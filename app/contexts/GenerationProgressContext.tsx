import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { GenerationProgressToast } from "~/components/GenerationProgressToast";

export type GenerationType = "image" | "video";

export interface GenerationJob {
  requestId: string;
  type: GenerationType;
  status: "queued" | "processing" | "complete" | "failed";
  progress: number;
  message?: string;
  setId?: string;
  error?: string;
  prompt?: string;
  createdAt: Date;
  toastId?: string | number;
}

interface GenerationProgressContextType {
  activeJobs: GenerationJob[];
  addJob: (job: Omit<GenerationJob, "createdAt" | "toastId">) => void;
  removeJob: (requestId: string) => void;
  updateJob: (requestId: string, updates: Partial<GenerationJob>) => void;
}

const GenerationProgressContext = createContext<GenerationProgressContextType | null>(null);

export function useGenerationProgress() {
  const context = useContext(GenerationProgressContext);
  if (!context) {
    throw new Error("useGenerationProgress must be used within a GenerationProgressProvider");
  }
  return context;
}

const POLL_INTERVAL = 2000; // 2 seconds

export function GenerationProgressProvider({ children }: { children: React.ReactNode }) {
  const [activeJobs, setActiveJobs] = useState<GenerationJob[]>([]);
  const pollingRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const updateJob = useCallback((requestId: string, updates: Partial<GenerationJob>) => {
    setActiveJobs((prev) =>
      prev.map((job) =>
        job.requestId === requestId ? { ...job, ...updates } : job
      )
    );
  }, []);

  const removeJob = useCallback((requestId: string) => {
    // Clear polling interval
    const interval = pollingRefs.current.get(requestId);
    if (interval) {
      clearInterval(interval);
      pollingRefs.current.delete(requestId);
    }

    setActiveJobs((prev) => prev.filter((job) => job.requestId !== requestId));
  }, []);

  const pollJobStatus = useCallback(async (requestId: string, type: GenerationType) => {
    try {
      const response = await fetch(`/api/processing/${requestId}${type === "video" ? "?type=video" : ""}`);

      if (!response.ok) {
        if (response.status === 404) {
          // Job not found - might be expired or already processed
          console.warn(`Job ${requestId} not found`);
          return null;
        }
        throw new Error("Failed to fetch status");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Polling error:", error);
      return null;
    }
  }, []);

  const startPolling = useCallback((requestId: string, type: GenerationType) => {
    // Initial poll
    pollJobStatus(requestId, type).then((data) => {
      if (data) {
        updateJob(requestId, {
          status: data.status,
          progress: data.progress,
          message: data.message,
          setId: data.setId,
          error: data.error,
        });
      }
    });

    // Set up interval polling
    const interval = setInterval(async () => {
      const data = await pollJobStatus(requestId, type);

      if (data) {
        updateJob(requestId, {
          status: data.status,
          progress: data.progress,
          message: data.message,
          setId: data.setId,
          error: data.error,
        });

        // Stop polling if complete or failed
        if (data.status === "complete" || data.status === "failed") {
          clearInterval(interval);
          pollingRefs.current.delete(requestId);
        }
      }
    }, POLL_INTERVAL);

    pollingRefs.current.set(requestId, interval);
  }, [pollJobStatus, updateJob]);

  const addJob = useCallback((job: Omit<GenerationJob, "createdAt" | "toastId">) => {
    const newJob: GenerationJob = {
      ...job,
      createdAt: new Date(),
    };

    // Create a persistent toast for this job
    // unstyled: true prevents the shadcn Toaster's classNames from being applied
    // to the toast wrapper, which conflicts with custom toast styling
    const toastId = toast.custom(
      (t) => (
        <GenerationProgressToast
          job={{ ...newJob, toastId: t }}
          onDismiss={() => {
            toast.dismiss(t);
            // Only remove from tracking if complete or failed
            if (newJob.status === "complete" || newJob.status === "failed") {
              removeJob(newJob.requestId);
            }
          }}
        />
      ),
      {
        duration: Infinity, // Don't auto-dismiss
        id: `generation-${job.requestId}`,
        unstyled: true,
      }
    );

    newJob.toastId = toastId;

    setActiveJobs((prev) => [...prev, newJob]);

    // Start polling for this job
    startPolling(job.requestId, job.type);
  }, [startPolling, removeJob]);

  // Update toast when job status changes
  useEffect(() => {
    activeJobs.forEach((job) => {
      if (job.toastId) {
        toast.custom(
          (t) => (
            <GenerationProgressToast
              job={{ ...job, toastId: t }}
              onDismiss={() => {
                toast.dismiss(t);
                if (job.status === "complete" || job.status === "failed") {
                  removeJob(job.requestId);
                }
              }}
            />
          ),
          {
            id: `generation-${job.requestId}`,
            duration: job.status === "complete" || job.status === "failed" ? 10000 : Infinity,
            unstyled: true,
          }
        );
      }
    });
  }, [activeJobs, removeJob]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pollingRefs.current.forEach((interval) => clearInterval(interval));
      pollingRefs.current.clear();
    };
  }, []);

  return (
    <GenerationProgressContext.Provider
      value={{ activeJobs, addJob, removeJob, updateJob }}
    >
      {children}
    </GenerationProgressContext.Provider>
  );
}
