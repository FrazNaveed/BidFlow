export type ConfidenceLevel = "high" | "medium" | "low";

export function getConfidenceLevel(similarity: number): ConfidenceLevel {
  if (similarity > 0.85) return "high";
  if (similarity >= 0.7) return "medium";
  return "low";
}

export function getConfidenceLabel(level: ConfidenceLevel): string {
  switch (level) {
    case "high":
      return "High confidence";
    case "medium":
      return "Medium confidence";
    case "low":
      return "Low confidence — review carefully";
  }
}

export function getConfidenceColor(level: ConfidenceLevel): string {
  switch (level) {
    case "high":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "medium":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "low":
      return "bg-red-100 text-red-800 border-red-200";
  }
}
