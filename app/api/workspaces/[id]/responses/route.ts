import { NextRequest, NextResponse } from "next/server";
import { getApiAuth } from "@/lib/api-auth";
import { embedText } from "@/lib/embeddings";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { auth, error } = await getApiAuth();
    if (error) return error;
    const { user, supabase } = auth!;

    const body = await request.json();
    const { responseId, answer, approved } = body;

    if (!responseId) {
      return NextResponse.json({ error: "responseId required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (answer !== undefined) updates.answer = answer;
    if (approved !== undefined) updates.approved = approved;

    const { data: response, error: updateError } = await supabase
      .from("workspace_responses")
      .update(updates)
      .eq("id", responseId)
      .eq("workspace_id", params.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (approved && response) {
      const combined = `Q: ${response.question}\nA: ${response.answer}`;
      const embedding = await embedText(combined);
      await supabase.from("chunks").insert({
        user_id: user.id,
        content: combined,
        embedding,
        source_file: "approved_answers",
        chunk_index: 0,
        approved: true,
      });
    }

    return NextResponse.json({ response });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
