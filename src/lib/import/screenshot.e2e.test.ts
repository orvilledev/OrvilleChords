import { describe, expect, it } from "vitest";
import { ocrLinesToChordPro, pageToOcrLines } from "./screenshot";

/**
 * Real-OCR integration test. Runs Tesseract in Node against a rendered chord
 * chart image, so it needs network access for the language data on first run.
 * Enable with: OCR_E2E=1 (and OCR_E2E_IMAGE=<path to png>).
 */
describe.runIf(process.env.OCR_E2E)("screenshot import (real OCR)", () => {
  it("reads a rendered chart into ChordPro with correct chord placement", async () => {
    const { createWorker, PSM } = await import("tesseract.js");
    const imagePath = process.env.OCR_E2E_IMAGE!;
    const cachePath = process.env.OCR_E2E_CACHE ?? ".";

    const worker = await createWorker("eng", 1, { cachePath });
    try {
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        preserve_interword_spaces: "1",
      });
      const { data } = await worker.recognize(imagePath, {}, { blocks: true, text: true });
      const lines = pageToOcrLines(data as never);
      const { body, keyGuess } = ocrLinesToChordPro([lines]);

      // eslint-disable-next-line no-console
      console.log("--- imported body ---\n" + body + "\n---------------------");

      expect(body).toContain('{start_of_verse: label="Verse 1"}');
      expect(body).toContain("[G]God is able");
      expect(body).toContain("He will [D]never fail");
      expect(body).toContain("[Em]He is almighty [C]God");
      expect(body).toContain("[G]we seek");
      expect(body).toContain("{start_of_chorus}");
      expect(body).toContain("Lifted [G]up, He defeated the [D]grave");
      expect(body).toContain("Raised to [Em]life, our [D]God is [C]able");
      expect(body).toContain("{start_of_bridge}");
      expect(body).toContain("[C] [D] [G] [Em]");
      expect(keyGuess).toBe("G");
    } finally {
      await worker.terminate();
    }
  }, 120_000);
});
