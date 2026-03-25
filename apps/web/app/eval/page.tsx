"use client";

import { useMemo, useState } from "react";
import NeonCard from "../components/NeonCard";
import SectionTitle from "../components/SectionTitle";

type EvalResult = {
  caseId: string;
  pass: boolean;
  actual: { triageLevel: string; emergency: boolean; confidence: string; citationsCount: number };
  issues: string[];
};

export default function EvalPage() {
  const apiBase = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  }, []);

  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<EvalResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openCaseId, setOpenCaseId] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`${apiBase}/api/eval/run`, { method: "POST" });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error ? JSON.stringify(data.error) : "Eval failed");
      setResults(data.results as EvalResult[]);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 md:px-6">
      <NeonCard className="p-5">
        <h1 className="text-2xl font-semibold">
          Evaluation <span className="text-cyan-300">Console</span>
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Run the golden + adversarial harness and inspect each case with pass/fail detail.
        </p>
        <button
          onClick={run}
          disabled={busy}
          className="mt-4 rounded-lg bg-cyan-400/90 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-55"
        >
          {busy ? "Running..." : "Run eval suite"}
        </button>
      </NeonCard>

      {error ? (
        <div className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {results ? (
        <section className="mt-5 space-y-3">
          <NeonCard className="p-4">
            <SectionTitle title="Summary" />
            <div className="mt-2 text-sm text-slate-100">
              Total: {results.length} | Passed: {results.filter((r) => r.pass).length} | Failed:{" "}
              {results.filter((r) => !r.pass).length}
            </div>
          </NeonCard>

          {results.map((r) => {
            const open = openCaseId === r.caseId;
            return (
              <NeonCard key={r.caseId} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-slate-100">{r.caseId}</div>
                    <div className="mt-1 text-xs text-slate-300">
                      triage={r.actual.triageLevel}, emergency={String(r.actual.emergency)}, confidence=
                      {r.actual.confidence}, citations={r.actual.citationsCount}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        "rounded-full px-2 py-1 text-xs font-semibold",
                        r.pass ? "bg-lime-400/20 text-lime-200" : "bg-rose-500/20 text-rose-200"
                      ].join(" ")}
                    >
                      {r.pass ? "PASS" : "FAIL"}
                    </span>
                    <button
                      aria-expanded={open}
                      onClick={() => setOpenCaseId(open ? null : r.caseId)}
                      className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:border-cyan-400"
                    >
                      {open ? "Hide details" : "Show details"}
                    </button>
                  </div>
                </div>

                {open ? (
                  <div className="mt-3 rounded-lg bg-slate-900/60 p-3 text-sm text-slate-200">
                    {r.issues.length > 0 ? (
                      <ul className="space-y-1">
                        {r.issues.map((i) => (
                          <li key={i} className="text-rose-200">
                            {i}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-lime-200">No issues for this case.</div>
                    )}
                  </div>
                ) : null}
              </NeonCard>
            );
          })}
        </section>
      ) : null}
    </main>
  );
}

