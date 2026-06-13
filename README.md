# RFP Autopilot — AI-Powered Bid & Proposal Response Engine

Full hackathon implementation for Procurement, Sourcing & Contract Management.

## Requirements coverage

| Requirement | Implementation |
|-------------|----------------|
| LLM parsing & narrative generation | Gemini 2.5 Flash — requirement extraction, Q&A drafting |
| RAG Capability Library | Company documents in `company-data/` → Gemini embeddings + pgvector |
| NER | Deadlines, budgets, evaluation weights, compliance clauses |
| Win probability scoring | 7-factor model incl. budget, history, competitors |
| Per-RFP workspaces | `/workspaces` — isolated bid workspace per tender |
| Compliance checklist | Pass/fail/partial per requirement |
| GO/NO-GO decision | Auto recommendation with rationale |
| Structured proposal export | Section-mapped Word document |
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

### 3. Customize your company (optional)

Edit files in **`company-data/`** — company profile, case studies, compliance docs, and `bid-history.json`. See `company-data/README.md`.

### 4. Start app & index library

```bash
npm run dev
```

Open http://localhost:3000 → **Library** → **Index company library**

## Demo flow (judges)

1. **Library** → Index company library (7 documents + 12 bid records)
2. **Analyze** → Upload your tender PDF (or a sample RFP from `sample-data/`)
3. **Workspace opens** with GO/NO-GO, win score, compliance checklist
4. **Generate Draft** → grounded answers citing company documents
5. **Edit & Approve** → export proposal

## Data layout

| Location | Contents |
|----------|----------|
| `company-data/*.txt` | Company profile, services, case studies, compliance, CVs |
| `company-data/bid-history.json` | Past bid outcomes (scoring model) |
| `company-data/capability-index.json` | Project metadata (3 reference projects) |
| `sample-data/evaluation-taxonomy.json` | Sector evaluation criteria reference |
| `sample-data/sample-rfp-*.txt` | Short sample tenders for testing |

## API routes

- `POST /api/seed` — index `company-data/` + load bid history
- `POST /api/ingest` — upload additional company documents
- `POST /api/analyze` — analyze RFP + create workspace
- `GET /api/workspaces` — list workspaces
- `POST /api/workspaces/[id]/draft` — generate full draft (SSE)
- `POST /api/workspaces/[id]/export` — structured Word export
