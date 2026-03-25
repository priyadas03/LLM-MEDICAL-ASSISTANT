import type { ChatMode, TriageLevel } from "../types/chat.js";
import type { ChatIntake } from "../types/chat.js";

export type SafetyDecision = {
  triageLevel: TriageLevel;
  emergency: boolean;
  emergencyInstructions?: string;
  redFlagReasons: string[];
  followUpQuestions: string[];
};

export function buildDefaultEducation(args: {
  mode: ChatMode;
  intake?: ChatIntake;
  triageLevel: TriageLevel;
}): string {
  const base =
    "I can provide general medical information, but I’m not a doctor and I can’t diagnose you. If symptoms are severe or worsening, please seek care promptly.";

  if (args.triageLevel === "emergency") {
    return `${base} Based on the symptoms you shared, this may require immediate emergency evaluation.`;
  }

  if (args.triageLevel === "urgent") {
    return `${base} Based on your symptoms, consider urgent medical evaluation today (especially if symptoms are worsening or you feel very unwell).`;
  }

  if (args.triageLevel === "routine") {
    return `${base} If you’d like, share more details (timing, severity, and any relevant history) so I can give more tailored guidance and what to watch for.`;
  }

  return `${base} If you share more details, I can help you think through possible causes and when to seek care.`;
}

export function getEmergencyInstructions(args: {
  mode: ChatMode;
  emergencyInstructions?: string;
}): string {
  // Keep a consistent emergency message across consumer/clinician.
  if (args.emergencyInstructions && args.emergencyInstructions.trim().length > 0) {
    return args.emergencyInstructions;
  }
  return "Please seek emergency care now (call your local emergency number or go to the nearest emergency department).";
}

