"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UploadZone from "@/components/UploadZone";

export default function AnalyzePage() {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Analysis failed");
        return;
      }

      if (data.workspaceId) {
        router.push(`/app/workspaces/${data.workspaceId}`);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analyze RFP</h1>
        <p className="mt-1 text-slate-600">
          Upload a tender document to create a bid workspace with requirement extraction,
          compliance analysis, win scoring, and a GO/NO-GO recommendation.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <UploadZone
        accept=".pdf,.docx,.doc,.txt"
        label="Drop incoming RFP here"
        hint="Creates a new workspace with full bid intelligence analysis"
        onUpload={handleUpload}
        disabled={analyzing}
      />

      {analyzing && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 text-center">
          <div className="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <p className="font-medium text-indigo-900">
            Running LLM extraction, NER, RAG scoring, and creating workspace...
          </p>
        </div>
      )}
    </div>
  );
}
