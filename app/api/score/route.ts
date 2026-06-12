import { NextRequest, NextResponse } from "next/server";
import { getApiAuth } from "@/lib/api-auth";
import { extractEntities } from "@/lib/ner";
import { checkKnowledgeBase } from "@/lib/rag";
import { calculateWinScore, calculateQuestionWinScore } from "@/lib/win-score";

export async function POST(request: NextRequest) {
  try {
    const { auth, error } = await getApiAuth();
    if (error) return error;
    const { supabase } = auth!;

    const chunkCount = await checkKnowledgeBase(supabase);
    if (chunkCount === 0) {
      return NextResponse.json(
        {
          error:
            "No documents in knowledge base. Upload capability documents first.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (body.question) {
      const winScore = await calculateQuestionWinScore(
        supabase,
        body.question,
        body.trustScore ?? 0,
        body.sources ?? []
      );
      return NextResponse.json({ winScore });
    }

    const requirements: string[] =
      body.requirements ||
      body.questions ||
      [];

    if (requirements.length === 0) {
      return NextResponse.json(
        { error: "requirements, questions, or question field is required" },
        { status: 400 }
      );
    }

    let entities = body.entities;
    if (body.rfpText && !entities) {
      entities = await extractEntities(body.rfpText);
    }

    const winScore = await calculateWinScore(supabase, requirements, entities);

    return NextResponse.json({ winScore, entities });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scoring failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
