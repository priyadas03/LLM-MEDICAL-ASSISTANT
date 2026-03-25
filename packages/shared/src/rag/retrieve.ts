import fs from "fs";
import path from "path";
import { tokenize } from "./tokenize.js";
import type { RagIndex, RagRetrievalResult, RagCitation, RagChunk } from "./indexTypes.js";

type IndexCacheEntry = { mtimeMs: number; index: RagIndex };
const indexCache: Record<string, IndexCacheEntry> = {};

function loadIndexCached(indexPath: string): RagIndex {
  const mtimeMs = fs.statSync(indexPath).mtimeMs;
  const cached = indexCache[indexPath];
  if (cached && cached.mtimeMs === mtimeMs) return cached.index;

  const raw = fs.readFileSync(indexPath, "utf8");
  const index = JSON.parse(raw) as RagIndex;
  indexCache[indexPath] = { mtimeMs, index };
  return index;
}

function scoreChunk(queryTokens: string[], chunkTokens: string[]): number {
  if (queryTokens.length === 0) return 0;
  const chunkSet = new Set(chunkTokens);
  let overlap = 0;
  for (const t of queryTokens) {
    if (chunkSet.has(t)) overlap += 1;
  }

  // Slight length normalization.
  return overlap / Math.sqrt(Math.max(1, chunkTokens.length));
}

function scoreChunkVector(query: { tokens: string[]; vector: Record<string, number> }, chunk: { tokens: string[]; vector: Record<string, number> }): number {
  const chunkVec = chunk.vector ?? {};
  const qVec = query.vector ?? {};

  let sum = 0;
  let denom = 0;

  // Compute a simple weighted overlap: sum(min(tf_q, tf_c)) / sqrt(totalTokensInChunk).
  for (const t of Object.keys(qVec)) {
    denom += qVec[t] ?? 0;
    if (chunkVec[t]) {
      sum += Math.min(qVec[t]!, chunkVec[t]!);
    }
  }

  const chunkLen = Object.values(chunkVec).reduce((a, b) => a + b, 0);
  return denom === 0 ? 0 : sum / Math.sqrt(Math.max(1, chunkLen));
}

function buildCitations(chunks: RagChunk[]): RagCitation[] {
  return chunks.map((c) => ({ sourceId: c.sourceId, title: c.title, chunkId: c.chunkId }));
}

function inferCategoriesFromIntake(intake?: { symptoms?: string[]; conditions?: string[] }): string[] {
  const text = [...(intake?.symptoms ?? []), ...(intake?.conditions ?? [])].join(" ").toLowerCase();
  const cats: string[] = [];
  if (/(fever|temperature|hot\b)/.test(text)) cats.push("fever");
  if (/(dehydrat|very thirsty|can't keep|cannot keep fluids|no urine|no urination|vomit)/.test(text)) cats.push("dehydration");
  if (/(diarrh|loose stool|watery stool|stool)/.test(text)) cats.push("diarrhea");
  return [...new Set(cats)];
}

export function retrieve(args: {
  indexPath: string;
  query: string;
  // Optional intake hints used as metadata filters.
  intake?: { symptoms?: string[]; conditions?: string[] };
  limit?: number;
  minScore?: number;
}): RagRetrievalResult {
  const idxAbs = path.resolve(args.indexPath);
  if (!fs.existsSync(idxAbs)) {
    return { citations: [], chunks: [], confidence: "low" };
  }

  const index = loadIndexCached(idxAbs);
  const limit = args.limit ?? 5;
  const minScore = args.minScore ?? 0.08;

  const qTokens = tokenize(args.query);
  const hintTokens = tokenize(
    [...(args.intake?.symptoms ?? []), ...(args.intake?.conditions ?? [])].join(" ")
  );

  const queryTokens = qTokens.length > 0 ? qTokens : hintTokens;

  const qVector: Record<string, number> = {};
  for (const t of queryTokens) qVector[t] = (qVector[t] ?? 0) + 1;

  const categories = inferCategoriesFromIntake(args.intake);
  const filtered =
    categories.length > 0
      ? index.chunks.filter((c) => {
          const cat = c.metadata?.category ?? "";
          return categories.includes(cat);
        })
      : index.chunks;

  const scored = filtered
    .map((c) => ({
      chunk: c,
      score: scoreChunkVector({ tokens: queryTokens, vector: qVector }, { tokens: c.tokens, vector: c.vector })
    }))
    .filter((x) => x.score >= minScore)
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, limit).map((x) => x.chunk);
  const topScore = scored.length > 0 ? scored[0]!.score : 0;

  const confidence: RagRetrievalResult["confidence"] =
    topScore >= 0.22 ? "high" : topScore >= minScore ? "medium" : "low";

  return {
    citations: buildCitations(top),
    chunks: top,
    confidence
  };
}

