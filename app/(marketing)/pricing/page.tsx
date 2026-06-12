import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
};

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "to evaluate",
    description: "For individuals exploring AI-assisted bid response.",
    features: [
      "3 RFP workspaces / month",
      "Capability library (50 docs)",
      "Compliance checklist",
      "Win probability scoring",
      "Word export",
    ],
    cta: "Start free",
    href: "/login",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "$299",
    period: "/ seat / month",
    description: "For bid teams responding to tenders every week.",
    features: [
      "Unlimited workspaces",
      "Unlimited library documents",
      "Bulk RFP processing",
      "GO/NO-GO analytics",
      "Priority AI drafting",
      "Team review & approve",
    ],
    cta: "Start trial",
    href: "/login",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "annual contract",
    description: "For organizations with complex procurement workflows.",
    features: [
      "SSO & role-based access",
      "Custom evaluation taxonomy",
      "Dedicated support & onboarding",
      "API access",
      "SLA & security review",
      "Multi-workspace governance",
    ],
    cta: "Contact sales",
    href: "mailto:hello@bidflow.ai",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <main className="bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Simple pricing for bid teams
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Start free, scale as your team wins more deals. All plans include
            core AI parsing, RAG, and compliance features.
          </p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col rounded-2xl border p-8 ${
                plan.highlighted
                  ? "border-indigo-600 bg-white shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-600"
                  : "border-slate-200 bg-white"
              }`}
            >
              {plan.highlighted && (
                <span className="mb-4 inline-flex w-fit rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}
              <h2 className="text-xl font-semibold text-slate-900">{plan.name}</h2>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                <span className="text-sm text-slate-500">{plan.period}</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{plan.description}</p>
              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-slate-600">
                    <span className="text-indigo-600">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`mt-8 block rounded-xl py-3 text-center text-sm font-semibold transition ${
                  plan.highlighted
                    ? "bg-indigo-600 text-white hover:bg-indigo-500"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
