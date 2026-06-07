import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Hoist the mock SDK function so the test scope and the vi.mock factory
// share a reference to it. Without `vi.hoisted` the `mockGenerate` symbol
// inside the factory would not yet exist when vitest hoists `vi.mock`.
const { mockGenerate } = vi.hoisted(() => ({ mockGenerate: vi.fn() }));

// Mock the OpenAI SDK — `new OpenAI(...)` must be constructable, so we
// expose a class whose `.images.generate` is the hoisted mockGenerate fn.
// (`vi.fn().mockImplementation(() => ({...}))` returns an arrow that can't
// be `new`-ed; vitest emits a "did not use 'function' or 'class'" warning
// and the `new` throws.)
vi.mock("openai", () => ({
  default: class FakeOpenAI {
    images = { generate: mockGenerate };
  },
}));

// Mock the `~/server` barrel — only the four symbols `createNewOpenAIImages`
// actually pulls in. A full mock keeps the test from transitively pulling in
// Prisma/S3/Redis/etc. at import time.
vi.mock("~/server", () => ({
  addBase64EncodedImageToAWS: vi.fn(),
  createNewImage: vi.fn(),
  createNewSet: vi.fn(),
  deleteSet: vi.fn(),
}));

vi.mock("~/utils/s3Utils", () => ({
  getS3BucketURL: vi.fn((id: string) => `https://s3.example.com/${id}`),
  getS3BucketThumbnailURL: vi.fn((id: string) => `https://s3.example.com/thumb/${id}`),
}));

