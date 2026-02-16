import { Badge } from "components/ui/badge";
import {
  buildLogs,
  getCategoryLabel,
  type BuildLogEntry,
} from "~/config/buildLogs";
import { Sparkles, TrendingUp, Bug, Megaphone } from "lucide-react";

function getCategoryStyles(category: BuildLogEntry["category"]): string {
  switch (category) {
    case "feature":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "improvement":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "fix":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    case "announcement":
      return "bg-purple-500/15 text-purple-400 border-purple-500/30";
  }
}

function getCategoryIcon(category: BuildLogEntry["category"]) {
  const className = "h-4 w-4";
  switch (category) {
    case "feature":
      return <Sparkles className={className} />;
    case "improvement":
      return <TrendingUp className={className} />;
    case "fix":
      return <Bug className={className} />;
    case "announcement":
      return <Megaphone className={className} />;
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function BuildLogCard({ entry }: { entry: BuildLogEntry }) {
  return (
    <div className="relative pl-8 pb-8 last:pb-0">
      {/* Timeline dot */}
      <div className="absolute left-0 top-1 h-3 w-3 rounded-full bg-zinc-600 ring-4 ring-zinc-900" />

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <Badge className={getCategoryStyles(entry.category)}>
            <span className="mr-1.5 flex items-center">
              {getCategoryIcon(entry.category)}
            </span>
            {getCategoryLabel(entry.category)}
          </Badge>
          <span className="text-sm text-zinc-500">{formatDate(entry.date)}</span>
        </div>

        <h3 className="text-lg font-semibold text-zinc-100 mb-2">
          {entry.title}
        </h3>

        <p className="text-zinc-400 mb-4 leading-relaxed">
          {entry.description}
        </p>

        {entry.highlights && entry.highlights.length > 0 && (
          <ul className="space-y-1.5">
            {entry.highlights.map((highlight) => (
              <li
                key={highlight}
                className="flex items-start gap-2 text-sm text-zinc-300"
              >
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-zinc-500" />
                {highlight}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function WhatsNewPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">What&apos;s New</h1>
        <p className="text-zinc-400">
          The latest features and updates on Pixel Studio
        </p>
      </div>

      {/* Timeline */}
      <div className="relative border-l border-zinc-800 ml-1.5">
        {buildLogs.map((entry) => (
          <BuildLogCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
