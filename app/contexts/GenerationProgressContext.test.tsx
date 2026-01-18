/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import {
  GenerationProgressProvider,
  useGenerationProgress,
} from "./GenerationProgressContext";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    custom: vi.fn((render, options) => options?.id || `toast-${Math.random()}`),
    dismiss: vi.fn(),
  },
}));

// Mock the GenerationProgressToast component
vi.mock("~/components/GenerationProgressToast", () => ({
  GenerationProgressToast: () => null,
}));

// Mock fetch for polling
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("GenerationProgressContext", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    // Default mock that returns queued status
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "queued", progress: 0 }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GenerationProgressProvider>{children}</GenerationProgressProvider>
  );

  describe("useGenerationProgress hook", () => {
    it("throws error when used outside provider", () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderHook(() => useGenerationProgress());
      }).toThrow("useGenerationProgress must be used within a GenerationProgressProvider");

      consoleSpy.mockRestore();
    });

    it("returns context value when used inside provider", () => {
      const { result } = renderHook(() => useGenerationProgress(), { wrapper });

      expect(result.current).toHaveProperty("activeJobs");
      expect(result.current).toHaveProperty("addJob");
      expect(result.current).toHaveProperty("removeJob");
      expect(result.current).toHaveProperty("updateJob");
      expect(Array.isArray(result.current.activeJobs)).toBe(true);
    });

    it("starts with empty activeJobs array", () => {
      const { result } = renderHook(() => useGenerationProgress(), { wrapper });

      expect(result.current.activeJobs).toHaveLength(0);
    });
  });

  describe("addJob", () => {
    it("adds a new job to activeJobs", async () => {
      const { result } = renderHook(() => useGenerationProgress(), { wrapper });

      await act(async () => {
        result.current.addJob({
          requestId: "test-123",
          type: "image",
          status: "queued",
          progress: 0,
          message: "Starting image generation...",
          prompt: "A beautiful sunset",
        });
      });

      expect(result.current.activeJobs.length).toBe(1);
      expect(result.current.activeJobs[0].requestId).toBe("test-123");
      expect(result.current.activeJobs[0].type).toBe("image");
      expect(result.current.activeJobs[0].status).toBe("queued");
      expect(result.current.activeJobs[0].prompt).toBe("A beautiful sunset");
    });

    it("adds createdAt timestamp to new job", async () => {
      const { result } = renderHook(() => useGenerationProgress(), { wrapper });

      const beforeAdd = new Date();

      await act(async () => {
        result.current.addJob({
          requestId: "test-456",
          type: "video",
          status: "queued",
          progress: 0,
        });
      });

      const job = result.current.activeJobs[0];
      expect(job.createdAt).toBeDefined();
      expect(job.createdAt instanceof Date).toBe(true);
      expect(job.createdAt.getTime()).toBeGreaterThanOrEqual(beforeAdd.getTime());
    });

    it("can add multiple jobs", async () => {
      const { result } = renderHook(() => useGenerationProgress(), { wrapper });

      await act(async () => {
        result.current.addJob({
          requestId: "job-1",
          type: "image",
          status: "queued",
          progress: 0,
        });
      });

      await act(async () => {
        result.current.addJob({
          requestId: "job-2",
          type: "video",
          status: "queued",
          progress: 0,
        });
      });

      expect(result.current.activeJobs.length).toBe(2);
      expect(result.current.activeJobs.map((j) => j.requestId)).toContain("job-1");
      expect(result.current.activeJobs.map((j) => j.requestId)).toContain("job-2");
    });

    it("correctly sets job type for image jobs", async () => {
      const { result } = renderHook(() => useGenerationProgress(), { wrapper });

      await act(async () => {
        result.current.addJob({
          requestId: "image-job",
          type: "image",
          status: "queued",
          progress: 0,
        });
      });

      expect(result.current.activeJobs[0].type).toBe("image");
    });

    it("correctly sets job type for video jobs", async () => {
      const { result } = renderHook(() => useGenerationProgress(), { wrapper });

      await act(async () => {
        result.current.addJob({
          requestId: "video-job",
          type: "video",
          status: "queued",
          progress: 0,
        });
      });

      expect(result.current.activeJobs[0].type).toBe("video");
    });
  });

  describe("updateJob", () => {
    it("updates an existing job", async () => {
      const { result } = renderHook(() => useGenerationProgress(), { wrapper });

      await act(async () => {
        result.current.addJob({
          requestId: "update-test",
          type: "image",
          status: "queued",
          progress: 0,
        });
      });

      await act(async () => {
        result.current.updateJob("update-test", {
          status: "processing",
          progress: 50,
          message: "Processing...",
        });
      });

      const job = result.current.activeJobs.find((j) => j.requestId === "update-test");
      expect(job?.status).toBe("processing");
      expect(job?.progress).toBe(50);
      expect(job?.message).toBe("Processing...");
    });

    it("does not affect other jobs when updating one", async () => {
      const { result } = renderHook(() => useGenerationProgress(), { wrapper });

      await act(async () => {
        result.current.addJob({
          requestId: "job-a",
          type: "image",
          status: "queued",
          progress: 0,
        });
        result.current.addJob({
          requestId: "job-b",
          type: "video",
          status: "queued",
          progress: 0,
        });
      });

      // Update both jobs to set initial progress values
      await act(async () => {
        result.current.updateJob("job-b", { progress: 10 });
      });

      await act(async () => {
        result.current.updateJob("job-a", { progress: 75 });
      });

      const jobA = result.current.activeJobs.find((j) => j.requestId === "job-a");
      const jobB = result.current.activeJobs.find((j) => j.requestId === "job-b");

      expect(jobA?.progress).toBe(75);
      expect(jobB?.progress).toBe(10); // Unchanged by job-a update
    });

    it("can update status to complete", async () => {
      const { result } = renderHook(() => useGenerationProgress(), { wrapper });

      await act(async () => {
        result.current.addJob({
          requestId: "complete-test",
          type: "image",
          status: "queued",
          progress: 0,
        });
      });

      await act(async () => {
        result.current.updateJob("complete-test", {
          status: "complete",
          progress: 100,
          setId: "set-123",
        });
      });

      const job = result.current.activeJobs.find((j) => j.requestId === "complete-test");
      expect(job?.status).toBe("complete");
      expect(job?.progress).toBe(100);
      expect(job?.setId).toBe("set-123");
    });

    it("can update status to failed with error message", async () => {
      const { result } = renderHook(() => useGenerationProgress(), { wrapper });

      await act(async () => {
        result.current.addJob({
          requestId: "fail-test",
          type: "image",
          status: "queued",
          progress: 0,
        });
      });

      await act(async () => {
        result.current.updateJob("fail-test", {
          status: "failed",
          error: "Content policy violation",
        });
      });

      const job = result.current.activeJobs.find((j) => j.requestId === "fail-test");
      expect(job?.status).toBe("failed");
      expect(job?.error).toBe("Content policy violation");
    });
  });

  describe("removeJob", () => {
    it("removes a job from activeJobs", async () => {
      const { result } = renderHook(() => useGenerationProgress(), { wrapper });

      await act(async () => {
        result.current.addJob({
          requestId: "remove-test",
          type: "image",
          status: "queued",
          progress: 0,
        });
      });

      expect(result.current.activeJobs.length).toBe(1);

      await act(async () => {
        result.current.removeJob("remove-test");
      });

      expect(result.current.activeJobs.length).toBe(0);
    });

    it("only removes the specified job", async () => {
      const { result } = renderHook(() => useGenerationProgress(), { wrapper });

      await act(async () => {
        result.current.addJob({
          requestId: "keep-job",
          type: "image",
          status: "queued",
          progress: 0,
        });
        result.current.addJob({
          requestId: "remove-job",
          type: "video",
          status: "queued",
          progress: 0,
        });
      });

      expect(result.current.activeJobs.length).toBe(2);

      await act(async () => {
        result.current.removeJob("remove-job");
      });

      expect(result.current.activeJobs.length).toBe(1);
      expect(result.current.activeJobs[0].requestId).toBe("keep-job");
    });

    it("does nothing when removing non-existent job", async () => {
      const { result } = renderHook(() => useGenerationProgress(), { wrapper });

      await act(async () => {
        result.current.addJob({
          requestId: "existing-job",
          type: "image",
          status: "queued",
          progress: 0,
        });
      });

      await act(async () => {
        result.current.removeJob("non-existent-job");
      });

      expect(result.current.activeJobs.length).toBe(1);
      expect(result.current.activeJobs[0].requestId).toBe("existing-job");
    });
  });

  describe("polling initialization", () => {
    it("calls fetch when job is added", async () => {
      const { result } = renderHook(() => useGenerationProgress(), { wrapper });

      await act(async () => {
        result.current.addJob({
          requestId: "poll-test",
          type: "image",
          status: "queued",
          progress: 0,
        });
      });

      // Give it a moment for the initial fetch to be called
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(mockFetch).toHaveBeenCalled();
      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain("/api/processing/poll-test");
    });

    it("includes type=video query param for video jobs", async () => {
      const { result } = renderHook(() => useGenerationProgress(), { wrapper });

      await act(async () => {
        result.current.addJob({
          requestId: "video-poll-test",
          type: "video",
          status: "queued",
          progress: 0,
        });
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(mockFetch).toHaveBeenCalled();
      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain("type=video");
    });
  });
});
