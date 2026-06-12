create extension if not exists vector;

-- Capability library chunks (RAG)
create table if not exists chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  embedding vector(1536),
  source_file text,
  chunk_index int,
  approved boolean default false,
  created_at timestamp default now()
);

create index if not exists chunks_embedding_idx on chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create or replace function match_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  source_file text,
  similarity float
)
language sql stable
as $$
  select
    id,
    content,
    source_file,
    1 - (embedding <=> query_embedding) as similarity
  from chunks
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- Per-RFP/Tender workspaces
create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  source_filename text,
  domain text,
  status text default 'active',
  summary text,
  entities jsonb,
  requirements jsonb,
  evaluation_criteria jsonb,
  win_score jsonb,
  compliance_checklist jsonb,
  go_no_go text,
  go_no_go_rationale text,
  effort_baseline_minutes int,
  effort_ai_minutes int,
  effort_reduction_pct numeric,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Draft responses per workspace
create table if not exists workspace_responses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  requirement_id text,
  section_type text,
  section_title text,
  question text not null,
  answer text,
  confidence text,
  win_probability int,
  approved boolean default false,
  sources jsonb,
  created_at timestamp default now()
);

create index if not exists workspace_responses_workspace_idx on workspace_responses(workspace_id);

-- Historical bid outcomes (120 past bids)
create table if not exists bid_history (
  id uuid primary key default gen_random_uuid(),
  bid_id text unique,
  domain text,
  sector text,
  outcome text,
  evaluation_score numeric,
  contract_value numeric,
  our_bid_value numeric,
  competitor_count int,
  year int,
  created_at timestamp default now()
);

-- Evaluation criteria taxonomy
create table if not exists evaluation_taxonomy (
  id uuid primary key default gen_random_uuid(),
  sector text,
  criterion text,
  typical_weight text,
  description text
);

-- Structured capability library metadata
create table if not exists capability_records (
  id uuid primary key default gen_random_uuid(),
  project_name text,
  summary text,
  certifications text,
  year_completed int,
  contract_value numeric,
  duration_months int,
  client_type text,
  domain text,
  created_at timestamp default now()
);
