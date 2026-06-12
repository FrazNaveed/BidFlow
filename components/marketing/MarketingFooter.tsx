import Link from "next/link";

export default function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                B
              </div>
              <span className="font-semibold text-slate-900">BidFlow</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              AI-powered bid and proposal response for procurement, sourcing, and contract teams.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Product</h4>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li><Link href="/#product" className="hover:text-indigo-600">Features</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-indigo-600">How it works</Link></li>
              <li><Link href="/pricing" className="hover:text-indigo-600">Pricing</Link></li>
              <li><Link href="/login" className="hover:text-indigo-600">Log in</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Platform</h4>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li><Link href="/app/library" className="hover:text-indigo-600">Capability library</Link></li>
              <li><Link href="/app/workspaces" className="hover:text-indigo-600">Bid workspaces</Link></li>
              <li><Link href="/app/analyze" className="hover:text-indigo-600">RFP analysis</Link></li>
              <li><Link href="/app/bulk" className="hover:text-indigo-600">Bulk responses</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Company</h4>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li><a href="mailto:hello@bidflow.ai" className="hover:text-indigo-600">Contact</a></li>
              <li><Link href="/app/analyze" className="hover:text-indigo-600">Book a demo</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-sm text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} BidFlow. All rights reserved.</p>
          <p>Built for procurement &amp; bid teams.</p>
        </div>
      </div>
    </footer>
  );
}
