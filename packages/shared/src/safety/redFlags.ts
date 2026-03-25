import type { ChatIntake, TriageLevel } from "../types/chat.js";

type RedFlagRule = {
  id: string;
  triage: TriageLevel;
  patterns: string[];
  reasons: string[];
  emergencyInstructions: string;
};

const rules: RedFlagRule[] = [
  {
    id: "chest_pain_sob",
    triage: "emergency",
    patterns: [
      "chest pain",
      "pressure in chest",
      "tightness in chest",
      "shortness of breath",
      "trouble breathing",
      "cannot breathe",
      "severe shortness"
    ],
    reasons: [
      "Possible serious heart or breathing problem described by the symptoms."
    ],
    emergencyInstructions:
      "Please seek emergency care now (call your local emergency number or go to the nearest emergency department)."
  },
  {
    id: "stroke_symptoms",
    triage: "emergency",
    patterns: [
      "face drooping",
      "drooping face",
      "face droop",
      "face droops",
      "droop",
      "droops",
      "slurred speech",
      "slurred",
      "speech is slurred",
      "speech difficulty",
      "speech slurred",
      "weakness on one side",
      "one-sided weakness",
      "arm weakness",
      "stroke"
    ],
    reasons: [
      "Symptoms could indicate stroke or a related neurologic emergency."
    ],
    emergencyInstructions:
      "Please seek emergency care now (call your local emergency number). Time-sensitive treatment may be needed."
  },
  {
    id: "severe_bleeding",
    triage: "emergency",
    patterns: ["severe bleeding", "can't stop bleeding", "heavy bleeding"],
    reasons: ["Possible severe bleeding described."],
    emergencyInstructions:
      "Please seek emergency care now or contact emergency services immediately."
  },
  {
    id: "suicidal_or_self_harm",
    triage: "emergency",
    patterns: [
      "suicidal",
      "want to die",
      "kill myself",
      "self harm",
      "hurt myself",
      "overdose"
    ],
    reasons: ["The message suggests immediate risk of self-harm or suicide."],
    emergencyInstructions:
      "If you are in immediate danger or might act on these thoughts, call your local emergency number now. Otherwise, seek urgent mental health support today."
  },
  {
    id: "high_fever_red",
    triage: "urgent",
    patterns: ["very high fever", "105", "104", "severe fever"],
    reasons: ["A very high fever can be a warning sign, especially with other symptoms."],
    emergencyInstructions:
      "Consider urgent medical evaluation today, especially if there are concerning additional symptoms (confusion, stiff neck, breathing trouble, severe weakness)."
  },
  {
    id: "dehydration",
    triage: "urgent",
    patterns: ["dehydrated", "can't keep fluids", "no urine", "very thirsty"],
    reasons: ["The symptoms may indicate dehydration that can become serious."],
    emergencyInstructions:
      "Seek urgent medical advice today, especially if you cannot keep fluids down or urine output is very low."
  }
];

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

export function detectRedFlags(args: {
  message: string;
  intake?: ChatIntake;
}): {
  triageLevel: TriageLevel;
  redFlagReasons: string[];
  emergency: boolean;
  emergencyInstructions?: string;
  followUpQuestions: string[];
} {
  const content = normalize(
    [args.message, ...(args.intake?.symptoms ?? []), ...(args.intake?.conditions ?? [])].join(
      " "
    )
  );

  const matched: RedFlagRule[] = [];
  for (const rule of rules) {
    if (rule.patterns.some((p) => content.includes(normalize(p)))) {
      matched.push(rule);
    }
  }

  const triagePriority: Record<TriageLevel, number> = {
    emergency: 3,
    urgent: 2,
    routine: 1,
    unknown: 0
  };

  const top =
    matched.length > 0
      ? matched.reduce(
          (a, b) =>
            triagePriority[b.triage] > triagePriority[a.triage] ? b : a,
          matched[0]!
        )
      : null;

  const redFlagReasons = matched.flatMap((r) => r.reasons);
  const emergency = top?.triage === "emergency";
  const triageLevel: TriageLevel = top?.triage ?? "unknown";

  const followUpQuestions: string[] = [];
  if (!top) {
    followUpQuestions.push("How long have the symptoms been going on?");
    followUpQuestions.push("How severe are the symptoms right now (mild, moderate, severe)?");
  } else {
    // Keep questions minimal in emergency/urgent cases.
    followUpQuestions.push("Are you safe right now, and is someone able to help you?");
    followUpQuestions.push("Do you have any of the additional symptoms listed in the reason messages?");
  }

  return {
    triageLevel,
    redFlagReasons,
    emergency,
    emergencyInstructions: top?.emergencyInstructions,
    followUpQuestions
  };
}

