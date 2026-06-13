#!/usr/bin/env node
/**
 * Regenerates evaluation taxonomy only.
 * Company library lives in company-data/ — edit those files directly.
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "sample-data");
mkdirSync(outDir, { recursive: true });

const evaluationTaxonomy = [
  { sector: "IT Services", criterion: "Technical Approach", typical_weight: "30-40%", description: "Solution architecture, methodology, innovation" },
  { sector: "IT Services", criterion: "Security & Compliance", typical_weight: "20-30%", description: "SOC 2, ISO 27001, data protection controls" },
  { sector: "IT Services", criterion: "Past Performance", typical_weight: "15-25%", description: "Relevant project references and outcomes" },
  { sector: "IT Services", criterion: "Price", typical_weight: "10-20%", description: "Total cost of ownership and value" },
  { sector: "IT Services", criterion: "Team Qualifications", typical_weight: "10-15%", description: "Key personnel experience and certifications" },
  { sector: "Construction", criterion: "Technical Methodology", typical_weight: "25-35%", description: "Construction approach and safety plan" },
  { sector: "Construction", criterion: "Safety Record", typical_weight: "20-25%", description: "HSE track record and incident rates" },
  { sector: "Construction", criterion: "Past Performance", typical_weight: "15-20%", description: "Similar project delivery history" },
  { sector: "Construction", criterion: "Price", typical_weight: "15-25%", description: "Competitive pricing and value engineering" },
  { sector: "Logistics", criterion: "Operational Capability", typical_weight: "30-40%", description: "Fleet, routes, and fulfillment capacity" },
  { sector: "Logistics", criterion: "Technology & Tracking", typical_weight: "15-25%", description: "Telematics, visibility, and reporting" },
  { sector: "Logistics", criterion: "Past Performance", typical_weight: "15-20%", description: "On-time delivery and SLA compliance" },
  { sector: "Logistics", criterion: "Price", typical_weight: "15-25%", description: "Cost per unit and total contract value" },
  { sector: "Advisory", criterion: "Methodology & Approach", typical_weight: "35-45%", description: "Analytical rigor and delivery plan" },
  { sector: "Advisory", criterion: "Team Qualifications", typical_weight: "25-35%", description: "Consultant credentials and sector experience" },
];

writeFileSync(join(outDir, "evaluation-taxonomy.json"), JSON.stringify(evaluationTaxonomy, null, 2));

console.log("Generated sample-data/evaluation-taxonomy.json");
console.log("Company documents: edit company-data/*.txt and company-data/bid-history.json");
