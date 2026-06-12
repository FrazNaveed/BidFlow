import type { EffortBenchmark as EffortBenchmarkType } from "@/lib/types";

export default function EffortBenchmark({ effort }: { effort: EffortBenchmarkType }) {
  const meetsTarget = effort.reductionPct >= 50;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">
        Effort Reduction Benchmark
      </h3>
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg bg-slate-50 p-4 text-center">
          <p className="text-2xl font-bold text-slate-700">{effort.baselineMinutes}m</p>
          <p className="mt-1 text-xs text-slate-500">{effort.baselineLabel}</p>
        </div>
        <div className="rounded-lg bg-indigo-50 p-4 text-center">
          <p className="text-2xl font-bold text-indigo-700">{effort.aiMinutes}m</p>
          <p className="mt-1 text-xs text-indigo-600">{effort.aiLabel}</p>
        </div>
        <div className={`rounded-lg p-4 text-center ${meetsTarget ? "bg-emerald-50" : "bg-amber-50"}`}>
          <p className={`text-2xl font-bold ${meetsTarget ? "text-emerald-700" : "text-amber-700"}`}>
            {effort.reductionPct}%
          </p>
          <p className={`mt-1 text-xs ${meetsTarget ? "text-emerald-600" : "text-amber-600"}`}>
            {meetsTarget ? "✓ Exceeds 50% target" : "Below 50% target"}
          </p>
        </div>
      </div>
    </div>
  );
}
