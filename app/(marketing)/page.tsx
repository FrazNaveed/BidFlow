import Link from "next/link";
import ProductPreview from "@/components/marketing/ProductPreview";

const features = [
  {
    title: "Intelligent RFP parsing",
    description:
      "Upload PDF or Word tenders. BidFlow extracts requirements, evaluation criteria, deadlines, and compliance clauses automatically.",
    icon: "📄",
  },
  {
    title: "Capability-matched responses",
    description:
      "RAG searches your project library, certifications, and case studies to draft answers grounded in real evidence.",
    icon: "🔍",
  },
  {
    title: "Compliance checklist",
    description:
      "Every requirement mapped pass/fail against your library. Flag mandatory gaps before you invest bid effort.",
    icon: "✓",
  },
  {
    title: "Win probability scoring",
    description:
      "Seven-factor bid scoring: capability fit, budget alignment, historical win rate, and competitive position.",
    icon: "📊",
  },
  {
    title: "GO / NO-GO decisions",
    description:
      "Data-driven pursuit recommendations with clear rationale so leadership can decide in minutes, not days.",
    icon: "🎯",
  },
  {
    title: "Review, approve, export",
    description:
      "Bid managers edit AI drafts, approve final copy, and export structured Word proposals ready for submission.",
    icon: "📤",
  },
];

const steps = [
  { step: "01", title: "Build your library", body: "Index past proposals, case studies, and certifications into a searchable capability library." },
  { step: "02", title: "Analyze incoming RFPs", body: "Upload a tender to create a dedicated workspace with extracted requirements and bid intelligence." },
  { step: "03", title: "Draft & decide", body: "Generate compliant responses, review win score, and get a GO/NO-GO recommendation." },
  { step: "04", title: "Export & submit", body: "Approve final answers and export a structured proposal document." },
];

const logos = ["Technology", "Construction", "Logistics", "Healthcare", "Finance", "Government"];

export default function LandingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="hero-surface relative overflow-hidden pb-20 pt-16 sm:pb-28 sm:pt-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-5 inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700">
              AI for procurement &amp; bid teams
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl sm:leading-[1.1]">
              Win more RFPs with{" "}
              <span className="text-gradient">AI you can trust</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              Respond to more RFPs, RFQs, and tenders with higher-quality, compliant
              proposals — faster. Parse documents, match capabilities, score win
              probability, and export submission-ready drafts.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/login"
                className="w-full rounded-xl bg-indigo-600 px-8 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 sm:w-auto"
              >
                Analyze an RFP — free
              </Link>
              <Link
                href="/#how-it-works"
                className="w-full rounded-xl border border-slate-300 bg-white px-8 py-3.5 text-center text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto"
              >
                See how it works
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              No credit card required · PDF &amp; DOCX supported · Export to Word
            </p>
          </div>

          <div className="mt-16 sm:mt-20">
            <ProductPreview />
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-b border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-slate-500">
            Trusted across industries
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {logos.map((name) => (
              <span key={name} className="text-lg font-semibold text-slate-400">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="bg-slate-50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Your team is trapped in manual RFPs
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Bid teams spend 60–80% of their time reading tenders, cross-referencing
              libraries, and formatting responses — not winning deals.
            </p>
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-red-100 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wider text-red-600">Before BidFlow</p>
              <ul className="mt-6 space-y-4 text-slate-600">
                <li className="flex gap-3">
                  <span className="text-red-400">✕</span>
                  Generic past responses that don&apos;t address specific requirements
                </li>
                <li className="flex gap-3">
                  <span className="text-red-400">✕</span>
                  Missed mandatory clauses leading to disqualification
                </li>
                <li className="flex gap-3">
                  <span className="text-red-400">✕</span>
                  Capability evidence scattered across drives and inboxes
                </li>
                <li className="flex gap-3">
                  <span className="text-red-400">✕</span>
                  No structured way to decide which bids to pursue
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">With BidFlow</p>
              <ul className="mt-6 space-y-4 text-slate-600">
                <li className="flex gap-3">
                  <span className="text-emerald-500">✓</span>
                  AI drafts requirement-mapped responses from your capability library
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-500">✓</span>
                  Auto-generated compliance checklist with pass/fail evidence
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-500">✓</span>
                  Centralized workspaces per RFP with full bid intelligence
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-500">✓</span>
                  Win-probability dashboard and GO/NO-GO recommendations
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="product" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Finally, AI responses you can trust
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              LLM parsing, RAG retrieval, NER extraction, and bid scoring — integrated
              into one workflow built for proposal managers.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-indigo-200 hover:shadow-md"
              >
                <span className="text-2xl">{f.icon}</span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-slate-200 bg-slate-50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              From tender to submission in four steps
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Cut manual bid preparation effort by 50% or more with an AI engine
              designed for compliance-first proposal teams.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.step} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="text-sm font-bold text-indigo-600">{s.step}</span>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 sm:grid-cols-3">
          {[
            { stat: "50%+", label: "Reduction in manual bid prep time" },
            { stat: "7", label: "Win-probability scoring factors" },
            { stat: "100%", label: "Requirement-level compliance mapping" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-4xl font-bold text-indigo-600">{item.stat}</p>
              <p className="mt-2 text-sm text-slate-600">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 px-8 py-16 text-center sm:px-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to respond faster and win more?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-indigo-100">
              Upload your first RFP and get a full bid workspace with compliance
              analysis, win scoring, and AI-drafted responses.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/login"
                className="w-full rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 sm:w-auto"
              >
                Get started free
              </Link>
              <Link
                href="/pricing"
                className="w-full rounded-xl border border-white/30 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
              >
                View pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
