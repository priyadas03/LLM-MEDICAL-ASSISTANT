import express from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { type Role } from "@medical/shared";

export const authRouter = express.Router();

const seedBodySchema = z
  .object({
    role: z.enum(["consumer", "clinician", "admin"])
  })
  .strict();

authRouter.post("/auth/seed", async (req, res) => {
  const parsed = seedBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const role = parsed.data.role as Role;
  const user = await prisma.user.create({ data: { role } });
  await prisma.consent.create({
    data: { userId: user.id, storePHI: true }
  }).catch(() => undefined);

  res.json({ ok: true, userId: user.id, role });
});

