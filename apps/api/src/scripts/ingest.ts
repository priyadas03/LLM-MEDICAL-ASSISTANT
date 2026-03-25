import { env } from "../config/env.js";
import { ingestSources } from "@medical/shared";

import path from "path";
import { fileURLToPath } from "url";

const here = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(here), "../../../../");

const sourcesDir = path.join(repoRoot, "data", "sources");
const outputPath = path.isAbsolute(env.SOURCE_INDEX_PATH)
  ? env.SOURCE_INDEX_PATH
  : path.join(repoRoot, env.SOURCE_INDEX_PATH);

const indexVersion = `local-${new Date().toISOString().slice(0, 10)}`;

async function main() {
  // eslint-disable-next-line no-console
  console.log(`[ingest] sourcesDir=${sourcesDir}`);
  // eslint-disable-next-line no-console
  console.log(`[ingest] outputPath=${outputPath}`);
  ingestSources({
    sourcesDir,
    indexVersion,
    outputPath
  });
  // eslint-disable-next-line no-console
  console.log("[ingest] done");
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

