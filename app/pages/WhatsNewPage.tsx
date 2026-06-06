import { Sparkles, TrendingUp, Bug, Megaphone } from "lucide-react";
import {
  buildLogs,
  getCategoryLabel,
  type BuildLogEntry,
} from "~/config/buildLogs";
import { PageHeader, Badge } from "~/components/ps";

type Category = BuildLogEntry["category"];

const TONE_BY_CATEGORY: Record<Category, "success" | "info" | "warning" | "accent"> = {
  feature: "success",
  improvement: "info",
  fix: "warning",
  announcement: "accent",
};

function getCategoryIcon(category: Category) {
  const cls = "h-3 w-3";
  switch (category) {
    case "feature":
      return <Sparkles className={cls} strokeWidth={2.4} />;
    case "improvement":
      return <TrendingUp className={cls} strokeWidth={2.4} />;
    case "fix":
      return <Bug className={cls} strokeWidth={2.4} />;
    case "announcement":
      return <Megaphone className={cls} strokeWidth={2.4} />;
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

function TimelineEntry({
  entry,
  isFirst,
}: {
  entry: BuildLogEntry;
  isFirst: boolean;
}) {
  const tone = TONE_BY_CATEGORY[entry.category];
  return (
    <div className="relative pb-10 pl-10 last:pb-0">
      {/* Timeline dot */}
      <div
        className="absolute left-[14px] top-2 grid h-3 w-3 -translate-x-1/2 place-items-center rounded-full bg-[var(--accent)]"
        aria-hidden
      />
      <article
        className={
          "rounded-lg border bg-surface-1 p-5 transition-colors " +
          (isFirst
            ? "border-border-accent shadow-md"
            : "border-[var(--border)]")
        }
      >
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <Badge tone={tone} icon={getCategoryIcon(entry.category)}>
            {getCategoryLabel(entry.category)}
          </Badge>
          <span className="text-[12.5px] text-fg-subtle">
            {formatDate(entry.date)}
          </span>
          <span className="mono ml-auto rounded-sm bg-surface-3 px-2 py-0.5 text-[11px] text-fg-muted">
            {entry.id}
          </span>
        </div>
        <h3 className="mb-2 text-[17px] font-semibold tracking-[-0.01em] text-fg">
          {entry.title}
        </h3>
        <p className="mb-3 text-[14px] leading-[1.6] text-fg-muted">
          {entry.description}
        </p>
        {entry.highlights && entry.highlights.length > 0 && (
          <ul className="space-y-1.5">
            {entry.highlights.map((highlight) => (
              <li
                key={highlight}
                className="flex items-start gap-2 text-[13.5px] text-fg"
              >
                <span className="mt-[7px] h-1 w-1 flex-shrink-0 rounded-full bg-[var(--accent)]" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  );
}

export default function WhatsNewPage() {
  return (
    <div className="mx-auto max-w-3xl py-8">
      <PageHeader
        icon={<Sparkles className="h-[20px] w-[20px]" strokeWidth={2} />}
        title="What's new"
        subtitle="The latest features and updates on Pixel Studio"
      />
      <div className="relative ml-3.5 border-l border-[var(--border)]">
        {buildLogs.map((entry, idx) => (
          <TimelineEntry key={entry.id} entry={entry} isFirst={idx === 0} />
        ))}
      </div>
    </div>
  );
}
