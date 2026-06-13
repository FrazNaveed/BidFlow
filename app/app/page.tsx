"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function DashboardPage() {
  const [stats, setStats] = useState({ workspaces: 0, chunks: 0, loading: true });

  const load = useCallback(async () => {
    try {
      const [ws, docs] = await Promise.all([
        fetch("/api/workspaces").then((r) => r.json()),
        fetch("/api/documents").then((r) => r.json()),
      ]);
      setStats({
        workspaces: ws.workspaces?.length ?? 0,
        chunks: docs.totalChunks ?? 0,
        loading: false,
      });
    } catch {
      setStats((s) => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cards = [
    {
      title: "Active workspaces",
      value: stats.loading ? "—" : String(stats.workspaces),
      href: "/app/workspaces",
      desc: "RFPs in progress",
    },
    {
      title: "Library chunks",
      value: stats.loading ? "—" : String(stats.chunks),
      href: "/app/library",
      desc: "Indexed capability evidence",
    },
    {
      title: "New analysis",
      value: "→",
      href: "/app/analyze",
      desc: "Upload a tender document",
    },
  ];

  const actions = [
    {
      title: "Analyze an RFP",
      body: "Upload PDF or Word to extract requirements, score the bid, and create a workspace.",
      href: "/app/analyze",
      primary: true,
    },
    {
      title: "Manage capability library",
      body: "Upload case studies and certifications so AI responses cite real evidence.",
      href: "/app/library",
      primary: false,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-600">
          Overview of your bid pipeline and capability library.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-indigo-200 hover:shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{c.title}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{c.value}</p>
            <p className="mt-1 text-xs text-slate-400">{c.desc}</p>
          </Link>
        ))}
      </div>

      {stats.chunks === 0 && !stats.loading && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <strong>Get started:</strong> Load your capability library first so RFP
          analysis can match requirements to evidence.{" "}
          <Link href="/app/library" className="font-medium underline">
            Open library →
          </Link>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {actions.map((a) => (
          <Link
            key={a.title}
            href={a.href}
            className={`rounded-xl border p-6 transition hover:shadow-sm ${
              a.primary
                ? "border-indigo-200 bg-indigo-50 hover:border-indigo-300"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <h2 className="font-semibold text-slate-900">{a.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{a.body}</p>
            <span className="mt-4 inline-block text-sm font-medium text-indigo-600">
              Open →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
