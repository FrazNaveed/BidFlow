import { NextRequest } from "next/server";
import { getApiAuth } from "@/lib/api-auth";
import {
  getConfidenceLabel,
  getConfidenceLevel,
} from "@/lib/confidence";
import { generateAnswer } from "@/lib/rag";
import {
  getWorkspace,
  saveWorkspaceResponses,
} from "@/lib/workspaces";
import type { ExtractedRequirement } from "@/lib/types";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        const session = await getApiAuth();
        if (session.error) {
          send({ type: "error", message: "Unauthorized" });
          controller.close();
          return;
        }

        const { supabase } = session.auth!;

        const workspace = await getWorkspace(supabase, params.id);
        if (!workspace) {
          send({ type: "error", message: "Workspace not found" });
          controller.close();
          return;
        }

        const requirements = (workspace.requirements ||
          []) as ExtractedRequirement[];
        const total = requirements.length;

        send({ type: "start", total });

        const responses = [];
        let current = 0;

        for (const req of requirements) {
          current++;
          send({
            type: "progress",
            current,
            total,
            requirement: req.text,
          });

          try {
            const result = await generateAnswer(supabase, req.text);
            responses.push({
              requirement_id: req.id,
              section_type: req.sectionType,
              section_title: req.sectionTitle || req.category,
              question: req.text,
              answer: result.answer ?? result.message ?? "",
              confidence: result.trustScore
                ? getConfidenceLabel(getConfidenceLevel(result.trustScore))
                : "Low confidence",
              win_probability: result.winScore?.overall ?? 0,
              sources: result.sources,
            });
          } catch {
            responses.push({
              requirement_id: req.id,
              section_type: req.sectionType,
              section_title: req.sectionTitle || req.category,
              question: req.text,
              answer: "Error generating response",
              confidence: "Error",
              win_probability: 0,
            });
          }

          await sleep(400);
        }

        await saveWorkspaceResponses(supabase, params.id, responses);
        send({ type: "complete", count: responses.length });
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Draft generation failed",
        });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
