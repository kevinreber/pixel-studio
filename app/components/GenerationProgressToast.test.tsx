/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { GenerationProgressToast } from "./GenerationProgressToast";
import type { GenerationJob } from "~/contexts/GenerationProgressContext";

// Wrapper component to provide router context
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

const createMockJob = (overrides: Partial<GenerationJob> = {}): GenerationJob => ({
  requestId: "test-request-123",
  type: "image",
  status: "queued",
  progress: 0,
  createdAt: new Date(),
  ...overrides,
});

describe("GenerationProgressToast", () => {
  describe("rendering", () => {
    it("renders without crashing", () => {
      const job = createMockJob();
      const onDismiss = vi.fn();

      render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      expect(screen.getByText("Image Generation")).toBeInTheDocument();
    });

    it("renders video generation title for video jobs", () => {
      const job = createMockJob({ type: "video" });
      const onDismiss = vi.fn();

      render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      expect(screen.getByText("Video Generation")).toBeInTheDocument();
    });

    it("renders dismiss button", () => {
      const job = createMockJob();
      const onDismiss = vi.fn();

      render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument();
    });
  });

  describe("status states", () => {
    it("shows 'Queued...' for queued status", () => {
      const job = createMockJob({ status: "queued" });
      const onDismiss = vi.fn();

      render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      expect(screen.getByText("Queued...")).toBeInTheDocument();
    });

    it("shows custom message for processing status", () => {
      const job = createMockJob({
        status: "processing",
        progress: 45,
        message: "Generating images...",
      });
      const onDismiss = vi.fn();

      render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      expect(screen.getByText("Generating images...")).toBeInTheDocument();
    });

    it("shows default message when no custom message provided", () => {
      const job = createMockJob({
        status: "processing",
        progress: 50,
      });
      const onDismiss = vi.fn();

      render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      expect(screen.getByText("Generating images...")).toBeInTheDocument();
    });

    it("shows 'Images ready!' for complete image job", () => {
      const job = createMockJob({
        status: "complete",
        progress: 100,
        setId: "set-123",
      });
      const onDismiss = vi.fn();

      render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      expect(screen.getByText("Images ready!")).toBeInTheDocument();
    });

    it("shows 'Video ready!' for complete video job", () => {
      const job = createMockJob({
        type: "video",
        status: "complete",
        progress: 100,
        setId: "set-123",
      });
      const onDismiss = vi.fn();

      render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      expect(screen.getByText("Video ready!")).toBeInTheDocument();
    });

    it("shows 'Generation failed' for failed status", () => {
      const job = createMockJob({
        status: "failed",
        error: "Content policy violation",
      });
      const onDismiss = vi.fn();

      render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      expect(screen.getByText("Generation failed")).toBeInTheDocument();
    });
  });

  describe("progress display", () => {
    it("shows progress percentage for processing jobs", () => {
      const job = createMockJob({
        status: "processing",
        progress: 65,
      });
      const onDismiss = vi.fn();

      render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      expect(screen.getByText("65%")).toBeInTheDocument();
    });

    it("shows progress percentage for queued jobs", () => {
      const job = createMockJob({
        status: "queued",
        progress: 0,
      });
      const onDismiss = vi.fn();

      render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("does not show progress percentage for complete jobs", () => {
      const job = createMockJob({
        status: "complete",
        progress: 100,
        setId: "set-123",
      });
      const onDismiss = vi.fn();

      render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      expect(screen.queryByText("100%")).not.toBeInTheDocument();
    });

    it("does not show progress percentage for failed jobs", () => {
      const job = createMockJob({
        status: "failed",
        progress: 30,
        error: "Error",
      });
      const onDismiss = vi.fn();

      render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      expect(screen.queryByText("30%")).not.toBeInTheDocument();
    });
  });

  describe("prompt display", () => {
    it("shows truncated prompt", () => {
      const job = createMockJob({
        prompt: "A beautiful sunset over mountains",
      });
      const onDismiss = vi.fn();

      render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      expect(screen.getByText("A beautiful sunset over mountains")).toBeInTheDocument();
    });

    it("truncates long prompts", () => {
      const longPrompt =
        "This is a very long prompt that exceeds the maximum length and should be truncated with ellipsis at the end";
      const job = createMockJob({ prompt: longPrompt });
      const onDismiss = vi.fn();

      render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      // Should show truncated text (first 40 chars + ...)
      expect(screen.getByText(/This is a very long prompt that exceeds/)).toBeInTheDocument();
    });

    it("does not show prompt section when prompt is empty", () => {
      const job = createMockJob({ prompt: undefined });
      const onDismiss = vi.fn();

      const { container } = render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      // Check that there's no truncated prompt text element
      const truncatedPromptElements = container.querySelectorAll(".truncate");
      expect(truncatedPromptElements.length).toBe(0);
    });
  });

  describe("error display", () => {
    it("shows error message for failed jobs", () => {
      const job = createMockJob({
        status: "failed",
        error: "Content policy violation",
      });
      const onDismiss = vi.fn();

      render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      expect(screen.getByText("Content policy violation")).toBeInTheDocument();
    });

    it("does not show error section for non-failed jobs", () => {
      const job = createMockJob({
        status: "processing",
        error: undefined,
      });
      const onDismiss = vi.fn();

      render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      expect(screen.queryByText(/violation/i)).not.toBeInTheDocument();
    });
  });

  describe("action links", () => {
    it("shows 'View images' link for complete image job", () => {
      const job = createMockJob({
        status: "complete",
        progress: 100,
        setId: "set-123",
      });
      const onDismiss = vi.fn();

      render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      const link = screen.getByRole("link", { name: /view images/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/sets/set-123");
    });

    it("shows 'View video' link for complete video job", () => {
      const job = createMockJob({
        type: "video",
        status: "complete",
        progress: 100,
        setId: "set-456",
      });
      const onDismiss = vi.fn();

      render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      const link = screen.getByRole("link", { name: /view video/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/sets/set-456");
    });

    it("shows 'Try again' link for failed job", () => {
      const job = createMockJob({
        status: "failed",
        error: "Error occurred",
      });
      const onDismiss = vi.fn();

      render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      const link = screen.getByRole("link", { name: /try again/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/create");
    });

    it("links to /create-video for failed video jobs", () => {
      const job = createMockJob({
        type: "video",
        status: "failed",
        error: "Error occurred",
      });
      const onDismiss = vi.fn();

      render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      const link = screen.getByRole("link", { name: /try again/i });
      expect(link).toHaveAttribute("href", "/create-video");
    });

    it("does not show view link for complete job without setId", () => {
      const job = createMockJob({
        status: "complete",
        progress: 100,
        setId: undefined,
      });
      const onDismiss = vi.fn();

      render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      expect(screen.queryByRole("link", { name: /view/i })).not.toBeInTheDocument();
    });
  });

  describe("dismiss functionality", () => {
    it("calls onDismiss when dismiss button is clicked", () => {
      const job = createMockJob();
      const onDismiss = vi.fn();

      render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("calls onDismiss when view link is clicked", () => {
      const job = createMockJob({
        status: "complete",
        progress: 100,
        setId: "set-123",
      });
      const onDismiss = vi.fn();

      render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole("link", { name: /view images/i }));

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("calls onDismiss when try again link is clicked", () => {
      const job = createMockJob({
        status: "failed",
        error: "Error",
      });
      const onDismiss = vi.fn();

      render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole("link", { name: /try again/i }));

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe("styling", () => {
    it("has correct background color classes", () => {
      const job = createMockJob();
      const onDismiss = vi.fn();

      const { container } = render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      const toastElement = container.firstChild as HTMLElement;
      expect(toastElement).toHaveClass("bg-zinc-900");
    });

    it("has correct width class", () => {
      const job = createMockJob();
      const onDismiss = vi.fn();

      const { container } = render(
        <TestWrapper>
          <GenerationProgressToast job={job} onDismiss={onDismiss} />
        </TestWrapper>
      );

      const toastElement = container.firstChild as HTMLElement;
      expect(toastElement).toHaveClass("w-[360px]");
    });
  });
});
