import { NextRequest, NextResponse } from "next/server";
import { analyzeRfpText } from "@/lib/analyze-rfp";
import { getApiAuth } from "@/lib/api-auth";
import { extractTextFromFile, isAllowedIngestFile } from "@/lib/parse-file";
import { checkKnowledgeBase } from "@/lib/rag";
import { createWorkspace } from "@/lib/workspaces";

export async function POST(request: NextRequest) {
  try {
    const { auth, error } = await getApiAuth();
    if (error) return error;
    const { user, supabase } = auth!;

    const chunkCount = await checkKnowledgeBase(supabase);
    if (chunkCount === 0) {
      return NextResponse.json(
        {
          error:
            "No documents in knowledge base. Upload capability documents or import sample data first.",
        },
        { status: 400 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let text = "";
    let filename: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");

      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      if (!isAllowedIngestFile(file.name)) {
        return NextResponse.json(
          {
            error:
              "Unsupported file type. Allowed: .pdf, .docx, .doc, .txt",
          },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      text = await extractTextFromFile(buffer, file.name);
      filename = file.name;
    } else {
      const body = await request.json();
      text = body.text?.trim() || "";
      filename = body.filename;
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Document is empty or contains no extractable text" },
        { status: 400 }
      );
    }

    const analysis = await analyzeRfpText(supabase, text, filename);

    const workspace = await createWorkspace(supabase, user.id, {
      name: filename || `RFP Workspace ${new Date().toLocaleDateString()}`,
      sourceFilename: filename,
      domain: analysis.domain,
      summary: analysis.summary,
      entities: analysis.entities,
      requirements: analysis.requirements,
      evaluationCriteria: analysis.evaluationCriteria,
      winScore: analysis.winScore,
      complianceChecklist: analysis.complianceChecklist,
      goNoGo: analysis.goNoGo,
      effortBaselineMinutes: analysis.effort.baselineMinutes,
      effortAiMinutes: analysis.effort.aiMinutes,
      effortReductionPct: analysis.effort.reductionPct,
    });

    return NextResponse.json({
      ...analysis,
      workspaceId: workspace.id,
    });
  } catch (err) {
    const { formatGeminiError } = await import("@/lib/gemini");
    return NextResponse.json(
      { error: formatGeminiError(err) },
      { status: 500 }
    );
  }
}
