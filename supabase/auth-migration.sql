-- Run this in Supabase SQL Editor after the base schema.sql
-- Adds per-user isolation for workspaces and capability library chunks

alter table workspaces add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table chunks add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists workspaces_user_id_idx on workspaces(user_id);
create index if not exists chunks_user_id_idx on chunks(user_id);

-- Row Level Security
alter table workspaces enable row level security;
alter table chunks enable row level security;
alter table workspace_responses enable row level security;
alter table bid_history enable row level security;
alter table evaluation_taxonomy enable row level security;
alter table capability_records enable row level security;

-- Workspaces: users manage their own
drop policy if exists "workspaces_select_own" on workspaces;
create policy "workspaces_select_own" on workspaces for select using (auth.uid() = user_id);
drop policy if exists "workspaces_insert_own" on workspaces;
create policy "workspaces_insert_own" on workspaces for insert with check (auth.uid() = user_id);
drop policy if exists "workspaces_update_own" on workspaces;
create policy "workspaces_update_own" on workspaces for update using (auth.uid() = user_id);
drop policy if exists "workspaces_delete_own" on workspaces;
create policy "workspaces_delete_own" on workspaces for delete using (auth.uid() = user_id);

-- Chunks: users manage their own capability library
drop policy if exists "chunks_select_own" on chunks;
create policy "chunks_select_own" on chunks for select using (auth.uid() = user_id);
drop policy if exists "chunks_insert_own" on chunks;
create policy "chunks_insert_own" on chunks for insert with check (auth.uid() = user_id);
drop policy if exists "chunks_update_own" on chunks;
create policy "chunks_update_own" on chunks for update using (auth.uid() = user_id);
drop policy if exists "chunks_delete_own" on chunks;
create policy "chunks_delete_own" on chunks for delete using (auth.uid() = user_id);

-- Workspace responses: via workspace ownership
drop policy if exists "responses_select_own" on workspace_responses;
create policy "responses_select_own" on workspace_responses for select using (
  exists (select 1 from workspaces w where w.id = workspace_id and w.user_id = auth.uid())
);
drop policy if exists "responses_insert_own" on workspace_responses;
create policy "responses_insert_own" on workspace_responses for insert with check (
  exists (select 1 from workspaces w where w.id = workspace_id and w.user_id = auth.uid())
);
drop policy if exists "responses_update_own" on workspace_responses;
create policy "responses_update_own" on workspace_responses for update using (
  exists (select 1 from workspaces w where w.id = workspace_id and w.user_id = auth.uid())
);
drop policy if exists "responses_delete_own" on workspace_responses;
create policy "responses_delete_own" on workspace_responses for delete using (
  exists (select 1 from workspaces w where w.id = workspace_id and w.user_id = auth.uid())
);

-- Shared reference data: read-only for authenticated users
drop policy if exists "bid_history_read" on bid_history;
create policy "bid_history_read" on bid_history for select to authenticated using (true);

drop policy if exists "taxonomy_read" on evaluation_taxonomy;
create policy "taxonomy_read" on evaluation_taxonomy for select to authenticated using (true);

drop policy if exists "capability_records_read" on capability_records;
create policy "capability_records_read" on capability_records for select to authenticated using (true);
