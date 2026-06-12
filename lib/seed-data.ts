import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { chunkText } from "./chunking";
import { embedTexts } from "./embeddings";
import { getSupabaseAdmin } from "./supabase/admin";

const SAMPLE_DIR = join(process.cwd(), "sample-data");

function loadJson<T>(filename: string): T {
  const path = join(SAMPLE_DIR, filename);
  if (!existsSync(path)) throw new Error(`Missing sample file: ${filename}`);
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

export async function seedBidHistory(): Promise<number> {
  const records = loadJson<Record<string, unknown>[]>("bid-history.json");
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("bid_history").upsert(records, {
    onConflict: "bid_id",
  });
  if (error) throw new Error(error.message);
  return records.length;
}

export async function seedEvaluationTaxonomy(): Promise<number> {
  const records = loadJson<Record<string, unknown>[]>("evaluation-taxonomy.json");
  const supabase = getSupabaseAdmin();
  await supabase.from("evaluation_taxonomy").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { error } = await supabase.from("evaluation_taxonomy").insert(records);
  if (error) throw new Error(error.message);
  return records.length;
}

export async function seedCapabilityRecords(): Promise<number> {
  const records = loadJson<Record<string, unknown>[]>("capability-library.json");
  const supabase = getSupabaseAdmin();
  await supabase.from("capability_records").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { error } = await supabase.from("capability_records").insert(records);
  if (error) throw new Error(error.message);
  return records.length;
}

export async function seedCapabilityChunks(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const records = loadJson<
    {
      project_name: string;
      summary: string;
      certifications: string;
      year_completed: number;
      contract_value: number;
      duration_months: number;
      client_type: string;
      domain: string;
    }[]
  >("capability-library.json");

  const texts = records.map(
    (r) =>
      `Project: ${r.project_name}\nDomain: ${r.domain}\nClient: ${r.client_type}\nYear: ${r.year_completed}\nContract Value: $${r.contract_value.toLocaleString()}\nDuration: ${r.duration_months} months\nCertifications: ${r.certifications}\n\n${r.summary}`
  );

  const allChunks: { content: string; source: string; index: number }[] = [];
  for (let i = 0; i < texts.length; i++) {
    const chunks = chunkText(texts[i]);
    chunks.forEach((content, index) => {
      allChunks.push({
        content,
        source: `capability_${records[i].project_name.replace(/\s+/g, "_").slice(0, 40)}.txt`,
        index,
      });
    });
  }

  const embeddings = await embedTexts(allChunks.map((c) => c.content));

  await supabase
    .from("chunks")
    .delete()
    .eq("user_id", userId)
    .like("source_file", "capability_%");

  const rows = allChunks.map((c, i) => ({
    user_id: userId,
    content: c.content,
    embedding: embeddings[i],
    source_file: c.source,
    chunk_index: c.index,
    approved: false,
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
    capabilityChunks = await seedCapabilityChunks(supabase, userId);
  }
  return { bidHistory, evaluationTaxonomy, capabilityRecords, capabilityChunks };
}
