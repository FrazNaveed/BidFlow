import { TaskType } from "@google/generative-ai";
import { embedContentBatch, embedContentValues } from "./gemini";

export async function embedText(text: string): Promise<number[]> {
  return embedContentValues(text, TaskType.RETRIEVAL_QUERY);
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  return embedContentBatch(texts, TaskType.RETRIEVAL_DOCUMENT);
}
