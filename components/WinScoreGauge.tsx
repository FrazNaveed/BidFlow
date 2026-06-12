import type { WinScoreResult } from "@/lib/types";

interface WinScoreGaugeProps {
  winScore: WinScoreResult;
  compact?: boolean;
}

function scoreColor(overall: number): string {
  if (overall >= 75) return "text-emerald-600";
  if (overall >= 50) return "text-amber-600";
  if (overall >= 30) return "text-orange-600";
  return "text-red-600";
}

function barColor(overall: number): string {
  if (overall >= 75) return "bg-emerald-500";
  if (overall >= 50) return "bg-amber-500";
  if (overall >= 30) return "bg-orange-500";
  return "bg-red-500";
}

function BreakdownBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-800">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

export default function WinScoreGauge({
  winScore,
  compact = false,
}: WinScoreGaugeProps) {
  const { overall, label, breakdown, gaps } = winScore;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div
          className={`text-2xl font-bold ${scoreColor(overall)}`}
        >
          {overall}%
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">Win Probability</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div
          className={`text-4xl font-bold ${scoreColor(overall)}`}
        >
          {overall}%
        </div>
        <div>
          <p className="font-semibold text-slate-900">Win Probability</p>
          <p className="text-sm text-slate-600">{label}</p>
        </div>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${barColor(overall)}`}
          style={{ width: `${overall}%` }}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <BreakdownBar label="Capability match" value={breakdown.capabilityMatch} />
        <BreakdownBar label="Compliance coverage" value={breakdown.complianceCoverage} />
        <BreakdownBar label="Answerability" value={breakdown.requirementAnswerability} />
        <BreakdownBar label="Confidence" value={breakdown.confidenceScore} />
        <BreakdownBar label="Budget alignment" value={breakdown.budgetAlignment} />
        <BreakdownBar label="Historical win rate" value={breakdown.historicalWinRate} />
        <BreakdownBar label="Competitive position" value={breakdown.competitorRisk} />
      </div>

      {gaps.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800">
            Gaps & risks
          </p>
          <ul className="space-y-1">
            {gaps.slice(0, 5).map((gap, i) => (
              <li key={i} className="text-xs text-amber-900">
                • {gap}
              </li>
            ))}
            {gaps.length > 5 && (
              <li className="text-xs text-amber-700">
                + {gaps.length - 5} more gaps
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
