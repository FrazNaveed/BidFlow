import { NextRequest, NextResponse } from "next/server";
import { getApiAuth } from "@/lib/api-auth";
import { generateAnswer, streamAnswer } from "@/lib/rag";

export async function POST(request: NextRequest) {
  try {
    const { auth, error } = await getApiAuth();
    if (error) return error;

    const body = await request.json();
    const question = body.question?.trim();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    const wantsStream = body.stream === true;
    const { supabase } = auth!;

    if (wantsStream) {
      const response = await streamAnswer(supabase, question);

      if (response.type === "error") {
        return NextResponse.json({
          answer: response.result.answer,
          lowConfidence: response.result.lowConfidence,
          message: response.result.message,
          sources: response.result.sources,
          trustScore: response.result.trustScore,
        });
      }

      const headers = new Headers({
        "Content-Type": "text/plain; charset=utf-8",
        "X-Sources": JSON.stringify(response.result.sources),
        "X-Trust-Score": String(response.result.trustScore),
        "X-Low-Confidence": "false",
        "X-Win-Score": JSON.stringify(response.result.winScore ?? null),
      });

      return new Response(response.stream, { headers });
    }

    const result = await generateAnswer(supabase, question);

    if (result.lowConfidence && !result.answer) {
      return NextResponse.json({
        answer: null,
        lowConfidence: true,
        message: result.message,
        sources: result.sources,
        trustScore: result.trustScore,
      });
    }

    return NextResponse.json({
      answer: result.answer,
      lowConfidence: result.lowConfidence,
      sources: result.sources,
      trustScore: result.trustScore,
      winScore: result.winScore,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Answer generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
