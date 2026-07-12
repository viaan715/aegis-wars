export type ProjectType = "kitchen" | "bathroom";

export type DocumentCategory =
  | "contract"
  | "receipt"
  | "photo"
  | "message"
  | "payment"
  | "permit"
  | "other";

export type PricingTier = "summary" | "full" | "review";

export interface QuestionnaireAnswers {
  contractorName: string;
  contractSignedDate: string;
  totalContractAmount: number | null;
  amountPaidToDate: number | null;
  promisedScope: string[];
  promisedScopeOther: string;
  stageStopped: string;
  lastContactDate: string;
  alreadyTried: string[];
  alreadyTriedOther: string;
  additionalNotes: string;
}

export interface StoredDocument {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  category: DocumentCategory;
  uploadedAt: string;
  storagePath: string;
}

export interface DocumentFacts {
  documentCategory: DocumentCategory;
  dates: { label: string; date: string }[];
  amounts: { label: string; amount: number }[];
  scopeItems: string[];
  promises: string[];
  parties: { contractor?: string; homeowner?: string };
  summary: string;
}

export interface DocumentExtraction {
  documentId: string;
  status: "pending" | "processing" | "complete" | "error" | "skipped";
  facts: DocumentFacts | null;
  error: string | null;
  extractedAt: string | null;
  mocked?: boolean;
}

export interface TimelineEvent {
  date: string;
  label: string;
  source: string;
}

export interface ScopeStageStatus {
  stage: string;
  status: "likely_done" | "in_progress" | "not_started" | "unclear";
  evidence: string[];
}

export interface Financials {
  totalContractAmount: number | null;
  amountPaidToDate: number | null;
  estimatedValueReceived: number | null;
  estimatedValueReceivedPct: number | null;
  likelyOverpaid: boolean;
  overpaymentAmount: number | null;
}

export interface Flag {
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
}

export interface RestartReport {
  generatedAt: string;
  projectType: ProjectType;
  timeline: TimelineEvent[];
  scopeStatus: ScopeStageStatus[];
  financials: Financials;
  missingDocuments: string[];
  questionsForNextContractor: string[];
  flags: Flag[];
  summary: string;
  disclaimer: string;
}

export interface PaymentState {
  tier: PricingTier | null;
  status: "unpaid" | "processing" | "paid";
  stripeSessionId: string | null;
  paidAt: string | null;
}

export interface Project {
  id: string;
  createdAt: string;
  updatedAt: string;
  projectType: ProjectType | null;
  questionnaire: QuestionnaireAnswers | null;
  documents: StoredDocument[];
  extraction: {
    status: "not_started" | "processing" | "complete" | "error";
    perDocument: DocumentExtraction[];
    startedAt: string | null;
    completedAt: string | null;
  };
  report: RestartReport | null;
  payment: PaymentState;
}
