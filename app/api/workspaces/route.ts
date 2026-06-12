import { NextResponse } from "next/server";
import { getApiAuth } from "@/lib/api-auth";
import { listWorkspaces } from "@/lib/workspaces";

export async function GET() {
  try {
    const { auth, error } = await getApiAuth();
    if (error) return error;

    const workspaces = await listWorkspaces(auth!.supabase);
    return NextResponse.json({ workspaces });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list workspaces";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
