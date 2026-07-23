import Papa from "papaparse";
import type { ParseIssue, ParseResult, ParsedRecord, SourceFormat } from "./types";

const TEXT_FIELD_PRIORITY = [
  "text",
  "content",
  "completion",
  "output",
  "response",
  "answer",
  "prompt",
  "input",
  "message",
  "body",
  "summary",
  "instruction",
];

function pickTextField(fields: string[], records: Record<string, unknown>[]): string | null {
  const lowerToActual = new Map(fields.map((f) => [f.toLowerCase(), f]));
  for (const candidate of TEXT_FIELD_PRIORITY) {
    const actual = lowerToActual.get(candidate);
    if (actual) return actual;
  }

  // Fall back to the string field with the greatest average length.
  let best: string | null = null;
  let bestAvg = -1;
  for (const field of fields) {
    let total = 0;
    let count = 0;
    for (const record of records) {
      const value = record[field];
      if (typeof value === "string") {
        total += value.length;
        count++;
      }
    }
    if (count === 0) continue;
    const avg = total / count;
    if (avg > bestAvg) {
      bestAvg = avg;
      best = field;
    }
  }
  return best;
}

function recordToText(record: Record<string, unknown>, textField: string | null): string {
  if (textField && typeof record[textField] === "string") {
    return record[textField] as string;
  }
  if (textField && record[textField] != null) {
    return String(record[textField]);
  }
  return Object.values(record)
    .filter((v) => v != null)
    .map((v) => (typeof v === "string" ? v : JSON.stringify(v)))
    .join(" ");
}

function buildParsedRecords(
  rawRecords: Record<string, unknown>[]
): { records: ParsedRecord[]; fields: string[]; textField: string | null } {
  const fieldSet = new Set<string>();
  for (const r of rawRecords) {
    for (const k of Object.keys(r)) fieldSet.add(k);
  }
  const fields = Array.from(fieldSet);
  const textField = pickTextField(fields, rawRecords);

  const records: ParsedRecord[] = rawRecords.map((raw, index) => ({
    index,
    raw,
    text: recordToText(raw, textField),
  }));

  return { records, fields, textField };
}

function parseJson(raw: string): { data: Record<string, unknown>[]; issues: ParseIssue[] } {
  const issues: ParseIssue[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return parseJsonl(raw);
  }

  let array: unknown[];
  if (Array.isArray(parsed)) {
    array = parsed;
  } else if (parsed && typeof parsed === "object") {
    const arrayProp = Object.values(parsed as Record<string, unknown>).find((v) => Array.isArray(v));
    if (arrayProp) {
      array = arrayProp as unknown[];
    } else {
      array = [parsed];
    }
  } else {
    throw new Error("JSON file must contain an array or object of records.");
  }

  const data: Record<string, unknown>[] = [];
  array.forEach((item, i) => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      data.push(item as Record<string, unknown>);
    } else {
      data.push({ value: item });
      issues.push({ index: i, message: "Record is not a JSON object; wrapped as { value }." });
    }
  });

  return { data, issues };
}

function parseJsonl(raw: string): { data: Record<string, unknown>[]; issues: ParseIssue[] } {
  const issues: ParseIssue[] = [];
  const data: Record<string, unknown>[] = [];
  const lines = raw.split(/\r?\n/);
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const obj = JSON.parse(trimmed);
      if (obj && typeof obj === "object" && !Array.isArray(obj)) {
        data.push(obj);
      } else {
        data.push({ value: obj });
      }
    } catch {
      issues.push({ index: i, message: "Line is not valid JSON and was skipped." });
    }
  });
  if (data.length === 0) {
    throw new Error("No valid JSON records found (checked JSON array and JSON Lines formats).");
  }
  return { data, issues };
}

function parseCsv(raw: string): { data: Record<string, unknown>[]; issues: ParseIssue[] } {
  const issues: ParseIssue[] = [];
  const result = Papa.parse<Record<string, unknown>>(raw, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  result.errors.forEach((err) => {
    issues.push({ index: err.row ?? -1, message: err.message });
  });

  if (result.data.length === 0) {
    throw new Error("CSV file contains no data rows.");
  }

  return { data: result.data, issues };
}

export function parseDataset(raw: string, fileName: string): ParseResult {
  const lower = fileName.toLowerCase();
  const looksJson = lower.endsWith(".json") || lower.endsWith(".jsonl") || lower.endsWith(".ndjson");
  const isJsonl = lower.endsWith(".jsonl") || lower.endsWith(".ndjson");

  let format: SourceFormat;
  let parsed: { data: Record<string, unknown>[]; issues: ParseIssue[] };

  if (isJsonl) {
    format = "jsonl";
    parsed = parseJsonl(raw);
  } else if (looksJson) {
    format = "json";
    parsed = parseJson(raw);
  } else if (lower.endsWith(".csv")) {
    format = "csv";
    parsed = parseCsv(raw);
  } else {
    const trimmed = raw.trimStart();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      format = "json";
      parsed = parseJson(raw);
    } else {
      format = "csv";
      parsed = parseCsv(raw);
    }
  }

  const { records, fields, textField } = buildParsedRecords(parsed.data);

  return {
    records,
    fields,
    textField,
    format,
    issues: parsed.issues,
  };
}
