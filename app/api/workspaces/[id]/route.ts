import { NextRequest, NextResponse } from "next/server";
import { getApiAuth } from "@/lib/api-auth";
import {
  deleteWorkspace,
  getWorkspace,
  getWorkspaceResponses,
  updateWorkspace,
} from "@/lib/workspaces";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { auth, error } = await getApiAuth();
    if (error) return error;

    const workspace = await getWorkspace(auth!.supabase, params.id);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const responses = await getWorkspaceResponses(auth!.supabase, params.id);
    return NextResponse.json({ workspace, responses });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get workspace";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { auth, error } = await getApiAuth();
    if (error) return error;

    const body = await request.json();
    const workspace = await updateWorkspace(auth!.supabase, params.id, body);
    return NextResponse.json({ workspace });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update workspace";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { auth, error } = await getApiAuth();
    if (error) return error;

    await deleteWorkspace(auth!.supabase, params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete workspace";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
