import * as XLSX from "xlsx";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const questions = [
  "Do you comply with SOC 2 Type II?",
  "How do you handle data encryption?",
  "What is your incident response process?",
  "Do you support single sign-on (SSO)?",
  "What is your uptime SLA?",
];

const sheet = XLSX.utils.aoa_to_sheet([
  ["Question"],
  ...questions.map((q) => [q]),
]);

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, sheet, "Questions");

const outPath = join(__dirname, "..", "sample-data", "sample-rfp-questions.xlsx");
writeFileSync(outPath, XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
console.log("Created", outPath);
