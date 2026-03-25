"use client";

import { useState } from "react";
import EvidenceModal from "./EvidenceModal";

type Citation = { sourceId: string; title: string; chunkId: string };

const cardBtn =
  "w-full text-left rounded-2xl border border-[var(--card-border)] bg-[var(--card)] backdrop-blur-md shadow-glow p-3 transition-transform duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80";

export default function EvidenceCard({ citation }: { citation: Citation }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cardBtn}>
        <span className="text-sm font-medium text-slate-100">{citation.title}</span>
        <span className="mt-1 block text-xs text-slate-300/80">Source: {citation.sourceId}</span>
        <span className="block text-xs text-slate-400">Chunk: {citation.chunkId}</span>
        <span className="mt-2 block text-xs text-cyan-300/90">Open details</span>
      </button>
      <EvidenceModal open={open} onClose={() => setOpen(false)} citation={citation} />
    </>
  );
}

