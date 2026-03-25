"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import NeonCard from "./components/NeonCard";
import TriageBanner from "./components/TriageBanner";
import EmergencyInstructionsCard from "./components/EmergencyInstructionsCard";
import SectionTitle from "./components/SectionTitle";
import RecommendedNextSteps from "./components/RecommendedNextSteps";
import UncertaintyNotes from "./components/UncertaintyNotes";
import EvidenceCard from "./components/EvidenceCard";
import LoadingSkeleton from "./components/LoadingSkeleton";
import ClinicianSummaryTabs from "./components/ClinicianSummaryTabs";

type ChatResponse = {
  triageLevel: "emergency" | "urgent" | "routine" | "unknown";
  redFlagReasons: string[];
  emergency: boolean;
  emergencyInstructions?: string;
  followUpQuestions: string[];
  education: string;
  recommendedNextSteps: string[];
  uncertaintyNotes: string[];
  clinicianSummary?: string;
  citations: Array<{ sourceId: string; title: string; chunkId: string }>;
  confidence: "high" | "medium" | "low";
};

const API_BASE_FALLBACK = "http://localhost:3001";

export default function Page() {
  const apiBase = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return process.env.NEXT_PUBLIC_API_URL ?? API_BASE_FALLBACK;
  }, []);

  const [mode, setMode] = useState<"consumer" | "clinician">("consumer");
  const [message, setMessage] = useState("");
  const [age, setAge] = useState<string>("");
  const [symptoms, setSymptoms] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [resp, setResp] = useState<ChatResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSend() {
    setBusy(true);
    setError(null);
    try {
      const intake =
        symptoms.trim().length > 0 || age.trim().length > 0
          ? {
              age: age.trim().length ? Number(age) : undefined,
              symptoms: symptoms
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            }
          : undefined;

      const r = await fetch(`${apiBase}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode, message: message.trim(), intake })
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error ? JSON.stringify(data.error) : "Request failed");
      setResp(data as ChatResponse);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <header className="mb-6">
        <NeonCard className="overflow-hidden p-5 md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                MedAssist <span className="text-cyan-300">Futuristic Console</span>
              </h1>
              <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
                Educational medical guidance with triage-first safety. This tool does not provide
                diagnosis and should not replace professional care.
              </p>
            </div>
            <div className="flex items-center gap-3 opacity-90">
              <Image src="/medical/shield.svg" alt="Medical shield icon" width={56} height={56} />
              <Image src="/medical/thermometer.svg" alt="Thermometer icon" width={44} height={44} />
              <Image src="/medical/lungs.svg" alt="Lungs icon" width={52} height={52} />
            </div>
          </div>
          <div className="mt-4">
            <Image
              src="/medical/heartbeat.svg"
              alt="Heartbeat line illustration"
              width={1200}
              height={220}
              className="w-full h-auto opacity-80"
            />
          </div>
        </NeonCard>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <NeonCard className="p-4 md:p-5 h-fit">
          <h2 className="text-sm uppercase tracking-[0.16em] text-cyan-300/90 font-semibold">
            Triage Intake
          </h2>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-slate-400">Mode</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as "consumer" | "clinician")}
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
              >
                <option value="consumer">Consumer</option>
                <option value="clinician">Clinician</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-wide text-slate-400">Symptoms (comma-separated)</span>
              <input
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="chest pain, shortness of breath"
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
              />
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-wide text-slate-400">Age (optional)</span>
              <input
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="45"
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
              />
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-wide text-slate-400">Message</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your question. Avoid sharing personal identifiers."
                className="mt-1 min-h-32 w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
              />
            </label>

            <button
              onClick={onSend}
              disabled={busy || message.trim().length === 0}
              className="w-full rounded-lg bg-cyan-400/90 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-55 disabled:cursor-not-allowed"
            >
              {busy ? "Analyzing..." : "Ask"}
            </button>
          </div>
        </NeonCard>

        <NeonCard className="p-4 md:p-5 transition-all duration-300">
          {!resp && !busy ? (
            <div className="text-sm text-slate-300 leading-relaxed">
              Send a question to view triage guidance, safety recommendations, and evidence cards.
            </div>
          ) : null}

          {busy ? <LoadingSkeleton /> : null}

          {error ? (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          {resp ? (
            <div className="space-y-4">
              <TriageBanner triageLevel={resp.triageLevel} emergency={resp.emergency} confidence={resp.confidence} />

              {resp.redFlagReasons.length > 0 ? (
                <NeonCard className="p-3">
                  <SectionTitle title="Red Flag Reasons" />
                  <ul className="mt-2 space-y-1 text-sm text-slate-100">
                    {resp.redFlagReasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </NeonCard>
              ) : null}

              {resp.emergency && resp.emergencyInstructions ? (
                <EmergencyInstructionsCard text={resp.emergencyInstructions} />
              ) : null}

              <NeonCard className="p-3">
                <SectionTitle title="Education" />
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-100">
                  {resp.education}
                </p>
              </NeonCard>

              <NeonCard className="p-3">
                <RecommendedNextSteps steps={resp.recommendedNextSteps} />
              </NeonCard>

              <NeonCard className="p-3">
                <UncertaintyNotes notes={resp.uncertaintyNotes} />
              </NeonCard>

              {resp.followUpQuestions.length > 0 ? (
                <NeonCard className="p-3">
                  <SectionTitle title="Follow-up Questions" />
                  <ul className="mt-2 space-y-1 text-sm text-slate-100">
                    {resp.followUpQuestions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </NeonCard>
              ) : null}

              {resp.citations.length > 0 ? (
                <section className="space-y-2" aria-label="Evidence citations">
                  <SectionTitle title="Evidence Cards" />
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {resp.citations.map((c) => (
                      <EvidenceCard key={`${c.sourceId}-${c.chunkId}`} citation={c} />
                    ))}
                  </div>
                </section>
              ) : null}

              {mode === "clinician" && resp.clinicianSummary ? (
                <ClinicianSummaryTabs summary={resp.clinicianSummary} />
              ) : null}
            </div>
          ) : null}
        </NeonCard>
      </div>
    </main>
  );
}

