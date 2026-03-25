"use client";

export default function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse" aria-live="polite" aria-busy="true">
      <div className="h-8 rounded-lg bg-slate-700/50" />
      <div className="h-20 rounded-lg bg-slate-700/40" />
      <div className="h-20 rounded-lg bg-slate-700/30" />
      <div className="h-14 rounded-lg bg-slate-700/40" />
    </div>
  );
}

