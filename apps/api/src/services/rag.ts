import { retrieve } from "@medical/shared";
import { env } from "../config/env.js";
import type { ChatIntake } from "@medical/shared";

export async function retrieveForChat(args: { message: string; intake?: ChatIntake }) {
  // retrieve() is synchronous but wrapped for future async embedding providers.
  const result = retrieve({
    indexPath: env.SOURCE_INDEX_PATH,
    query: args.message,
    intake: args.intake ? { symptoms: args.intake.symptoms, conditions: args.intake.conditions } : undefined,
    limit: 5,
    minScore: 0.08
  });

  return result;
}

