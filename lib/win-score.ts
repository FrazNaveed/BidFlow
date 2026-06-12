import type { SupabaseClient } from "@supabase/supabase-js";
import { getBidHistoryStats } from "./bid-history";
import { embedText } from "./embeddings";
import type {
  ComplianceClause,
  NERResult,
  RequirementScore,
  WinScoreBreakdown,
  WinScoreResult,
} from "./types";

const MATCH_THRESHOLD = 0.7;

function scoreLabel(overall: number): string {
  if (overall >= 75) return "Strong fit — high win probability";
  if (overall >= 50) return "Moderate fit — competitive with gaps";
  if (overall >= 30) return "Weak fit — significant gaps";
  return "Poor fit — low win probability";
}

async function scoreRequirements(
  supabase: SupabaseClient,
  requirements: string[]
): Promise<RequirementScore[]> {
  if (requirements.length === 0) return [];

  const scores: RequirementScore[] = [];

  for (const requirement of requirements) {
    const embedding = await embedText(requirement);

    const { data, error } = await supabase.rpc("match_chunks", {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 3,
    });

    if (error) {
      scores.push({
        requirement,
        similarity: 0,
        answerable: false,
        topSource: null,
      });
      continue;
    }

    const chunks = data ?? [];
    const topSimilarity = chunks[0]?.similarity ?? 0;

    scores.push({
      requirement,
      similarity: topSimilarity,
      answerable: topSimilarity >= MATCH_THRESHOLD,
      topSource: chunks[0]?.source_file ?? null,
    });
  }

  return scores;
}

async function scoreComplianceClauses(
  supabase: SupabaseClient,
  clauses: ComplianceClause[]
): Promise<{ coverage: number; gaps: string[] }> {
  if (clauses.length === 0) {
    return { coverage: 100, gaps: [] };
  }

  const gaps: string[] = [];
  let covered = 0;

  for (const clause of clauses) {
    const embedding = await embedText(clause.clause);

    const { data } = await supabase.rpc("match_chunks", {
      query_embedding: embedding,
      match_threshold: MATCH_THRESHOLD,
      match_count: 1,
    });

    if (data && data.length > 0) {
      covered++;
    } else {
      gaps.push(`No capability evidence for: ${clause.type} (${clause.clause})`);
    }
  }

  return {
    coverage: Math.round((covered / clauses.length) * 100),
    gaps,
  };
}

function computeRagBreakdown(
  requirementScores: RequirementScore[],
  complianceCoverage: number
): Pick<
  WinScoreBreakdown,
  "capabilityMatch" | "complianceCoverage" | "requirementAnswerability" | "confidenceScore"
> {
  const avgSimilarity =
    requirementScores.length > 0
      ? requirementScores.reduce((s, r) => s + r.similarity, 0) /
        requirementScores.length
      : 0;

  const answerablePct =
    requirementScores.length > 0
      ? (requirementScores.filter((r) => r.answerable).length /
          requirementScores.length) *
        100
      : 0;

  const highConf = requirementScores.filter((r) => r.similarity > 0.85).length;
  const medConf = requirementScores.filter(
    (r) => r.similarity >= 0.7 && r.similarity <= 0.85
  ).length;
  const total = requirementScores.length || 1;

  const confidenceScore = Math.round((highConf * 100 + medConf * 60) / total);

  return {
    capabilityMatch: Math.round(avgSimilarity * 100),
    complianceCoverage,
    requirementAnswerability: Math.round(answerablePct),
    confidenceScore: Math.min(100, confidenceScore),
  };
}

function computeOverall(breakdown: WinScoreBreakdown): number {
  return Math.round(
    breakdown.capabilityMatch * 0.25 +
      breakdown.complianceCoverage * 0.2 +
      breakdown.requirementAnswerability * 0.15 +
      breakdown.confidenceScore * 0.1 +
      breakdown.budgetAlignment * 0.1 +
      breakdown.historicalWinRate * 0.1 +
      breakdown.competitorRisk * 0.1
  );
}

export async function calculateWinScore(
  supabase: SupabaseClient,
  requirements: string[],
  entities?: NERResult,
  domain = "IT Services"
): Promise<WinScoreResult> {
  const requirementScores = await scoreRequirements(supabase, requirements);

  const { coverage, gaps: complianceGaps } = entities
    ? await scoreComplianceClauses(supabase, entities.complianceClauses)
    : { coverage: 100, gaps: [] as string[] };

  const budgetText = entities?.budgets[0]?.amount || entities?.budgets[0]?.text;
  const historyStats = await getBidHistoryStats(supabase, domain, budgetText);

  const ragBreakdown = computeRagBreakdown(requirementScores, coverage);
  const breakdown: WinScoreBreakdown = {
    ...ragBreakdown,
    budgetAlignment: historyStats.budgetAlignment,
    historicalWinRate: historyStats.historicalWinRate,
    competitorRisk: historyStats.competitorRisk,
  };

  const overall = computeOverall(breakdown);

  const gaps = [
    ...complianceGaps,
    ...requirementScores
      .filter((r) => !r.answerable)
      .map(
        (r) =>
          `Low capability match (${(r.similarity * 100).toFixed(0)}%): ${r.requirement.slice(0, 120)}${r.requirement.length > 120 ? "…" : ""}`
      ),
  ];

  if (historyStats.budgetAlignment < 50) {
    gaps.push("Budget may be misaligned with historical contract values in this domain");
  }
  if (historyStats.historicalWinRate < 40) {
    gaps.push(`Low historical win rate (${historyStats.historicalWinRate}%) in ${domain}`);
  }

  return {
    overall,
    label: scoreLabel(overall),
    breakdown,
    gaps,
    requirementScores,
  };
}

export async function calculateQuestionWinScore(
  supabase: SupabaseClient,
  question: string,
  trustScore: number,
  sources: { source_file: string }[]
): Promise<WinScoreResult> {
  const requirementScores: RequirementScore[] = [
    {
      requirement: question,
      similarity: trustScore,
      answerable: trustScore >= MATCH_THRESHOLD,
      topSource: sources[0]?.source_file ?? null,
    },
  ];

  const historyStats = await getBidHistoryStats(supabase, "IT Services");
  const ragBreakdown = computeRagBreakdown(requirementScores, trustScore >= 0.7 ? 100 : 50);
  const breakdown: WinScoreBreakdown = {
    ...ragBreakdown,
    budgetAlignment: historyStats.budgetAlignment,
    historicalWinRate: historyStats.historicalWinRate,
    competitorRisk: historyStats.competitorRisk,
  };

  const overall = computeOverall(breakdown);
  const gaps: string[] = [];
  if (!requirementScores[0].answerable) {
    gaps.push("Insufficient capability evidence for this question");
  }

  return {
    overall,
    label: scoreLabel(overall),
    breakdown,
    gaps,
    requirementScores,
  };
}
