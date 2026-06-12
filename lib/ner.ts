import { callGeminiJSON } from "./gemini";
import type { NERResult } from "./types";

const COMPLIANCE_KEYWORDS = [
  "SOC 2",
  "SOC2",
  "ISO 27001",
  "ISO27001",
  "FedRAMP",
  "HIPAA",
  "GDPR",
  "PCI DSS",
  "PCI-DSS",
  "CMMC",
  "NIST",
  "FISMA",
  "ITAR",
  "CCPA",
  "HITECH",
  "FERPA",
];

const DATE_PATTERN =
  /\b(?:due|deadline|submit(?:tal)?|proposal|response|closing)\s*(?:date|by|on|no later than)?[:\s]*((?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2})/gi;

const BUDGET_PATTERN =
  /\$[\d,]+(?:\.\d{2})?(?:\s*(?:million|M|billion|B|thousand|K))?|\b(?:budget|ceiling|not to exceed|NTE)[:\s]*\$?[\d,]+(?:\.\d{2})?/gi;

const WEIGHT_PATTERN =
  /([A-Za-z][A-Za-z\s\/&-]{2,40}?)\s*[:\-–]\s*(\d{1,3})\s*%/g;

function extractContext(text: string, index: number, radius = 80): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + radius);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

function regexExtract(text: string): NERResult {
  const deadlines: NERResult["deadlines"] = [];
  const budgets: NERResult["budgets"] = [];
  const evaluationWeights: NERResult["evaluationWeights"] = [];
  const complianceClauses: NERResult["complianceClauses"] = [];

  let match: RegExpExecArray | null;

  const dateRegex = new RegExp(DATE_PATTERN.source, DATE_PATTERN.flags);
  while ((match = dateRegex.exec(text)) !== null) {
    deadlines.push({
      text: match[0].trim(),
      date: match[1]?.trim() ?? null,
      context: extractContext(text, match.index),
    });
  }

  const budgetRegex = new RegExp(BUDGET_PATTERN.source, BUDGET_PATTERN.flags);
  while ((match = budgetRegex.exec(text)) !== null) {
    budgets.push({
      text: match[0].trim(),
      amount: match[0].replace(/budget|ceiling|not to exceed|NTE/gi, "").trim(),
      context: extractContext(text, match.index),
    });
  }

  const weightRegex = new RegExp(WEIGHT_PATTERN.source, WEIGHT_PATTERN.flags);
  while ((match = weightRegex.exec(text)) !== null) {
    evaluationWeights.push({
      criterion: match[1].trim(),
      weight: `${match[2]}%`,
      context: extractContext(text, match.index),
    });
  }

  for (const keyword of COMPLIANCE_KEYWORDS) {
    const regex = new RegExp(keyword.replace(/\s+/g, "\\s*"), "gi");
    while ((match = regex.exec(text)) !== null) {
      complianceClauses.push({
        clause: match[0],
        type: keyword.replace(/\s+/g, " "),
        context: extractContext(text, match.index),
      });
    }
  }

  return { deadlines, budgets, evaluationWeights, complianceClauses };
}

function dedupe<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const k = key(item).toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function llmEnrich(text: string, regexResult: NERResult): Promise<NERResult> {
  const truncated = text.slice(0, 60000);

  try {
    const enriched = await callGeminiJSON<NERResult>(`You are an NER system for RFP documents. Extract structured entities from the document below.

Find:
1. deadlines - submission dates, due dates, milestone dates
2. budgets - dollar amounts, budget ceilings, contract values
3. evaluationWeights - scoring criteria with percentage weights
4. complianceClauses - security/compliance requirements (SOC 2, ISO, FedRAMP, HIPAA, GDPR, etc.)

Merge with any regex findings already detected. Do not duplicate. Include brief context snippets.

Existing regex findings:
${JSON.stringify(regexResult, null, 2)}

DOCUMENT:
${truncated}

Return JSON matching this schema:
{
  "deadlines": [{ "text": string, "date": string|null, "context": string }],
  "budgets": [{ "text": string, "amount": string|null, "context": string }],
  "evaluationWeights": [{ "criterion": string, "weight": string, "context": string }],
  "complianceClauses": [{ "clause": string, "type": string, "context": string }]
}`);

    return {
      deadlines: dedupe(
        [...regexResult.deadlines, ...enriched.deadlines],
        (d) => d.text
      ),
      budgets: dedupe(
        [...regexResult.budgets, ...enriched.budgets],
        (b) => b.text
      ),
      evaluationWeights: dedupe(
        [...regexResult.evaluationWeights, ...enriched.evaluationWeights],
        (w) => `${w.criterion}-${w.weight}`
      ),
      complianceClauses: dedupe(
        [...regexResult.complianceClauses, ...enriched.complianceClauses],
        (c) => c.clause
      ),
    };
  } catch {
    return {
      deadlines: dedupe(regexResult.deadlines, (d) => d.text),
      budgets: dedupe(regexResult.budgets, (b) => b.text),
      evaluationWeights: dedupe(
        regexResult.evaluationWeights,
        (w) => `${w.criterion}-${w.weight}`
      ),
      complianceClauses: dedupe(regexResult.complianceClauses, (c) => c.clause),
    };
  }
}

export async function extractEntities(text: string): Promise<NERResult> {
  const regexResult = regexExtract(text);
  return llmEnrich(text, regexResult);
}
