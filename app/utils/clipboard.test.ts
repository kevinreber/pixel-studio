import { describe, it, expect, vi, afterEach } from "vitest";
import { copyToClipboard } from "./clipboard";

/**
 * The regression these cover is Sentry PIXEL-STUDIO-76: reading `.writeText`
 * off an undefined `navigator.clipboard` throws synchronously, so a `.catch()`
 * on the returned promise never runs. The "missing API" case is the one that
 * actually broke in production.
 *
 * These run in vitest's default `node` environment, where `globalThis.navigator`
 * exists on Node 21+ but not on Node 20 (which CI uses). `vi.stubGlobal` defines
 * the global either way, so the suite must not reach for a pre-existing one.
 */
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("copyToClipboard", () => {
  it("writes the text and reports success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await expect(copyToClipboard("hello")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("reports failure instead of throwing when the clipboard API is absent", async () => {
    vi.stubGlobal("navigator", {});

    await expect(copyToClipboard("hello")).resolves.toBe(false);
  });

  it("reports failure instead of throwing when there is no navigator at all", async () => {
    vi.stubGlobal("navigator", undefined);

    await expect(copyToClipboard("hello")).resolves.toBe(false);
  });

  it("reports failure when the write is rejected", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await expect(copyToClipboard("hello")).resolves.toBe(false);
  });

  it("passes empty text through to the clipboard unchanged", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await expect(copyToClipboard("")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("");
  });
});
