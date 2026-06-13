import { callGeminiJSON } from "./gemini";
import { getSupabase } from "./supabase";
import type { EvaluationCriterion, ExtractedRequirement } from "./types";

interface ExtractionResponse {
  summary: string;
  domain: string;
  requirements: ExtractedRequirement[];
  evaluationCriteria: EvaluationCriterion[];
}

export async function extractRequirements(
  text: string
): Promise<{
  summary: string;
  domain: string;
  requirements: ExtractedRequirement[];
  evaluationCriteria: EvaluationCriterion[];
}> {
  const truncated = text.slice(0, 80000);

  const result = await callGeminiJSON<ExtractionResponse>(`You are an expert bid analyst. Parse the following RFP/RFQ/Tender document and extract structured bid intelligence.

Extract:
1. summary — 2-3 sentence overview
2. domain — primary sector (e.g. "IT Services", "Construction", "Logistics")
3. requirements — up to 50 most important distinct requirements vendors must address, including:
   - id: "REQ-001" format
   - text: requirement text (max 300 characters each)
   - category: technical|security|compliance|pricing|timeline|legal|experience|other
   - priority: high (mandatory/shall/must), medium (should), low (nice-to-have)
   - sectionType: "question" (explicit Q&A), "narrative" (descriptive section to write), or "compliance" (certification/regulatory)
   - sectionTitle: parent section name if identifiable
4. evaluationCriteria — scoring criteria with weights from the document. For each, include a short description of what it means and sourceQuote: a verbatim sentence or phrase copied from the document.

DOCUMENT:
${truncated}

Return JSON:
{
  "summary": string,
  "domain": string,
  "requirements": [{ "id": string, "text": string, "category": string, "priority": "high"|"medium"|"low", "sectionType": "question"|"narrative"|"compliance", "sectionTitle": string }],
  "evaluationCriteria": [{ "criterion": string, "weight": string, "description": string, "sourceQuote": string }]
}`);

  const requirements = (result.requirements || [])
    .filter((r) => r.text?.trim())
    .map((r) => ({
      ...r,
      sectionType: r.sectionType || "question",
    }));

  const evaluationCriteria = await enrichEvaluationCriteria(
    result.evaluationCriteria || [],
    result.domain || "IT Services"
  );

  return {
    summary: result.summary || "",
    domain: result.domain || "IT Services",
    requirements,
    evaluationCriteria,
  };
}

async function enrichEvaluationCriteria(
  criteria: EvaluationCriterion[],
  domain: string
): Promise<EvaluationCriterion[]> {
  try {
    const supabase = getSupabase();
    const { data: taxonomy } = await supabase
      .from("evaluation_taxonomy")
      .select("*")
      .ilike("sector", `%${domain.split(" ")[0]}%`);

    if (!taxonomy || taxonomy.length === 0) return criteria;

    return criteria.map((c) => {
      const match = taxonomy.find((t) =>
        c.criterion.toLowerCase().includes(t.criterion.toLowerCase().slice(0, 8))
      );
      return {
        ...c,
        taxonomyMatch: match?.criterion,
        description: c.description || match?.description,
      };
    });
  } catch {
    return criteria;
  }
}
