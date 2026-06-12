"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ComplianceChecklist from "@/components/ComplianceChecklist";
import { mandatoryPassRate } from "@/lib/mandatory-pass-rate";
import EffortBenchmark from "@/components/EffortBenchmark";
import GoNoGoBanner from "@/components/GoNoGoBanner";
import NERPanel from "@/components/NERPanel";
import WinScoreDashboard from "@/components/WinScoreDashboard";
import type {
  ComplianceChecklistItem,
  EffortBenchmark as EffortBenchmarkType,
  GoNoGoResult,
  NERResult,
  Workspace,
  WorkspaceResponse,
  WinScoreResult,
} from "@/lib/types";

export default function WorkspaceDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [responses, setResponses] = useState<WorkspaceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState(false);
  const [draftProgress, setDraftProgress] = useState<{ current: number; total: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const fetchWorkspace = useCallback(async () => {
    const res = await fetch(`/api/workspaces/${id}`);
    const data = await res.json();
    if (res.ok) {
      setWorkspace(data.workspace);
      setResponses(data.responses);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  const generateDraft = async () => {
    setDrafting(true);
    setDraftProgress(null);

    const res = await fetch(`/api/workspaces/${id}/draft`, { method: "POST" });
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) return;

    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = JSON.parse(line.slice(6));
        if (data.type === "start") setDraftProgress({ current: 0, total: data.total });
        if (data.type === "progress") setDraftProgress({ current: data.current, total: data.total });
        if (data.type === "complete") await fetchWorkspace();
      }
    }
    setDrafting(false);
    setDraftProgress(null);
  };

  const approveResponse = async (responseId: string, answer: string) => {
    await fetch(`/api/workspaces/${id}/responses`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responseId, answer, approved: true }),
    });
    setEditingId(null);
    await fetchWorkspace();
  };

  const exportProposal = async () => {
    const res = await fetch(`/api/workspaces/${id}/export`, { method: "POST" });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workspace?.name || "proposal"}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <p className="text-slate-500">Loading workspace...</p>;
  }

  if (!workspace) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-600">Workspace not found.</p>
        <Link href="/app/workspaces" className="mt-4 inline-block text-indigo-600">
          ← Back to workspaces
        </Link>
      </div>
    );
  }

  const winScore = workspace.win_score as WinScoreResult | null;
  const checklist = (workspace.compliance_checklist || []) as ComplianceChecklistItem[];
  const entities = workspace.entities as NERResult | null;
  const goNoGo: GoNoGoResult | null = workspace.go_no_go
    ? {
        decision: workspace.go_no_go,
        rationale: workspace.go_no_go_rationale || "",
        factors: {
          overallScore: winScore?.overall || 0,
          mandatoryPassRate: mandatoryPassRate(checklist),
          complianceCoverage: winScore?.breakdown.complianceCoverage || 0,
          budgetAlignment: winScore?.breakdown.budgetAlignment || 0,
          historicalWinRate: winScore?.breakdown.historicalWinRate || 0,
        },
      }
    : null;

  const effort: EffortBenchmarkType | null =
    workspace.effort_baseline_minutes != null
      ? {
          baselineMinutes: workspace.effort_baseline_minutes,
          aiMinutes: workspace.effort_ai_minutes || 0,
          reductionPct: Number(workspace.effort_reduction_pct) || 0,
          baselineLabel: `~${Math.floor(workspace.effort_baseline_minutes / 60)}h ${workspace.effort_baseline_minutes % 60}m manual`,
          aiLabel: `~${workspace.effort_ai_minutes}m with AI`,
        }
      : null;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/app/workspaces" className="text-sm text-indigo-600 hover:underline">
            ← All workspaces
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{workspace.name}</h1>
          {workspace.domain && <p className="text-indigo-600">{workspace.domain}</p>}
          {workspace.summary && (
            <p className="mt-2 max-w-3xl text-sm text-slate-600">{workspace.summary}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={generateDraft}
            disabled={drafting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {drafting ? "Generating..." : "Generate draft"}
          </button>
          <button
            onClick={exportProposal}
            disabled={responses.length === 0}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Export proposal
          </button>
        </div>
      </div>

      {goNoGo && <GoNoGoBanner goNoGo={goNoGo} />}

      {drafting && draftProgress && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800">
          Drafting response {draftProgress.current} of {draftProgress.total}...
        </div>
      )}

      {effort && <EffortBenchmark effort={effort} />}

      {winScore && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <WinScoreDashboard winScore={winScore} />
        </div>
      )}

      {entities && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Extracted entities</h2>
          <NERPanel entities={entities} />
        </div>
      )}

      {checklist.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Compliance checklist</h2>
          <ComplianceChecklist items={checklist} />
        </div>
      )}

      {responses.length > 0 && (
        <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Draft responses</h2>
          {responses.map((resp) => (
            <div key={resp.id} className="border-b border-slate-100 pb-6 last:border-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-600">
                  {resp.section_type}
                </span>
                {resp.section_title && (
                  <span className="text-xs text-slate-500">{resp.section_title}</span>
                )}
                {resp.approved && (
                  <span className="text-xs font-medium text-emerald-600">✓ Approved</span>
                )}
              </div>
              <p className="mb-2 font-medium text-slate-800">{resp.question}</p>
              {editingId === resp.id ? (
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              ) : (
                <p className="whitespace-pre-wrap text-sm text-slate-600">{resp.answer}</p>
              )}
              <div className="mt-3 flex gap-2">
                {editingId === resp.id ? (
                  <>
                    <button
                      onClick={() => approveResponse(resp.id, editText)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Save & approve
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(resp.id);
                      setEditText(resp.answer || "");
                    }}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
