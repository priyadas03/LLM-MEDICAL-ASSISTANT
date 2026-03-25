import type { ChatIntake, ChatMode, ChatResponse, TriageLevel } from "../types/chat.js";
import { ChatResponseSchema, type Citation } from "../types/chat.js";
import { detectRedFlags } from "./redFlags.js";
import { detectUnsafeRequest } from "./refusal.js";
import { buildDefaultEducation, getEmergencyInstructions } from "./policy.js";

export type SafetyEnforcementResult = {
  response: ChatResponse;
};

function buildUncertaintyNotes(triageLevel: TriageLevel): string[] {
  const base = [
    "This guidance is informational and not a diagnosis.",
    "If symptoms are worsening, severe, or you feel unsafe, seek appropriate care."
  ];
  if (triageLevel === "unknown") return [...base, "I may be missing critical medical context; share more details if you can."];
  return base;
}

function buildRecommendedNextSteps(triageLevel: TriageLevel, emergency: boolean): string[] {
  if (emergency) {
    return ["Seek emergency care now.", "If possible, have someone stay with you and help monitor symptoms."];
  }
  if (triageLevel === "urgent") {
    return ["Consider urgent medical evaluation today.", "If symptoms worsen, seek emergency care."];
  }
  if (triageLevel === "routine") {
    return ["Share more details (timing, severity, relevant history) for tailored guidance."];
  }
  return ["Share more details so I can assess risk more accurately."];
}

export function enforceSafety(args: {
  mode: ChatMode;
  message: string;
  intake?: ChatIntake;
}): SafetyEnforcementResult {
  const refusal = detectUnsafeRequest({
    mode: args.mode,
    message: args.message,
    intakeText: JSON.stringify(args.intake ?? {})
  });

  if (refusal.shouldRefuse) {
    const education = refusal.safeAlternative ?? "I can’t help with that request.";
    const response = ChatResponseSchema.parse({
      triageLevel: "unknown",
      redFlagReasons: [],
      emergency: false,
      emergencyInstructions: undefined,
      followUpQuestions: [
        "Can you share what you are trying to achieve (for example, understanding symptoms or medication safety)?"
      ],
      education,
      recommendedNextSteps: [
        "Share your goals (education vs medication safety vs symptoms) so I can respond appropriately."
      ],
      uncertaintyNotes: buildUncertaintyNotes("unknown"),
      clinicianSummary: args.mode === "clinician" ? "Safety refusal: policy-based." : undefined,
      citations: [] as Citation[],
      confidence: "low"
    });
    return { response };
  }

  const redFlag = detectRedFlags({ message: args.message, intake: args.intake });
  const emergency = redFlag.emergency;

  const education = buildDefaultEducation({
    mode: args.mode,
    intake: args.intake,
    triageLevel: redFlag.triageLevel
  });

  const emergencyInstructions = emergency
    ? getEmergencyInstructions({ mode: args.mode, emergencyInstructions: redFlag.emergencyInstructions })
    : undefined;

  const response = ChatResponseSchema.parse({
    triageLevel: redFlag.triageLevel,
    redFlagReasons: redFlag.redFlagReasons,
    emergency,
    emergencyInstructions,
    followUpQuestions: redFlag.followUpQuestions,
    education,
    recommendedNextSteps: buildRecommendedNextSteps(redFlag.triageLevel, emergency),
    uncertaintyNotes: buildUncertaintyNotes(redFlag.triageLevel),
    clinicianSummary:
      args.mode === "clinician"
        ? "Triage driven by deterministic safety rules. Provide full clinical context for better guidance."
        : undefined,
    citations: [],
    confidence: emergency ? "medium" : redFlag.triageLevel === "routine" ? "low" : "medium"
  });

  return { response };
}

