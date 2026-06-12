import mammoth from "mammoth";

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt"];

export function getFileExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot).toLowerCase() : "";
}

export function isAllowedIngestFile(filename: string): boolean {
  return ALLOWED_EXTENSIONS.includes(getFileExtension(filename));
}

export async function extractTextFromFile(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = getFileExtension(filename);

  switch (ext) {
    case ".pdf":
      return extractPdfText(buffer);
    case ".docx":
    case ".doc":
      return extractDocxText(buffer);
    case ".txt":
      return buffer.toString("utf-8");
    default:
      throw new Error(
        `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`
      );
  }
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text || "";
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value || "";
}
