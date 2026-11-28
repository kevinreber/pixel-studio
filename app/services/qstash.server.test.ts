import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const publishJSON = vi.fn().mockResolvedValue({ messageId: "msg-1" });

vi.mock("@upstash/qstash", () => ({
  Client: class {
    publishJSON = publishJSON;
  },
  Receiver: class {},
}));

vi.mock("./processingStatus.server", () => ({
  publishProcessingUpdate: vi.fn().mockResolvedValue(undefined),
  getProcessingStatusService: vi.fn(() => ({
    claimProcessingRequest: vi.fn().mockResolvedValue({ claimed: false }),
  })),
  getProcessingStatus: vi.fn(),
}));

vi.mock("./generationLog.server", () => ({
  logGenerationStart: vi.fn().mockResolvedValue(undefined),
  logGenerationComplete: vi.fn().mockResolvedValue(undefined),
  logGenerationFailed: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("~/server/createNewImages", () => ({
  createNewImages: vi.fn(),
}));

import {
  checkQStashHealth,
  queueImageGenerationQStash,
  requiresQStashSignature,
} from "./qstash.server";

const formData = {
  prompt: "a lighthouse at dusk",
  numberOfImages: 1,
  model: "sd3.5-large",
  stylePreset: undefined,
  private: false,
};

// Mirrors the live Vercel deployment, which runs with NODE_ENV=development.
const stubVercelProduction = () => {
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("BASE_URL", "");
  vi.stubEnv("QSTASH_TOKEN", "token");
  vi.stubEnv("QSTASH_CURRENT_SIGNING_KEY", "current");
  vi.stubEnv("QSTASH_NEXT_SIGNING_KEY", "next");
};

const stubLocalDevelopment = () => {
  vi.stubEnv("VERCEL_ENV", "");
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("BASE_URL", "http://localhost:5173");
};

describe("qstash environment detection", () => {
  beforeEach(() => {
    publishJSON.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("queues through QStash on Vercel production even when NODE_ENV is development", async () => {
    stubVercelProduction();

    await queueImageGenerationQStash(
      formData,
      "user-1",
      "https://www.pixelstudioai.com"
    );

    expect(publishJSON).toHaveBeenCalledTimes(1);
    expect(publishJSON.mock.calls[0][0].url).toBe(
      "https://www.pixelstudioai.com/api/queue/process-image"
    );
  });

  it("prefers the request origin over BASE_URL for the callback", async () => {
    stubVercelProduction();
    vi.stubEnv("BASE_URL", "https://stale.example.com");

    await queueImageGenerationQStash(
      formData,
      "user-1",
      "https://www.pixelstudioai.com"
    );

    expect(publishJSON.mock.calls[0][0].url).toBe(
      "https://www.pixelstudioai.com/api/queue/process-image"
    );
  });

  it("processes in-process instead of publishing during local development", async () => {
    stubLocalDevelopment();

    await queueImageGenerationQStash(formData, "user-1");

    expect(publishJSON).not.toHaveBeenCalled();
  });

  it("requires webhook signatures on Vercel production even when NODE_ENV is development", () => {
    stubVercelProduction();
    expect(requiresQStashSignature()).toBe(true);
  });

  it("does not require webhook signatures during local development", () => {
    stubLocalDevelopment();
    expect(requiresQStashSignature()).toBe(false);
  });

  it("reports unhealthy in production when signing keys are missing", async () => {
    stubVercelProduction();
    vi.stubEnv("QSTASH_NEXT_SIGNING_KEY", "");

    await expect(checkQStashHealth()).resolves.toBe(false);
  });

  it("reports healthy in production when token and signing keys are set", async () => {
    stubVercelProduction();

    await expect(checkQStashHealth()).resolves.toBe(true);
  });
});
