import { z } from "zod";

export type TriageLevel = "emergency" | "urgent" | "routine" | "unknown";

export const ChatModeSchema = z.enum(["consumer", "clinician"]);
export type ChatMode = z.infer<typeof ChatModeSchema>;

export const ChatIntakeSchema = z
  .object({
    age: z.number().int().min(0).max(120).optional(),
    sexAtBirth: z.enum(["female", "male", "intersex", "unknown"]).optional(),
    pregnant: z.boolean().optional(),
    symptoms: z.array(z.string().min(1)).optional(),
    meds: z.array(z.string().min(1)).optional(),
    conditions: z.array(z.string().min(1)).optional()
  })
  .strict();

export type ChatIntake = z.infer<typeof ChatIntakeSchema>;

export const CitationSchema = z
  .object({
    sourceId: z.string(),
    title: z.string(),
    chunkId: z.string()
  })
  .strict();

export type Citation = z.infer<typeof CitationSchema>;

export const ChatResponseSchema = z
  .object({
    triageLevel: z.enum(["emergency", "urgent", "routine", "unknown"]),
    redFlagReasons: z.array(z.string()),
    emergency: z.boolean(),
    emergencyInstructions: z.string().optional(),
    followUpQuestions: z.array(z.string()),
    education: z.string(),
    recommendedNextSteps: z.array(z.string()),
    uncertaintyNotes: z.array(z.string()),
    clinicianSummary: z.string().optional(),
    citations: z.array(CitationSchema),
    confidence: z.enum(["high", "medium", "low"])
  })
  .strict();

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

export const ChatRequestSchema = z
  .object({
    mode: ChatModeSchema,
    // In a real deployment these come from auth; kept optional for MVP.
    userId: z.string().optional(),
    conversationId: z.string().optional(),
    message: z.string().min(1),
    intake: ChatIntakeSchema.optional()
  })
  .strict();

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

