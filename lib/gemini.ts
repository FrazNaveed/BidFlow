import {
  GoogleGenerativeAI,
  TaskType,
  type GenerativeModel,
} from "@google/generative-ai";

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

export function formatGeminiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);

  if (raw.includes("GEMINI_API_KEY is not set")) {
    return "GEMINI_API_KEY is not set in .env. Get a key at aistudio.google.com, then restart npm run dev.";
  }
  if (raw.includes("API key not valid") || raw.includes("API_KEY_INVALID")) {
    return "Invalid GEMINI_API_KEY in .env. Check your key at aistudio.google.com, then restart npm run dev.";
  }
  if (raw.includes("prepayment credits are depleted") || raw.includes("429 Too Many Requests")) {
    return "Gemini API credits are depleted for this project. Open aistudio.google.com → your project → Buy credits ($25 is enough for the hackathon), or create a new project with a new API key. Then restart npm run dev.";
  }
  if (raw.includes("RESOURCE_EXHAUSTED") || raw.includes("quota")) {
    return "Gemini API rate limit or quota exceeded. Wait a few minutes, try gemini-2.5-flash-lite in GEMINI_MODEL, or add credits in AI Studio.";
  }
  if (raw.includes("404 Not Found") || raw.includes("no longer available")) {
    return "Gemini model not found or retired. Set GEMINI_MODEL=gemini-2.5-flash in .env and restart npm run dev.";
  }
  if (raw.includes("Failed to parse JSON") || raw.includes("Unterminated string in JSON")) {
    return "AI returned incomplete JSON while parsing the RFP. Try again, or upload a shorter/smaller document.";
  }

  return raw;
}
export const GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIMENSIONS = 1536;

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set in .env");
  }
  return key;
}

export function getGemini(): GoogleGenerativeAI {
  return new GoogleGenerativeAI(getApiKey());
}

export function getTextModel(maxOutputTokens = 4096): GenerativeModel {
  return getGemini().getGenerativeModel({
    model: getGeminiModel(),
    generationConfig: { maxOutputTokens },
  });
}

export function parseJsonFromLLM<T>(text: string): T {
  const candidates: string[] = [];
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) candidates.push(fenced[1].trim());
  candidates.push(text.trim());
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) candidates.push(objectMatch[0]);

  let lastError: unknown;
  for (const raw of candidates) {
    try {
      return JSON.parse(raw) as T;
    } catch (err) {
      lastError = err;
    }
  }

  const message =
    lastError instanceof Error ? lastError.message : "Invalid JSON";
  throw new SyntaxError(`Failed to parse JSON from model response: ${message}`);
}

function jsonGenerationConfig(maxOutputTokens: number) {
  return {
    maxOutputTokens,
    responseMimeType: "application/json" as const,
    // Gemini 2.5 thinking tokens can truncate JSON mid-string without this.
    thinkingConfig: { thinkingBudget: 0 },
  };
}

export async function callGemini(prompt: string, maxTokens = 4096): Promise<string> {
  const result = await getTextModel(maxTokens).generateContent(prompt);
  return result.response.text();
}

export async function callGeminiJSON<T>(prompt: string, maxTokens = 8192): Promise<T> {
  const model = getGemini().getGenerativeModel({
    model: getGeminiModel(),
    generationConfig: jsonGenerationConfig(maxTokens),
  });

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await model.generateContent(
        attempt === 0
          ? prompt
          : `${prompt}\n\nReturn complete, valid JSON only. Keep requirement text under 300 characters. Close all strings and brackets.`
      );
      return parseJsonFromLLM<T>(result.response.text());
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
}

export async function streamGemini(prompt: string, maxTokens = 1024) {
  return getTextModel(maxTokens).generateContentStream(prompt);
}

export function getEmbeddingModel(): GenerativeModel {
  return getGemini().getGenerativeModel({ model: GEMINI_EMBEDDING_MODEL });
}

type EmbedRequest = {
  content: { role: string; parts: { text: string }[] };
  taskType: TaskType;
  outputDimensionality: number;
};

function buildEmbedRequest(text: string, taskType: TaskType): EmbedRequest {
  return {
    content: { role: "user", parts: [{ text }] },
    taskType,
    outputDimensionality: EMBEDDING_DIMENSIONS,
  };
}

export async function embedContentValues(
  text: string,
  taskType: TaskType
): Promise<number[]> {
  const result = await getEmbeddingModel().embedContent(
    buildEmbedRequest(text, taskType) as Parameters<GenerativeModel["embedContent"]>[0]
  );
  return result.embedding.values;
}

export async function embedContentBatch(
  texts: string[],
  taskType: TaskType
): Promise<number[][]> {
  const result = await getEmbeddingModel().batchEmbedContents({
    requests: texts.map((text) =>
      buildEmbedRequest(text, taskType)
    ) as Parameters<GenerativeModel["batchEmbedContents"]>[0]["requests"],
  });
  return result.embeddings.map((item) => item.values);
}
