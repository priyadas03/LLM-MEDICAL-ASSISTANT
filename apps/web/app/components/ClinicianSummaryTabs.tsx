"use client";

import { useMemo, useState } from "react";
import NeonCard from "./NeonCard";

type Section = "subjective" | "safety" | "assessment" | "plan";

function parseSummary(summary: string): Record<Section, string[]> {
  const lines = summary.split("\n").map((x) => x.trim());
  const out: Record<Section, string[]> = {
    subjective: [],
    safety: [],
    assessment: [],
    plan: []
  };

  let current: Section = "subjective";
  for (const l of lines) {
    const lower = l.toLowerCase();
    if (lower.startsWith("subjective:")) {
      current = "subjective";
      continue;
    }
    if (lower.startsWith("safety:")) {
      current = "safety";
      continue;
    }
    if (lower.startsWith("assessment")) {
      current = "assessment";
      continue;
    }
    if (lower.startsWith("plan:")) {
      current = "plan";
      continue;
    }
    if (!l || lower.startsWith("chart note")) continue;
    out[current].push(l.replace(/^- /, ""));
  }

  return out;
}

export default function ClinicianSummaryTabs({ summary }: { summary: string }) {
  const [active, setActive] = useState<Section>("subjective");
  const parsed = useMemo(() => parseSummary(summary), [summary]);

  const tabs: Array<{ id: Section; label: string }> = [
    { id: "subjective", label: "Subjective" },
    { id: "safety", label: "Safety" },
    { id: "assessment", label: "Assessment" },
    { id: "plan", label: "Plan" }
  ];

  return (
    <NeonCard className="p-4">
      <div className="text-sm uppercase tracking-[0.16em] text-cyan-300/90 font-semibold">
        Clinician Summary
      </div>
      <div role="tablist" aria-label="Clinician chart note sections" className="mt-3 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={active === t.id}
            onClick={() => setActive(t.id)}
            className={[
              "rounded-lg px-3 py-1.5 text-xs border transition-colors duration-200",
              active === t.id
                ? "border-cyan-400 bg-cyan-400/15 text-cyan-100"
                : "border-slate-600 text-slate-300 hover:border-cyan-500/60"
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-2 text-sm text-slate-100 leading-relaxed">
        {(parsed[active] ?? []).map((line, idx) => (
          <li key={`${active}-${idx}`} className="flex gap-2">
            <span
              className={[
                "mt-1 inline-block h-2 w-2 rounded-full",
                active === "safety" ? "bg-rose-400" : "bg-cyan-400"
              ].join(" ")}
            />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </NeonCard>
  );
}

