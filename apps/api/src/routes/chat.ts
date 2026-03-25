import express from "express";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import {
  encryptString,
  deidentifyText,
  type Role,
  isRoleAllowedForMode
} from "@medical/shared";
import { safetyMiddleware } from "../middleware/safety.js";
import { orchestrateWithRag } from "../services/orchestrate.js";

export const chatRouter = express.Router();

function parseDemoRole(req: express.Request): Role | null {
  const raw = String(req.headers["x-demo-role"] ?? req.headers["x-user-role"] ?? "").toLowerCase();
  if (raw === "consumer" || raw === "clinician" || raw === "admin") return raw as Role;
  return null;
}

async function getOrCreateUser(role: Role) {
  const user =
    (await prisma.user.findFirst({ where: { role }, select: { id: true } })) ??
    (await prisma.user.create({ data: { role } }));

  // MVP: default to storing PHI long-term (as requested), but keep this logic isolated
  // so later we can wire consent settings from the UI.
  const consent = await prisma.consent.upsert({
    where: { userId: user.id },
    update: { storePHI: true },
    create: { userId: user.id, storePHI: true }
  });

  return { userId: user.id as string, storePHI: consent.storePHI };
}

function buildStoragePayload(args: { message: string; intake: unknown }) {
  return JSON.stringify(
    {
      message: args.message,
      intake: args.intake
    },
    null,
    0
  );
}

chatRouter.post("/chat", safetyMiddleware(), async (req, res) => {
  const locals = res.locals.safety;
  if (!locals) {
    return res.status(500).json({ ok: false, error: "Safety middleware did not run." });
  }

  const { mode, message, intake, safetyResponse } = locals;
  const finalResponse = await orchestrateWithRag({
    mode,
    safetyResponse,
    message,
    intake
  });

  const role = parseDemoRole(req) ?? "consumer";
  if (!isRoleAllowedForMode({ role, mode })) {
    return res.status(403).json({ ok: false, error: "Role not allowed for this mode." });
  }

  const { userId, storePHI } = await getOrCreateUser(role);
  const conversation = await prisma.conversation.create({
    data: {
      userId,
      mode
    }
  });
  const plaintext = buildStoragePayload({ message, intake });
  const deidentified = deidentifyText(plaintext);
  const contentEncrypted =
    storePHI && env.PHI_ENC_KEY && env.PHI_ENC_KEY.trim().length > 0
      ? encryptString(plaintext, env.PHI_ENC_KEY)
      : undefined;

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderRole: "user",
      contentEncrypted,
      contentDeidentified: deidentified
    }
  });
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderRole: "assistant",
      contentEncrypted:
        storePHI && env.PHI_ENC_KEY && env.PHI_ENC_KEY.trim().length > 0
          ? encryptString(finalResponse.education, env.PHI_ENC_KEY)
          : undefined,
      contentDeidentified: deidentifyText(finalResponse.education)
    }
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action:
        finalResponse.triageLevel === "unknown" &&
        finalResponse.emergency === false &&
        finalResponse.redFlagReasons.length === 0 &&
        finalResponse.confidence === "low"
          ? "chat.refusal"
          : "chat.responded",
      meta: JSON.stringify({
        triageLevel: finalResponse.triageLevel,
        redFlagReasons: finalResponse.redFlagReasons,
        citations: finalResponse.citations
      })
    }
  });

  return res.json(finalResponse);
});

