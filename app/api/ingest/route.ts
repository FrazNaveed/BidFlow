import { NextRequest, NextResponse } from "next/server";
import { getApiAuth } from "@/lib/api-auth";
import { chunkText } from "@/lib/chunking";
import { embedTexts } from "@/lib/embeddings";
import {
  extractTextFromFile,
  isAllowedIngestFile,
} from "@/lib/parse-file";

export async function POST(request: NextRequest) {
  try {
    const { auth, error } = await getApiAuth();
    if (error) return error;
    const { user, supabase } = auth!;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!isAllowedIngestFile(file.name)) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Allowed: .pdf, .docx, .doc, .txt",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractTextFromFile(buffer, file.name);

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Document is empty or contains no extractable text" },
        { status: 400 }
      );
    }

    const chunks = chunkText(text);
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "Document is empty or contains no extractable text" },
        { status: 400 }
      );
    }

    const embeddings = await embedTexts(chunks);

    const rows = chunks.map((content, index) => ({
      user_id: user.id,
      content,
      embedding: embeddings[index],
      source_file: file.name,
      chunk_index: index,
      approved: false,
    }));

    const { error: insertError } = await supabase.from("chunks").insert(rows);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      chunksCreated: chunks.length,
      filename: file.name,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ingest failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
