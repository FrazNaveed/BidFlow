"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import UploadZone from "@/components/UploadZone";

interface BulkRow {
  question: string;
  answer: string;
  confidence: string;
  winProbability: string;
}

async function processSSE(
  body: FormData | string,
  headers?: Record<string, string>,
  onEvent?: (data: Record<string, unknown>) => void
): Promise<{ rows: BulkRow[]; excelBase64: string | null }> {
  const res = await fetch("/api/bulk-answer", {
    method: "POST",
    body,
    headers,
  });

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) throw new Error("No response stream");

  let buffer = "";
  const previewRows: BulkRow[] = [];
  let excelBase64: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = JSON.parse(line.slice(6));
      onEvent?.(data);

      if (data.type === "progress") {
        previewRows.push({
          question: data.question,
          answer: "Generating...",
          confidence: "",
          winProbability: "",
        });
      } else if (data.type === "complete") {
        excelBase64 = data.file;
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(
          Uint8Array.from(atob(data.file), (c) => c.charCodeAt(0)),
          { type: "array" }
        );
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const allRows = XLSX.utils.sheet_to_json<string[]>(sheet, {
          header: 1,
          defval: "",
        }) as string[][];

        const fileHeaders = allRows[0].map(String);
        const qCol = fileHeaders.findIndex((h) =>
          h.toLowerCase().includes("question")
        );
        const questionCol = qCol >= 0 ? qCol : 0;
        const answerCol = fileHeaders.findIndex((h) => h === "AI Answer");
        const confCol = fileHeaders.findIndex((h) => h === "Confidence");
        const winCol = fileHeaders.findIndex((h) => h === "Win Probability");

        return {
          rows: allRows.slice(1).map((row) => ({
            question: String(row[questionCol] || ""),
            answer: String(row[answerCol] || ""),
            confidence: String(row[confCol] || ""),
            winProbability: String(row[winCol] || ""),
          })).filter((r) => r.question),
          excelBase64,
        };
      }
    }
  }

  return { rows: previewRows, excelBase64 };
}

export default function BulkPage() {
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [excelBase64, setExcelBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runBulk = useCallback(
    async (
      body: FormData | string,
      headers?: Record<string, string>
    ) => {
      setProcessing(true);
      setProgress(null);
      setStatus(null);
      setRows([]);
      setExcelBase64(null);
      setError(null);

      try {
        const result = await processSSE(body, headers, (data) => {
          if (data.type === "error") {
            setError(data.message as string);
          } else if (data.type === "status") {
            setStatus(data.message as string);
          } else if (data.type === "extracted") {
            setStatus(
              `Extracted ${data.count} requirements — generating answers...`
            );
          } else if (data.type === "start") {
            setProgress({ current: 0, total: data.total as number });
          } else if (data.type === "progress") {
            setProgress({
              current: data.current as number,
              total: data.total as number,
            });
            setRows((prev) => [
              ...prev,
              {
                question: data.question as string,
                answer: "Generating...",
                confidence: "",
                winProbability: "",
              },
            ]);
          }
        });

        setRows(result.rows);
        setExcelBase64(result.excelBase64);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bulk processing failed");
      } finally {
        setProcessing(false);
        setStatus(null);
      }
    },
    []
  );

  useEffect(() => {
    const reqParam = searchParams.get("requirements");
    if (!reqParam) return;

    try {
      const questions: string[] = JSON.parse(decodeURIComponent(reqParam));
      if (questions.length > 0) {
        runBulk(JSON.stringify({ questions }), {
          "Content-Type": "application/json",
        });
      }
    } catch {
      // ignore invalid param
    }
  }, [searchParams, runBulk]);

  const handleSpreadsheetUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    await runBulk(formData);
  };

  const handleRfpUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", "rfp");
    await runBulk(formData);
  };

  const downloadExcel = () => {
    if (!excelBase64) return;
    const bytes = Uint8Array.from(atob(excelBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rfp-answers.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadWord = async () => {
    if (rows.length === 0) return;

    const res = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: rows.map((r) => ({
          question: r.question,
          answer: r.answer,
          confidence: `${r.confidence}${r.winProbability ? ` · Win: ${r.winProbability}` : ""}`,
        })),
      }),
    });

    if (!res.ok) return;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rfp-responses.docx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const progressPercent =
    progress && progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Bulk RFP</h1>
        <p className="mt-2 text-slate-600">
          Upload an Excel/CSV of questions, or upload a full RFP document to
          auto-extract and answer all requirements.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <UploadZone
          accept=".xlsx,.xls,.csv"
          label="Excel or CSV"
          hint="Column named 'Question' or first column"
          onUpload={handleSpreadsheetUpload}
          disabled={processing}
        />
        <UploadZone
          accept=".pdf,.docx,.doc,.txt"
          label="Full RFP document"
          hint="LLM extracts requirements, then answers each one"
          onUpload={handleRfpUpload}
          disabled={processing}
        />
      </div>

      {(processing || status) && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          {status && (
            <p className="mb-3 text-sm font-medium text-indigo-700">
              {status}
            </p>
          )}
          {progress && (
            <>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">
                  Answering question {progress.current} of {progress.total}...
                </span>
                <span className="text-slate-500">{progressPercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Results</h2>
            <div className="flex gap-2">
              {excelBase64 && (
                <button
                  onClick={downloadExcel}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Download Excel
                </button>
              )}
              <button
                onClick={downloadWord}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Download Word
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Question
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    AI Answer
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Confidence
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Win %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 align-top text-slate-800">
                      {row.question}
                    </td>
                    <td className="px-4 py-3 align-top text-slate-600">
                      {row.answer}
                    </td>
                    <td className="px-4 py-3 align-top text-slate-500">
                      {row.confidence}
                    </td>
                    <td className="px-4 py-3 align-top text-slate-500">
                      {row.winProbability}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
