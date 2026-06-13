import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { chunkText } from "./chunking";
import { embedTexts } from "./embeddings";
import { getSupabaseAdmin } from "./supabase/admin";

const COMPANY_DIR = join(process.cwd(), "company-data");
const SAMPLE_DIR = join(process.cwd(), "sample-data");
const COMPANY_SOURCE_PREFIX = "company/";

function loadCompanyJson<T>(filename: string): T {
  const path = join(COMPANY_DIR, filename);
  if (!existsSync(path)) throw new Error(`Missing company file: ${filename}`);
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

function loadSampleJson<T>(filename: string): T {
  const path = join(SAMPLE_DIR, filename);
  if (!existsSync(path)) throw new Error(`Missing sample file: ${filename}`);
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

export async function seedBidHistory(): Promise<number> {
  const records = loadCompanyJson<Record<string, unknown>[]>("bid-history.json");
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("bid_history").upsert(records, {
    onConflict: "bid_id",
  });
  if (error) throw new Error(error.message);
  return records.length;
}

export async function seedEvaluationTaxonomy(): Promise<number> {
  const records = loadSampleJson<Record<string, unknown>[]>("evaluation-taxonomy.json");
  const supabase = getSupabaseAdmin();
  await supabase.from("evaluation_taxonomy").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { error } = await supabase.from("evaluation_taxonomy").insert(records);
  if (error) throw new Error(error.message);
  return records.length;
}

export async function seedCapabilityRecords(): Promise<number> {
  const records = loadCompanyJson<Record<string, unknown>[]>("capability-index.json");
  const supabase = getSupabaseAdmin();
  await supabase.from("capability_records").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { error } = await supabase.from("capability_records").insert(records);
  if (error) throw new Error(error.message);
  return records.length;
}

export async function seedCompanyLibraryChunks(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const files = readdirSync(COMPANY_DIR)
    .filter((f) => f.endsWith(".txt"))
    .sort();

  if (files.length === 0) {
    throw new Error("No .txt documents found in company-data/");
  }

  const allChunks: { content: string; source: string; index: number }[] = [];

  for (const filename of files) {
    const text = readFileSync(join(COMPANY_DIR, filename), "utf-8").trim();
    if (!text) continue;

    const chunks = chunkText(text);
    chunks.forEach((content, index) => {
      allChunks.push({
        content,
        source: `${COMPANY_SOURCE_PREFIX}${filename}`,
        index,
      });
    });
  }

  if (allChunks.length === 0) {
    throw new Error("Company documents produced no indexable chunks");
  }

  const embeddings = await embedTexts(allChunks.map((c) => c.content));

  await supabase
    .from("chunks")
    .delete()
    .eq("user_id", userId)
    .like("source_file", `${COMPANY_SOURCE_PREFIX}%`);

  const rows = allChunks.map((c, i) => ({
    user_id: userId,
    content: c.content,
    embedding: embeddings[i],
    source_file: c.source,
    chunk_index: c.index,
    approved: true,
  }));

  const batchSize = 50;
  for (let i = 0; i < rows.length; i += batchSize) {
    const { error } = await supabase.from("chunks").insert(rows.slice(i, i + batchSize));
    if (error) throw new Error(error.message);
  }

  return rows.length;
}

export async function seedAll(
  supabase: SupabaseClient,
  userId: string,
  options: { capabilityChunks?: boolean } = {}
) {
  const bidHistory = await seedBidHistory();
  const evaluationTaxonomy = await seedEvaluationTaxonomy();
  const capabilityRecords = await seedCapabilityRecords();
  let capabilityChunks = 0;
  if (options.capabilityChunks) {
    capabilityChunks = await seedCompanyLibraryChunks(supabase, userId);
  }
  return {
    bidHistory,
    evaluationTaxonomy,
    capabilityRecords,
    capabilityChunks,
    companyDocuments: readdirSync(COMPANY_DIR).filter((f) => f.endsWith(".txt")).length,
  };
}
