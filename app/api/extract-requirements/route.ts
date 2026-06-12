import { NextRequest, NextResponse } from "next/server";
import { extractRequirements } from "@/lib/extract-requirements";
import { extractTextFromFile, isAllowedIngestFile } from "@/lib/parse-file";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let text = "";

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
    } else {
      const body = await request.json();
      text = body.text?.trim() || "";
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Document is empty or contains no extractable text" },
        { status: 400 }
      );
    }

    const result = await extractRequirements(text);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Requirement extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
