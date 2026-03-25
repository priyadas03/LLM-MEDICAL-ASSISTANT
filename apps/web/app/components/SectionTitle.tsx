"use client";

export default function SectionTitle({ title }: { title: string }) {
  return (
    <h3 className="text-sm uppercase tracking-[0.16em] text-cyan-300/90 font-semibold">
      {title}
    </h3>
  );
}

