export function chunkText(text: string, opts?: { maxChars?: number }): string[] {
  const maxChars = opts?.maxChars ?? 700;
  const paras = text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const p of paras) {
    if (current.length + p.length + 1 <= maxChars) {
      current = current ? `${current}\n\n${p}` : p;
      continue;
    }

    if (current) chunks.push(current);
    current = p;
  }

  if (current) chunks.push(current);
  return chunks;
}

