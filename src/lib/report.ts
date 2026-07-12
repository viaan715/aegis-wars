import { STAGE_SEQUENCES, STANDARD_MISSING_DOC_CHECKLIST } from "./project-stages";
import {
  Financials,
  Flag,
  Project,
  RestartReport,
  ScopeStageStatus,
  TimelineEvent,
} from "./types";

const DISCLAIMER =
  "This report is generated automatically from the documents and answers you provided. " +
  "It is a plain-language summary, not legal advice. For decisions about money owed, contract " +
  "disputes, liens, or possible legal action, consult a licensed attorney in your state.";

const OVERPAYMENT_THRESHOLD = 1.15;
const STALE_CONTACT_DAYS = 21;

function parseDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function buildTimeline(project: Project): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const q = project.questionnaire;

  if (q?.contractSignedDate) {
    events.push({ date: q.contractSignedDate, label: "Contract signed", source: "questionnaire" });
  }
  if (q?.lastContactDate) {
    events.push({
      date: q.lastContactDate,
      label: "Last contact with contractor",
      source: "questionnaire",
    });
  }

  project.extraction.perDocument.forEach((extraction) => {
    const doc = project.documents.find((d) => d.id === extraction.documentId);
    if (!doc || !extraction.facts) return;
    extraction.facts.dates.forEach((d) => {
      if (parseDate(d.date)) {
        events.push({ date: d.date, label: d.label, source: doc.filename });
      }
    });
  });

  return events
    .filter((e) => parseDate(e.date))
    .sort((a, b) => parseDate(a.date)!.getTime() - parseDate(b.date)!.getTime());
}

function buildScopeStatus(project: Project): ScopeStageStatus[] {
  const projectType = project.projectType ?? "kitchen";
  const stages = STAGE_SEQUENCES[projectType];
  const stopped = project.questionnaire?.stageStopped ?? "";

  const allScopeItems = project.extraction.perDocument.flatMap((e) => e.facts?.scopeItems ?? []);

  if (stopped === "Work never started") {
    return stages.map((s) => ({ stage: s.label, status: "not_started", evidence: [] }));
  }

  const stoppedIndex = stages.findIndex((s) => s.label === stopped);

  return stages.map((s, i) => {
    const keywords = s.label
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .split(" ")
      .filter((w) => w.length > 3);
    const evidence = allScopeItems.filter((item) =>
      keywords.some((kw) => item.toLowerCase().includes(kw))
    );

    let status: ScopeStageStatus["status"] = "unclear";
    if (stoppedIndex >= 0) {
      if (i < stoppedIndex) status = "likely_done";
      else if (i === stoppedIndex) status = "in_progress";
      else status = "not_started";
    }

    return { stage: s.label, status, evidence };
  });
}

function buildFinancials(project: Project, scopeStatus: ScopeStageStatus[]): Financials {
  const projectType = project.projectType ?? "kitchen";
  const stages = STAGE_SEQUENCES[projectType];
  const q = project.questionnaire;

  const totalContractAmount = q?.totalContractAmount ?? null;
  const amountPaidToDate = q?.amountPaidToDate ?? null;

  let completedWeight = 0;
  stages.forEach((stage, i) => {
    const status = scopeStatus[i]?.status;
    if (status === "likely_done") completedWeight += stage.valueWeight;
    else if (status === "in_progress") completedWeight += stage.valueWeight * 0.5;
  });

  const estimatedValueReceivedPct = completedWeight;
  const estimatedValueReceived =
    totalContractAmount != null ? Math.round(totalContractAmount * completedWeight) : null;

  const likelyOverpaid =
    amountPaidToDate != null &&
    estimatedValueReceived != null &&
    estimatedValueReceived > 0 &&
    amountPaidToDate > estimatedValueReceived * OVERPAYMENT_THRESHOLD;

  const overpaymentAmount =
    likelyOverpaid && amountPaidToDate != null && estimatedValueReceived != null
      ? Math.round(amountPaidToDate - estimatedValueReceived)
      : null;

  return {
    totalContractAmount,
    amountPaidToDate,
    estimatedValueReceived,
    estimatedValueReceivedPct,
    likelyOverpaid,
    overpaymentAmount,
  };
}

