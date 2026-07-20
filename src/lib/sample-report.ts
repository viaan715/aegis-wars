import { DISCLAIMER } from "./report";
import { RestartReport } from "./types";

/**
 * Fictional but realistic Restart Report used on the public /sample page so visitors can see
 * exactly what they'd get before starting their own. Numbers are hand-picked to be internally
 * consistent (financials, flags, and questions all line up), not derived from buildReport.
 */
export const SAMPLE_REPORT: RestartReport = {
  generatedAt: "2026-06-18T16:00:00.000Z",
  projectType: "kitchen",
  timeline: [
    { date: "2026-03-02", label: "Contract signed with ABC Renovations LLC", source: "contract.pdf" },
    { date: "2026-03-18", label: "Demolition completed", source: "text messages.pdf" },
    { date: "2026-04-09", label: "Rough-in inspection referenced in texts", source: "text messages.pdf" },
    { date: "2026-05-05", label: "Cabinet delivery receipt", source: "cabinet_receipt.pdf" },
    { date: "2026-05-12", label: "Last payment made ($10,000)", source: "venmo_export.pdf" },
    { date: "2026-06-10", label: "Last contact with contractor", source: "questionnaire" },
  ],
  scopeStatus: [
    { stage: "Design finalized & permits pulled", status: "likely_done", evidence: [] },
    { stage: "Demolition", status: "likely_done", evidence: [] },
    { stage: "Rough-in (plumbing, electrical, HVAC)", status: "likely_done", evidence: [] },
    { stage: "Drywall & paint", status: "likely_done", evidence: [] },
    { stage: "Cabinet installation", status: "in_progress", evidence: [] },
    { stage: "Countertop template & install", status: "not_started", evidence: [] },
    { stage: "Backsplash", status: "not_started", evidence: [] },
    { stage: "Appliance install & hookup", status: "not_started", evidence: [] },
    { stage: "Flooring", status: "not_started", evidence: [] },
    { stage: "Final punch list & inspection sign-off", status: "not_started", evidence: [] },
  ],
  financials: {
    totalContractAmount: 42_000,
    amountPaidToDate: 38_000,
    estimatedValueReceived: 22_260,
    estimatedValueReceivedPct: 0.53,
    likelyOverpaid: true,
    overpaymentAmount: 15_740,
  },
  costBenchmark: { low: 15_000, high: 60_000 },
  missingDocuments: [
    "Building permit",
    "Lien waivers (for each payment made)",
  ],
  questionsForNextContractor: [
    "Can you confirm exactly what stage the project was left at, in writing?",
    "Are there any change orders or verbal agreements that aren't reflected in the original contract?",
    "Who has keys, code access, or possession of any materials already purchased for the job?",
    "Are there manufacturer warranties on any installed materials or appliances, and are they transferable?",
    "Was the rough-in (plumbing/electrical) inspected and signed off before any walls were closed up?",
    "Was a permit ever pulled for this project? If not, is one required in this jurisdiction?",
    "The paperwork suggests roughly $15,740 was paid beyond the value of work completed — can this be accounted for or credited toward the remaining work?",
    "Were lien waivers signed for prior payments? An unpaid subcontractor or supplier could still file a lien on the property.",
  ],
  flags: [
    {
      severity: "high",
      title: "Possible overpayment",
      detail:
        "Based on the contract value and the stage work stopped at, you may have paid roughly $15,740 more than the value of work completed so far.",
    },
    {
      severity: "medium",
      title: "No permit found",
      detail:
        "This type of project typically requires a permit. Unpermitted work can complicate resale and inspections later.",
    },
    {
      severity: "medium",
      title: "Extended silence from contractor",
      detail: "It's been about 38 days since your last recorded contact with the contractor.",
    },
  ],
  summary:
    "You signed a $42,000 contract with ABC Renovations LLC on March 2, 2026 for a full kitchen renovation. " +
    "Based on your documents and answers, demolition, rough-in plumbing and electrical, and drywall were completed, " +
    "and cabinet installation was underway when the contractor stopped responding.\n\n" +
    "You've paid $38,000 to date — about 90% of the contract total. But the work completed so far represents " +
    "closer to 53% of the full scope, a gap of roughly $15,740 between what's been paid and what's been delivered.\n\n" +
    "No building permit or lien waivers turned up among your uploaded documents, which is worth resolving before " +
    "a new contractor picks up the job — an unpermitted rough-in can mean reopening finished walls for inspection. " +
    "It's been about 38 days since your last recorded contact with ABC Renovations.",
  disclaimer: DISCLAIMER,
};
