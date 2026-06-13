import { callGeminiJSON } from "./gemini";
import type { BudgetEntity, NERResult } from "./types";

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

const BUDGET_AMOUNT_PATTERN =
  /(?:PKR|Rs\.?\s?|USD|\$|EUR|£)\s*[\d,]+(?:\.\d{2})?(?:\s*(?:million|M|billion|B|thousand|K|lakh|crore))?|\b(?:budget|ceiling|not to exceed|NTE|contract\s+(?:value|price))[\s:–-]*(?:PKR|Rs\.?\s?|USD|\$)?\s*[\d,]+(?:\.\d{2})?(?:\s*(?:million|M|billion|B|thousand|K|lakh|crore))?/gi;

const BUDGET_RULE_PATTERN =
  /\b(?:total available budget|maximum contract value|financial proposal shall not exceed|contract price shall not exceed|fixed-budget selection)[^.!\n]{0,160}/gi;

const WEIGHT_PATTERN =
  /([A-Za-z][A-Za-z\s\/&-]{2,40}?)\s*[:\-–]\s*(\d{1,3})\s*%/g;

const NON_BUDGET_CONTEXT =
  /performance guarantee|bank guarantee|bid security|earnest money|evaluation score|technical marks|lowest financial proposal/i;

function extractSentence(text: string, index: number, maxLen = 320): string {
  let start = index;
  const searchBack = Math.min(index, 220);
  for (let i = 0; i < searchBack; i++) {
    const ch = text[index - i];
    if (i > 0 && (ch === "\n" || ch === "." || ch === "!" || ch === "?")) {
      start = index - i + 1;
      break;
    }
    if (i === searchBack - 1) start = Math.max(0, index - 80);
  }

  let end = index;
  const searchForward = Math.min(text.length - index, 220);
  for (let i = 0; i < searchForward; i++) {
    const ch = text[index + i];
    if (ch === "\n" || ch === "." || ch === "!" || ch === "?") {
      end = index + i + 1;
      break;
    }
    if (i === searchForward - 1) end = Math.min(text.length, index + 120);
  }

  let sentence = text.slice(start, end).replace(/\s+/g, " ").trim();
  if (sentence.length > maxLen) {
    sentence = `${sentence.slice(0, maxLen).trim()}…`;
  }
  return sentence;
}

function normalizeBudgetLabel(text: string, context: string): string {
  const combined = `${text} ${context}`;
  const amountMatch = combined.match(
    /(?:PKR|Rs\.?\s?|USD|\$|EUR|£)\s*[\d,]+(?:\.\d{2})?(?:\s*(?:million|M|billion|B|thousand|K|lakh|crore))?/i
  );
  if (amountMatch) return amountMatch[0].replace(/\s+/g, " ").trim();

  if (/total available budget/i.test(combined)) return "Total available budget (see Data Sheet)";
  if (/fixed-budget/i.test(combined)) return "Fixed-budget assignment";
  if (/not to exceed|NTE|ceiling/i.test(combined)) return "Budget ceiling / NTE";

  return text.length >= 12 ? text : context.slice(0, 80).trim() + (context.length > 80 ? "…" : "");
}

function parseBudgetAmount(text: string): string | null {
  const match = text.match(
    /(?:PKR|Rs\.?\s?|USD|\$|EUR|£)\s*[\d,]+(?:\.\d{2})?(?:\s*(?:million|M|billion|B|thousand|K|lakh|crore))?/i
  );
  return match ? match[0].replace(/\s+/g, " ").trim() : null;
}

function isValidBudget(item: BudgetEntity): boolean {
  const blob = `${item.text} ${item.context}`.toLowerCase();
  if (NON_BUDGET_CONTEXT.test(blob)) return false;
  if (item.text.length < 6 && !parseBudgetAmount(item.text)) return false;
  if (/^budget[,.\s]*$/i.test(item.text.trim())) return false;
  return true;
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
      context: extractSentence(text, match.index),
    });
  }

  const amountRegex = new RegExp(BUDGET_AMOUNT_PATTERN.source, BUDGET_AMOUNT_PATTERN.flags);
  while ((match = amountRegex.exec(text)) !== null) {
    const context = extractSentence(text, match.index);
    const raw = match[0].trim();
    budgets.push({
      text: normalizeBudgetLabel(raw, context),
      amount: parseBudgetAmount(raw),
      context,
    });
  }

  const ruleRegex = new RegExp(BUDGET_RULE_PATTERN.source, BUDGET_RULE_PATTERN.flags);
  while ((match = ruleRegex.exec(text)) !== null) {
    const context = extractSentence(text, match.index);
    if (NON_BUDGET_CONTEXT.test(context)) continue;
    budgets.push({
      text: normalizeBudgetLabel(match[0].trim(), context),
      amount: parseBudgetAmount(context),
      context,
    });
  }

  const weightRegex = new RegExp(WEIGHT_PATTERN.source, WEIGHT_PATTERN.flags);
  while ((match = weightRegex.exec(text)) !== null) {
    evaluationWeights.push({
      criterion: match[1].trim(),
      weight: `${match[2]}%`,
      context: extractSentence(text, match.index),
    });
  }

  for (const keyword of COMPLIANCE_KEYWORDS) {
    const regex = new RegExp(keyword.replace(/\s+/g, "\\s*"), "gi");
    while ((match = regex.exec(text)) !== null) {
      complianceClauses.push({
        clause: match[0],
        type: keyword.replace(/\s+/g, " "),
        context: extractSentence(text, match.index),
      });
    }
  }

  return {
    deadlines,
    budgets: dedupe(budgets.filter(isValidBudget), (b) => b.context.slice(0, 80)),
    evaluationWeights,
    complianceClauses,
  };
}

function dedupe<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const k = key(item).toLowerCase().replace(/\s+/g, " ");
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
2. budgets - ONLY contract values, budget ceilings, or explicit currency amounts (PKR, USD, Rs, $). Include rules like "total available budget in Data Sheet" as ONE entry with a clear label — NOT performance guarantees, bid bonds, or evaluation percentages.
3. evaluationWeights - scoring criteria with percentage weights (technical/financial split, minimum marks)
4. complianceClauses - security/compliance requirements (SOC 2, ISO, FedRAMP, HIPAA, GDPR, etc.)

For each item, "text" must be a readable label (not a single word like "budget,"). "context" must be one complete sentence copied or closely paraphrased from the document.

Do NOT put performance guarantees, bank guarantees, or evaluation scoring rules in budgets.

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

    const mergedBudgets = dedupe(
      [...regexResult.budgets, ...enriched.budgets]
        .filter(isValidBudget)
        .map((b) => ({
          ...b,
          text: normalizeBudgetLabel(b.text, b.context),
          amount: b.amount || parseBudgetAmount(`${b.text} ${b.context}`),
        })),
      (b) => b.context.slice(0, 100)
    );

    return {
      deadlines: dedupe(
        [...regexResult.deadlines, ...enriched.deadlines],
        (d) => d.text
      ),
      budgets: mergedBudgets,
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
    return regexResult;
  }
}

export async function extractEntities(text: string): Promise<NERResult> {
  const regexResult = regexExtract(text);
  return llmEnrich(text, regexResult);
}
