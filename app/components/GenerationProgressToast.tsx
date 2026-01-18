import { Link } from "@remix-run/react";
import { Image, Video, Loader2, CheckCircle2, XCircle, X, ExternalLink } from "lucide-react";
import type { GenerationJob } from "~/contexts/GenerationProgressContext";

interface GenerationProgressToastProps {
  job: GenerationJob;
  onDismiss: () => void;
}

export function GenerationProgressToast({ job, onDismiss }: GenerationProgressToastProps) {
  const isComplete = job.status === "complete";
  const isFailed = job.status === "failed";
  const isProcessing = job.status === "processing" || job.status === "queued";

  const getStatusIcon = () => {
    if (isComplete) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    if (isFailed) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
  };

  const getTypeIcon = () => {
    if (job.type === "video") {
      return <Video className="w-4 h-4 text-purple-400" />;
    }
    return <Image className="w-4 h-4 text-pink-400" />;
  };

  const getStatusText = () => {
    if (isComplete) {
      return job.type === "video" ? "Video ready!" : "Images ready!";
    }
    if (isFailed) {
      return "Generation failed";
    }
    if (job.status === "queued") {
      return "Queued...";
    }
    return job.message || (job.type === "video" ? "Generating video..." : "Generating images...");
  };

  const getProgressColor = () => {
    if (isComplete) return "bg-green-500";
    if (isFailed) return "bg-red-500";
    return "bg-blue-500";
  };

  const truncatePrompt = (prompt: string, maxLength: number = 40) => {
    if (!prompt) return "";
    if (prompt.length <= maxLength) return prompt;
    return prompt.slice(0, maxLength) + "...";
  };

  return (
    <div className="w-[360px] bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50">
        <div className="flex items-center gap-2">
          {getTypeIcon()}
          <span className="text-sm font-medium text-zinc-200">
            {job.type === "video" ? "Video Generation" : "Image Generation"}
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-zinc-700 rounded transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          {getStatusIcon()}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${
              isFailed ? "text-red-400" : isComplete ? "text-green-400" : "text-zinc-200"
            }`}>
              {getStatusText()}
            </p>
            {job.prompt && (
              <p className="text-xs text-zinc-500 mt-1 truncate">
                {truncatePrompt(job.prompt)}
              </p>
            )}
            {isFailed && job.error && (
              <p className="text-xs text-red-400/80 mt-1">
                {job.error}
              </p>
            )}
          </div>
          {isProcessing && (
            <span className="text-sm font-mono text-zinc-400">
              {job.progress}%
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="mt-3">
            <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressColor()}`}
                style={{ width: `${Math.max(job.progress, 5)}%` }}
              />
            </div>
          </div>
        )}

        {/* Completed Actions */}
        {isComplete && job.setId && (
          <div className="mt-3">
            <Link
              to={`/sets/${job.setId}`}
              onClick={onDismiss}
              className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              View {job.type === "video" ? "video" : "images"}
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Failed Actions */}
        {isFailed && (
          <div className="mt-3">
            <Link
              to={job.type === "video" ? "/create-video" : "/create"}
              onClick={onDismiss}
              className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
            >
              Try again
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
