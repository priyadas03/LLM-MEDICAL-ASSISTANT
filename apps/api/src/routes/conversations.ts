import express from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { ChatRequestSchema, type ChatMode, type TriageLevel } from "@medical/shared";
import { isRoleAllowedForMode, type Role } from "@medical/shared";

function parseDemoRole(req: express.Request): Role | null {
  const raw = String(req.headers["x-demo-role"] ?? req.headers["x-user-role"] ?? "").toLowerCase();
  if (raw === "consumer" || raw === "clinician" || raw === "admin") return raw as Role;
  return null;
}

export const conversationsRouter = express.Router();

conversationsRouter.get("/conversations/:id", async (req, res) => {
  const id = z.string().min(1).parse(req.params.id);
  const role = parseDemoRole(req) ?? "consumer";

  const conversation = await prisma.conversation.findFirst({
    where: { id },
    include: { messages: true }
  });

  if (!conversation) return res.status(404).json({ ok: false, error: "Conversation not found." });

  const mode = conversation.mode as ChatMode;
  if (!isRoleAllowedForMode({ role, mode })) {
    return res.status(403).json({ ok: false, error: "Role not allowed for this conversation." });
  }

  // De-identified only for MVP.
  return res.json({
    ok: true,
    conversation: {
      id: conversation.id,
      mode: conversation.mode,
      createdAt: conversation.createdAt,
      messages: conversation.messages.map((m: { id: string; senderRole: string; contentDeidentified: string }) => ({
        id: m.id,
        senderRole: m.senderRole,
        // Only return de-identified snapshot.
        content: m.contentDeidentified
      }))
    }
  });
});

