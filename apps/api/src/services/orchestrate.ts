import type { ChatResponse, ChatIntake, ChatMode } from "@medical/shared";
import { ChatResponseSchema, deidentifyText } from "@medical/shared";
import { retrieveForChat } from "./rag.js";

function buildEducation(args: {
  mode: ChatMode;
  intake?: ChatIntake;
  message: string;
  evidenceText: string[];
  confidence: "high" | "medium" | "low";
}) {
  const headline =
    args.mode === "clinician"
      ? "Evidence-based general guidance (not a diagnosis):"
      : "General medical information (not a diagnosis):";

  const evidence = args.evidenceText
    .slice(0, 3)
    .map((t) => `- ${t.replace(/\s+/g, " ").trim()}`)
    .join("\n");

  const caveat =
    args.confidence === "high"
      ? "If symptoms are severe, worsening, or you feel unsafe, seek urgent care."
      : "Because the match to medical guidance is uncertain, consider contacting a clinician for evaluation.";

  return `${headline}\n\n${evidence}\n\n${caveat}`;
}

function buildClinicianSummary(args: {
  intake?: ChatIntake;
  triageLevel: ChatResponse["triageLevel"];
  redFlagReasons: string[];
  citationsCount: number;
}): string {
  const subjectiveBits = [
    args.intake?.age ? `Age: ${args.intake.age}` : null,
    args.intake?.sexAtBirth ? `Sex at birth: ${args.intake.sexAtBirth}` : null,
    args.intake?.pregnant === true ? "Pregnant: yes" : null,
    args.intake?.symptoms?.length ? `Symptoms: ${args.intake.symptoms.join(", ")}` : null,
    args.intake?.conditions?.length ? `Conditions: ${args.intake.conditions.join(", ")}` : null,
    args.intake?.meds?.length ? `Meds: ${args.intake.meds.join(", ")}` : null
  ].filter(Boolean);

  const redFlags =
    args.redFlagReasons.length
      ? args.redFlagReasons.join(" | ")
      : "None detected by safety rules.";

  // Chart-note style output; keep non-diagnostic language.
  return [
    "Chart note (MVP):",
    "Subjective:",
    ...(subjectiveBits.length ? subjectiveBits.map((b) => `- ${b}`) : ["- Not provided"]),
    "",
    "Safety:",
    `- Triage level (deterministic): ${args.triageLevel}`,
    `- Red flags: ${redFlags}`,
    "",
    "Assessment (non-diagnostic):",
    "- Provide evaluation steps consistent with the cited general guidance.",
    "",
    "Plan:",
    "- Follow recommended next steps from the response.",
    `- Evidence chunks cited: ${args.citationsCount}`
  ].join("\n");
}

export async function orchestrateWithRag(args: {
  mode: ChatMode;
  safetyResponse: ChatResponse;
  message: string;
  intake?: ChatIntake;
}): Promise<ChatResponse> {
  const isLikelyRefusal =
    args.safetyResponse.triageLevel === "unknown" &&
    args.safetyResponse.emergency === false &&
    args.safetyResponse.redFlagReasons.length === 0 &&
    args.safetyResponse.citations.length === 0 &&
    args.safetyResponse.confidence === "low";

  if (args.safetyResponse.emergency || isLikelyRefusal) {
    // Safety layer already provides emergency instructions; avoid adding non-essential citations.
    return args.safetyResponse;
  }

  let retrieval: Awaited<ReturnType<typeof retrieveForChat>> | null = null;
  try {
    retrieval = await retrieveForChat({ message: args.message, intake: args.intake });
  } catch {
    // Reliability: if retrieval fails (index missing, file IO issues, etc.), fall back safely.
    return args.safetyResponse;
  }

  if (!retrieval || retrieval.chunks.length === 0) {
    return args.safetyResponse;
  }

  const deidMessage = deidentifyText(args.message);
  const evidenceText = retrieval.chunks.map((c) => c.text);

  const education = buildEducation({
    mode: args.mode,
    intake: args.intake,
    message: deidMessage,
    evidenceText,
    confidence: retrieval.confidence
  });

  const clinicianSummary =
    args.mode === "clinician"
      ? buildClinicianSummary({
          intake: args.intake,
          triageLevel: args.safetyResponse.triageLevel,
          redFlagReasons: args.safetyResponse.redFlagReasons,
          citationsCount: retrieval.citations.length
        })
      : undefined;

  const updated: ChatResponse = ChatResponseSchema.parse({
    ...args.safetyResponse,
    education,
    clinicianSummary,
    citations: retrieval.citations.map((c) => ({ sourceId: c.sourceId, title: c.title, chunkId: c.chunkId })),
    confidence: retrieval.confidence === "high" ? "high" : retrieval.confidence === "medium" ? "medium" : "low"
  });

  return updated;
}

