import React from 'react';
import { Goal, Milestone, Achievement } from '../../types';
import {
  Calendar,
  CheckCircle2,
  Trophy,
  History,
  Flag,
  Sparkles,
  Sliders,
  TrendingUp,
  Clock
} from 'lucide-react';

interface GoalProgressTimelineProps {
  goal: Goal;
  milestones: Milestone[];
  achievements?: Achievement[];
  progressEvents?: any[];
}

export const GoalProgressTimeline: React.FC<GoalProgressTimelineProps> = ({
  goal,
  milestones,
  achievements = [],
  progressEvents = []
}) => {
  // Combine all significant events into a unified chronological stream
  const timelineItems: Array<{
    id: string;
    date: Date;
    type: 'goal_created' | 'milestone_completed' | 'achievement' | 'progress_event' | 'goal_completed';
    title: string;
    description: string;
    badge?: string;
    icon: any;
    color: string;
  }> = [];

  // 1. Goal Created
  timelineItems.push({
    id: 'creation',
    date: new Date(goal.startDate || goal.createdAt),
    type: 'goal_created',
    title: `Journey Initiated: ${goal.title}`,
    description: `Goal established with target completion date: ${new Date(goal.targetDate).toLocaleDateString()}. Target outcome: ${goal.targetOutcome || 'Achieve all milestones'}`,
    badge: 'Origin',
    icon: Flag,
    color: 'indigo'
  });

  // 2. Milestone completions
  milestones
    .filter((m) => m.isCompleted)
    .forEach((m) => {
      timelineItems.push({
        id: `milestone-${m._id}`,
        date: new Date(m.completedAt || (goal as any).updatedAt || goal.createdAt),
        type: 'milestone_completed',
        title: `Milestone Conquered: ${m.title}`,
        description: `Delivered milestone objectives. Advanced overall goal by +${m.weight}% weight.`,
        badge: `+${m.weight}% Progress`,
        icon: CheckCircle2,
        color: 'emerald'
      });
    });

  // 3. Achievements earned
  achievements.forEach((ach) => {
    timelineItems.push({
      id: `ach-${ach._id}`,
      date: new Date(ach.earnedAt),
      type: 'achievement',
      title: `Achievement Earned: ${ach.title}`,
      description: ach.description,
      badge: `${ach.tier.toUpperCase()} TIER`,
      icon: Trophy,
      color: 'amber'
    });
  });

  // 4. Progress increment events
  progressEvents.forEach((evt) => {
    timelineItems.push({
      id: `evt-${evt._id}`,
      date: new Date(evt.createdAt || evt.date),
      type: 'progress_event',
      title: `Recorded Progress: +${evt.quantityAdded || evt.progressDelta} ${goal.measurementUnit || 'units'}`,
      description: evt.notes || `Progress delta: +${evt.progressDelta}%`,
      badge: `+${evt.progressDelta}%`,
      icon: TrendingUp,
      color: 'cyan'
    });
  });

  // 5. Goal Completed (if 100%)
  if (goal.currentProgressPercentage >= 100 || goal.status === 'completed') {
    timelineItems.push({
      id: 'completion',
      date: new Date(goal.completedAt || (goal as any).updatedAt || new Date()),
      type: 'goal_completed',
      title: `Goal Mastered: 100% Roadmap Conquered!`,
      description: goal.reflectionNote
        ? `Personal Reflection: "${goal.reflectionNote}"`
        : 'All milestones and requirements successfully achieved.',
      badge: 'Goal Achieved',
      icon: Trophy,
      color: 'amber'
    });
  }

  // Sort chronological descending (most recent at top)
  timelineItems.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" />
            <span>Chronological Progress Timeline</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete historical log of milestones conquered, verified progress events, and earned achievements.
          </p>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {timelineItems.length} Journey Milestones
        </span>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {timelineItems.map((item) => {
          const Icon = item.icon;
          const isEmerald = item.color === 'emerald';
          const isAmber = item.color === 'amber';
          const isCyan = item.color === 'cyan';
          const isIndigo = item.color === 'indigo';

          return (
            <div key={item.id} className="relative group">
              {/* Timeline Pin */}
              <div
                className={`absolute -left-6 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-md ${
                  isEmerald
                    ? 'bg-emerald-950 border-emerald-400 text-emerald-400'
                    : isAmber
                    ? 'bg-amber-950 border-amber-400 text-amber-300'
                    : isCyan
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                    : 'bg-indigo-950 border-indigo-400 text-indigo-300'
                }`}
              >
                <Icon className="w-3 h-3" />
              </div>

              {/* Event Content Card */}
              <div className="ml-3 p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isEmerald
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : isAmber
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : isCyan
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {item.date.toLocaleDateString()} • {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
