import { NextRequest, NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from "docx";

interface AnswerItem {
  question: string;
  answer: string;
  source?: string;
  confidence?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const answers: AnswerItem[] = body.answers;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: "answers array is required" },
        { status: 400 }
      );
    }

    const children: Paragraph[] = [
      new Paragraph({
        text: "RFP Responses",
        heading: HeadingLevel.TITLE,
        spacing: { after: 400 },
      }),
    ];

    for (const item of answers) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: item.question, bold: true, size: 24 }),
          ],
          spacing: { before: 300, after: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: item.answer, size: 22 })],
          spacing: { after: 100 },
        })
      );

      if (item.source || item.confidence) {
        const citation = [item.source, item.confidence]
          .filter(Boolean)
          .join(" · ");
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: citation,
                italics: true,
                size: 18,
                color: "666666",
              }),
            ],
            spacing: { after: 300 },
          })
        );
      }
    }

    const doc = new Document({ sections: [{ children }] });
    const buffer = await Packer.toBuffer(doc);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": 'attachment; filename="rfp-responses.docx"',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
