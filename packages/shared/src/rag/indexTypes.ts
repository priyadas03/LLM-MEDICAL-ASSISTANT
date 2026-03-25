export type RagChunk = {
  chunkId: string;
  sourceId: string;
  title: string;
  text: string;
  // Simple metadata derived during ingestion.
  metadata: Record<string, string>;
  // Lightweight vector representation: token frequency counts.
  vector: Record<string, number>;
  tokens: string[];
  // Used for reproducibility when sources are re-ingested.
  sourceVersion: string;
};

export type RagIndex = {
  indexVersion: string;
  createdAtISO: string;
  chunks: RagChunk[];
};

export type RagCitation = {
  sourceId: string;
  title: string;
  chunkId: string;
};

export type RagRetrievalResult = {
  citations: RagCitation[];
  chunks: RagChunk[];
  confidence: "high" | "medium" | "low";
};

