"use client";

import { useEffect, useId } from "react";

export type Citation = { sourceId: string; title: string; chunkId: string };

export default function EvidenceModal({
  open,
  onClose,
  citation
}: {
  open: boolean;
  onClose: () => void;
  citation: Citation | null;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !citation) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
        aria-label="Close evidence details"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[101] w-full max-w-lg rounded-2xl border border-cyan-400/25 bg-slate-900/95 p-5 shadow-glow shadow-cyan-500/10"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold text-slate-100">
            {citation.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
          >
            Close
          </button>
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Source</dt>
            <dd className="text-slate-100">{citation.sourceId}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Chunk</dt>
            <dd className="font-mono text-xs text-slate-300">{citation.chunkId}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          Full passage text is not loaded in this view. When the API exposes chunk retrieval, it
          will appear here for clinician review.
        </p>
      </div>
    </div>
  );
}
