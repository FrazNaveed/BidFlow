#!/usr/bin/env node
/**
 * Offline unit tests for pure logic (no DB/API required).
 * Run: node scripts/test-logic.mjs
 */

import assert from "assert";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
    failed++;
  }
}

// ── Inline mirrors of lib/*.ts pure functions ──

function buildComplianceChecklist(requirements, scores) {
  return requirements.map((req) => {
    const score = scores.find((s) => s.requirement === req.text);
    const similarity = score?.similarity ?? 0;
    const mandatory = req.priority === "high";
    let status = "fail";
    if (similarity >= 0.85) status = "pass";
    else if (similarity >= 0.7) status = "partial";
    return { id: req.id, requirement: req.text, mandatory, status, similarity };
  });
}

function mandatoryPassRate(checklist) {
  const mandatory = checklist.filter((c) => c.mandatory);
  if (mandatory.length === 0) return 100;
  const passedCount = mandatory.filter((c) => c.status === "pass" || c.status === "partial").length;
  return Math.round((passedCount / mandatory.length) * 100);
}

function determineGoNoGo(winScore, checklist) {
  const mandatoryRate = mandatoryPassRate(checklist);
  const { breakdown, overall } = winScore;
  const mandatoryFails = checklist.filter((c) => c.mandatory && c.status === "fail").length;

  if (overall >= 55 && mandatoryRate >= 70 && breakdown.complianceCoverage >= 50 && mandatoryFails <= 2) {
    return { decision: "GO" };
  }
  if (overall < 30 || mandatoryFails >= 5) {
    return { decision: "NO-GO" };
  }
  return { decision: "REVIEW" };
}

function calculateEffortBenchmark(requirementCount, pageEstimate = 0) {
  const pages = pageEstimate || Math.max(1, Math.ceil(requirementCount * 1.5));
  const baselineMinutes = Math.round(45 + pages * 2 + requirementCount * 8);
  const aiMinutes = Math.round(3 + requirementCount * 0.5);
  const reductionPct = Math.round(((baselineMinutes - aiMinutes) / baselineMinutes) * 100);
  return { baselineMinutes, aiMinutes, reductionPct };
}

// ── Tests ──

console.log("\n── Compliance Checklist Logic ──");
test("maps high similarity to pass", () => {
  const items = buildComplianceChecklist(
    [{ id: "R1", text: "ISO 27001 certification", priority: "high" }],
    [{ requirement: "ISO 27001 certification", similarity: 0.9 }]
  );
  assert.strictEqual(items[0].status, "pass");
});

test("maps medium similarity to partial", () => {
  const items = buildComplianceChecklist(
    [{ id: "R2", text: "Cloud hosting", priority: "medium" }],
    [{ requirement: "Cloud hosting", similarity: 0.75 }]
  );
  assert.strictEqual(items[0].status, "partial");
});

test("maps low similarity to fail (compliance gap)", () => {
  const items = buildComplianceChecklist(
    [{ id: "R3", text: "FedRAMP High", priority: "high" }],
    [{ requirement: "FedRAMP High", similarity: 0.3 }]
  );
  assert.strictEqual(items[0].status, "fail");
  assert.strictEqual(items[0].mandatory, true);
});

console.log("\n── GO/NO-GO Logic ──");
test("strong bid returns GO", () => {
  const checklist = buildComplianceChecklist(
    [
      { id: "R1", text: "A", priority: "high" },
      { id: "R2", text: "B", priority: "high" },
    ],
    [
      { requirement: "A", similarity: 0.9 },
      { requirement: "B", similarity: 0.88 },
    ]
  );
  const result = determineGoNoGo(
    { overall: 65, breakdown: { complianceCoverage: 80 } },
    checklist
  );
  assert.strictEqual(result.decision, "GO");
});

test("weak bid returns NO-GO", () => {
  const checklist = buildComplianceChecklist(
    Array.from({ length: 6 }, (_, i) => ({ id: `R${i}`, text: `req${i}`, priority: "high" })),
    Array.from({ length: 6 }, (_, i) => ({ requirement: `req${i}`, similarity: 0.2 }))
  );
  const result = determineGoNoGo(
    { overall: 20, breakdown: { complianceCoverage: 10 } },
    checklist
  );
  assert.strictEqual(result.decision, "NO-GO");
});

console.log("\n── Effort Benchmark ──");
test("meets 50%+ reduction for typical RFP (10+ requirements)", () => {
  for (const count of [10, 20, 50]) {
    const e = calculateEffortBenchmark(count);
    assert.ok(e.reductionPct >= 50, `expected ≥50% for ${count} reqs, got ${e.reductionPct}%`);
  }
});

test("AI time is less than manual baseline", () => {
  const e = calculateEffortBenchmark(25);
  assert.ok(e.aiMinutes < e.baselineMinutes);
});

console.log("\n── Sample Dataset Integrity ──");
test("bid history has 120 rows with win/loss fields", () => {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, "sample-data/bid-history.json"), "utf8"));
  assert.strictEqual(data.length, 120);
  assert.ok("outcome" in data[0] || "result" in data[0] || "won" in data[0]);
});

test("capability library has 50 records", () => {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, "sample-data/capability-library.json"), "utf8"));
  assert.strictEqual(data.length, 50);
});

test("evaluation taxonomy has 15+ entries", () => {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, "sample-data/evaluation-taxonomy.json"), "utf8"));
  assert.ok(data.length >= 15);
});

test("3 sector RFP samples exist", () => {
  for (const f of ["sample-rfp-it-services.txt", "sample-rfp-construction.txt", "sample-rfp-logistics.txt"]) {
    assert.ok(fs.existsSync(path.join(ROOT, "sample-data", f)), `missing ${f}`);
  }
});

console.log("\n── Codebase Feature Presence ──");
const featureChecks = [
  ["lib/gemini.ts", "LLM (Gemini) integration"],
  ["lib/rag.ts", "RAG capability library"],
  ["lib/ner.ts", "NER extraction"],
  ["lib/win-score.ts", "Win probability scoring"],
  ["lib/extract-requirements.ts", "Requirement extraction"],
  ["lib/proposal-export.ts", "Structured DOCX export"],
  ["components/WinScoreDashboard.tsx", "Win probability dashboard UI"],
  ["components/ComplianceChecklist.tsx", "Compliance checklist UI"],
  ["components/GoNoGoBanner.tsx", "GO/NO-GO banner UI"],
  ["components/NERPanel.tsx", "NER output UI"],
  ["components/EffortBenchmark.tsx", "Effort reduction UI"],
  ["app/workspaces/[id]/page.tsx", "Per-RFP workspace UI"],
  ["app/api/analyze/route.ts", "RFP analyze endpoint"],
  ["app/api/workspaces/[id]/draft/route.ts", "Draft generation endpoint"],
  ["app/api/workspaces/[id]/export/route.ts", "Proposal export endpoint"],
];

for (const [file, label] of featureChecks) {
  test(`${label} exists (${file})`, () => {
    assert.ok(fs.existsSync(path.join(ROOT, file)), `missing ${file}`);
  });
}

console.log("\n══════════════════════════════════════");
console.log(`OFFLINE TESTS: ${passed} passed, ${failed} failed`);
console.log("══════════════════════════════════════");
process.exit(failed > 0 ? 1 : 0);
