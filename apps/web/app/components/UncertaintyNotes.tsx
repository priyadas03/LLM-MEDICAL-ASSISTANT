"use client";

import SectionTitle from "./SectionTitle";

export default function UncertaintyNotes({ notes }: { notes: string[] }) {
  if (!notes.length) return null;
  return (
    <section aria-label="Uncertainty notes" className="space-y-2">
      <SectionTitle title="Uncertainty Notes" />
      <ul className="space-y-2">
        {notes.map((s) => (
          <li key={s} className="text-sm text-slate-300 leading-relaxed">
            {s}
          </li>
        ))}
      </ul>
    </section>
  );
}

