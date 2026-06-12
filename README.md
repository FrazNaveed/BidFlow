# RFP Autopilot — AI-Powered Bid & Proposal Response Engine

Full hackathon implementation for Procurement, Sourcing & Contract Management.

## Requirements coverage

| Requirement | Implementation |
|-------------|----------------|
| LLM parsing & narrative generation | Gemini 2.5 Flash — requirement extraction, Q&A drafting |
| RAG Capability Library | Gemini embeddings + Supabase pgvector |
| NER | Deadlines, budgets, evaluation weights, compliance clauses |
| Win probability scoring | 7-factor model incl. budget, history, competitors |
| Per-RFP workspaces | `/workspaces` — isolated bid workspace per tender |
| Compliance checklist | Pass/fail/partial per requirement |
| GO/NO-GO decision | Auto recommendation with rationale |
| Structured proposal export | Section-mapped Word document |
| 50%+ effort reduction | Benchmark panel on each workspace |
| Review/edit/approve | Workspace draft editor with approve → re-index |

## Setup

### 1. Install & configure

```bash
npm install
cp .env.local.example .env.local
# Fill in GEMINI_API_KEY, Supabase keys
```

### 2. Run database schema

Execute **all** of `supabase/schema.sql` in Supabase SQL editor (includes workspaces, bid_history, taxonomy tables).

### 3. Generate sample datasets

```bash
node scripts/generate-sample-datasets.mjs
```

### 4. Start app & seed data

```bash
npm run dev
```

Open http://localhost:3000 → **Library** → click **Seed + index 50 capabilities**

## Demo flow (judges)

1. **Library** → Seed datasets (120 bids, 50 capabilities, 15 criteria)
2. **Analyze** → Upload `sample-data/sample-rfp-it-services.txt`
3. **Workspace opens** with:
   - GO/NO-GO banner
   - Win probability dashboard (7 criteria)
   - NER entities
   - Compliance checklist (pass/fail)
   - Effort reduction benchmark (≥50%)
4. Click **Generate Draft** → AI answers all requirements
5. **Edit & Approve** responses → re-indexes into library
6. **Export Proposal** → structured Word document

## Sample data

| File | Records |
|------|---------|
| `sample-data/bid-history.json` | 120 past bids |
| `sample-data/capability-library.json` | 50 projects |
| `sample-data/evaluation-taxonomy.json` | 15 criteria |
| `sample-data/sample-rfp-it-services.txt` | IT RFP |
| `sample-data/sample-rfp-construction.txt` | Construction RFQ |
| `sample-data/sample-rfp-logistics.txt` | Logistics tender |

## API routes

- `POST /api/seed` — load hackathon datasets
- `POST /api/analyze` — analyze RFP + create workspace
- `GET /api/workspaces` — list workspaces
- `GET /api/workspaces/[id]` — workspace detail
- `POST /api/workspaces/[id]/draft` — generate full draft (SSE)
- `POST /api/workspaces/[id]/export` — structured Word export
- `PATCH /api/workspaces/[id]/responses` — edit/approve response
