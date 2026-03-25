import express from "express";

export const healthRouter = (() => {
  const router = express.Router();
  router.get("/health", (_req, res) => {
    res.json({ ok: true, service: "medical-assistant-api" });
  });
  return router;
})();

