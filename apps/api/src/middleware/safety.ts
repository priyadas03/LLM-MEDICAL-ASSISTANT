import type express from "express";
import { ChatRequestSchema, type ChatResponse, type ChatMode, type ChatIntake } from "@medical/shared";
import { enforceSafety } from "@medical/shared";

export type SafetyLocals = {
  mode: ChatMode;
  message: string;
  intake?: ChatIntake;
  safetyResponse: ChatResponse;
};

declare module "express-serve-static-core" {
  interface Locals {
    safety?: SafetyLocals;
  }
}

export function safetyMiddleware() {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const parsed = ChatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: parsed.error.flatten() });
    }

    const { mode, message, intake } = parsed.data;
    const { response } = enforceSafety({ mode, message, intake });

    res.locals.safety = { mode, message, intake, safetyResponse: response };
    return next();
  };
}

