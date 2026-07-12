import { DocumentCategory } from "@/lib/types";

export interface UploadCategoryDef {
  id: DocumentCategory;
  label: string;
  hint: string;
  accept: string;
}

export const UPLOAD_CATEGORIES: UploadCategoryDef[] = [
  {
    id: "contract",
    label: "Contract",
    hint: "The signed agreement, plus any addenda or change orders.",
    accept: ".pdf,.doc,.docx,image/*",
  },
  {
    id: "receipt",
    label: "Receipts & invoices",
    hint: "Material receipts, contractor invoices, permit fee receipts.",
    accept: ".pdf,image/*",
  },
  {
    id: "payment",
    label: "Payment records",
    hint: "Bank transfers, cashed checks, Venmo/Zelle confirmations.",
    accept: ".pdf,image/*",
  },
  {
    id: "photo",
    label: "Job-site photos",
    hint: "Photos of current progress — the more recent, the better.",
    accept: "image/*",
  },
  {
    id: "message",
    label: "Texts & emails",
    hint: "Screenshots or exports of conversations with the contractor.",
    accept: ".pdf,image/*,text/plain",
  },
  {
    id: "permit",
    label: "Permits & inspections",
    hint: "Permit cards, inspection sign-off sheets, lien waivers.",
    accept: ".pdf,image/*",
  },
];
