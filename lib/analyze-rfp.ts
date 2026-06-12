import type { SupabaseClient } from "@supabase/supabase-js";
import { buildComplianceChecklist } from "./compliance-checklist";
import { calculateEffortBenchmark } from "./effort-benchmark";
import { extractRequirements } from "./extract-requirements";
import { determineGoNoGo } from "./go-no-go";
import { extractEntities } from "./ner";
import { calculateWinScore } from "./win-score";
import type { RFPAnalysisResult } from "./types";

export async function analyzeRfpText(
  supabase: SupabaseClient,
  text: string,
  filename?: string
): Promise<RFPAnalysisResult> {
  const [entities, extracted] = await Promise.all([
    extractEntities(text),
    extractRequirements(text),
  ]);

  const { summary, domain, requirements, evaluationCriteria } = extracted;
  const requirementTexts = requirements.map((r) => r.text);
  const winScore = await calculateWinScore(supabase, requirementTexts, entities, domain);
  const complianceChecklist = buildComplianceChecklist(
    requirements,
    winScore.requirementScores
  );
  const goNoGo = determineGoNoGo(winScore, complianceChecklist);
  const effort = calculateEffortBenchmark(requirements.length);

  return {
    filename,
    domain,
    summary,
    entities,
    requirements,
    evaluationCriteria,
    complianceChecklist,
    winScore,
    goNoGo,
    effort,
  };
}
