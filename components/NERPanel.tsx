import type { NERResult } from "@/lib/types";

interface NERPanelProps {
  entities: NERResult;
  hideEvaluationWeights?: boolean;
}

function EntitySection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-800">
        {title}
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {count}
        </span>
      </h3>
      {count === 0 ? (
        <p className="text-xs text-slate-400">None detected</p>
      ) : (
        children
      )}
    </div>
  );
}

export default function NERPanel({ entities, hideEvaluationWeights }: NERPanelProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <EntitySection title="Deadlines" count={entities.deadlines.length}>
        <ul className="space-y-2">
          {entities.deadlines.map((d, i) => (
            <li key={i} className="text-sm">
              <span className="font-medium text-slate-800">{d.text}</span>
              {d.date && (
                <span className="ml-2 text-xs text-indigo-600">{d.date}</span>
              )}
              <blockquote className="mt-0.5 border-l-2 border-slate-200 pl-2 text-xs leading-relaxed text-slate-500">
                {d.context}
              </blockquote>
            </li>
          ))}
        </ul>
      </EntitySection>

      <EntitySection title="Budget & contract value" count={entities.budgets.length}>
        <ul className="space-y-3">
          {entities.budgets.map((b, i) => (
            <li key={i} className="text-sm">
              <span className="font-medium text-emerald-700">{b.text}</span>
              {b.amount && b.amount !== b.text && (
                <span className="ml-2 text-xs text-emerald-600">{b.amount}</span>
              )}
              {b.context && (
                <blockquote className="mt-1 border-l-2 border-slate-200 pl-2 text-xs leading-relaxed text-slate-500">
                  {b.context}
                </blockquote>
              )}
            </li>
          ))}
        </ul>
      </EntitySection>

      {!hideEvaluationWeights && (
      <EntitySection
        title="Evaluation weights"
        count={entities.evaluationWeights.length}
      >
        <ul className="space-y-2">
          {entities.evaluationWeights.map((w, i) => (
            <li key={i} className="text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-800">{w.criterion}</span>
                <span className="shrink-0 rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                  {w.weight}
                </span>
              </div>
              {w.context && (
                <p className="mt-1 text-xs italic leading-relaxed text-slate-500 line-clamp-3">
                  &ldquo;{w.context}&rdquo;
                </p>
              )}
            </li>
          ))}
        </ul>
      </EntitySection>
      )}

      <EntitySection
        title="Compliance clauses"
        count={entities.complianceClauses.length}
      >
        <ul className="space-y-2">
          {entities.complianceClauses.map((c, i) => (
            <li key={i} className="text-sm">
              <span className="rounded bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700">
                {c.type}
              </span>
              <blockquote className="mt-1 border-l-2 border-slate-200 pl-2 text-xs leading-relaxed text-slate-500">
                {c.context}
              </blockquote>
            </li>
          ))}
        </ul>
      </EntitySection>
    </div>
  );
}
