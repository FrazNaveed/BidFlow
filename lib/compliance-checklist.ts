import type {
  ComplianceChecklistItem,
  ExtractedRequirement,
  RequirementScore,
} from "./types";

export function buildComplianceChecklist(
  requirements: ExtractedRequirement[],
  scores: RequirementScore[]
): ComplianceChecklistItem[] {
  return requirements.map((req) => {
    const score = scores.find((s) => s.requirement === req.text);
    const similarity = score?.similarity ?? 0;
    const mandatory = req.priority === "high";

    let status: ComplianceChecklistItem["status"] = "fail";
    if (similarity >= 0.85) status = "pass";
    else if (similarity >= 0.7) status = "partial";

    let notes = "";
    if (status === "pass") notes = "Capability evidence found in library";
    else if (status === "partial")
      notes = "Partial match — review and supplement before submission";
    else if (mandatory)
      notes = "MANDATORY gap — disqualification risk if not addressed";
    else notes = "Optional requirement — low evidence in capability library";

    return {
      id: req.id,
      requirement: req.text,
      mandatory,
      sectionType: req.sectionType,
      category: req.category,
      status,
      similarity,
      evidence: score?.topSource ?? null,
      notes,
    };
  });
}

export { mandatoryPassRate } from "./mandatory-pass-rate";
