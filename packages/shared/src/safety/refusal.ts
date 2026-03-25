import type { ChatMode } from "../types/chat.js";

export type RefusalDecision = {
  shouldRefuse: boolean;
  reason?: string;
  safeAlternative?: string;
};

const refusalPatterns: Array<{
  id: string;
  patterns: string[];
  reason: string;
  // Suggested safer alternative language.
  safeAlternativeConsumer: string;
  safeAlternativeClinician: string;
}> = [
  {
    id: "diagnosis_certainty",
    patterns: ["diagnose", "what is wrong with me", "diagnosis", "definitive", "certainly"],
    reason: "Requests for diagnosis or certainty that the assistant cannot provide.",
    safeAlternativeConsumer:
      "I can’t diagnose you. If you share your symptoms (onset, severity, and any red flags), I can explain possible causes and what to watch for.",
    safeAlternativeClinician:
      "I can’t provide a definitive diagnosis. I can help summarize guideline-based differentials and recommend appropriate next evaluation steps."
  },
  {
    id: "prescribing_dose",
    patterns: [
      "prescribe",
      "prescription",
      "how much",
      "dosage",
      "dose",
      "mg",
      "increase dose",
      "change my dose",
      "titrate"
    ],
    reason: "Requests for medication prescribing or dosage changes that require clinician oversight.",
    safeAlternativeConsumer:
      "I can provide general medication information, but I can’t prescribe or adjust doses. If you want, tell me the medication name and what you’re considering, and I can share safety considerations to discuss with a clinician.",
    safeAlternativeClinician:
      "I can provide general medication safety information (contraindications/typical usage), but I can’t recommend prescribing or dosage changes. Share the clinical context and I can help you check guideline-backed considerations."
  },
  {
    id: "seek_illicit",
    patterns: ["illicit", "illegal drugs", "how to get", "smuggle"],
    reason: "Requests that may facilitate unsafe/illegal actions.",
    safeAlternativeConsumer:
      "I can’t help with unsafe or illegal actions. If you share your underlying health concern, I can help find safer, legal options to get support.",
    safeAlternativeClinician:
      "I can’t assist with unsafe/illegal actions. If you share the clinical concern, I can help with safe, guideline-aligned support options."
  }
];

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

export function detectUnsafeRequest(args: {
  mode: ChatMode;
  message: string;
  // Intake is included to catch cases like "start my meds today".
  intakeText?: string;
}): RefusalDecision {
  const content = normalize([args.message, args.intakeText ?? ""].join(" "));

  for (const rule of refusalPatterns) {
    if (rule.patterns.some((p) => content.includes(normalize(p)))) {
      return {
        shouldRefuse: true,
        reason: rule.reason,
        safeAlternative:
          args.mode === "clinician"
            ? rule.safeAlternativeClinician
            : rule.safeAlternativeConsumer
      };
    }
  }

  return { shouldRefuse: false };
}

