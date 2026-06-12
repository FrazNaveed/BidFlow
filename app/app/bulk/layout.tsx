import { Suspense } from "react";

export default function BulkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-slate-500">
          Loading...
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
