import { describe, it, expect, vi, afterEach } from "vitest";
import { copyToClipboard } from "./clipboard";

/**
 * The regression these cover is Sentry PIXEL-STUDIO-76: reading `.writeText`
 * off an undefined `navigator.clipboard` throws synchronously, so a `.catch()`
 * on the returned promise never runs. The "missing API" case is the one that
 * actually broke in production.
 */
function setClipboard(value: unknown) {
  // Stub the whole navigator: Node < 21 (CI runs Node 20) has no global
  // `navigator`, so defining a property on it would throw.
  vi.stubGlobal("navigator", { clipboard: value });
}

describe("copyToClipboard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("writes the text and reports success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });

    await expect(copyToClipboard("hello")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("reports failure instead of throwing when the API is absent", async () => {
    setClipboard(undefined);

    await expect(copyToClipboard("hello")).resolves.toBe(false);
  });

  it("reports failure when the write is rejected", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    setClipboard({ writeText });

    await expect(copyToClipboard("hello")).resolves.toBe(false);
  });

  it("still resolves false for empty text with no API available", async () => {
    setClipboard(undefined);

    await expect(copyToClipboard("")).resolves.toBe(false);
  });
});
