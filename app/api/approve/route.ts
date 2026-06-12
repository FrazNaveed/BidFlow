import { NextRequest, NextResponse } from "next/server";
import { getApiAuth } from "@/lib/api-auth";
import { embedText } from "@/lib/embeddings";

export async function POST(request: NextRequest) {
  try {
    const { auth, error } = await getApiAuth();
    if (error) return error;
    const { user, supabase } = auth!;

    const body = await request.json();
    const answeredQuestion = body.answeredQuestion?.trim();
    const approvedAnswer = body.approvedAnswer?.trim();

    if (!answeredQuestion || !approvedAnswer) {
      return NextResponse.json(
        { error: "answeredQuestion and approvedAnswer are required" },
        { status: 400 }
      );
    }

    const combined = `Q: ${answeredQuestion}\nA: ${approvedAnswer}`;
    const embedding = await embedText(combined);

    const { error: insertError } = await supabase.from("chunks").insert({
      user_id: user.id,
      content: combined,
      embedding,
      source_file: "approved_answers",
      chunk_index: 0,
      approved: true,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Approve failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
