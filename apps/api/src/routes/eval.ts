import express from "express";
import { evalCases } from "../eval/cases.js";
import { runEval } from "../eval/runEval.js";

export const evalRouter = express.Router();

evalRouter.post("/eval/run", async (_req, res) => {
  const results = await runEval(evalCases);
  const passCount = results.filter((r) => r.pass).length;
  res.json({ ok: true, summary: { passCount, total: results.length }, results });
});

