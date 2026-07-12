import Anthropic from "@anthropic-ai/sdk";
import { DocumentCategory, DocumentFacts, Project, RestartReport } from "./types";

const MODEL = "claude-opus-4-8";

let client: Anthropic | null = null;

export function isClaudeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

const FACTS_TOOL: Anthropic.Tool = {
  name: "record_document_facts",
  description:
    "Record structured facts extracted from a single homeowner renovation document (contract, receipt, photo, message, payment record, or permit).",
  input_schema: {
    type: "object",
    properties: {
      documentCategory: {
        type: "string",
        enum: ["contract", "receipt", "photo", "message", "payment", "permit", "other"],
        description: "What kind of document this actually is, based on its content.",
      },
      dates: {
        type: "array",
        items: {
          type: "object",
          properties: {
            label: { type: "string", description: "What the date refers to, e.g. 'contract signed'" },
            date: { type: "string", description: "ISO 8601 date, YYYY-MM-DD, if determinable" },
          },
          required: ["label", "date"],
          additionalProperties: false,
        },
        description: "Every meaningful date mentioned in the document.",
      },
      amounts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            label: { type: "string", description: "What the amount is for, e.g. 'deposit', 'cabinet materials'" },
            amount: { type: "number", description: "Dollar amount, numeric only" },
          },
          required: ["label", "amount"],
          additionalProperties: false,
        },
        description: "Every dollar amount mentioned.",
      },
      scopeItems: {
        type: "array",
        items: { type: "string" },
        description: "Specific pieces of work or materials mentioned (e.g. 'install quartz countertops', 'replace subfloor').",
      },
      promises: {
        type: "array",
        items: { type: "string" },
        description: "Commitments, guarantees, or promises made by the contractor found in the document.",
      },
      parties: {
        type: "object",
        properties: {
          contractor: { type: "string" },
          homeowner: { type: "string" },
        },
        additionalProperties: false,
        description: "Names or business names identified, if any.",
      },
      summary: {
        type: "string",
        description: "One or two plain-language sentences describing what this document is and what it shows.",
      },
    },
    required: ["documentCategory", "dates", "amounts", "scopeItems", "promises", "parties", "summary"],
    additionalProperties: false,
  },
};

interface FileInput {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}

function buildContentBlocks(file: FileInput): Anthropic.ContentBlockParam[] {
  const blocks: Anthropic.ContentBlockParam[] = [];

  if (file.mimeType.startsWith("image/")) {
    blocks.push({
      type: "image",
      source: {
        type: "base64",
        media_type: file.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
        data: file.buffer.toString("base64"),
      },
    });
  } else if (file.mimeType === "application/pdf") {
    blocks.push({
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: file.buffer.toString("base64"),
      },
    });
  } else {
    const text = file.buffer.toString("utf-8").slice(0, 50_000);
    blocks.push({ type: "text", text });
  }

  blocks.push({
    type: "text",
    text: `The file above is named "${file.filename}". Extract the facts it contains by calling record_document_facts.`,
  });

  return blocks;
}

export async function extractDocumentFacts(
  file: FileInput,
  categoryHint: DocumentCategory
): Promise<DocumentFacts> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 2048,
    system:
      "You extract structured facts from documents related to a homeowner's stalled renovation project (kitchen or bathroom). " +
      "Be precise and conservative: only record what the document actually shows. Do not infer amounts or dates that aren't present. " +
      `The uploader categorized this document as "${categoryHint}", but set documentCategory to what it actually appears to be.`,
    tools: [FACTS_TOOL],
    tool_choice: { type: "tool", name: "record_document_facts" },
    messages: [{ role: "user", content: buildContentBlocks(file) }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) {
    throw new Error("Claude did not return structured facts for this document.");
  }
  return toolUse.input as DocumentFacts;
}

export async function generateReportSummary(
  project: Project,
  facts: DocumentFacts[]
): Promise<string> {
  const context = {
    projectType: project.projectType,
    questionnaire: project.questionnaire,
    extractedFacts: facts,
  };

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1500,
    output_config: { effort: "medium" },
    system:
      "You write plain-language summaries for homeowners whose renovation contractor quit or disappeared mid-project. " +
      "Given structured facts extracted from their documents and their questionnaire answers, write a clear, calm, factual summary " +
      "of what the paperwork shows: what was agreed, what's been paid, what stage things stopped at, and anything that looks off " +
      "(gaps, inconsistencies, missing paperwork). Write 2-4 short paragraphs, plain language, no legalese. " +
      "Do not give legal advice or tell them what legal action to take — describe what the documents show and let them draw conclusions. " +
      "Do not include a disclaimer yourself; one is appended separately.",
    messages: [
      {
        role: "user",
        content: `Here is the project data as JSON:\n\n${JSON.stringify(context, null, 2)}\n\nWrite the summary now.`,
      },
    ],
  });

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );
  return textBlock?.text ?? "";
}

export function mockDocumentFacts(categoryHint: DocumentCategory, filename: string): DocumentFacts {
  return {
    documentCategory: categoryHint,
    dates: [],
    amounts: [],
    scopeItems: [],
    promises: [],
    parties: {},
    summary: `[Mock extraction — ANTHROPIC_API_KEY not configured] Placeholder facts for "${filename}".`,
  };
}

export function mockReportSummary(): string {
  return (
    "[Mock summary — ANTHROPIC_API_KEY not configured] This is a placeholder summary. " +
    "Configure ANTHROPIC_API_KEY to generate a real plain-language summary of your documents."
  );
}

export type { FileInput };
export type RestartReportPartial = Partial<RestartReport>;
