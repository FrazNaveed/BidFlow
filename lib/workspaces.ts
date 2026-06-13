import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ComplianceChecklistItem,
  EvaluationCriterion,
  ExtractedRequirement,
  GoNoGoResult,
  NERResult,
  Workspace,
  WorkspaceResponse,
  WinScoreResult,
} from "./types";

export async function createWorkspace(
  supabase: SupabaseClient,
  userId: string,
  data: {
    name: string;
    sourceFilename?: string;
    domain?: string;
    summary?: string;
    entities?: NERResult;
    requirements?: ExtractedRequirement[];
    evaluationCriteria?: EvaluationCriterion[];
    winScore?: WinScoreResult;
    complianceChecklist?: ComplianceChecklistItem[];
    goNoGo?: GoNoGoResult;
  }
): Promise<Workspace> {
  const { data: row, error } = await supabase
    .from("workspaces")
    .insert({
      user_id: userId,
      name: data.name,
      source_filename: data.sourceFilename,
      domain: data.domain,
      summary: data.summary,
      entities: data.entities,
      requirements: data.requirements,
      evaluation_criteria: data.evaluationCriteria,
      win_score: data.winScore,
      compliance_checklist: data.complianceChecklist,
      go_no_go: data.goNoGo?.decision,
      go_no_go_rationale: data.goNoGo?.rationale,
      status:
        data.goNoGo?.decision === "GO"
          ? "go"
          : data.goNoGo?.decision === "NO-GO"
            ? "no-go"
            : "review",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return row as Workspace;
}

export async function listWorkspaces(supabase: SupabaseClient): Promise<Workspace[]> {
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Workspace[]) ?? [];
}

export async function getWorkspace(
  supabase: SupabaseClient,
  id: string
): Promise<Workspace | null> {
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Workspace;
}

export async function updateWorkspace(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<{
    status: string;
    go_no_go: string;
    go_no_go_rationale: string;
  }>
): Promise<Workspace> {
  const { data, error } = await supabase
    .from("workspaces")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Workspace;
}

export async function deleteWorkspace(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("workspaces").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function saveWorkspaceResponses(
  supabase: SupabaseClient,
  workspaceId: string,
  responses: {
    requirement_id?: string;
    section_type?: string;
    section_title?: string;
    question: string;
    answer?: string;
    confidence?: string;
    win_probability?: number;
    approved?: boolean;
    sources?: unknown;
  }[]
): Promise<void> {
  await supabase.from("workspace_responses").delete().eq("workspace_id", workspaceId);

  if (responses.length === 0) return;

  const { error } = await supabase.from("workspace_responses").insert(
    responses.map((r) => ({
      workspace_id: workspaceId,
      requirement_id: r.requirement_id,
      section_type: r.section_type,
      section_title: r.section_title,
      question: r.question,
      answer: r.answer,
      confidence: r.confidence,
      win_probability: r.win_probability,
      approved: r.approved ?? false,
      sources: r.sources,
    }))
  );

  if (error) throw new Error(error.message);
}

export async function getWorkspaceResponses(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<WorkspaceResponse[]> {
  const { data, error } = await supabase
    .from("workspace_responses")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as WorkspaceResponse[]) ?? [];
}
