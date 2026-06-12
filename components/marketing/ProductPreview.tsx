export default function ProductPreview() {
  const rows = [
    {
      req: "Describe your ISO 27001 certification and audit history.",
      resp: "We maintain ISO 27001:2022 certification with annual third-party audits. Our most recent surveillance audit (Q4 2025) reported zero major non-conformities...",
      status: "Compliant",
      conf: "94%",
    },
    {
      req: "Detail cloud migration experience for enterprise clients.",
      resp: "Delivered 12 enterprise cloud migrations across AWS and Azure, including a 3,200-user healthcare platform migration completed 2 months ahead of schedule...",
      status: "Compliant",
      conf: "88%",
    },
    {
      req: "Provide evidence of 99.9% uptime SLA capability.",
      resp: "Our managed services platform achieved 99.97% uptime over the past 24 months, supported by multi-region failover and 24/7 NOC monitoring...",
      status: "Review",
      conf: "72%",
    },
  ];

  return (
    <div className="relative mx-auto max-w-4xl">
      <div className="absolute -inset-6 rounded-3xl bg-indigo-500/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-900 shadow-2xl shadow-slate-900/20">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <div className="h-3 w-3 rounded-full bg-red-400/80" />
          <div className="h-3 w-3 rounded-full bg-amber-400/80" />
          <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
          <span className="ml-3 text-xs text-slate-400">Enterprise IT Services RFP — Workspace</span>
        </div>

        <div className="grid gap-0 lg:grid-cols-[200px_1fr]">
          <div className="hidden border-r border-white/10 bg-slate-950/50 p-4 lg:block">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Workspace</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li className="rounded-md bg-indigo-600/20 px-2 py-1.5 text-indigo-300">Requirements</li>
              <li className="px-2 py-1.5">Compliance</li>
              <li className="px-2 py-1.5">Win score</li>
              <li className="px-2 py-1.5">Draft export</li>
            </ul>
            <div className="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
              <p className="text-xs text-emerald-400">GO recommendation</p>
              <p className="mt-1 text-2xl font-bold text-white">68%</p>
              <p className="text-xs text-slate-400">win probability</p>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-medium text-indigo-300">
                AI drafting
              </span>
              <span className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs text-slate-300">
                24 requirements extracted
              </span>
              <span className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs text-slate-300">
                RAG-sourced
              </span>
            </div>

            <div className="space-y-3">
              {rows.map((row, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-slate-800/50 p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <p className="text-xs font-medium text-slate-400">Requirement</p>
                    <div className="flex shrink-0 gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          row.status === "Compliant"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {row.status}
                      </span>
                      <span className="text-xs text-slate-500">{row.conf}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-200">{row.req}</p>
                  <p className="mt-3 text-xs font-medium text-slate-500">AI response</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-300">{row.resp}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
