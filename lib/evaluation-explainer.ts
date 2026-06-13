import type { NormalizedCriterion } from "./evaluation-criteria";

export function explainCriterion(criterion: NormalizedCriterion): string {
  const lower = criterion.criterion.toLowerCase();
  const w = criterion.weight;

  if (lower.includes("minimum") && lower.includes("technical")) {
    return `Pass/fail gate: bidders must score at least ${w} on the technical proposal (out of 100) to be treated as a responsive bidder before financial scoring.`;
  }
  if (lower.includes("lowest") && lower.includes("financial")) {
    return `Financial scoring rule: the lowest-priced compliant bid typically receives the maximum ${w} on the financial component; higher prices receive proportionally lower marks.`;
  }
  if (lower.includes("financial") || lower.includes("price") || lower.includes("commercial")) {
    return `Price component — ${w} of your combined evaluation score comes from the financial proposal.`;
  }
  if (lower.includes("technical")) {
    return `Quality component — ${w} of your combined score reflects methodology, team, experience, and understanding of scope.`;
  }
  if (criterion.weightNum >= 20) {
    return `Major scoring factor weighted at ${w} of the overall evaluation.`;
  }
  return criterion.description || `Scoring factor weighted at ${w}.`;
}

export function buildScoringSummary(criteria: NormalizedCriterion[]): string | null {
  const primary = criteria.filter((c) => c.level === "primary");
  const technical = primary.find((c) => c.criterion.toLowerCase().includes("technical"));
  const financial = primary.find(
    (c) =>
      c.criterion.toLowerCase().includes("financial") ||
      c.criterion.toLowerCase().includes("price")
  );
  const minTechnical = criteria.find((c) =>
    c.criterion.toLowerCase().includes("minimum")
  );

  if (!technical && !financial && criteria.length === 0) return null;

  const parts: string[] = [];

  if (technical && financial) {
    parts.push(
      `This tender uses a weighted score: Technical ${technical.weight} + Financial ${financial.weight}.`
    );
  } else if (technical) {
    parts.push(`Technical quality is weighted at ${technical.weight}.`);
  }

  if (minTechnical) {
    parts.push(
      `Bidders must meet the minimum technical threshold (${minTechnical.weight}) or are disqualified before price is fully considered.`
    );
  }

  parts.push(
    "Figures below are taken from the tender document — always confirm against the official RFP before bidding."
  );

  return parts.join(" ");
}
