import React, { useState } from 'react';
import {
  Lightbulb,
  ThumbsUp,
  FlaskConical,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';

interface RecommendationCardProps {
  recommendation: any;
  onHelpful?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onTestInLab?: (recommendation: any) => void;
  isHelpful?: boolean;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onHelpful,
  onDismiss,
  onTestInLab,
  isHelpful = false
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const recId = recommendation.id || recommendation._id || 'rec';

  return (
    <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-4 shadow-sm flex flex-col justify-between">
      <div className="space-y-3">
        {/* Header Badges */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30">
            {recommendation.category || 'Behavioral Rhythm'}
          </span>
          <span className="text-[10px] text-[#64748B] font-mono">
            {recommendation.confidenceLevel ? `${recommendation.confidenceLevel} confidence` : 'Verified telemetry'}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-sm font-bold text-[#F8FAFC]">
          {recommendation.title || recommendation.observation}
        </h4>

        {/* Observation & Evidence Block */}
        <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#263247] space-y-2 text-xs">
          <div>
            <span className="text-[#94A3B8] font-bold">Observation: </span>
            <span className="text-[#F8FAFC]">{recommendation.observed_issue || recommendation.observation}</span>
          </div>

          {(recommendation.supporting_data || recommendation.evidence) && (
            <div>
              <span className="text-[#94A3B8] font-bold">Evidence: </span>
              <span className="text-[#94A3B8]">{recommendation.supporting_data || recommendation.evidence}</span>
            </div>
          )}

          {recommendation.expected_benefit_hypothesis && (
            <div className="pt-1 text-[#38BDF8]">
              <span className="font-bold">Possible Explanation: </span>
              <span>{recommendation.expected_benefit_hypothesis}</span>
            </div>
          )}
        </div>

        {/* Recommended Action */}
        <div className="text-xs text-[#10B981] flex items-start gap-2 pt-1 font-medium">
          <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Recommended Action: </span>
            <span>{recommendation.suggested_change || recommendation.recommended_action || recommendation.suggested_target_behavior}</span>
          </div>
        </div>

        {/* How to Measure */}
        <div className="text-[11px] text-[#64748B] flex items-center gap-1.5 pl-6">
          <CheckCircle2 className="w-3 h-3 text-[#8B5CF6]" />
          <span>
            Test for {recommendation.suggested_experiment_days || 14} days and compare completion velocity with baseline.
          </span>
        </div>

        {/* Collapsible Technical Details */}
        <div>
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="flex items-center gap-1 text-[11px] text-[#64748B] hover:text-[#94A3B8] transition cursor-pointer font-medium"
          >
            <span>{showTechnicalDetails ? 'Hide Scientific Telemetry Details' : 'View Scientific Telemetry Details'}</span>
            {showTechnicalDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showTechnicalDetails && (
            <div className="mt-2 p-3 rounded-xl bg-[#0B0F19]/80 border border-[#263247] text-[11px] text-[#94A3B8] space-y-1.5 animate-in fade-in duration-150">
              <div><strong className="text-[#F8FAFC]">Analytical Method: </strong>Multivariate Behavioral Clustering & Pacing Engine</div>
              <div><strong className="text-[#F8FAFC]">Data Limitations: </strong>{recommendation.data_limitation_note || 'Observed correlation reflects historical logs; individual focus conditions and course difficulty may vary.'}</div>
              <div><strong className="text-[#F8FAFC]">Suggested Experiment Window: </strong>{recommendation.suggested_experiment_days || 14} days</div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-[#263247] text-xs mt-3">
        <div className="flex items-center gap-2">
          {onHelpful && (
            <button
              type="button"
              onClick={() => onHelpful(recId)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                isHelpful
                  ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                  : 'bg-[#1C2638] text-[#94A3B8] border-[#263247] hover:text-[#F8FAFC]'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{isHelpful ? 'Helpful' : 'Mark Helpful'}</span>
            </button>
          )}

          {onTestInLab && (
            <button
              type="button"
              onClick={() => onTestInLab(recommendation)}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 text-[#8B5CF6] border border-[#8B5CF6]/30 transition cursor-pointer"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Test in Improvement Lab</span>
            </button>
          )}
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={() => onDismiss(recId)}
            className="text-xs text-[#64748B] hover:text-[#EF4444] transition cursor-pointer px-2 py-1"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};
export default RecommendationCard;
