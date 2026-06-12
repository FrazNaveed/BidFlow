import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { ProposalSection, Workspace, WorkspaceResponse } from "./types";

export function groupResponsesIntoSections(
  workspace: Workspace,
  responses: WorkspaceResponse[]
): ProposalSection[] {
  const sections = new Map<string, ProposalSection>();

  for (const resp of responses) {
    const title = resp.section_title || resp.section_type || "General Response";
    if (!sections.has(title)) {
      sections.set(title, {
        title,
        sectionType: resp.section_type || "question",
        items: [],
      });
    }
    sections.get(title)!.items.push({
      question: resp.question,
      answer: resp.answer || "",
      confidence: resp.confidence || undefined,
      source: resp.sources
        ? JSON.stringify(resp.sources).slice(0, 80)
        : undefined,
    });
  }

  if (sections.size === 0 && workspace.requirements) {
    return [
      {
        title: "Proposal Responses",
        sectionType: "question",
        items: workspace.requirements.map((r) => ({
          question: r.text,
          answer: "",
          status: "pending",
        })),
      },
    ];
  }

  return Array.from(sections.values());
}

export async function buildStructuredProposalDoc(
  workspace: Workspace,
  sections: ProposalSection[]
): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({
      text: "Proposal Response Document",
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: workspace.name,
          bold: true,
          size: 28,
        }),
      ],
      spacing: { after: 100 },
    }),
  ];

  if (workspace.summary) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Executive Summary", bold: true, size: 24 }),
        ],
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: workspace.summary, size: 22 })],
        spacing: { after: 300 },
      })
    );
  }

  if (workspace.go_no_go) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Bid Decision: ${workspace.go_no_go}`,
            bold: true,
            size: 22,
          }),
        ],
        spacing: { after: 100 },
      })
    );
  }

  for (const section of sections) {
    children.push(
      new Paragraph({
        text: section.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    for (const item of section.items) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: item.question, bold: true, size: 22 }),
          ],
          spacing: { before: 200, after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: item.answer || "[Pending response]",
              size: 22,
            }),
          ],
          spacing: { after: 80 },
        })
      );

      if (item.confidence || item.source) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: [item.confidence, item.source].filter(Boolean).join(" · "),
                italics: true,
                size: 18,
                color: "666666",
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}
