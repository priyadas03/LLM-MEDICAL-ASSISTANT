import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.js";
import { chatRouter } from "./routes/chat.js";
import { intakeRouter } from "./routes/intake.js";
import { conversationsRouter } from "./routes/conversations.js";
import { authRouter } from "./routes/auth.js";
import { evalRouter } from "./routes/eval.js";

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  // Observability (MVP): log method/path + latency for each request.
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const ms = Date.now() - start;
      // eslint-disable-next-line no-console
      console.log(`[api] ${req.method} ${req.path} -> ${res.statusCode} (${ms}ms)`);
    });
    next();
  });

  app.use(healthRouter);
  app.use("/api", chatRouter);
  app.use("/api", intakeRouter);
  app.use("/api", conversationsRouter);
  app.use("/api", authRouter);
  app.use("/api", evalRouter);

  // Basic error handler to avoid leaking internals.
  app.use((err: any, _req: express.Request, res: express.Response, _next: any) => {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  });

  // In the future, add audit/security headers.
  if (env.NODE_ENV === "production") {
    app.disable("x-powered-by");
  }

  return app;
}

