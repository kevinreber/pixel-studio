/**
 * Zustand store for generation job tracking
 *
 * This store consolidates all generation-related state management:
 * - Active jobs (image/video generation)
 * - Polling logic
 * - WebSocket connection status
 * - Toast notifications
 *
 * Benefits over the current Context approach:
 * - No provider wrapper needed
 * - Automatic cleanup via subscriptions
 * - Computed selectors for derived state
 * - Optional persistence middleware
 * - Simpler integration in components
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
// Optional: import { persist } from "zustand/middleware";

// ============================================================================
// Types
// ============================================================================

export type GenerationType = "image" | "video";
export type JobStatus = "queued" | "processing" | "complete" | "failed" | "partial";
export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export interface GenerationJob {
  requestId: string;
  type: GenerationType;
  status: JobStatus;
  progress: number;
  message?: string;
  setId?: string;
  error?: string;
  prompt?: string;
  createdAt: number; // timestamp for serialization
  // Comparison mode fields
  comparisonMode?: boolean;
  models?: string[];
  modelStatuses?: Record<string, ModelStatus>;
  totalModels?: number;
  completedModels?: number;
}

export interface ModelStatus {
  status: string;
  progress: number;
  setId?: string;
  error?: string;
}

interface GenerationStore {
  // State
  jobs: Map<string, GenerationJob>;
  connectionStatus: ConnectionStatus;
  wsUrl: string | null;

  // Derived state (computed via selectors)
  // activeJobs, completedJobs, failedJobs - see selectors below

  // Actions
  addJob: (job: Omit<GenerationJob, "createdAt">) => void;
  updateJob: (requestId: string, updates: Partial<GenerationJob>) => void;
  removeJob: (requestId: string) => void;
  clearCompletedJobs: () => void;

  // Connection management
  setConnectionStatus: (status: ConnectionStatus) => void;
  setWsUrl: (url: string) => void;

  // Polling controls (internal)
  _pollingIntervals: Map<string, NodeJS.Timeout>;
  _startPolling: (requestId: string, type: GenerationType) => void;
  _stopPolling: (requestId: string) => void;
  _stopAllPolling: () => void;
}

// ============================================================================
// Store
// ============================================================================

const POLL_INTERVAL = 2000;

export const useGenerationStore = create<GenerationStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    jobs: new Map(),
    connectionStatus: "disconnected",
    wsUrl: null,
    _pollingIntervals: new Map(),

    // Actions
    addJob: (job) => {
      const newJob: GenerationJob = {
        ...job,
        createdAt: Date.now(),
      };

      set((state) => {
        const jobs = new Map(state.jobs);
        jobs.set(job.requestId, newJob);
        return { jobs };
      });

      // Start polling for this job
      get()._startPolling(job.requestId, job.type);
    },

    updateJob: (requestId, updates) => {
      set((state) => {
        const jobs = new Map(state.jobs);
        const existing = jobs.get(requestId);
        if (existing) {
          jobs.set(requestId, { ...existing, ...updates });
        }
        return { jobs };
      });

      // Stop polling if job is complete or failed
      const job = get().jobs.get(requestId);
      if (job?.status === "complete" || job?.status === "failed") {
        get()._stopPolling(requestId);
      }
    },

    removeJob: (requestId) => {
      get()._stopPolling(requestId);
      set((state) => {
        const jobs = new Map(state.jobs);
        jobs.delete(requestId);
        return { jobs };
      });
    },

    clearCompletedJobs: () => {
      set((state) => {
        const jobs = new Map(state.jobs);
        for (const [id, job] of jobs) {
          if (job.status === "complete" || job.status === "failed") {
            get()._stopPolling(id);
            jobs.delete(id);
          }
        }
        return { jobs };
      });
    },

    setConnectionStatus: (status) => set({ connectionStatus: status }),
    setWsUrl: (url) => set({ wsUrl: url }),

    // Internal polling logic
    _startPolling: (requestId, type) => {
      const { _pollingIntervals } = get();

      // Don't start if already polling
      if (_pollingIntervals.has(requestId)) return;

      const poll = async () => {
        try {
          const endpoint = type === "video"
            ? `/api/processing/${requestId}?type=video`
            : `/api/processing/${requestId}`;

          const response = await fetch(endpoint);

          if (!response.ok) {
            if (response.status === 404) {
              console.warn(`Job ${requestId} not found`);
              get()._stopPolling(requestId);
              return;
            }
            throw new Error("Failed to fetch status");
          }

          const data = await response.json();

          get().updateJob(requestId, {
            status: data.status,
            progress: data.progress,
            message: data.message,
            setId: data.setId,
            error: data.error,
            comparisonMode: data.comparisonMode,
            models: data.models,
            modelStatuses: data.modelStatuses,
            totalModels: data.totalModels,
            completedModels: data.completedModels,
          });

          get().setConnectionStatus("connected");
        } catch (error) {
          console.error("Polling error:", error);
          get().setConnectionStatus("disconnected");
        }
      };

      // Initial poll
      poll();

      // Set up interval
      const interval = setInterval(poll, POLL_INTERVAL);
      _pollingIntervals.set(requestId, interval);
    },

    _stopPolling: (requestId) => {
      const { _pollingIntervals } = get();
      const interval = _pollingIntervals.get(requestId);
      if (interval) {
        clearInterval(interval);
        _pollingIntervals.delete(requestId);
      }
    },

    _stopAllPolling: () => {
      const { _pollingIntervals } = get();
      for (const interval of _pollingIntervals.values()) {
        clearInterval(interval);
      }
      _pollingIntervals.clear();
    },
  }))
);

// ============================================================================
// Selectors (for derived state)
// ============================================================================

export const selectActiveJobs = (state: GenerationStore): GenerationJob[] =>
  Array.from(state.jobs.values()).filter(
    (job) => job.status === "queued" || job.status === "processing"
  );

export const selectCompletedJobs = (state: GenerationStore): GenerationJob[] =>
  Array.from(state.jobs.values()).filter(
    (job) => job.status === "complete" || job.status === "partial"
  );

export const selectFailedJobs = (state: GenerationStore): GenerationJob[] =>
  Array.from(state.jobs.values()).filter((job) => job.status === "failed");

export const selectJobById = (requestId: string) => (state: GenerationStore) =>
  state.jobs.get(requestId);

export const selectJobCount = (state: GenerationStore): number =>
  state.jobs.size;

export const selectActiveJobCount = (state: GenerationStore): number =>
  selectActiveJobs(state).length;

// ============================================================================
// Hooks for common patterns
// ============================================================================

/**
 * Hook to track a specific job by requestId
 * Automatically starts polling when the component mounts
 */
export function useJob(requestId: string, type: GenerationType = "image") {
  const job = useGenerationStore((state) => state.jobs.get(requestId));
  const connectionStatus = useGenerationStore((state) => state.connectionStatus);
  const addJob = useGenerationStore((state) => state.addJob);

  // Start tracking if not already tracked
  if (!job) {
    // Add as a new job to start polling
    addJob({
      requestId,
      type,
      status: "queued",
      progress: 0,
    });
  }

  return { job, connectionStatus };
}

/**
 * Hook to get all active jobs (for notification badges, etc.)
 */
export function useActiveJobs() {
  return useGenerationStore(selectActiveJobs);
}

/**
 * Hook to add a new generation job
 */
export function useAddJob() {
  return useGenerationStore((state) => state.addJob);
}
