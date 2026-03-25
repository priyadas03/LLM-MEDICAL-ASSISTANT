import express from "express";
import { z } from "zod";
import { ChatIntakeSchema } from "@medical/shared";

const IntakeValidateBodySchema = z
  .object({
    age: z.number().int().min(0).max(120).optional(),
    sexAtBirth: z.enum(["female", "male", "intersex", "unknown"]).optional(),
    pregnant: z.boolean().optional(),
    symptoms: z.array(z.string().min(1)).optional(),
    meds: z.array(z.string().min(1)).optional(),
    conditions: z.array(z.string().min(1)).optional()
  })
  .strict();

export const intakeRouter = express.Router();

intakeRouter.post("/intake/validate", async (req, res) => {
  const parsed = IntakeValidateBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const validated = ChatIntakeSchema.parse(parsed.data);

  // Minimal cleanup: de-dup & trim list-like fields.
  const cleaned = {
    ...validated,
    symptoms: validated.symptoms?.map((s) => s.trim()).filter(Boolean),
    meds: validated.meds?.map((s) => s.trim()).filter(Boolean),
    conditions: validated.conditions?.map((c) => c.trim()).filter(Boolean)
  };

  res.json({ ok: true, intake: cleaned });
});

