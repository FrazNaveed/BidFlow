#!/usr/bin/env node
/**
 * Hackathon requirements verification script.
 * Run with: node scripts/verify-requirements.mjs
 * Requires: npm run dev + valid .env keys
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const BASE = process.env.TEST_BASE_URL || "http://localhost:3000";

const results = [];

function pass(id, label, detail = "") {
  results.push({ id, label, status: "PASS", detail });
  console.log(`  ✓ PASS  ${label}${detail ? ` — ${detail}` : ""}`);
}

function fail(id, label, detail = "") {
  results.push({ id, label, status: "FAIL", detail });
  console.log(`  ✗ FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
}

function warn(id, label, detail = "") {
  results.push({ id, label, status: "WARN", detail });
  console.log(`  ⚠ WARN  ${label}${detail ? ` — ${detail}` : ""}`);
}

async function api(method, route, { body, headers } = {}) {
  const res = await fetch(`${BASE}${route}`, { method, body, headers });
  const contentType = res.headers.get("content-type") || "";
  let data = null;
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.arrayBuffer();
  }
  return { ok: res.ok, status: res.status, data, headers: res.headers };
}

function checkSampleDatasets() {
  console.log("\n── Sample Datasets ──");
  const checks = [
    ["sample-data/bid-history.json", 120, "bid history"],
    ["sample-data/capability-library.json", 50, "capability library"],
    ["sample-data/evaluation-taxonomy.json", 15, "evaluation taxonomy"],
    ["sample-data/sample-rfp-it-services.txt", 1, "IT services RFP"],
    ["sample-data/sample-rfp-construction.txt", 1, "construction RFP"],
    ["sample-data/sample-rfp-logistics.txt", 1, "logistics RFP"],
  ];

  for (const [rel, minCount, label] of checks) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) {
      fail("DS", `${label} file exists`, `missing ${rel}`);
      continue;
    }
    if (rel.endsWith(".json")) {
      const arr = JSON.parse(fs.readFileSync(full, "utf8"));
      const count = Array.isArray(arr) ? arr.length : Object.keys(arr).length;
      if (count >= minCount) pass("DS", `${label}`, `${count} records`);
      else fail("DS", `${label}`, `expected ≥${minCount}, got ${count}`);
    } else {
      const size = fs.statSync(full).size;
      if (size > 500) pass("DS", `${label}`, `${Math.round(size / 1024)}KB`);
      else fail("DS", `${label}`, `file too small (${size} bytes)`);
    }
  }
}

async function ensureSeeded() {
  console.log("\n── Knowledge Base ──");
  const docs = await api("GET", "/api/documents");
  if (!docs.ok) {
    fail("KB", "Documents API reachable", `HTTP ${docs.status}`);
    return false;
  }
  const chunks = docs.data.totalChunks || 0;
  if (chunks > 0) {
    pass("KB", "Capability library indexed", `${chunks} chunks`);
    return true;
  }

  console.log("  … seeding sample datasets (may take ~30s) …");
  const seed = await api("POST", "/api/seed", {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ capabilityChunks: true }),
  });
  if (!seed.ok) {
    fail("KB", "Seed datasets", seed.data?.error || `HTTP ${seed.status}`);
    return false;
  }
  pass("KB", "Seed datasets", JSON.stringify(seed.data.seeded));
  return true;
}

async function testAnalyzeAndWorkspace() {
  console.log("\n── RFP Ingest & Workspace ──");
  const rfpPath = path.join(ROOT, "sample-data/sample-rfp-it-services.txt");
  const text = fs.readFileSync(rfpPath, "utf8");
  const blob = new Blob([text], { type: "text/plain" });
  const form = new FormData();
  form.append("file", blob, "sample-rfp-it-services.txt");

  const analyze = await api("POST", "/api/analyze", { body: form });
  if (!analyze.ok) {
    fail("RFP", "Accept RFP document & analyze", analyze.data?.error || `HTTP ${analyze.status}`);
    return null;
  }

  const a = analyze.data;
  const workspaceId = a.workspaceId;

  if (workspaceId) pass("RFP", "Creates separate workspace", workspaceId);
  else fail("RFP", "Creates separate workspace", "no workspaceId returned");

  if (a.requirements?.length > 0)
    pass("RFP", "Extract mandatory requirements", `${a.requirements.length} requirements`);
  else fail("RFP", "Extract mandatory requirements", "none extracted");

  if (a.evaluationCriteria?.length > 0)
    pass("RFP", "Extract evaluation criteria", `${a.evaluationCriteria.length} criteria`);
  else warn("RFP", "Extract evaluation criteria", "none in response (may be embedded in requirements)");

  const hasDeadlines = a.entities?.deadlines?.length > 0;
  const hasBudgets = a.entities?.budgets?.length > 0;
  const hasWeights = a.entities?.evaluationWeights?.length > 0;
  const hasClauses = a.entities?.complianceClauses?.length > 0;
  if (hasDeadlines) pass("NER", "Extract deadlines", `${a.entities.deadlines.length} found`);
  else warn("NER", "Extract deadlines", "none found in sample");
  if (hasBudgets) pass("NER", "Extract budget figures", `${a.entities.budgets.length} found`);
  else warn("NER", "Extract budget figures", "none found in sample");
  if (hasWeights) pass("NER", "Extract evaluation weights", `${a.entities.evaluationWeights.length} found`);
  else warn("NER", "Extract evaluation weights", "none found in sample");
  if (hasClauses) pass("NER", "Extract compliance clauses", `${a.entities.complianceClauses.length} found`);
  else warn("NER", "Extract compliance clauses", "none found in sample");

  if (a.complianceChecklist?.length > 0) {
    const statuses = a.complianceChecklist.map((c) => c.status);
    const hasPassFail = statuses.some((s) => s === "pass" || s === "fail" || s === "partial");
    if (hasPassFail)
      pass("COMP", "Compliance checklist pass/fail mapping", `${a.complianceChecklist.length} items`);
    else fail("COMP", "Compliance checklist pass/fail mapping", "no status values");
  } else fail("COMP", "Compliance checklist auto-generated", "empty");

  if (a.winScore?.overall != null && a.winScore?.breakdown) {
    const keys = Object.keys(a.winScore.breakdown);
    pass("WIN", "Win-probability scoring", `overall ${a.winScore.overall}%, ${keys.length} factors`);
  } else fail("WIN", "Win-probability scoring", "missing winScore");

  if (a.goNoGo?.decision && a.goNoGo?.rationale)
    pass("GNG", "GO/NO-GO decision", `${a.goNoGo.decision}: ${a.goNoGo.rationale.slice(0, 60)}…`);
  else fail("GNG", "GO/NO-GO decision", "missing");

  if (a.effort?.reductionPct >= 50)
    pass("EFF", "50%+ effort reduction", `${a.effort.reductionPct}% (${a.effort.baselineMinutes}m → ${a.effort.aiMinutes}m)`);
  else if (a.effort?.reductionPct != null)
    fail("EFF", "50%+ effort reduction", `only ${a.effort.reductionPct}%`);
  else fail("EFF", "50%+ effort reduction", "missing effort benchmark");

  return workspaceId;
}

async function testWorkspaceDetail(workspaceId) {
  console.log("\n── Workspace UI Data ──");
  const res = await api("GET", `/api/workspaces/${workspaceId}`);
  if (!res.ok) {
    fail("WS", "Workspace detail API", `HTTP ${res.status}`);
    return;
  }
  const { workspace, responses } = res.data;
  pass("WS", "Workspace persisted", workspace.name);

  const fields = ["win_score", "compliance_checklist", "entities", "go_no_go", "effort_reduction_pct"];
  for (const f of fields) {
    if (workspace[f] != null) pass("WS", `Workspace has ${f}`, "present");
    else fail("WS", `Workspace has ${f}`, "missing");
  }

  if (responses.length === 0) pass("WS", "Draft responses (pre-generation)", "0 — expected before Generate Draft");
}

async function testDraftGeneration(workspaceId) {
  console.log("\n── Draft Generation (LLM + RAG) ──");
  console.log("  … generating draft (may take 1–3 min) …");

  const res = await fetch(`${BASE}/api/workspaces/${workspaceId}/draft`, { method: "POST" });
  if (!res.ok) {
    fail("DRAFT", "Generate structured draft", `HTTP ${res.status}`);
    return;
  }

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completed = false;
  let total = 0;

  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = JSON.parse(line.slice(6));
      if (data.type === "start") total = data.total;
      if (data.type === "complete") completed = true;
      if (data.type === "error") {
        fail("DRAFT", "Generate structured draft", data.message);
        return;
      }
    }
  }

  if (completed) pass("DRAFT", "Generate structured draft", `${total} requirements answered`);
  else fail("DRAFT", "Generate structured draft", "stream did not complete");

  const detail = await api("GET", `/api/workspaces/${workspaceId}`);
  const responses = detail.data.responses || [];
  const withAnswers = responses.filter((r) => r.answer && r.answer.length > 20);
  if (withAnswers.length > 0)
    pass("DRAFT", "Responses mapped to requirements", `${withAnswers.length}/${responses.length} substantive`);
  else fail("DRAFT", "Responses mapped to requirements", "no substantive answers");
}

async function testApproveAndExport(workspaceId) {
  console.log("\n── Review / Approve / Export ──");
  const detail = await api("GET", `/api/workspaces/${workspaceId}`);
  const responses = detail.data.responses || [];
  if (responses.length === 0) {
    warn("REV", "Edit & approve flow", "no responses to approve");
    return;
  }

  const first = responses[0];
  const patch = await api("PATCH", `/api/workspaces/${workspaceId}/responses`, {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      responseId: first.id,
      answer: (first.answer || "Test answer") + " [verified]",
      approved: true,
    }),
  });
  if (patch.ok) pass("REV", "Review, edit & approve", `response ${first.id.slice(0, 8)}… approved`);
  else fail("REV", "Review, edit & approve", patch.data?.error || `HTTP ${patch.status}`);

  const exp = await api("POST", `/api/workspaces/${workspaceId}/export`);
  if (exp.ok && exp.data.byteLength > 1000) {
    pass("EXP", "Export structured proposal (DOCX)", `${Math.round(exp.data.byteLength / 1024)}KB`);
  } else {
    fail("EXP", "Export structured proposal (DOCX)", `HTTP ${exp.status} or empty file`);
  }
}

async function testRagAnswer() {
  console.log("\n── RAG Q&A ──");
  const res = await api("POST", "/api/answer", {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question: "Describe our cloud migration experience and certifications.",
      stream: false,
    }),
  });
  if (res.ok && res.data.answer?.length > 20) {
    pass("RAG", "RAG capability library query", `${res.data.answer.length} chars, trust ${res.data.trustScore}`);
  } else {
    fail("RAG", "RAG capability library query", res.data?.error || res.data?.message || `HTTP ${res.status}`);
  }
}

async function testNerApi() {
  console.log("\n── NER API ──");
  const text = fs.readFileSync(path.join(ROOT, "sample-data/sample-rfp-it-services.txt"), "utf8");
  const res = await api("POST", "/api/ner", {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: text.slice(0, 8000) }),
  });
  if (res.ok && res.data.entities) {
    const e = res.data.entities;
    pass("NER-API", "NER endpoint", `deadlines=${e.deadlines?.length}, budgets=${e.budgets?.length}, weights=${e.evaluationWeights?.length}`);
  } else {
    fail("NER-API", "NER endpoint", res.data?.error || `HTTP ${res.status}`);
  }
}

async function main() {
  console.log("RFP Autopilot — Requirements Verification");
  console.log(`Target: ${BASE}`);

  try {
    await fetch(BASE);
  } catch {
    console.error("\n✗ Dev server not reachable. Run: npm run dev");
    process.exit(1);
  }

  checkSampleDatasets();
  const seeded = await ensureSeeded();
  if (!seeded) {
    printSummary();
    process.exit(1);
  }

  await testRagAnswer();
  await testNerApi();

  const workspaceId = await testAnalyzeAndWorkspace();
  if (!workspaceId) {
    printSummary();
    process.exit(1);
  }

  await testWorkspaceDetail(workspaceId);

  const skipDraft = process.argv.includes("--skip-draft");
  if (skipDraft) {
    warn("DRAFT", "Draft generation", "skipped (--skip-draft)");
  } else {
    await testDraftGeneration(workspaceId);
    await testApproveAndExport(workspaceId);
  }

  printSummary();
}

function printSummary() {
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const warned = results.filter((r) => r.status === "WARN").length;

  console.log("\n══════════════════════════════════════");
  console.log(`SUMMARY: ${passed} passed, ${failed} failed, ${warned} warnings`);
  console.log("══════════════════════════════════════");

  if (failed > 0) {
    console.log("\nFailed checks:");
    results.filter((r) => r.status === "FAIL").forEach((r) => console.log(`  • ${r.label}: ${r.detail}`));
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("\nFatal:", err.message);
  process.exit(1);
});
