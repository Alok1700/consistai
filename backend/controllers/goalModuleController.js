import GoalModule from '../models/GoalModule.js';
import GoalMilestone from '../models/GoalMilestone.js';
import { updateGoalProgress } from './goalMilestoneController.js';

/**
 * Recompute and save GoalMilestone cached progress fields from its GoalModules
 */
export async function updateMilestoneProgress(milestoneId) {
  const total = await GoalModule.countDocuments({ milestone: milestoneId });
  const completed = await GoalModule.countDocuments({ milestone: milestoneId, isCompleted: true });
  const progressPercentage = total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0;

  let status = 'not_started';
  if (total > 0 && completed === total) status = 'completed';
  else if (completed > 0) status = 'in_progress';

  const updateData = {
    moduleCount: total,
    completedModuleCount: completed,
    progressPercentage,
    status
  };
  if (status === 'completed') updateData.completedAt = new Date();
  else if (status !== 'completed') updateData.completedAt = null;

  const milestone = await GoalMilestone.findByIdAndUpdate(milestoneId, updateData, { new: true });
  return milestone;
}

// GET /api/goal-milestones/:milestoneId/modules or /api/milestones/:milestoneId/modules
export async function getModulesForMilestone(req, res, next) {
  try {
    const { milestoneId } = req.params;
    const userId = req.user.id;

    const milestone = await GoalMilestone.findOne({ _id: milestoneId, user: userId });
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const modules = await GoalModule.find({ milestone: milestoneId, user: userId }).sort({ order: 1 });
    res.json({ success: true, count: modules.length, modules });
  } catch (err) {
    next(err);
  }
}

