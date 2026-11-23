import ScreenTimeRecord from '../models/ScreenTimeRecord.js';
import { syncDailyAnalytics } from '../services/dailyAnalyticsAggregator.js';

export const logScreenTime = async (req, res, next) => {
  try {
    const {
      date,
      totalMinutes,
      productiveMinutes,
      distractingMinutes,
      neutralMinutes,
      appUsage,
      notes
    } = req.body;

    const targetDate = date || new Date().toISOString().slice(0, 10);

    // Compute totals from appUsage if provided
    let calcProductive = productiveMinutes || 0;
    let calcDistracting = distractingMinutes || 0;
    let calcTotal = totalMinutes || 0;

    if (appUsage && Array.isArray(appUsage) && appUsage.length > 0) {
      calcTotal = appUsage.reduce((sum, a) => sum + (Number(a.minutes) || 0), 0);
      calcDistracting = appUsage.filter(a => a.isDistracting).reduce((sum, a) => sum + (Number(a.minutes) || 0), 0);
      calcProductive = appUsage.filter(a => !a.isDistracting && (a.category === 'Development' || a.category === 'Learning' || a.category === 'Research')).reduce((sum, a) => sum + (Number(a.minutes) || 0), 0);
    }

    const record = await ScreenTimeRecord.findOneAndUpdate(
      { user: req.user.id, date: targetDate },
      {
        totalMinutes: calcTotal,
        productiveMinutes: calcProductive,
        distractingMinutes: calcDistracting,
        neutralMinutes: neutralMinutes || Math.max(0, calcTotal - calcProductive - calcDistracting),
        appUsage: appUsage || [],
        source: 'manual_entry',
        notes: notes || ''
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await syncDailyAnalytics(req.user.id, targetDate);

    res.json({ success: true, record });
  } catch (err) {
    next(err);
  }
};

export const importScreenTimeCSV = async (req, res, next) => {
  try {
    const { csvContent } = req.body;
    if (!csvContent) {
      return res.status(400).json({ success: false, message: 'Please provide CSV content to import.' });
    }

    // Expected CSV format: date,appName,category,minutes,isDistracting
    // or: date,totalMinutes,productiveMinutes,distractingMinutes
    const lines = csvContent.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return res.status(400).json({ success: false, message: 'CSV has insufficient lines or headers.' });
    }

    const header = lines[0].toLowerCase().split(',').map(h => h.trim());
    const isAppFormat = header.includes('appname') || header.includes('app');

    const importedDates = new Set();

    if (isAppFormat) {
      // Group by date
      const dateAppMap = {};
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim());
        if (parts.length < 4) continue;
        const [d, appName, category, mins, isDistractStr] = parts;
        const isDistracting = isDistractStr ? (isDistractStr.toLowerCase() === 'true' || isDistractStr === '1') : false;

        if (!dateAppMap[d]) dateAppMap[d] = [];
        dateAppMap[d].push({
          appName,
          category: category || 'Other',
          minutes: Number(mins) || 0,
          isDistracting
        });
      }

      for (const [d, apps] of Object.entries(dateAppMap)) {
        const tot = apps.reduce((s, a) => s + a.minutes, 0);
        const dis = apps.filter(a => a.isDistracting).reduce((s, a) => s + a.minutes, 0);
        const prod = apps.filter(a => !a.isDistracting && (a.category === 'Development' || a.category === 'Learning')).reduce((s, a) => s + a.minutes, 0);

        await ScreenTimeRecord.findOneAndUpdate(
          { user: req.user.id, date: d },
          {
            totalMinutes: tot,
            productiveMinutes: prod,
            distractingMinutes: dis,
            neutralMinutes: Math.max(0, tot - prod - dis),
            appUsage: apps,
            source: 'csv_import'
          },
          { upsert: true }
        );
        importedDates.add(d);
      }
    } else {
      // Summary format: date, totalMinutes, productiveMinutes, distractingMinutes
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim());
        if (parts.length < 4) continue;
        const [d, total, prod, dist] = parts;

        await ScreenTimeRecord.findOneAndUpdate(
          { user: req.user.id, date: d },
          {
            totalMinutes: Number(total) || 0,
            productiveMinutes: Number(prod) || 0,
            distractingMinutes: Number(dist) || 0,
            neutralMinutes: Math.max(0, (Number(total) || 0) - (Number(prod) || 0) - (Number(dist) || 0)),
            source: 'csv_import'
          },
          { upsert: true }
        );
        importedDates.add(d);
      }
    }

    // Sync analytics for each imported date
    for (const d of importedDates) {
      await syncDailyAnalytics(req.user.id, d);
    }

    res.json({
      success: true,
      message: `Successfully imported screen time for ${importedDates.size} dates.`,
      importedDatesCount: importedDates.size
    });
  } catch (err) {
    next(err);
  }
};

export const getScreenTimeHistory = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { user: req.user.id };

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const records = await ScreenTimeRecord.find(query).sort({ date: -1 });

    const totalMinutes = records.reduce((s, r) => s + r.totalMinutes, 0);
    const distractingMinutes = records.reduce((s, r) => s + r.distractingMinutes, 0);
    const productiveMinutes = records.reduce((s, r) => s + r.productiveMinutes, 0);

    // Aggregate app usage breakdown
    const appAgg = {};
    records.forEach(r => {
      r.appUsage.forEach(a => {
        if (!appAgg[a.appName]) {
          appAgg[a.appName] = {
            appName: a.appName,
            category: a.category,
            isDistracting: a.isDistracting,
            totalMinutes: 0
          };
        }
        appAgg[a.appName].totalMinutes += a.minutes;
      });
    });

    const topApps = Object.values(appAgg).sort((a, b) => b.totalMinutes - a.totalMinutes);

    res.json({
      success: true,
      count: records.length,
      totals: {
        totalHours: Number((totalMinutes / 60).toFixed(1)),
        productiveHours: Number((productiveMinutes / 60).toFixed(1)),
        distractingHours: Number((distractingMinutes / 60).toFixed(1)),
        avgDailyDistractionMinutes: records.length > 0 ? Math.round(distractingMinutes / records.length) : 0
      },
      topApps,
      records
    });
  } catch (err) {
    next(err);
  }
};
