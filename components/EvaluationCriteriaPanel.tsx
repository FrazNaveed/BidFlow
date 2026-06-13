import {
  mapCriteriaToWinFactors,
  normalizeEvaluationCriteria,
} from "@/lib/evaluation-criteria";
import { buildScoringSummary, explainCriterion } from "@/lib/evaluation-explainer";
import type { EvaluationCriterion, NERResult } from "@/lib/types";

export default function EvaluationCriteriaPanel({
  evaluationCriteria,
  entities,
}: {
  evaluationCriteria?: EvaluationCriterion[] | null;
  entities?: NERResult | null;
}) {
  const criteria = normalizeEvaluationCriteria(
    evaluationCriteria || [],
    entities
  );
  const mappings = mapCriteriaToWinFactors(criteria);
  const summary = buildScoringSummary(criteria);

  if (criteria.length === 0) return null;

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-6">
      <h2 className="mb-1 text-lg font-semibold text-slate-900">
        How this tender is scored
      </h2>
      <p className="mb-4 text-sm text-slate-600">
        Evaluation rules extracted from the RFP — with source text from the document.
      </p>

      {summary && (
        <div className="mb-5 rounded-lg border border-indigo-100 bg-white p-4 text-sm leading-relaxed text-slate-700">
          {summary}
        </div>
      )}

      <div className="space-y-3">
        {criteria.map((c) => (
          <div
            key={`${c.criterion}-${c.weight}`}
            className="rounded-lg border border-white bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-slate-900">{c.criterion}</p>
                <p className="mt-1 text-sm text-slate-600">{explainCriterion(c)}</p>
                {c.description && c.description !== explainCriterion(c) && (
                  <p className="mt-1 text-sm text-slate-500">{c.description}</p>
                )}
              </div>
              <span className="shrink-0 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                {c.weight}
              </span>
            </div>
            {c.sourceText && (
              <blockquote className="mt-3 border-l-2 border-indigo-200 pl-3 text-xs italic leading-relaxed text-slate-500">
                &ldquo;{c.sourceText}&rdquo;
                <span className="mt-1 block not-italic text-[10px] uppercase tracking-wide text-slate-400">
                  Source excerpt from tender
                </span>
              </blockquote>
            )}
          </div>
        ))}
      </div>

      {mappings.length > 0 && (
        <div className="mt-4 rounded-lg border border-indigo-100 bg-white p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Linked to bid-fit score
          </p>
          <ul className="space-y-1 text-sm text-slate-700">
            {mappings.map((m) => (
              <li key={m.label}>
                <span className="font-medium">{m.label}</span> ({m.weight}) →{" "}
                {m.mapsTo}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
