import { NextRequest, NextResponse } from "next/server";
import { getApiAuth } from "@/lib/api-auth";
import {
  buildStructuredProposalDoc,
  groupResponsesIntoSections,
} from "@/lib/proposal-export";
import {
  getWorkspace,
  getWorkspaceResponses,
} from "@/lib/workspaces";

export async function POST(
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
    const sections = groupResponsesIntoSections(workspace, responses);
    const buffer = await buildStructuredProposalDoc(workspace, sections);

    const filename = `${workspace.name.replace(/[^a-z0-9]/gi, "_")}_proposal.docx`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
