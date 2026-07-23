"use client";

import { useRef, useState, type DragEvent } from "react";

const ACCEPT = ".csv,.json,.jsonl,.ndjson";

export function UploadDropzone({
  onFile,
  disabled,
  fileName,
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
  fileName?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      aria-disabled={disabled}
      className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors"
      style={{
        borderColor: dragging ? "var(--series-1)" : "var(--border)",
        background: dragging ? "color-mix(in srgb, var(--series-1) 6%, var(--surface-1))" : "var(--surface-1)",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[var(--text-muted)]">
        <path
          d="M12 15V4m0 0L8 8m4-4 4 4M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {fileName ? fileName : "Drop a CSV or JSON dataset here"}
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">or click to browse · .csv, .json, .jsonl · up to 15MB</p>
      </div>
    </div>
  );
}
