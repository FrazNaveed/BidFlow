"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { goNoGoColor } from "@/lib/go-no-go-colors";
import type { Workspace } from "@/lib/types";

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const res = await fetch("/api/workspaces");
      const data = await res.json();
      if (res.ok) setWorkspaces(data.workspaces);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workspaces</h1>
          <p className="mt-1 text-slate-600">
            One workspace per RFP, RFQ, or tender — analysis, drafts, and decisions in one place.
          </p>
        </div>
        <Link
          href="/app/analyze"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + New RFP Analysis
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading workspaces...</p>
      ) : workspaces.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-600">No workspaces yet.</p>
          <Link href="/app/analyze" className="mt-4 inline-block text-indigo-600 hover:underline">
            Analyze your first RFP →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/app/workspaces/${ws.id}`}
              className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <h2 className="font-semibold text-slate-900 line-clamp-2">{ws.name}</h2>
                {ws.go_no_go && (
                  <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-bold ${goNoGoColor(ws.go_no_go)}`}>
                    {ws.go_no_go}
                  </span>
                )}
              </div>
              {ws.domain && (
                <p className="mb-2 text-xs text-indigo-600">{ws.domain}</p>
              )}
              {ws.win_score && (
                <p className="text-sm text-slate-600">
                  Win probability: <strong>{ws.win_score.overall}%</strong>
                </p>
              )}
              <p className="mt-3 text-xs text-slate-400">
                {new Date(ws.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
