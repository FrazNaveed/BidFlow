import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "sample-data");
mkdirSync(outDir, { recursive: true });

const domains = ["IT Services", "Construction", "Logistics"];
const sectors = domains;
const outcomes = ["win", "loss"];

const bidHistory = [];
for (let i = 1; i <= 120; i++) {
  const domain = domains[i % 3];
  const outcome = i % 3 === 0 ? "loss" : "win";
  bidHistory.push({
    bid_id: `BID-${String(i).padStart(4, "0")}`,
    domain,
    sector: domain,
    outcome,
    evaluation_score: Math.round(60 + Math.random() * 35),
    contract_value: Math.round(100000 + Math.random() * 2000000),
    our_bid_value: Math.round(95000 + Math.random() * 1900000),
    competitor_count: Math.floor(2 + Math.random() * 6),
    year: 2019 + (i % 6),
  });
}

const taxonomy = [
  { sector: "IT Services", criterion: "Technical Approach", typical_weight: "30-40%", description: "Solution architecture, methodology, innovation" },
  { sector: "IT Services", criterion: "Security & Compliance", typical_weight: "20-30%", description: "SOC 2, ISO 27001, data protection controls" },
  { sector: "IT Services", criterion: "Past Performance", typical_weight: "15-25%", description: "Relevant project references and outcomes" },
  { sector: "IT Services", criterion: "Price", typical_weight: "10-20%", description: "Total cost of ownership and value" },
  { sector: "IT Services", criterion: "Team Qualifications", typical_weight: "10-15%", description: "Key personnel experience and certifications" },
  { sector: "Construction", criterion: "Technical Methodology", typical_weight: "25-35%", description: "Construction approach and safety plan" },
  { sector: "Construction", criterion: "Safety Record", typical_weight: "20-25%", description: "EMR, OSHA compliance, incident history" },
  { sector: "Construction", criterion: "Schedule", typical_weight: "15-20%", description: "Timeline feasibility and milestones" },
  { sector: "Construction", criterion: "Cost", typical_weight: "20-30%", description: "Bid price competitiveness" },
  { sector: "Construction", criterion: "Experience", typical_weight: "10-15%", description: "Similar project completion record" },
  { sector: "Logistics", criterion: "Operational Capability", typical_weight: "30-40%", description: "Fleet, warehousing, distribution network" },
  { sector: "Logistics", criterion: "SLA Performance", typical_weight: "20-25%", description: "On-time delivery, accuracy metrics" },
  { sector: "Logistics", criterion: "Technology Platform", typical_weight: "15-20%", description: "TMS/WMS, tracking, integration" },
  { sector: "Logistics", criterion: "Pricing", typical_weight: "15-25%", description: "Rate competitiveness and transparency" },
  { sector: "Logistics", criterion: "Sustainability", typical_weight: "5-10%", description: "Carbon footprint, green logistics" },
];

const certSets = [
  "SOC 2 Type II, ISO 27001",
  "ISO 9001, CMMI Level 3",
  "FedRAMP Moderate, SOC 2",
  "HIPAA, HITRUST",
  "PCI DSS Level 1",
];
const clientTypes = ["Government", "Enterprise", "Healthcare", "Financial Services", "Education"];

const capabilityLibrary = [];
const projectTemplates = [
  "Cloud migration and managed services for {client}",
  "Enterprise security platform deployment for {client}",
  "Data analytics and BI modernization for {client}",
  "SSO and identity management implementation for {client}",
  "Disaster recovery and BCP setup for {client}",
  "Custom software development for {client}",
  "Network infrastructure upgrade for {client}",
  "Compliance audit and remediation for {client}",
  "Mobile application development for {client}",
  "AI/ML proof of concept for {client}",
];

