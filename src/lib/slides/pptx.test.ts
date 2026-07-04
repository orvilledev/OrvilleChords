import { describe, it, expect } from "vitest";
import type { Song } from "../types";
import { buildDeck } from "./pptx";

const song: Song = {
  id: "1",
  title: "Amazing Grace",
  artist: "John Newton",
  originalKey: "G",
  tags: ["hymn"],
  body: `{start_of_verse}
A[G]mazing [G7]grace, how [C]sweet the [G]sound
That [G]saved a wretch like [D]me
{end_of_verse}`,
  createdAt: 0,
  updatedAt: 0,
};

describe("buildDeck", () => {
  it("produces a valid (zip-signed) pptx", async () => {
    const pptx = await buildDeck(song, { footer: "CCLI 12345" });
    const b64 = (await pptx.write({ outputType: "base64" })) as string;
    // Every .pptx is a zip; base64 of the "PK\x03\x04" signature starts "UEsDB".
    expect(b64.startsWith("UEsDB")).toBe(true);
    expect(b64.length).toBeGreaterThan(2000);
  });
});
