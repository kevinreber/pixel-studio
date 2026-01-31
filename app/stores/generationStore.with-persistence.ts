/**
 * Zustand store with persistence middleware
 *
 * This version adds sessionStorage persistence so that:
 * - Jobs survive page refreshes
 * - Users can see their in-progress generations after navigating away
 * - Browser tab crashes don't lose progress tracking
 */

import { create } from "zustand";
import { subscribeWithSelector, persist } from "zustand/middleware";

// ... same types as generationStore.ts ...

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
  createdAt: number;
  comparisonMode?: boolean;
  models?: string[];
  modelStatuses?: Record<string, { status: string; progress: number; setId?: string; error?: string }>;
  totalModels?: number;
  completedModels?: number;
}

interface GenerationStore {
  jobs: Map<string, GenerationJob>;
  connectionStatus: ConnectionStatus;
  wsUrl: string | null;
  addJob: (job: Omit<GenerationJob, "createdAt">) => void;
  updateJob: (requestId: string, updates: Partial<GenerationJob>) => void;
  removeJob: (requestId: string) => void;
  clearCompletedJobs: () => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  _pollingIntervals: Map<string, NodeJS.Timeout>;
  _startPolling: (requestId: string, type: GenerationType) => void;
  _stopPolling: (requestId: string) => void;
  _rehydratePolling: () => void;
}

const POLL_INTERVAL = 2000;
const STALE_JOB_THRESHOLD = 30 * 60 * 1000; // 30 minutes

export const useGenerationStore = create<GenerationStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        jobs: new Map(),
        connectionStatus: "disconnected",
        wsUrl: null,
        _pollingIntervals: new Map(),

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

        _startPolling: (requestId, type) => {
          const { _pollingIntervals } = get();
          if (_pollingIntervals.has(requestId)) return;

          const poll = async () => {
            try {
              const endpoint = type === "video"
                ? `/api/processing/${requestId}?type=video`
                : `/api/processing/${requestId}`;

              const response = await fetch(endpoint);
              if (!response.ok) {
                if (response.status === 404) {
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
            } catch {
              get().setConnectionStatus("disconnected");
            }
          };

          poll();
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

        // Resume polling for active jobs after rehydration
        _rehydratePolling: () => {
          const { jobs, _startPolling } = get();
          const now = Date.now();

          for (const [requestId, job] of jobs) {
            // Skip completed/failed jobs
            if (job.status === "complete" || job.status === "failed") continue;

            // Skip stale jobs (older than threshold)
            if (now - job.createdAt > STALE_JOB_THRESHOLD) {
              get().removeJob(requestId);
              continue;
            }

            // Resume polling for active jobs
            _startPolling(requestId, job.type);
          }
        },
      }),
      {
        name: "pixel-studio-generation",
        // Custom storage to handle Map serialization
        storage: {
          getItem: (name) => {
            const str = sessionStorage.getItem(name);
            if (!str) return null;
            const parsed = JSON.parse(str);
            // Convert jobs array back to Map
            if (parsed.state?.jobs) {
              parsed.state.jobs = new Map(parsed.state.jobs);
            }
            return parsed;
          },
          setItem: (name, value) => {
            // Convert jobs Map to array for JSON serialization
            const toStore = {
              ...value,
              state: {
                ...value.state,
                jobs: Array.from(value.state.jobs.entries()),
              },
            };
            sessionStorage.setItem(name, JSON.stringify(toStore));
          },
          removeItem: (name) => sessionStorage.removeItem(name),
        },

        // Only persist the jobs, not transient state
        partialize: (state) => ({
          jobs: state.jobs,
        }) as GenerationStore,

        // Resume polling after rehydration
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Small delay to ensure store is fully initialized
            setTimeout(() => {
              state._rehydratePolling();
            }, 100);
          }
        },
      }
    )
  )
);
