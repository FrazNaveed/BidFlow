"use client";

import { useCallback, useEffect, useState } from "react";
import UploadZone from "@/components/UploadZone";

interface Document {
  filename: string;
  chunkCount: number;
}

export default function HomePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [seeding, setSeeding] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (res.ok) {
        setDocuments(data.documents);
        setTotalChunks(data.totalChunks);
      }
    } catch {
      // ignore on initial load
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = async (file: File) => {
    setMessage(null);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/ingest", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      setMessage({ type: "error", text: data.error || "Upload failed" });
      return;
    }

    setMessage({
      type: "success",
      text: `Uploaded "${data.filename}" — ${data.chunksCreated} chunks indexed`,
    });
    await fetchDocuments();
  };

  const handleSeed = async (withChunks: boolean) => {
    setSeeding(true);
    setMessage(null);
    try {
      const res = await fetch("/api/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capabilityChunks: withChunks }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Seed failed" });
        return;
      }
      setMessage({
        type: "success",
        text: `Seeded: ${data.seeded.bidHistory} bids, ${data.seeded.evaluationTaxonomy} criteria, ${data.seeded.capabilityRecords} capabilities${withChunks ? `, ${data.seeded.capabilityChunks} chunks` : ""}`,
      });
      if (withChunks) await fetchDocuments();
    } finally {
      setSeeding(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Clear the entire knowledge base? This cannot be undone.")) {
      return;
    }

    const res = await fetch("/api/documents", { method: "DELETE" });
    if (res.ok) {
      setMessage({ type: "success", text: "Knowledge base cleared" });
      await fetchDocuments();
    } else {
      const data = await res.json();
      setMessage({ type: "error", text: data.error || "Failed to clear" });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Capability library</h1>
        <p className="mt-1 text-slate-600">
          Index past proposals, project summaries, certifications, and case studies for AI-powered matching.
        </p>
      </div>

      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5">
        <h3 className="font-semibold text-indigo-900">Import sample data</h3>
        <p className="mt-1 text-sm text-indigo-700">
          120 bid history records, 15 evaluation criteria, and 50 capability projects.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => handleSeed(false)}
            disabled={seeding}
            className="rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
          >
            Seed metadata
          </button>
          <button
            onClick={() => handleSeed(true)}
            disabled={seeding}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {seeding ? "Importing..." : "Import & index capabilities"}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <UploadZone
        accept=".pdf,.docx,.doc,.txt"
        label="Drop documents here"
        hint="PDF, Word (.docx, .doc), or plain text (.txt)"
        onUpload={handleUpload}
      />

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Uploaded Documents
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              {totalChunks} total chunks
            </span>
            {documents.length > 0 && (
              <button
                onClick={handleClear}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Clear knowledge base
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-slate-500">
            No documents uploaded yet. Upload your first document above.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <li
                key={doc.filename}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-50 p-2">
                    <svg
                      className="h-5 w-5 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <span className="font-medium text-slate-800">
                    {doc.filename}
                  </span>
                  {doc.filename === "approved_answers" && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      Approved
                    </span>
                  )}
                </div>
                <span className="text-sm text-slate-500">
                  {doc.chunkCount} chunks
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