// POST /api/goal-milestones/:milestoneId/modules or /api/milestones/:milestoneId/modules
export async function addModule(req, res, next) {
  try {
    const { milestoneId } = req.params;
    const userId = req.user.id;
    const { title, estimatedMinutes, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Module title is required' });
    }

    const milestone = await GoalMilestone.findOne({ _id: milestoneId, user: userId });
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const lastModule = await GoalModule.findOne({ milestone: milestoneId }).sort({ order: -1 });
    const order = lastModule ? lastModule.order + 1 : 1;

    const mod = await GoalModule.create({
      goal: milestone.goal,
      milestone: milestoneId,
      user: userId,
      title: title.trim(),
      description: description ? description.trim() : '',
      estimatedMinutes: Number(estimatedMinutes) || 45,
      order,
      status: 'not_started',
      isCompleted: false
    });

    const milestoneProgress = await updateMilestoneProgress(milestoneId);
    const goalProgress = await updateGoalProgress(milestone.goal, userId);

    res.status(201).json({
      success: true,
      module: mod,
      milestoneProgress: {
        moduleCount: milestoneProgress.moduleCount,
        completedModuleCount: milestoneProgress.completedModuleCount,
        progressPercentage: milestoneProgress.progressPercentage,
        status: milestoneProgress.status
      },
      goalProgress
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/goal-milestones/:milestoneId/modules/generate or /api/milestones/:milestoneId/modules/generate
export async function generateModules(req, res, next) {
  try {
    const { milestoneId } = req.params;
    const userId = req.user.id;
    const { count = 10, prefix = 'Module', wipeExisting = false } = req.body;

    const milestone = await GoalMilestone.findOne({ _id: milestoneId, user: userId });
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    if (wipeExisting) {
      await GoalModule.deleteMany({ milestone: milestoneId });
    }

    const lastModule = await GoalModule.findOne({ milestone: milestoneId }).sort({ order: -1 });
    const startOrder = wipeExisting ? 1 : (lastModule ? lastModule.order + 1 : 1);
    const numToGen = Math.max(1, Number(count) || 10);

    const moduleDocs = [];
    for (let i = 0; i < numToGen; i++) {
      const num = startOrder + i;
      const padded = String(num).padStart(2, '0');
      moduleDocs.push({
        goal: milestone.goal,
        milestone: milestoneId,
        user: userId,
        title: `${prefix.trim() || 'Module'} ${padded}`,
        order: num,
        status: 'not_started',
        isCompleted: false,
        estimatedMinutes: 45
      });
    }

    const modules = await GoalModule.insertMany(moduleDocs);
    const milestoneProgress = await updateMilestoneProgress(milestoneId);
    const goalProgress = await updateGoalProgress(milestone.goal, userId);

    res.status(201).json({
      success: true,
      count: modules.length,
      modules,
      milestoneProgress: {
        moduleCount: milestoneProgress.moduleCount,
        completedModuleCount: milestoneProgress.completedModuleCount,
        progressPercentage: milestoneProgress.progressPercentage,
        status: milestoneProgress.status
      },
      goalProgress
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/goal-milestones/:milestoneId/modules/import or /api/milestones/:milestoneId/modules/import
export async function importModules(req, res, next) {
  try {
    const { milestoneId } = req.params;
    const userId = req.user.id;
    const { text, titles, items, modules: rawModules, mode = 'append', wipeExisting = false } = req.body;

    const milestone = await GoalMilestone.findOne({ _id: milestoneId, user: userId });
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    let parsedNames = [];
    const candidateList = titles || items || rawModules;

    if (Array.isArray(candidateList) && candidateList.length > 0) {
      parsedNames = candidateList.map(it => (typeof it === 'string' ? it.trim() : it.title?.trim())).filter(Boolean);
    } else if (typeof text === 'string') {
      parsedNames = text
        .split(/\r?\n/)
        .map(line => line.trim().replace(/^\d+[\.\)\-:]\s*/, ''))
        .filter(line => line.length > 0);
    }

    if (!parsedNames.length) {
      return res.status(400).json({ success: false, message: 'No valid module titles found to import' });
    }

    if (wipeExisting) {
      await GoalModule.deleteMany({ milestone: milestoneId });
    }

    // If mode is 'populate', check if there are empty slots like "Module 01", "Module 02", etc.
    if (mode === 'populate' && !wipeExisting) {
      const existingModules = await GoalModule.find({ milestone: milestoneId, user: userId }).sort({ order: 1 });
      const genericSlotRegex = /^(Module|Chapter|Lesson|Slot)\s+\d+$/i;
      const genericSlots = existingModules.filter(m => genericSlotRegex.test(m.title) && !m.isCompleted);

      if (genericSlots.length > 0) {
        // Populate existing generic slots first
        const slotsToUpdate = Math.min(genericSlots.length, parsedNames.length);
        for (let i = 0; i < slotsToUpdate; i++) {
          genericSlots[i].title = parsedNames[i];
          await genericSlots[i].save();
        }

        // If there are more parsed names than available empty slots, append the remainder
        const remainingNames = parsedNames.slice(slotsToUpdate);
        if (remainingNames.length > 0) {
          const lastOrder = existingModules.length ? existingModules[existingModules.length - 1].order : 0;
          const extraDocs = remainingNames.map((name, idx) => ({
            goal: milestone.goal,
            milestone: milestoneId,
            user: userId,
            title: name,
            order: lastOrder + idx + 1,
            status: 'not_started',
            isCompleted: false
          }));
          await GoalModule.insertMany(extraDocs);
        }

        const milestoneProgress = await updateMilestoneProgress(milestoneId);
        const goalProgress = await updateGoalProgress(milestone.goal, userId);
        const allModules = await GoalModule.find({ milestone: milestoneId, user: userId }).sort({ order: 1 });

        return res.status(200).json({
          success: true,
          message: `Populated ${slotsToUpdate} slots and added ${remainingNames.length} new modules`,
          modules: allModules,
          milestoneProgress,
          goalProgress
        });
      }
    }

    // Default 'append' mode
    const lastModule = await GoalModule.findOne({ milestone: milestoneId }).sort({ order: -1 });
    const startOrder = wipeExisting ? 1 : (lastModule ? lastModule.order + 1 : 1);

    const moduleDocs = parsedNames.map((title, i) => ({
      goal: milestone.goal,
      milestone: milestoneId,
      user: userId,
      title,
      order: startOrder + i,
      status: 'not_started',
      isCompleted: false,
      estimatedMinutes: 45
    }));

    const inserted = await GoalModule.insertMany(moduleDocs);
    const milestoneProgress = await updateMilestoneProgress(milestoneId);
    const goalProgress = await updateGoalProgress(milestone.goal, userId);
    const allModules = await GoalModule.find({ milestone: milestoneId, user: userId }).sort({ order: 1 });

    res.status(201).json({
      success: true,
      message: `Imported ${inserted.length} modules`,
      importedCount: inserted.length,
      modules: allModules,
      milestoneProgress,
      goalProgress
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/goal-milestones/:milestoneId/modules/rename or /api/milestones/:milestoneId/modules/rename
export async function batchRenameModules(req, res, next) {
  try {
    const { milestoneId } = req.params;
    const userId = req.user.id;
    const { modules } = req.body;

    const milestone = await GoalMilestone.findOne({ _id: milestoneId, user: userId });
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    if (Array.isArray(modules)) {
      if (typeof modules[0] === 'string') {
        const existing = await GoalModule.find({ milestone: milestoneId, user: userId }).sort({ order: 1 });
        await Promise.all(
          existing.map((m, idx) => {
            if (modules[idx] && String(modules[idx]).trim()) {
              m.title = String(modules[idx]).trim();
              return m.save();
            }
            return Promise.resolve();
          })
        );
      } else {
        await Promise.all(
          modules.map(item => {
            if (item && item.id && item.title && String(item.title).trim()) {
              return GoalModule.findOneAndUpdate(
                { _id: item.id, milestone: milestoneId, user: userId },
                { title: String(item.title).trim() }
              );
            }
            return Promise.resolve();
          })
        );
      }
    }

    const updated = await GoalModule.find({ milestone: milestoneId, user: userId }).sort({ order: 1 });
    res.json({ success: true, count: updated.length, modules: updated });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/goal-modules/:id or /api/modules/:id
export async function updateModule(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, notes, estimatedMinutes, description } = req.body;

    const mod = await GoalModule.findOne({ _id: id, user: userId });
    if (!mod) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    if (title !== undefined) mod.title = title.trim();
    if (notes !== undefined) mod.notes = notes.trim();
    if (estimatedMinutes !== undefined) mod.estimatedMinutes = Number(estimatedMinutes) || 45;
    if (description !== undefined) mod.description = description.trim();

    await mod.save();
    res.json({ success: true, module: mod });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/goal-modules/:id/toggle
export async function toggleModuleStatus(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const mod = await GoalModule.findOne({ _id: id, user: userId });
    if (!mod) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    mod.isCompleted = !mod.isCompleted;
    mod.completedAt = mod.isCompleted ? new Date() : null;
    mod.status = mod.isCompleted ? 'completed' : 'not_started';

    await mod.save();

    const milestoneProgress = await updateMilestoneProgress(mod.milestone);
    const goalProgress = await updateGoalProgress(mod.goal, userId);

    res.json({
      success: true,
      module: mod,
      milestoneProgress: {
        moduleCount: milestoneProgress.moduleCount,
        completedModuleCount: milestoneProgress.completedModuleCount,
        progressPercentage: milestoneProgress.progressPercentage,
        status: milestoneProgress.status
      },
      goalProgress
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/goal-modules/:id/status or /api/modules/:id/status
export async function updateModuleStatus(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { status, isCompleted, notes } = req.body;

    const mod = await GoalModule.findOne({ _id: id, user: userId });
    if (!mod) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    if (isCompleted !== undefined) {
      mod.isCompleted = Boolean(isCompleted);
      mod.status = mod.isCompleted ? 'completed' : 'not_started';
      mod.completedAt = mod.isCompleted ? new Date() : null;
    } else if (status !== undefined) {
      mod.status = status;
      if (status === 'completed') {
        mod.isCompleted = true;
        mod.completedAt = new Date();
      } else if (status === 'not_started') {
        mod.isCompleted = false;
        mod.completedAt = null;
      } else {
        mod.isCompleted = false;
      }
    }

    if (notes !== undefined) mod.notes = notes;

    await mod.save();

    const milestoneProgress = await updateMilestoneProgress(mod.milestone);
    const goalProgress = await updateGoalProgress(mod.goal, userId);

    res.json({
      success: true,
      module: mod,
      milestoneProgress: {
        moduleCount: milestoneProgress.moduleCount,
        completedModuleCount: milestoneProgress.completedModuleCount,
        progressPercentage: milestoneProgress.progressPercentage,
        status: milestoneProgress.status
      },
      goalProgress
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/goal-modules/:id or /api/modules/:id
export async function deleteModule(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const mod = await GoalModule.findOne({ _id: id, user: userId });
    if (!mod) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    const { milestone: milestoneId, goal: goalId } = mod;
    await GoalModule.deleteOne({ _id: id });

    const milestoneProgress = await updateMilestoneProgress(milestoneId);
    const goalProgress = await updateGoalProgress(goalId, userId);

    res.json({
      success: true,
      message: 'Module deleted',
      milestoneProgress: {
        moduleCount: milestoneProgress.moduleCount,
        completedModuleCount: milestoneProgress.completedModuleCount,
        progressPercentage: milestoneProgress.progressPercentage,
        status: milestoneProgress.status
      },
      goalProgress
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/goal-modules/reorder or /api/modules/reorder
export async function reorderModules(req, res, next) {
  try {
    const userId = req.user.id;
    const { milestoneId, orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, message: 'orderedIds array required' });
    }

    await Promise.all(
      orderedIds.map((moduleId, index) =>
        GoalModule.findOneAndUpdate(
          { _id: moduleId, milestone: milestoneId, user: userId },
          { order: index + 1 },
          { new: true }
        )
      )
    );

    const updated = await GoalModule.find({ milestone: milestoneId, user: userId }).sort({ order: 1 });
    res.json({ success: true, modules: updated });
  } catch (err) {
    next(err);
  }
}
