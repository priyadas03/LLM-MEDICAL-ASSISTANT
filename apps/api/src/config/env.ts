import dotenv from "dotenv";

dotenv.config();

function getEnv(name: string, fallback?: string): string {
  const v = process.env[name];
  if (v === undefined || v === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 3001),
  LLM_PROVIDER: process.env.LLM_PROVIDER ?? "mock",
  PHI_ENC_KEY: process.env.PHI_ENC_KEY ?? "", // optional until PHI model work
  DATABASE_URL:
    process.env.DATABASE_URL ?? "file:./dev.db",
  SOURCE_INDEX_PATH:
    process.env.SOURCE_INDEX_PATH ?? "./data/vector_index/index.json"
};

export function requireEnv(name: keyof typeof env): string {
  const v = (env as any)[name] as string;
  return getEnv(String(name), v);
}

