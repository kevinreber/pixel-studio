import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { mapSizeToGptImage1, urlToBase64 } from "./createNewOpenAIImages";

describe("mapSizeToGptImage1", () => {
  it("passes 1024x1024 through unchanged (square is shared)", () => {
    expect(mapSizeToGptImage1("1024x1024")).toBe("1024x1024");
  });

  it("maps dall-e-3 portrait 1024x1792 to gpt-image-1 portrait 1024x1536", () => {
    expect(mapSizeToGptImage1("1024x1792")).toBe("1024x1536");
  });

  it("maps dall-e-3 landscape 1792x1024 to gpt-image-1 landscape 1536x1024", () => {
    expect(mapSizeToGptImage1("1792x1024")).toBe("1536x1024");
  });

  it("falls through to 'auto' for dall-e-2's 256x256", () => {
    expect(mapSizeToGptImage1("256x256")).toBe("auto");
  });

  it("falls through to 'auto' for dall-e-2's 512x512", () => {
    expect(mapSizeToGptImage1("512x512")).toBe("auto");
  });

  it("falls through to 'auto' for any unknown size string", () => {
    expect(mapSizeToGptImage1("")).toBe("auto");
    expect(mapSizeToGptImage1("not-a-size")).toBe("auto");
    expect(mapSizeToGptImage1("2048x2048")).toBe("auto");
  });
});

describe("urlToBase64", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("downloads the URL and returns the bytes as base64", async () => {
    const payload = Buffer.from("hello world");
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () =>
        payload.buffer.slice(
          payload.byteOffset,
          payload.byteOffset + payload.byteLength,
        ),
    } as Response);

    const result = await urlToBase64("https://example.com/image.png");
    expect(result).toBe(payload.toString("base64"));
    expect(globalThis.fetch).toHaveBeenCalledWith("https://example.com/image.png");
  });

  it("returns undefined when the response is not OK (e.g. 404)", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      arrayBuffer: async () => new ArrayBuffer(0),
    } as Response);

    const result = await urlToBase64("https://example.com/missing.png");
    expect(result).toBeUndefined();
  });

  it("returns undefined when fetch itself throws (network error)", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network down"));

    const result = await urlToBase64("https://example.com/image.png");
    expect(result).toBeUndefined();
  });

  it("returns undefined when fetch rejects with a non-Error value", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue("string rejection");

    const result = await urlToBase64("https://example.com/image.png");
    expect(result).toBeUndefined();
  });

  it("correctly base64-encodes binary (non-UTF8) payloads", async () => {
    const binary = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () =>
        binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength),
    } as Response);

    const result = await urlToBase64("https://example.com/image.png");
    expect(result).toBe(binary.toString("base64"));
  });
});
