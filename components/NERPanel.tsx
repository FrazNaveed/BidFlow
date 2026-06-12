import type { NERResult } from "@/lib/types";

interface NERPanelProps {
  entities: NERResult;
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

export default function NERPanel({ entities }: NERPanelProps) {
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
              <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">
                {d.context}
              </p>
            </li>
          ))}
        </ul>
      </EntitySection>

      <EntitySection title="Budget figures" count={entities.budgets.length}>
        <ul className="space-y-2">
          {entities.budgets.map((b, i) => (
            <li key={i} className="text-sm">
              <span className="font-medium text-emerald-700">{b.text}</span>
              <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">
                {b.context}
              </p>
            </li>
          ))}
        </ul>
      </EntitySection>

      <EntitySection
        title="Evaluation weights"
        count={entities.evaluationWeights.length}
      >
        <ul className="space-y-2">
          {entities.evaluationWeights.map((w, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className="text-slate-800">{w.criterion}</span>
              <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                {w.weight}
              </span>
            </li>
          ))}
        </ul>
      </EntitySection>

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
              <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                {c.context}
              </p>
            </li>
          ))}
        </ul>
      </EntitySection>
    </div>
  );
}