function buildMissingDocuments(project: Project): string[] {
  const categories = new Set(project.documents.map((d) => d.category));
  const allText = project.extraction.perDocument
    .flatMap((e) => [
      e.facts?.summary ?? "",
      ...(e.facts?.scopeItems ?? []),
      ...(e.facts?.promises ?? []),
    ])
    .join(" ")
    .toLowerCase();

  const missing: string[] = [];
  for (const item of STANDARD_MISSING_DOC_CHECKLIST) {
    let found = false;
    switch (item) {
      case "Signed contract":
        found = categories.has("contract");
        break;
      case "Building permit":
        found = categories.has("permit") || allText.includes("permit");
        break;
      case "Change orders (for any work added or altered after the contract was signed)":
        found = allText.includes("change order");
        break;
      case "Lien waivers (for each payment made)":
        found = allText.includes("lien waiver");
        break;
      case "Payment receipts / invoices":
        found = categories.has("receipt") || categories.has("payment");
        break;
      case "Inspection sign-offs":
        found = allText.includes("inspection");
        break;
    }
    if (!found) missing.push(item);
  }
  return missing;
}

function buildQuestions(project: Project, missingDocuments: string[], financials: Financials): string[] {
  const projectType = project.projectType ?? "kitchen";
  const questions = [
    `Can you confirm exactly what stage the ${projectType} was left at, in writing?`,
    "Was the rough-in (plumbing/electrical) inspected and signed off before any walls were closed up?",
    "Are there any change orders or verbal agreements that aren't reflected in the original contract?",
    "Who has keys, code access, or possession of any materials already purchased for the job?",
    "Are there manufacturer warranties on any installed materials or appliances, and are they transferable?",
  ];

  if (missingDocuments.includes("Building permit")) {
    questions.push("Was a permit ever pulled for this project? If not, is one required in this jurisdiction?");
  }
  if (financials.likelyOverpaid && financials.overpaymentAmount) {
    questions.push(
      `The paperwork suggests roughly $${financials.overpaymentAmount.toLocaleString()} was paid beyond the value of work completed — can this be accounted for or credited toward the remaining work?`
    );
  }
  if (missingDocuments.includes("Lien waivers (for each payment made)")) {
    questions.push(
      "Were lien waivers signed for prior payments? An unpaid subcontractor or supplier could still file a lien on the property."
    );
  }

  return questions;
}

function buildFlags(project: Project, financials: Financials, missingDocuments: string[]): Flag[] {
  const flags: Flag[] = [];

  if (financials.likelyOverpaid && financials.overpaymentAmount) {
    flags.push({
      severity: "high",
      title: "Possible overpayment",
      detail: `Based on the contract value and the stage work stopped at, you may have paid roughly $${financials.overpaymentAmount.toLocaleString()} more than the value of work completed so far.`,
    });
  }

  if (missingDocuments.includes("Signed contract")) {
    flags.push({
      severity: "high",
      title: "No signed contract on file",
      detail: "We didn't find a signed contract among your uploads. This is the single most important document for a new contractor and for any dispute.",
    });
  }

  if (missingDocuments.includes("Building permit")) {
    flags.push({
      severity: "medium",
      title: "No permit found",
      detail: "Kitchen and bathroom projects involving plumbing or electrical work typically require a permit. Unpermitted work can complicate resale and inspections later.",
    });
  }

  const lastContact = parseDate(project.questionnaire?.lastContactDate);
  if (lastContact) {
    const daysSince = Math.floor((Date.now() - lastContact.getTime()) / 86_400_000);
    if (daysSince >= STALE_CONTACT_DAYS) {
      flags.push({
        severity: "medium",
        title: "Extended silence from contractor",
        detail: `It's been about ${daysSince} days since your last recorded contact with the contractor.`,
      });
    }
  }

  if (
    (project.questionnaire?.amountPaidToDate ?? 0) > 0 &&
    !project.documents.some((d) => d.category === "receipt" || d.category === "payment")
  ) {
    flags.push({
      severity: "low",
      title: "No payment records uploaded",
      detail: "You indicated payments were made, but no receipts or payment records were uploaded. These help substantiate what you've paid.",
    });
  }

  return flags;
}

export function buildReport(project: Project, summary: string): RestartReport {
  const scopeStatus = buildScopeStatus(project);
  const financials = buildFinancials(project, scopeStatus);
  const missingDocuments = buildMissingDocuments(project);

  return {
    generatedAt: new Date().toISOString(),
    projectType: project.projectType ?? "kitchen",
    timeline: buildTimeline(project),
    scopeStatus,
    financials,
    missingDocuments,
    questionsForNextContractor: buildQuestions(project, missingDocuments, financials),
    flags: buildFlags(project, financials, missingDocuments),
    summary,
    disclaimer: DISCLAIMER,
  };
}
