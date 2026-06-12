import type { ComplianceChecklistItem } from "./types";

export function mandatoryPassRate(
  checklist: ComplianceChecklistItem[]
): number {
  const mandatory = checklist.filter((c) => c.mandatory);
  if (mandatory.length === 0) return 100;
  const passed = mandatory.filter(
    (c) => c.status === "pass" || c.status === "partial"
  ).length;
  return Math.round((passed / mandatory.length) * 100);
}
