import type { WinScoreResult } from "@/lib/types";

const CRITERIA: { key: keyof WinScoreResult["breakdown"]; label: string; weight: string }[] = [
  { key: "capabilityMatch", label: "Capability Match", weight: "25%" },
  { key: "complianceCoverage", label: "Compliance Coverage", weight: "20%" },
  { key: "requirementAnswerability", label: "Answerability", weight: "15%" },
  { key: "confidenceScore", label: "Confidence", weight: "10%" },
  { key: "budgetAlignment", label: "Budget Alignment", weight: "10%" },
  { key: "historicalWinRate", label: "Historical Win Rate", weight: "10%" },
  { key: "competitorRisk", label: "Competitive Position", weight: "10%" },
];

export default function WinScoreDashboard({ winScore }: { winScore: WinScoreResult }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <div className="relative flex h-28 w-28 items-center justify-center">
          <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={winScore.overall >= 55 ? "#10b981" : winScore.overall >= 35 ? "#f59e0b" : "#ef4444"}
              strokeWidth="8"
              strokeDasharray={`${winScore.overall * 2.64} 264`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-2xl font-bold text-slate-900">{winScore.overall}%</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Win Probability Dashboard</h3>
          <p className="text-sm text-slate-600">{winScore.label}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CRITERIA.map(({ key, label, weight }) => {
          const value = winScore.breakdown[key];
          return (
            <div key={key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-slate-700">{label}</span>
                <span className="text-slate-400">{weight}</span>
              </div>
              <div className="mb-1 text-lg font-bold text-slate-900">{value}%</div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
