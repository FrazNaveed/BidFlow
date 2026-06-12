import { goNoGoColor } from "@/lib/go-no-go-colors";
import type { GoNoGoResult } from "@/lib/types";

export default function GoNoGoBanner({ goNoGo }: { goNoGo: GoNoGoResult }) {
  return (
    <div className={`rounded-xl p-6 ${goNoGoColor(goNoGo.decision)}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium opacity-90">Bid Decision</p>
          <p className="text-3xl font-bold tracking-tight">{goNoGo.decision}</p>
          <p className="mt-2 text-sm opacity-95 max-w-2xl">{goNoGo.rationale}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-right text-xs shrink-0">
          <div>
            <p className="opacity-75">Overall Score</p>
            <p className="text-lg font-bold">{goNoGo.factors.overallScore}%</p>
          </div>
          <div>
            <p className="opacity-75">Mandatory Pass</p>
            <p className="text-lg font-bold">{goNoGo.factors.mandatoryPassRate}%</p>
          </div>
          <div>
            <p className="opacity-75">Budget Fit</p>
            <p className="text-lg font-bold">{goNoGo.factors.budgetAlignment}%</p>
          </div>
          <div>
            <p className="opacity-75">Hist. Win Rate</p>
            <p className="text-lg font-bold">{goNoGo.factors.historicalWinRate}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
