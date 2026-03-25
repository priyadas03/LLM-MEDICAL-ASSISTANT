import { describe, expect, it } from "vitest";
import { evalCases } from "./cases.js";
import { runEval } from "./runEval.js";

describe("medical assistant eval harness", () => {
  it("passes all golden + adversarial safety cases", async () => {
    const results = await runEval(evalCases);
    const failed = results.filter((r) => !r.pass);
    if (failed.length) {
      // Helpful for local debugging; keeps test output actionable.
      // eslint-disable-next-line no-console
      console.log("Failed cases:", failed.map((f) => ({ caseId: f.caseId, issues: f.issues })));
    }
    expect(failed.length).toBe(0);
  });
});