for (let i = 1; i <= 50; i++) {
  const domain = domains[i % 3];
  const client = clientTypes[i % clientTypes.length];
  const template = projectTemplates[i % projectTemplates.length];
  capabilityLibrary.push({
    project_name: `Project ${String(i).padStart(3, "0")} — ${domain.split(" ")[0]}`,
    summary: `${template.replace("{client}", client)}. Delivered on time with ${certSets[i % certSets.length]} compliance. Key outcomes: reduced operational costs by ${10 + (i % 20)}%, improved SLA to 99.${9 - (i % 3)}%, and successful audit with zero findings.`,
    certifications: certSets[i % certSets.length],
    year_completed: 2019 + (i % 6),
    contract_value: Math.round(150000 + (i * 37000) % 2500000),
    duration_months: 6 + (i % 24),
    client_type: client,
    domain,
  });
}

const rfps = [
  {
    filename: "sample-rfp-it-services.txt",
    content: `REQUEST FOR PROPOSAL — IT Managed Services\nAgency: Department of Digital Transformation\nRFP No: RFP-2026-IT-0089\n\nSUBMISSION DEADLINE: April 30, 2026\nBudget Ceiling: $2,500,000\n\nEVALUATION CRITERIA:\nTechnical Approach — 35%\nSecurity & Compliance — 25%\nPast Performance — 20%\nPrice — 20%\n\nSECTION A — TECHNICAL QUESTIONS\n1. Describe your cloud infrastructure management approach including monitoring and patching.\n2. The vendor shall maintain SOC 2 Type II certification.\n3. Provide SLA commitments for uptime (minimum 99.9%).\n\nSECTION B — COMPLIANCE\n4. Confirm GDPR and CCPA compliance for data processing.\n5. Describe incident response procedures and breach notification timelines.\n\nSECTION C — EXPERIENCE\n6. Provide three references for government IT projects over $500K completed in the last 3 years.`,
  },
  {
    filename: "sample-rfp-construction.txt",
    content: `REQUEST FOR QUOTATION — Office Building Renovation\nProject: Federal Building Wing C Renovation\nRFQ No: RFQ-2026-CON-0044\n\nSUBMISSION DEADLINE: May 15, 2026\nEstimated Budget: $4,200,000\n\nEVALUATION:\nTechnical Methodology — 30%\nSafety Record — 25%\nSchedule — 20%\nCost — 25%\n\nMANDATORY REQUIREMENTS:\n1. Contractor must hold valid state license and $5M general liability insurance.\n2. EMR rating shall not exceed 1.0 for the past 3 years.\n3. Submit detailed project schedule with milestones.\n4. Describe quality control and inspection procedures.\n5. Provide OSHA safety plan and training records.`,
  },
  {
    filename: "sample-rfp-logistics.txt",
    content: `TENDER NOTICE — National Distribution Services\nTender ID: TND-2026-LOG-0112\nClosing Date: June 1, 2026\nContract Value: $1,800,000 annually\n\nEVALUATION CRITERIA:\nOperational Capability — 35%\nSLA Performance — 25%\nTechnology Platform — 20%\nPricing — 20%\n\nREQUIREMENTS:\n1. Demonstrate nationwide distribution network with minimum 50 hub locations.\n2. Provide real-time shipment tracking and TMS integration capabilities.\n3. On-time delivery SLA of 98% or higher.\n4. ISO 9001 certification required.\n5. Submit carbon footprint reduction plan.\n6. Pricing breakdown by zone and service tier.`,
  },
];

writeFileSync(join(outDir, "bid-history.json"), JSON.stringify(bidHistory, null, 2));
writeFileSync(join(outDir, "evaluation-taxonomy.json"), JSON.stringify(taxonomy, null, 2));
writeFileSync(join(outDir, "capability-library.json"), JSON.stringify(capabilityLibrary, null, 2));

for (const rfp of rfps) {
  writeFileSync(join(outDir, rfp.filename), rfp.content);
}

console.log("Generated sample datasets:");
console.log(`  bid-history.json: ${bidHistory.length} records`);
console.log(`  evaluation-taxonomy.json: ${taxonomy.length} records`);
console.log(`  capability-library.json: ${capabilityLibrary.length} records`);
console.log(`  ${rfps.length} sample RFP documents`);
