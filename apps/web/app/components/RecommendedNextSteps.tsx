"use client";

import SectionTitle from "./SectionTitle";

export default function RecommendedNextSteps({ steps }: { steps: string[] }) {
  if (!steps.length) return null;
  return (
    <section aria-label="Recommended next steps" className="space-y-2">
      <SectionTitle title="Recommended Next Steps" />
      <ul className="space-y-2">
        {steps.map((s) => (
          <li key={s} className="flex gap-2 text-sm text-slate-100">
            <span className="mt-1 inline-block h-2 w-2 rounded-full bg-lime-400" />
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

