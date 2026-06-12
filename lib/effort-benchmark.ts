import type { EffortBenchmark } from "./types";

const MINUTES_PER_REQUIREMENT_MANUAL = 8;
const MINUTES_PER_REQUIREMENT_AI = 0.5;
const ANALYSIS_OVERHEAD_AI = 3;
const ANALYSIS_OVERHEAD_MANUAL = 45;

export function calculateEffortBenchmark(
  requirementCount: number,
  pageEstimate = 0
): EffortBenchmark {
  const pages = pageEstimate || Math.max(1, Math.ceil(requirementCount * 1.5));
  const baselineMinutes = Math.round(
    ANALYSIS_OVERHEAD_MANUAL +
      pages * 2 +
      requirementCount * MINUTES_PER_REQUIREMENT_MANUAL
  );
  const aiMinutes = Math.round(
    ANALYSIS_OVERHEAD_AI + requirementCount * MINUTES_PER_REQUIREMENT_AI
  );
  const reductionPct = Math.round(
    ((baselineMinutes - aiMinutes) / baselineMinutes) * 100
  );

  return {
    baselineMinutes,
    aiMinutes,
    reductionPct,
    baselineLabel: `~${Math.floor(baselineMinutes / 60)}h ${baselineMinutes % 60}m manual prep`,
    aiLabel: `~${aiMinutes} min with AI engine`,
  };
}
