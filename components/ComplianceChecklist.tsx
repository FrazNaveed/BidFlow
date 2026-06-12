import type { ComplianceChecklistItem } from "@/lib/types";

function statusStyle(status: ComplianceChecklistItem["status"]) {
  switch (status) {
    case "pass":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "partial":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "fail":
      return "bg-red-100 text-red-800 border-red-200";
  }
}

export default function ComplianceChecklist({
  items,
}: {
  items: ComplianceChecklistItem[];
}) {
  const passed = items.filter((i) => i.status === "pass").length;
  const partial = items.filter((i) => i.status === "partial").length;
  const failed = items.filter((i) => i.status === "fail").length;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-sm">
        <span className="text-emerald-700 font-medium">{passed} Pass</span>
        <span className="text-amber-700 font-medium">{partial} Partial</span>
        <span className="text-red-700 font-medium">{failed} Fail</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left font-semibold text-slate-700">ID</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Requirement</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Type</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className={item.mandatory && item.status === "fail" ? "bg-red-50/50" : ""}>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                  {item.id}
                  {item.mandatory && (
                    <span className="ml-1 text-red-600" title="Mandatory">*</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-800 max-w-md">{item.requirement}</td>
                <td className="px-4 py-3 capitalize text-slate-500">{item.sectionType}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${statusStyle(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {item.evidence ? (
                    <span title={item.notes}>{item.evidence}</span>
                  ) : (
                    <span className="text-red-500">{item.notes}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