vi.mock("~/utils/logger.server", () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Imports below are resolved after `vi.mock` has been hoisted, so they see
// the mocked modules.
import {
  mapSizeToGptImage1,
  urlToBase64,
  createNewOpenAIImages,
} from "./createNewOpenAIImages";
import {
  addBase64EncodedImageToAWS,
  createNewImage,
  createNewSet,
  deleteSet,
} from "~/server";

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

describe("createNewOpenAIImages (integration)", () => {
  const baseFormData = {
    prompt: "a cat in a hat",
    numberOfImages: 1,
    model: "dall-e-3",
    private: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DALLE_API_KEY = "test-key";
    delete process.env.USE_MOCK_DALLE;

    // Sensible defaults — individual tests can override.
    vi.mocked(createNewSet).mockResolvedValue({
      id: "set-test-id",
    } as Awaited<ReturnType<typeof createNewSet>>);
    vi.mocked(createNewImage).mockImplementation(
      (async (args: { userId: string; model: string; prompt: string }) => ({
        id: `img-${args.userId}-${args.model}`,
        prompt: args.prompt,
        userId: args.userId,
        model: args.model,
      })) as unknown as typeof createNewImage,
    );
    vi.mocked(addBase64EncodedImageToAWS).mockResolvedValue(
      undefined as unknown as Awaited<ReturnType<typeof addBase64EncodedImageToAWS>>,
    );
    vi.mocked(deleteSet).mockResolvedValue(
      undefined as unknown as Awaited<ReturnType<typeof deleteSet>>,
    );
  });

  it("rejects when userId is missing", async () => {
    await expect(
      createNewOpenAIImages(baseFormData, ""),
    ).rejects.toThrow("User ID is required");
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it("routes dall-e-3 to gpt-image-1 with n=1 per loop iteration", async () => {
    mockGenerate
      .mockResolvedValueOnce({ data: [{ b64_json: "first" }] })
      .mockResolvedValueOnce({ data: [{ b64_json: "second" }] });

    const result = await createNewOpenAIImages(
      { ...baseFormData, model: "dall-e-3", numberOfImages: 2 },
      "user-1",
    );

    expect(mockGenerate).toHaveBeenCalledTimes(2);
    expect(mockGenerate).toHaveBeenNthCalledWith(1, {
      prompt: "a cat in a hat",
      model: "gpt-image-1",
      size: "1024x1024",
      n: 1,
    });
    expect(mockGenerate).toHaveBeenNthCalledWith(2, {
      prompt: "a cat in a hat",
      model: "gpt-image-1",
      size: "1024x1024",
      n: 1,
    });

    expect(addBase64EncodedImageToAWS).toHaveBeenCalledTimes(2);
    expect(addBase64EncodedImageToAWS).toHaveBeenNthCalledWith(
      1,
      "first",
      expect.any(String),
    );
    expect(addBase64EncodedImageToAWS).toHaveBeenNthCalledWith(
      2,
      "second",
      expect.any(String),
    );

    expect(result.setId).toBe("set-test-id");
    expect(result.images).toHaveLength(2);
  });

  it("routes dall-e-2 (and other dall-e-* aliases) to gpt-image-1 with batched n", async () => {
    mockGenerate.mockResolvedValueOnce({
      data: [{ b64_json: "a" }, { b64_json: "b" }, { b64_json: "c" }],
    });

    const result = await createNewOpenAIImages(
      { ...baseFormData, model: "dall-e-2", numberOfImages: 3 },
      "user-2",
    );

    expect(mockGenerate).toHaveBeenCalledTimes(1);
    expect(mockGenerate).toHaveBeenCalledWith({
      prompt: "a cat in a hat",
      model: "gpt-image-1",
      size: "1024x1024",
      n: 3,
    });
    expect(addBase64EncodedImageToAWS).toHaveBeenCalledTimes(3);
    expect(result.images).toHaveLength(3);
  });

  it("persists the original model string ('dall-e-3') on the DB record, not 'gpt-image-1'", async () => {
    mockGenerate.mockResolvedValueOnce({ data: [{ b64_json: "x" }] });

    await createNewOpenAIImages(
      { ...baseFormData, model: "dall-e-3", numberOfImages: 1 },
      "user-3",
    );

    expect(createNewImage).toHaveBeenCalledTimes(1);
    expect(createNewImage).toHaveBeenCalledWith(
      expect.objectContaining({ model: "dall-e-3" }),
    );
  });

  it("maps dall-e-3 portrait dimensions (1024x1792) to gpt-image-1's 1024x1536", async () => {
    mockGenerate.mockResolvedValueOnce({ data: [{ b64_json: "x" }] });

    await createNewOpenAIImages(
      {
        ...baseFormData,
        model: "dall-e-3",
        width: 1024,
        height: 1792,
      } as Parameters<typeof createNewOpenAIImages>[0],
      "user-4",
    );

    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ size: "1024x1536" }),
    );
  });

  it("normalizes a url-only response via urlToBase64 (calls fetch with the URL)", async () => {
    const originalFetch = globalThis.fetch;
    const payload = Buffer.from("png-bytes");
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () =>
        payload.buffer.slice(
          payload.byteOffset,
          payload.byteOffset + payload.byteLength,
        ),
    } as Response);

    mockGenerate.mockResolvedValueOnce({
      data: [{ url: "https://openai-cdn.example.com/img.png" }],
    });

    try {
      await createNewOpenAIImages(
        { ...baseFormData, model: "dall-e-3", numberOfImages: 1 },
        "user-5",
      );

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://openai-cdn.example.com/img.png",
      );
      expect(addBase64EncodedImageToAWS).toHaveBeenCalledWith(
        payload.toString("base64"),
        expect.any(String),
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("rethrows 'OpenAI billing limit reached' when the SDK fails with billing_hard_limit_reached", async () => {
    const err = new Error("hard limit") as Error & { code: string };
    err.code = "billing_hard_limit_reached";
    mockGenerate.mockRejectedValueOnce(err);

    await expect(
      createNewOpenAIImages(
        { ...baseFormData, model: "dall-e-3" },
        "user-6",
      ),
    ).rejects.toThrow("OpenAI billing limit reached. Please try again later.");

    // The error happens before the set is created, so deleteSet should not fire.
    expect(deleteSet).not.toHaveBeenCalled();
  });

  it("swallows generic SDK errors and returns empty images (set was never created)", async () => {
    mockGenerate.mockRejectedValueOnce(new Error("network glitch"));

    const result = await createNewOpenAIImages(
      { ...baseFormData, model: "dall-e-3" },
      "user-7",
    );

    expect(result).toEqual({ images: [], setId: "" });
    expect(createNewSet).not.toHaveBeenCalled();
    expect(deleteSet).not.toHaveBeenCalled();
  });

  it("deletes the set when image persistence fails partway through (post-set-creation error)", async () => {
    mockGenerate.mockResolvedValueOnce({ data: [{ b64_json: "x" }] });
    vi.mocked(createNewImage).mockRejectedValueOnce(new Error("DB write failed"));

    const result = await createNewOpenAIImages(
      { ...baseFormData, model: "dall-e-3" },
      "user-8",
    );

    expect(result).toEqual({ images: [], setId: "" });
    expect(deleteSet).toHaveBeenCalledWith({ setId: "set-test-id" });
  });

  it("short-circuits via mock data when USE_MOCK_DALLE === 'tru'", async () => {
    process.env.USE_MOCK_DALLE = "tru";

    const result = await createNewOpenAIImages(
      { ...baseFormData, model: "dall-e-3", numberOfImages: 2 },
      "user-9",
    );

    expect(mockGenerate).not.toHaveBeenCalled();
    expect(createNewSet).not.toHaveBeenCalled();
    expect(result.images).toHaveLength(2);
    expect(result.setId).toBeTruthy();
    // Mock data has a distinctive marker prompt.
    expect(result.images[0]).toMatchObject({ prompt: "using mock data" });
  });
});
