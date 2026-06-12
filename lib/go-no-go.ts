import { mandatoryPassRate } from "./compliance-checklist";
import type {
  ComplianceChecklistItem,
  GoNoGoResult,
  WinScoreResult,
} from "./types";

export function determineGoNoGo(
  winScore: WinScoreResult,
  checklist: ComplianceChecklistItem[]
): GoNoGoResult {
  const mandatoryRate = mandatoryPassRate(checklist);
  const { breakdown, overall } = winScore;

  const factors = {
    overallScore: overall,
    mandatoryPassRate: mandatoryRate,
    complianceCoverage: breakdown.complianceCoverage,
    budgetAlignment: breakdown.budgetAlignment,
    historicalWinRate: breakdown.historicalWinRate,
  };

  const mandatoryFails = checklist.filter(
    (c) => c.mandatory && c.status === "fail"
  ).length;

  if (
    overall >= 55 &&
    mandatoryRate >= 70 &&
    breakdown.complianceCoverage >= 50 &&
    mandatoryFails <= 2
  ) {
    return {
      decision: "GO",
      rationale: `Strong bid fit (${overall}% win probability). ${mandatoryRate}% of mandatory requirements have capability evidence. Budget alignment and historical win rate support pursuit.`,
      factors,
    };
  }

  if (
    overall < 35 ||
    mandatoryRate < 50 ||
    mandatoryFails > 5 ||
    breakdown.complianceCoverage < 30
  ) {
    return {
      decision: "NO-GO",
      rationale: `Insufficient fit for pursuit (${overall}% win probability). ${mandatoryFails} mandatory compliance gaps detected. Resource investment unlikely to yield competitive submission.`,
      factors,
    };
  }

  return {
    decision: "REVIEW",
    rationale: `Borderline opportunity (${overall}% win probability). ${mandatoryFails} mandatory gaps require bid manager review. Consider GO only if gaps can be closed with partners or new evidence.`,
    factors,
  };
}

