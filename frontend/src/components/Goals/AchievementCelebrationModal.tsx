import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Achievement } from '../../types';
import { Trophy, Award, Sparkles, CheckCircle2, X, ArrowRight } from 'lucide-react';
import { api } from '../../api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface AchievementCelebrationModalProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export const AchievementCelebrationModal: React.FC<AchievementCelebrationModalProps> = ({
  achievement,
  onClose
}) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (achievement) {
      // Trigger confetti burst
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#7C3AED', '#6366F1', '#22C55E', '#F59E0B']
      });
    }
  }, [achievement]);

  const markCelebratedMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/achievements/${id}/celebrated`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements-latest'] });
    }
  });

  if (!achievement) return null;

  const handleDismiss = () => {
    markCelebratedMutation.mutate(achievement._id);
    onClose();
  };

  const isPlatinum = achievement.tier === 'platinum';
  const isGold = achievement.tier === 'gold';
  const isSilver = achievement.tier === 'silver';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          className="w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-500/50 rounded-3xl p-6 shadow-2xl relative text-center overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Badge Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 p-0.5 shadow-xl shadow-indigo-500/20 mb-4 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Trophy className="w-8 h-8 text-amber-400 animate-bounce" />
            </div>
          </div>

          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Achievement Unlocked • {achievement.tier.toUpperCase()} TIER
          </span>

          <h3 className="text-xl font-bold text-white mt-2 mb-1">
            {achievement.title}
          </h3>

          <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed mb-6">
            {achievement.description}
          </p>

          <button
            onClick={handleDismiss}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
          >
            <span>Continue Journey</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
