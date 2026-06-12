"use client";

import { useState } from "react";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import WinScoreGauge from "@/components/WinScoreGauge";
import type { WinScoreResult } from "@/lib/types";

interface Source {
  content: string;
  source_file: string;
  similarity: number;
}

interface QAItem {
  id: string;
  question: string;
  answer: string;
  sources: Source[];
  trustScore: number;
  approved: boolean;
  lowConfidence: boolean;
  message?: string;
  winScore?: WinScoreResult;
}

export default function AnswerPage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<QAItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [showSources, setShowSources] = useState(false);
  const [approving, setApproving] = useState(false);

  const active = history.find((h) => h.id === activeId) ?? null;

  const handleSubmit = async () => {
    if (!question.trim() || loading) return;

    setLoading(true);
    setEditing(false);
    setShowSources(false);

    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), stream: true }),
      });

      if (!res.ok) {
        const data = await res.json();
        const item: QAItem = {
          id: crypto.randomUUID(),
          question: question.trim(),
          answer: "",
          sources: data.sources || [],
          trustScore: data.trustScore || 0,
          approved: false,
          lowConfidence: true,
          message: data.error || data.message || "Failed to generate answer",
        };
        setHistory((prev) => [item, ...prev]);
        setActiveId(item.id);
        return;
      }

      const contentType = res.headers.get("Content-Type") || "";
      const sourcesHeader = res.headers.get("X-Sources");
      const trustScore = parseFloat(res.headers.get("X-Trust-Score") || "0");
      const winScoreHeader = res.headers.get("X-Win-Score");
      const sources: Source[] = sourcesHeader
        ? JSON.parse(sourcesHeader)
        : [];
      const winScore: WinScoreResult | undefined = winScoreHeader
        ? JSON.parse(winScoreHeader)
        : undefined;

      if (contentType.includes("application/json")) {
        const data = await res.json();
        const item: QAItem = {
          id: crypto.randomUUID(),
          question: question.trim(),
          answer: data.answer || "",
          sources: data.sources || [],
          trustScore: data.trustScore || 0,
          approved: false,
          lowConfidence: data.lowConfidence,
          message: data.message,
          winScore: data.winScore,
        };
        setHistory((prev) => [item, ...prev]);
        setActiveId(item.id);
        return;
      }

      const id = crypto.randomUUID();
      const item: QAItem = {
        id,
        question: question.trim(),
        answer: "",
        sources,
        trustScore,
        approved: false,
        lowConfidence: false,
        winScore,
      };
      setHistory((prev) => [item, ...prev]);
      setActiveId(id);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let fullAnswer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullAnswer += decoder.decode(value, { stream: true });
        setHistory((prev) =>
          prev.map((h) => (h.id === id ? { ...h, answer: fullAnswer } : h))
        );
      }
    } catch {
      const item: QAItem = {
        id: crypto.randomUUID(),
        question: question.trim(),
        answer: "",
        sources: [],
        trustScore: 0,
        approved: false,
        lowConfidence: true,
        message: "Network error. Please try again.",
      };
      setHistory((prev) => [item, ...prev]);
      setActiveId(item.id);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!active || active.approved || approving) return;

    const answerText = editing ? editText : active.answer;
    if (!answerText.trim()) return;

    setApproving(true);
    try {
      const res = await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answeredQuestion: active.question,
          approvedAnswer: answerText,
        }),
      });

      if (res.ok) {
        setHistory((prev) =>
          prev.map((h) =>
            h.id === active.id
              ? { ...h, answer: answerText, approved: true }
              : h
          )
        );
        setEditing(false);
      }
    } finally {
      setApproving(false);
    }
  };

  const selectItem = (item: QAItem) => {
    setActiveId(item.id);
    setEditing(false);
    setEditText(item.answer);
    setShowSources(false);
  };

  return (
    <div className="flex gap-8">
      <aside className="w-72 shrink-0">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Session History
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-slate-400">No questions yet</p>
        ) : (
          <ul className="space-y-2">
            {history.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => selectItem(item)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    activeId === item.id
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <p className="line-clamp-2 font-medium text-slate-800">
                    {item.question}
                  </p>
                  {item.approved && (
                    <span className="mt-1 inline-block text-xs text-emerald-600">
                      ✓ Approved
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <div className="flex-1 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Answer RFP</h1>
          <p className="mt-2 text-slate-600">
            Paste a question and get an AI answer grounded in your documents.
          </p>
        </div>

        <div className="space-y-3">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Paste your RFP question here..."
            rows={4}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            onClick={handleSubmit}
            disabled={!question.trim() || loading}
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Answer"}
          </button>
        </div>

        {active && (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Answer</h3>
              {!active.lowConfidence && active.trustScore > 0 && (
                <ConfidenceBadge trustScore={active.trustScore} />
              )}
            </div>

            {active.lowConfidence ? (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                {active.message || "Not enough information to answer."}
              </div>
            ) : editing ? (
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={8}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            ) : (
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {active.answer || (loading ? "Generating..." : "")}
              </div>
            )}

            {!active.lowConfidence && active.answer && (
              <div className="mt-4 flex gap-2">
                {!editing ? (
                  <button
                    onClick={() => {
                      setEditing(true);
                      setEditText(active.answer);
                    }}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                ) : (
                  <button
                    onClick={() => setEditing(false)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  onClick={handleApprove}
                  disabled={active.approved || approving}
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    active.approved
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  } disabled:opacity-70`}
                >
                  {active.approved ? "✓ Approved" : approving ? "Saving..." : "Approve"}
                </button>
              </div>
            )}

            {active.winScore && !active.lowConfidence && (
              <div className="mt-6 border-t border-slate-100 pt-4">
                <h4 className="mb-3 text-sm font-semibold text-slate-800">
                  Win Probability
                </h4>
                <WinScoreGauge winScore={active.winScore} compact />
              </div>
            )}

            {active.sources.length > 0 && (
              <div className="mt-6 border-t border-slate-100 pt-4">
                <button
                  onClick={() => setShowSources(!showSources)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  <svg
                    className={`h-4 w-4 transition-transform ${showSources ? "rotate-90" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  Sources ({active.sources.length})
                </button>
                {showSources && (
                  <ul className="mt-3 space-y-3">
                    {active.sources.map((source, i) => (
                      <li
                        key={i}
                        className="rounded-lg bg-slate-50 p-3 text-sm"
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span className="font-medium text-indigo-700">
                            {source.source_file}
                          </span>
                          <span className="text-xs text-slate-500">
                            {(source.similarity * 100).toFixed(0)}% match
                          </span>
                        </div>
                        <p className="text-slate-600 line-clamp-4">
                          {source.content}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
