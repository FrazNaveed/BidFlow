import type { SupabaseClient } from "@supabase/supabase-js";
import { streamGemini, callGemini } from "./gemini";
import { embedText } from "./embeddings";
import { calculateQuestionWinScore } from "./win-score";
import type { WinScoreResult } from "./types";

export interface RetrievedChunk {
  id: string;
  content: string;
  source_file: string;
  similarity: number;
}

export interface RagResult {
  answer: string | null;
  lowConfidence: boolean;
  message?: string;
  sources: RetrievedChunk[];
  trustScore: number;
  winScore?: WinScoreResult;
}

const MATCH_THRESHOLD = 0.7;
const MATCH_COUNT = 5;

export async function checkKnowledgeBase(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("chunks")
    .select("*", { count: "exact", head: true });

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function retrieveChunks(
  supabase: SupabaseClient,
  question: string
): Promise<RetrievedChunk[]> {
  const embedding = await embedText(question);

  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: embedding,
    match_threshold: MATCH_THRESHOLD,
    match_count: MATCH_COUNT,
  });

  if (error) throw new Error(error.message);
  return (data as RetrievedChunk[]) ?? [];
}

function buildPrompt(question: string, chunks: RetrievedChunk[]): string {
  const context = chunks
    .map(
      (chunk, i) =>
        `[Source ${i + 1}: ${chunk.source_file}]\n${chunk.content}`
    )
    .join("\n\n");

  return `You are an expert at answering RFP (Request for Proposal) questions on behalf of a company.

Use ONLY the context below to answer the question. Do not use any outside knowledge.
If the context doesn't contain enough information to answer confidently, say so explicitly.
Keep answers professional, concise, and factual. Keep answers under 300 words unless the question explicitly requires more detail.
At the end of your answer, note which source document(s) you drew from.

CONTEXT:
${context}

QUESTION:
${question}

ANSWER:`;
}

export async function generateAnswer(
  supabase: SupabaseClient,
  question: string
): Promise<RagResult> {
  const chunkCount = await checkKnowledgeBase(supabase);
  if (chunkCount === 0) {
    return {
      answer: null,
      lowConfidence: true,
      message:
        "No documents in knowledge base. Please upload documents before answering questions.",
      sources: [],
      trustScore: 0,
    };
  }

  const chunks = await retrieveChunks(supabase, question);

  if (chunks.length === 0) {
    return {
      answer: null,
      lowConfidence: true,
      message: "No relevant content found in your documents.",
      sources: [],
      trustScore: 0,
    };
  }

  const trustScore = chunks[0].similarity;

  if (trustScore < MATCH_THRESHOLD) {
    return {
      answer: null,
      lowConfidence: true,
      message: "No relevant content found in your documents.",
      sources: chunks,
      trustScore,
    };
  }

  const prompt = buildPrompt(question, chunks);
  const answer = await callGemini(prompt, 1024);
  const winScore = await calculateQuestionWinScore(supabase, question, trustScore, chunks);

  return {
    answer,
    lowConfidence: false,
    sources: chunks,
    trustScore,
    winScore,
  };
}

export async function streamAnswer(
  supabase: SupabaseClient,
  question: string
): Promise<
  | { type: "error"; result: RagResult }
  | { type: "stream"; result: RagResult; stream: ReadableStream<Uint8Array> }
> {
  const chunkCount = await checkKnowledgeBase(supabase);
  if (chunkCount === 0) {
    return {
      type: "error",
      result: {
        answer: null,
        lowConfidence: true,
        message:
          "No documents in knowledge base. Please upload documents before answering questions.",
        sources: [],
        trustScore: 0,
      },
    };
  }

  const chunks = await retrieveChunks(supabase, question);

  if (chunks.length === 0) {
    return {
      type: "error",
      result: {
        answer: null,
        lowConfidence: true,
        message: "No relevant content found in your documents.",
        sources: [],
        trustScore: 0,
      },
    };
  }

  const trustScore = chunks[0].similarity;

  if (trustScore < MATCH_THRESHOLD) {
    return {
      type: "error",
      result: {
        answer: null,
        lowConfidence: true,
        message: "No relevant content found in your documents.",
        sources: chunks,
        trustScore,
      },
    };
  }

  const prompt = buildPrompt(question, chunks);
  const winScore = await calculateQuestionWinScore(supabase, question, trustScore, chunks);
  const result: RagResult = {
    answer: "",
    lowConfidence: false,
    sources: chunks,
    trustScore,
    winScore,
  };

  const geminiStream = await streamGemini(prompt, 1024);
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of geminiStream.stream) {
          const text = chunk.text();
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return { type: "stream", result, stream };
}
