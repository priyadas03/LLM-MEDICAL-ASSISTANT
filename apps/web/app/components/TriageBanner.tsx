"use client";

export default function TriageBanner({
  triageLevel,
  emergency,
  confidence
}: {
  triageLevel: "emergency" | "urgent" | "routine" | "unknown";
  emergency: boolean;
  confidence: "high" | "medium" | "low";
}) {
  const tone =
    emergency || triageLevel === "emergency"
      ? { border: "rgba(248,113,113,0.35)", text: "text-rose-200", label: "Emergency" }
      : triageLevel === "urgent"
        ? { border: "rgba(56,189,248,0.35)", text: "text-cyan-200", label: "Urgent" }
        : triageLevel === "routine"
          ? { border: "rgba(163,230,53,0.28)", text: "text-lime-200", label: "Routine" }
          : { border: "rgba(148,163,184,0.28)", text: "text-slate-200", label: "Unknown" };

  return (
    <div
      className={[
        "relative overflow-hidden rounded-xl border backdrop-blur-md px-4 py-3 shadow-glow",
        tone.text
      ].join(" ")}
      style={{
        borderColor: tone.border,
        backgroundImage: "url('/medical/heartbeat.svg')",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/70 to-slate-950/55"
        aria-hidden
      />
      <div className="relative z-[1]">
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold tracking-wide">{tone.label} triage</div>
          <div className="text-sm opacity-80">Confidence: {confidence}</div>
        </div>
        {triageLevel !== "unknown" ? (
          <div className="mt-1 text-sm opacity-80">Prioritized based on safety rules + available context.</div>
        ) : (
          <div className="mt-1 text-sm opacity-80">More details may change the triage level.</div>
        )}
      </div>
    </div>
  );
}

