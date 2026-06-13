import type {
  EvaluationCriterion,
  EvaluationWeight,
  NERResult,
} from "./types";

export interface NormalizedCriterion {
  criterion: string;
  weight: string;
  weightNum: number;
  source: "extracted" | "ner";
  level: "primary" | "sub";
  description?: string;
  sourceText?: string;
}

const PRIMARY_KEYWORDS = [
  "technical",
  "financial",
  "price",
  "commercial",
  "cost",
  "evaluation of financial",
  "total technical",
];

function parseWeightNum(weight: string): number {
  const match = weight.match(/(\d{1,3})/);
  return match ? parseInt(match[1], 10) : 0;
}

function isPrimary(criterion: string, weightNum: number): boolean {
  const lower = criterion.toLowerCase();
  if (weightNum >= 20) return true;
  return PRIMARY_KEYWORDS.some((k) => lower.includes(k));
}

function dedupeCriteria(items: NormalizedCriterion[]): NormalizedCriterion[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.criterion.toLowerCase().replace(/\s+/g, " ").slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function normalizeEvaluationCriteria(
  evaluationCriteria: EvaluationCriterion[] = [],
  entities?: NERResult | null
): NormalizedCriterion[] {
  const fromExtracted: NormalizedCriterion[] = evaluationCriteria.map((c) => {
    const weightNum = parseWeightNum(c.weight);
    return {
      criterion: c.criterion,
      weight: c.weight,
      weightNum,
      source: "extracted" as const,
      level: isPrimary(c.criterion, weightNum) ? "primary" : "sub",
      description: c.description,
      sourceText: c.sourceQuote,
    };
  });

  const fromNer: NormalizedCriterion[] = (entities?.evaluationWeights || []).map(
    (w: EvaluationWeight) => {
      const weightNum = parseWeightNum(w.weight);
      return {
        criterion: w.criterion,
        weight: w.weight,
        weightNum,
        source: "ner" as const,
        level: isPrimary(w.criterion, weightNum) ? "primary" : "sub",
        sourceText: w.context,
      };
    }
  );

  const merged = dedupeCriteria(
    [...fromExtracted, ...fromNer].sort((a, b) => b.weightNum - a.weightNum)
  ).map((item) => {
    const nerMatch = fromNer.find(
      (n) =>
        n.criterion.toLowerCase().includes(item.criterion.toLowerCase().slice(0, 12)) ||
        item.criterion.toLowerCase().includes(n.criterion.toLowerCase().slice(0, 12))
    );
    const extractedMatch = fromExtracted.find(
      (e) =>
        e.criterion.toLowerCase().includes(item.criterion.toLowerCase().slice(0, 12)) ||
        item.criterion.toLowerCase().includes(e.criterion.toLowerCase().slice(0, 12))
    );
    return {
      ...item,
      description: item.description || extractedMatch?.description,
      sourceText: item.sourceText || nerMatch?.sourceText || extractedMatch?.sourceText,
    };
  });

  const primary = merged.filter((c) => c.level === "primary").slice(0, 6);
  if (primary.length >= 2) return primary;

  return merged.filter((c) => c.weightNum >= 5).slice(0, 8);
}

export function mapCriteriaToWinFactors(
  criteria: NormalizedCriterion[]
): { label: string; weight: string; mapsTo: string }[] {
  const primary = criteria.filter((c) => c.level === "primary");
  return primary.map((c) => {
    const lower = c.criterion.toLowerCase();
    let mapsTo = "Capability & compliance fit";
    if (lower.includes("financial") || lower.includes("price") || lower.includes("cost")) {
      mapsTo = "Budget alignment & pricing competitiveness";
    } else if (lower.includes("technical") || lower.includes("methodology")) {
      mapsTo = "Capability match & answerability";
    } else if (lower.includes("experience") || lower.includes("past")) {
      mapsTo = "Historical win rate & past performance";
    }
    return { label: c.criterion, weight: c.weight, mapsTo };
  });
}
