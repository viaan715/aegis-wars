"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Project,
  QuestionnaireAnswers,
  StoredDocument,
} from "@/lib/types";
import { UPLOAD_CATEGORIES } from "./upload-categories";
import {
  ALREADY_TRIED_OPTIONS,
  scopeChecklistFor,
  STAGE_SEQUENCES,
} from "@/lib/project-stages";

const EMPTY_QUESTIONNAIRE: QuestionnaireAnswers = {
  contractorName: "",
  contractSignedDate: "",
  totalContractAmount: null,
  amountPaidToDate: null,
  promisedScope: [],
  promisedScopeOther: "",
  stageStopped: "",
  lastContactDate: "",
  alreadyTried: [],
  alreadyTriedOther: "",
  additionalNotes: "",
};

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function IntakeWizard({ project }: { project: Project }) {
  const router = useRouter();
  const [step, setStep] = useState<"upload" | "questionnaire">("upload");
  const [documents, setDocuments] = useState<StoredDocument[]>(project.documents);
  const [busyCategory, setBusyCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<QuestionnaireAnswers>(
    project.questionnaire ?? EMPTY_QUESTIONNAIRE
  );
  const [submitting, setSubmitting] = useState(false);

  const projectType = project.projectType ?? "kitchen";
  const stages = STAGE_SEQUENCES[projectType];
  const scopeChecklist = useMemo(() => scopeChecklistFor(projectType), [projectType]);

  const docsByCategory = useMemo(() => {
    const map = new Map<string, StoredDocument[]>();
    for (const doc of documents) {
      map.set(doc.category, [...(map.get(doc.category) ?? []), doc]);
    }
    return map;
  }, [documents]);

  async function uploadFiles(category: string, files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusyCategory(category);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("category", category);
      Array.from(files).forEach((f) => fd.append("files", f));
      const res = await fetch(`/api/projects/${project.id}/documents`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      setDocuments(data.documents);
      if (data.rejected?.length) {
        setError(
          data.rejected
            .map((r: { filename: string; reason: string }) => `${r.filename}: ${r.reason}`)
            .join(" ")
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusyCategory(null);
    }
  }

  async function deleteDoc(docId: string) {
    setDocuments((docs) => docs.filter((d) => d.id !== docId));
    await fetch(`/api/projects/${project.id}/documents/${docId}`, { method: "DELETE" });
  }

  function toggleArrayValue(key: "promisedScope" | "alreadyTried", value: string) {
    setForm((f) => {
      const has = f[key].includes(value);
      return {
        ...f,
        [key]: has ? f[key].filter((v) => v !== value) : [...f[key], value],
      };
    });
  }

  const totalDocs = documents.length;

  async function proceedToQuestionnaire() {
    if (totalDocs === 0) {
      setError("Upload at least one document to continue — even just the contract helps.");
      return;
    }
    setError(null);
    setStep("questionnaire");
  }

  async function submitAndProcess() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/questionnaire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Could not save your answers.");
      router.push(`/projects/${project.id}/processing`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  if (step === "upload") {
    return (
      <div>
        <StepHeader
          step={1}
          title="Upload what you have"
          subtitle="Nothing needs to be complete or organized. Partial folders are normal — that's the whole point."
        />
        <div className="mt-8 space-y-4">
          {UPLOAD_CATEGORIES.map((cat) => {
            const docs = docsByCategory.get(cat.id) ?? [];
            return (
              <div
                key={cat.id}
                className="rounded-xl border border-line bg-paper p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-ink">{cat.label}</h3>
                    <p className="text-sm text-ink-soft">{cat.hint}</p>
                  </div>
                  <label className="cursor-pointer rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-soft">
                    {busyCategory === cat.id ? "Uploading…" : "Add files"}
                    <input
                      type="file"
                      multiple
                      accept={cat.accept}
                      className="hidden"
                      disabled={busyCategory !== null}
                      onChange={(e) => uploadFiles(cat.id, e.target.files)}
                    />
                  </label>
                </div>
                {docs.length > 0 && (
                  <ul className="mt-4 divide-y divide-line border-t border-line">
                    {docs.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <span className="truncate text-ink">{doc.filename}</span>
                        <span className="flex items-center gap-3 text-ink-soft">
                          {fmtBytes(doc.sizeBytes)}
                          <button
                            onClick={() => deleteDoc(doc.id)}
                            className="text-coral hover:underline"
                          >
                            Remove
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {error && <p className="mt-4 text-sm text-coral">{error}</p>}

        <div className="mt-8 flex items-center justify-between">
          <span className="text-sm text-ink-soft">
            {totalDocs} file{totalDocs === 1 ? "" : "s"} uploaded
          </span>
          <button
            onClick={proceedToQuestionnaire}
            className="rounded-lg bg-gold px-6 py-3 font-semibold text-on-accent hover:bg-gold-dark"
          >
            Continue to questionnaire →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <StepHeader
        step={2}
        title="A few questions about the project"
        subtitle="This fills gaps the documents can't — takes about 3 minutes."
      />

      <div className="mt-8 space-y-8">
        <Field label="Contractor's name or business">
          <input
            className="input"
            value={form.contractorName}
            onChange={(e) => setForm((f) => ({ ...f, contractorName: e.target.value }))}
            placeholder="e.g. Alvarez Home Renovations"
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Date the contract was signed">
            <input
              type="date"
              className="input"
              value={form.contractSignedDate}
              onChange={(e) => setForm((f) => ({ ...f, contractSignedDate: e.target.value }))}
            />
          </Field>
          <Field label="Date of your last contact with the contractor">
            <input
              type="date"
              className="input"
              value={form.lastContactDate}
              onChange={(e) => setForm((f) => ({ ...f, lastContactDate: e.target.value }))}
            />
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Total contract amount ($)">
            <input
              type="number"
              min={0}
              className="input"
              value={form.totalContractAmount ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  totalContractAmount: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
            />
          </Field>
          <Field label="Amount you've paid so far ($)">
            <input
              type="number"
              min={0}
              className="input"
              value={form.amountPaidToDate ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  amountPaidToDate: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
            />
          </Field>
        </div>

        <Field label="What was promised in the contract? Check everything that applies.">
          <div className="grid gap-2 sm:grid-cols-2">
            {scopeChecklist.map((item) => (
              <label key={item} className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={form.promisedScope.includes(item)}
                  onChange={() => toggleArrayValue("promisedScope", item)}
                  className="h-4 w-4 rounded border-line accent-gold"
                />
                {item}
              </label>
            ))}
          </div>
          <textarea
            className="input mt-3"
            placeholder="Anything else promised that isn't listed above?"
            rows={2}
            value={form.promisedScopeOther}
            onChange={(e) => setForm((f) => ({ ...f, promisedScopeOther: e.target.value }))}
          />
        </Field>

        <Field label="What stage were things at when work stopped?">
          <select
            className="input"
            value={form.stageStopped}
            onChange={(e) => setForm((f) => ({ ...f, stageStopped: e.target.value }))}
          >
            <option value="">Select the closest stage…</option>
            {stages.map((s) => (
              <option key={s.id} value={s.label}>
                {s.label}
              </option>
            ))}
            <option value="Work never started">Work never started</option>
          </select>
        </Field>

        <Field label="What have you already tried? Check everything that applies.">
          <div className="grid gap-2 sm:grid-cols-2">
            {ALREADY_TRIED_OPTIONS.map((item) => (
              <label key={item} className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={form.alreadyTried.includes(item)}
                  onChange={() => toggleArrayValue("alreadyTried", item)}
                  className="h-4 w-4 rounded border-line accent-gold"
                />
                {item}
              </label>
            ))}
          </div>
          <textarea
            className="input mt-3"
            placeholder="Anything else you've tried?"
            rows={2}
            value={form.alreadyTriedOther}
            onChange={(e) => setForm((f) => ({ ...f, alreadyTriedOther: e.target.value }))}
          />
        </Field>

        <Field label="Anything else worth knowing?">
          <textarea
            className="input"
            rows={4}
            placeholder="Disputes, verbal promises, safety concerns, anything that doesn't fit above."
            value={form.additionalNotes}
            onChange={(e) => setForm((f) => ({ ...f, additionalNotes: e.target.value }))}
          />
        </Field>
      </div>

      {error && <p className="mt-4 text-sm text-coral">{error}</p>}

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => setStep("upload")}
          className="text-sm font-medium text-ink-soft hover:text-ink hover:underline"
        >
          ← Back to uploads
        </button>
        <button
          onClick={submitAndProcess}
          disabled={submitting}
          className="rounded-lg bg-gold px-6 py-3 font-semibold text-on-accent hover:bg-gold-dark disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Build my Restart Report →"}
        </button>
      </div>
    </div>
  );
}

function StepHeader({
  step,
  title,
  subtitle,
}: {
  step: number;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <span className="kicker text-coral">Step {step} of 2</span>
      <h1 className="mt-1 font-display text-2xl font-bold text-ink">{title}</h1>
      <p className="mt-1 text-ink-soft">{subtitle}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-ink">{label}</label>
      {children}
    </div>
  );
}
