import type { GoNoGoDecision } from "./types";

export function goNoGoColor(decision: GoNoGoDecision): string {
  switch (decision) {
    case "GO":
      return "bg-emerald-600 text-white";
    case "NO-GO":
      return "bg-red-600 text-white";
    case "REVIEW":
      return "bg-amber-500 text-white";
  }
}
