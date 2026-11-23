import Milestone from '../models/Milestone.js';
import Goal from '../models/Goal.js';
import { goalProgressService } from './goalProgressService.js';

export const moduleService = {
  /**
   * Generates or syncs module slots for a goal
   * Mode:
   * - 'set_total': Ensures goal has exactly count modules (creates up to count, or trims empty trailing slots)
   * - 'append': Adds count new slots at the end
   * - 'populate': Populates existing slots with provided syllabus/titles without duplicating
   */
  async generateModuleSlots(goalId, userId, options = {}) {
    const { count = 10, mode = 'set_total', baseTitle = 'Module', category = '', forceTrim = false } = options;
    const goal = await Goal.findOne({ _id: goalId, user: userId });
    if (!goal) throw new Error('Goal not found.');

    const existingModules = await Milestone.find({ goal: goalId, user: userId }).sort({ order: 1 });
    const currentCount = existingModules.length;
    let targetCount = Number(count) || 10;
    targetCount = Math.max(1, Math.min(100, targetCount));

    if (mode === 'append') {
      const docsToInsert = [];
      for (let i = 1; i <= targetCount; i++) {
        const orderNum = currentCount + i;
        const seqStr = String(orderNum).padStart(2, '0');
        docsToInsert.push({
          goal: goalId,
          user: userId,
          title: `${baseTitle} ${seqStr}`,
          description: `Core study module #${seqStr} for ${goal.title}`,
          order: orderNum,
          sequenceNumber: orderNum,
          weight: 1.0,
          targetQuantity: 1,
          achievedQuantity: 0,
          status: 'not_started',
          isCompleted: false,
          estimatedEffort: '45 mins'
        });
      }
      const created = await Milestone.insertMany(docsToInsert);
      await goalProgressService.recalculateGoalProgress(goalId, userId, { source: 'generator', eventType: 'module_generated' });
      return {
        action: 'appended',
        addedCount: created.length,
        totalCount: currentCount + created.length,
        modules: await Milestone.find({ goal: goalId, user: userId }).sort({ order: 1 })
      };
    }

    if (mode === 'set_total') {
      if (currentCount === targetCount) {
        return {
          action: 'noop',
          addedCount: 0,
          totalCount: currentCount,
          modules: existingModules
        };
      }

      if (currentCount < targetCount) {
        // Need to create (targetCount - currentCount) new slots
        const docsToInsert = [];
        for (let i = currentCount + 1; i <= targetCount; i++) {
          const seqStr = String(i).padStart(2, '0');
          docsToInsert.push({
            goal: goalId,
            user: userId,
            title: `${baseTitle} ${seqStr}`,
            description: `Core study module #${seqStr} for ${goal.title}`,
            order: i,
            sequenceNumber: i,
            weight: 1.0,
            targetQuantity: 1,
            achievedQuantity: 0,
            status: 'not_started',
            isCompleted: false,
            estimatedEffort: '45 mins'
          });
        }
        await Milestone.insertMany(docsToInsert);
        await goalProgressService.recalculateGoalProgress(goalId, userId, { source: 'generator', eventType: 'module_generated' });
        return {
          action: 'expanded',
          addedCount: docsToInsert.length,
          totalCount: targetCount,
          modules: await Milestone.find({ goal: goalId, user: userId }).sort({ order: 1 })
        };
      } else {
        // currentCount > targetCount: User is shrinking slots
        // Check if any module beyond targetCount is completed
        const trailing = existingModules.slice(targetCount);
        const hasCompleted = trailing.some(m => m.status === 'completed' || m.isCompleted);
        if (hasCompleted && !forceTrim) {
          throw new Error(`Cannot reduce module count to ${targetCount}: completed modules would be removed. Explicitly confirm deletion.`);
        }
        const trailingIds = trailing.map(m => m._id);
        await Milestone.deleteMany({ _id: { $in: trailingIds } });
        await goalProgressService.recalculateGoalProgress(goalId, userId, { source: 'generator', eventType: 'module_trimmed' });
        return {
          action: 'trimmed',
          removedCount: trailingIds.length,
          totalCount: targetCount,
          modules: await Milestone.find({ goal: goalId, user: userId }).sort({ order: 1 })
        };
      }
    }

    return {
      action: 'unchanged',
      totalCount: currentCount,
      modules: existingModules
    };
  },

  /**
   * Populates existing or new module slots with an array of titles/items without creating duplicate extra records
   */
  async populateSyllabusItems(goalId, userId, items = []) {
    const goal = await Goal.findOne({ _id: goalId, user: userId });
    if (!goal) throw new Error('Goal not found.');
    if (!Array.isArray(items) || items.length === 0) return { count: 0, modules: [] };

    const existingModules = await Milestone.find({ goal: goalId, user: userId }).sort({ order: 1 });
    let updatedCount = 0;
    let createdCount = 0;

    // First update existing empty/not_started slots in place
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemTitle = typeof item === 'string' ? item.trim() : (item.title || '').trim();
      const itemDesc = typeof item === 'object' ? item.description || '' : '';
      const itemEffort = typeof item === 'object' ? item.estimatedEffort || '45 mins' : '45 mins';

      if (!itemTitle) continue;

      if (i < existingModules.length) {
        // Update existing slot in place without deleting or duplicating
        const slot = existingModules[i];
        // Do not overwrite completed modules with generic template titles
        if (slot.status !== 'completed' && !slot.isCompleted) {
          slot.title = itemTitle;
          if (itemDesc) slot.description = itemDesc;
          if (itemEffort) slot.estimatedEffort = itemEffort;
          await slot.save();
          updatedCount++;
        }
      } else {
        // Need to create new slot for items beyond current count
        const orderNum = i + 1;
        await Milestone.create({
          goal: goalId,
          user: userId,
          title: itemTitle,
          description: itemDesc || `Study module #${String(orderNum).padStart(2, '0')} for ${goal.title}`,
          order: orderNum,
          sequenceNumber: orderNum,
          weight: 1.0,
          targetQuantity: 1,
          achievedQuantity: 0,
          status: 'not_started',
          isCompleted: false,
          estimatedEffort: itemEffort
        });
        createdCount++;
      }
    }

    await goalProgressService.recalculateGoalProgress(goalId, userId, { source: 'syllabus_import', eventType: 'module_populated' });
    const allModules = await Milestone.find({ goal: goalId, user: userId }).sort({ order: 1 });

    return {
      updatedCount,
      createdCount,
      totalCount: allModules.length,
      modules: allModules
    };
  }
};
