import { NextResponse } from "next/server";
import { getApiAuth } from "@/lib/api-auth";

export async function GET() {
  try {
    const { auth, error } = await getApiAuth();
    if (error) return error;

    const { data, error: dbError } = await auth!.supabase
      .from("chunks")
      .select("source_file");

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      const file = row.source_file || "unknown";
      counts.set(file, (counts.get(file) || 0) + 1);
    }

    const documents = Array.from(counts.entries())
      .map(([filename, chunkCount]) => ({ filename, chunkCount }))
      .sort((a, b) => a.filename.localeCompare(b.filename));

    const totalChunks = data?.length ?? 0;

    return NextResponse.json({ documents, totalChunks });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list documents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { auth, error } = await getApiAuth();
    if (error) return error;

    const { error: dbError } = await auth!.supabase
      .from("chunks")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to clear knowledge base";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
