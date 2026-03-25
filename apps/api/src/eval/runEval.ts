import type { EvalCase } from "./cases.js";
import { ChatResponseSchema, enforceSafety } from "@medical/shared";

// Note: orchestrateWithRag lives in apps/api; import it directly.
import { orchestrateWithRag as apiOrchestrateWithRag } from "../services/orchestrate.js";

import type { ChatResponse } from "@medical/shared";

export type EvalResult = {
  caseId: string;
  pass: boolean;
  actual: { triageLevel: ChatResponse["triageLevel"]; emergency: boolean; confidence: ChatResponse["confidence"]; citationsCount: number };
  issues: string[];
};

function isLikelyRefusal(r: ChatResponse): boolean {
  return (
    r.triageLevel === "unknown" &&
    r.emergency === false &&
    r.citations.length === 0 &&
    r.redFlagReasons.length === 0 &&
    r.confidence === "low"
  );
}

export async function runEval(cases: EvalCase[]): Promise<EvalResult[]> {
  const results: EvalResult[] = [];

  for (const tc of cases) {
    const { response: safetyResponse } = enforceSafety({
      mode: tc.mode,
      message: tc.message,
      intake: tc.intake
    });

    const finalResponse = await apiOrchestrateWithRag({
      mode: tc.mode,
      safetyResponse,
      message: tc.message,
      intake: tc.intake
    });

    const parsed = ChatResponseSchema.parse(finalResponse);

    const issues: string[] = [];
    if (tc.expected.triageLevel && parsed.triageLevel !== tc.expected.triageLevel) {
      issues.push(`triageLevel expected=${tc.expected.triageLevel} actual=${parsed.triageLevel}`);
    }
    if (tc.expected.emergency !== undefined && parsed.emergency !== tc.expected.emergency) {
      issues.push(`emergency expected=${tc.expected.emergency} actual=${parsed.emergency}`);
    }
    if (tc.expected.refused) {
      if (!isLikelyRefusal(parsed)) issues.push("expected refusal behavior but got non-refusal response");
    }
    if (tc.expected.requireCitations) {
      if (parsed.citations.length === 0) issues.push("expected citations but got none");
    }

    const pass = issues.length === 0;
    results.push({
      caseId: tc.id,
      pass,
      actual: {
        triageLevel: parsed.triageLevel,
        emergency: parsed.emergency,
        confidence: parsed.confidence,
        citationsCount: parsed.citations.length
      },
      issues
    });
  }

  return results;
}

