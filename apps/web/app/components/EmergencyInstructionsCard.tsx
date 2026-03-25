"use client";

export default function EmergencyInstructionsCard({
  text
}: {
  text: string;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-[rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.08)] px-4 py-3">
      <div className="text-rose-200 font-semibold tracking-wide">Emergency instructions</div>
      <div className="mt-2 text-sm leading-relaxed text-slate-100">{text}</div>
    </div>
  );
}

