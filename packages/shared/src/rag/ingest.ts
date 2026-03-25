import fs from "fs";
import path from "path";
import { tokenize } from "./tokenize.js";
import { chunkText } from "./chunk.js";
import type { RagIndex, RagChunk } from "./indexTypes.js";

function safeChunkId(sourceId: string, idx: number): string {
  return `${sourceId}#${idx}`;
}

function inferCategoryFromFilename(filename: string): string {
  const base = filename.toLowerCase();
  if (base.includes("fever")) return "fever";
  if (base.includes("dehydrat")) return "dehydration";
  if (base.includes("diarrhea") || base.includes("diarr")) return "diarrhea";
  return "general";
}

function readTextFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}

export function ingestSources(args: {
  sourcesDir: string;
  indexVersion: string;
  outputPath: string;
}): RagIndex {
  const files = fs
    .readdirSync(args.sourcesDir, { withFileTypes: true })
    .filter((f) => f.isFile() && (f.name.endsWith(".md") || f.name.endsWith(".txt")));

  const chunks: RagChunk[] = [];

  for (const f of files) {
    const full = path.join(args.sourcesDir, f.name);
    const text = readTextFile(full);
    const sourceId = f.name.replace(/\.(md|txt)$/i, "");
    const title = f.name;
    const category = inferCategoryFromFilename(f.name);

    const pieces = chunkText(text, { maxChars: 700 });
    pieces.forEach((piece, idx) => {
      const tokenList = tokenize(piece);
      const tokenCounts: Record<string, number> = {};
      for (const t of tokenList) {
        tokenCounts[t] = (tokenCounts[t] ?? 0) + 1;
      }
      chunks.push({
        chunkId: safeChunkId(sourceId, idx),
        sourceId,
        title,
        text: piece,
        metadata: { category },
        tokens: tokenList,
        vector: tokenCounts,
        sourceVersion: args.indexVersion
      });
    });
  }

  const index: RagIndex = {
    indexVersion: args.indexVersion,
    createdAtISO: new Date().toISOString(),
    chunks
  };

  fs.mkdirSync(path.dirname(args.outputPath), { recursive: true });
  fs.writeFileSync(args.outputPath, JSON.stringify(index, null, 2), "utf8");
  return index;
}

