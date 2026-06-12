import { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { getApiAuth } from "@/lib/api-auth";
import {
  getConfidenceLabel,
  getConfidenceLevel,
} from "@/lib/confidence";
import { extractRequirements } from "@/lib/extract-requirements";
import { extractTextFromFile, isAllowedIngestFile } from "@/lib/parse-file";
import { generateAnswer } from "@/lib/rag";

function findQuestionColumn(headers: string[]): number {
  const questionIdx = headers.findIndex((h) =>
    String(h).toLowerCase().includes("question")
  );
  return questionIdx >= 0 ? questionIdx : 0;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type SSESender = (data: object) => void;

async function processQuestions(
  supabase: SupabaseClient,
  questions: string[],
  send: SSESender
): Promise<{
  rows: string[][];
  headers: string[];
}> {
  const headers = ["Question", "AI Answer", "Confidence", "Win Probability"];
  const rows: string[][] = [headers];
  const total = questions.filter(Boolean).length;

  send({ type: "start", total });

  let processed = 0;

  for (const question of questions) {
    if (!question.trim()) continue;

    processed++;
    send({
      type: "progress",
      current: processed,
      total,
      question,
    });

    try {
      const result = await generateAnswer(supabase, question);
      rows.push([
        question,
        result.answer ?? result.message ?? "No answer generated",
        result.trustScore
          ? getConfidenceLabel(getConfidenceLevel(result.trustScore))
          : "Low confidence",
        result.winScore ? `${result.winScore.overall}%` : "—",
      ]);
    } catch {
      rows.push([question, "Error generating answer", "Error", "—"]);
    }

    await sleep(500);
  }

  return { rows, headers };
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send: SSESender = (data) => {
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

        const contentType = request.headers.get("content-type") || "";
        let questions: string[] = [];

        if (contentType.includes("application/json")) {
          const body = await request.json();
          questions = body.questions || body.requirements || [];
        } else {
          const formData = await request.formData();
          const file = formData.get("file");
          const mode = formData.get("mode");

          if (!file || !(file instanceof File)) {
            send({ type: "error", message: "No file provided" });
            controller.close();
            return;
          }

          const ext = file.name.toLowerCase();
          const isSpreadsheet =
            ext.endsWith(".xlsx") ||
            ext.endsWith(".xls") ||
            ext.endsWith(".csv");

          if (mode === "rfp" || (!isSpreadsheet && isAllowedIngestFile(file.name))) {
            send({
              type: "status",
              message: "Extracting requirements from RFP document...",
            });

            const buffer = Buffer.from(await file.arrayBuffer());
            const text = await extractTextFromFile(buffer, file.name);
            const { requirements } = await extractRequirements(text);
            questions = requirements.map((r) => r.text);

            send({
              type: "extracted",
              count: questions.length,
            });
          } else if (isSpreadsheet) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const workbook = XLSX.read(buffer, { type: "buffer" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const fileRows = XLSX.utils.sheet_to_json<string[]>(sheet, {
              header: 1,
              defval: "",
            }) as string[][];

            if (fileRows.length < 2) {
              send({
                type: "error",
                message:
                  "File must contain a header row and at least one question",
              });
              controller.close();
              return;
            }

            const fileHeaders = fileRows[0].map(String);
            const questionCol = findQuestionColumn(fileHeaders);
            questions = fileRows
              .slice(1)
              .map((row) => String(row[questionCol] || "").trim());
          } else {
            send({
              type: "error",
              message: "Unsupported file type",
            });
            controller.close();
            return;
          }
        }

        if (questions.filter(Boolean).length === 0) {
          send({ type: "error", message: "No questions found to process" });
          controller.close();
          return;
        }

        const { rows } = await processQuestions(supabase, questions, send);

        const outSheet = XLSX.utils.aoa_to_sheet(rows);
        const outWorkbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(outWorkbook, outSheet, "RFP Answers");
        const outBuffer = XLSX.write(outWorkbook, {
          type: "buffer",
          bookType: "xlsx",
        });

        send({
          type: "complete",
          filename: "rfp-answers.xlsx",
          file: Buffer.from(outBuffer).toString("base64"),
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Bulk answer failed";
        send({ type: "error", message });
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
