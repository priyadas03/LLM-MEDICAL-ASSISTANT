"use client";

import type { ReactNode } from "react";

export default function NeonCard({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-2xl border border-[var(--card-border)] bg-[var(--card)] backdrop-blur-md shadow-glow",
        className ?? ""
      ].join(" ")}
    >
      {children}
    </div>
  );
}

