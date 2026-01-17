/**
 * GenerationQueue Component
 *
 * Displays the user's active image generation jobs with real-time progress updates.
 * Users can see all their queued, in-progress, and recently completed jobs.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "@remix-run/react";
import { Loader2, CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";

interface QueueJob {
  requestId: string;
  status: "queued" | "processing" | "complete" | "failed";
  progress: number;
  message?: string;
  setId?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

interface GenerationQueueProps {
  /** Whether to show completed jobs */
  showCompleted?: boolean;
  /** Maximum number of jobs to display */
  maxJobs?: number;
  /** Callback when a job completes */
  onJobComplete?: (job: QueueJob) => void;
  /** Additional CSS classes */
  className?: string;
}

export function GenerationQueue({
  showCompleted = true,
  maxJobs = 10,
  onJobComplete,
  className = "",
}: GenerationQueueProps) {
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial jobs
  const fetchJobs = useCallback(async () => {
    try {
      const response = await fetch("/api/queue/status");
      if (!response.ok) {
        throw new Error("Failed to fetch queue status");
      }
      const data = await response.json();
      setJobs(data.jobs.slice(0, maxJobs));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load queue");
    } finally {
      setIsLoading(false);
    }
  }, [maxJobs]);

  // Track previous job statuses to detect completions
  const prevJobsRef = useRef<Map<string, string>>(new Map());

  // Check for newly completed jobs and notify
  useEffect(() => {
    jobs.forEach((job) => {
      const prevStatus = prevJobsRef.current.get(job.requestId);
      if (job.status === "complete" && prevStatus && prevStatus !== "complete") {
        onJobComplete?.(job);
      }
      prevJobsRef.current.set(job.requestId, job.status);
    });
  }, [jobs, onJobComplete]);

  // Initial fetch
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Poll for updates (fallback if WebSocket not available)
  useEffect(() => {
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  // Filter jobs based on showCompleted setting
  const displayedJobs = showCompleted
    ? jobs
    : jobs.filter((j) => j.status !== "complete" && j.status !== "failed");

  // Don't show anything while loading or if there are no jobs
  if (isLoading || displayedJobs.length === 0) {
    return null;
  }

  if (error) {
    return (
      <div className={`text-red-400 text-sm ${className}`}>
        Error loading queue: {error}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300">Active Generations</h3>
        <span className="text-xs text-zinc-500">
          {displayedJobs.filter((j) => j.status !== "complete").length} in progress
        </span>
      </div>

      <div className="space-y-2">
        {displayedJobs.map((job) => (
          <QueueJobCard key={job.requestId} job={job} />
        ))}
      </div>
    </div>
  );
}

function QueueJobCard({ job }: { job: QueueJob }) {
  const statusColors = {
    queued: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    complete: "bg-green-500/20 text-green-400 border-green-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const StatusIcon = () => {
    switch (job.status) {
      case "queued":
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case "complete":
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const progressBarColor = {
    queued: "bg-yellow-500",
    processing: "bg-blue-500",
    complete: "bg-green-500",
    failed: "bg-red-500",
  };

  const isActive = job.status === "queued" || job.status === "processing";

  const cardContent = (
    <>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <StatusIcon />
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium border ${statusColors[job.status]}`}
          >
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </span>
        </div>

        {job.status === "complete" && job.setId && (
          <Link
            to={`/sets/${job.setId}`}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
          >
            View Images
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}

        {job.status === "failed" && (
          <Link
            to="/create"
            className="text-xs text-zinc-400 hover:text-zinc-300 font-medium"
          >
            Try Again
          </Link>
        )}

        {isActive && (
          <Link
            to={`/processing/${job.requestId}`}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-300"
          >
            View Progress
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* Progress bar for active jobs */}
      {isActive && (
        <div className="mb-2">
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span className="truncate max-w-[200px]">{job.message || "Processing..."}</span>
            <span className="font-mono">{job.progress}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${progressBarColor[job.status]}`}
              style={{ width: `${Math.max(job.progress, 5)}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Error message for failed jobs */}
      {job.status === "failed" && job.error && (
        <p className="text-xs text-red-400 mt-1">{job.message || job.error}</p>
      )}

      {/* Success message */}
      {job.status === "complete" && (
        <p className="text-xs text-green-400 mt-1">
          {job.message || "Images generated successfully!"}
        </p>
      )}

      {/* Request ID */}
      <div className="mt-2 pt-2 border-t border-zinc-800">
        <span className="text-xs text-zinc-600 font-mono">
          {job.requestId.slice(0, 12)}...
        </span>
      </div>
    </>
  );

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
      {cardContent}
    </div>
  );
}

export default GenerationQueue;
