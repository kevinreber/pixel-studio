import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import {
  Search as SearchIcon,
  Compass,
  Image as ImageIcon,
  Video as VideoIcon,
  Heart,
  Bookmark,
} from "lucide-react";
import type { ExplorePageLoader } from "../routes/explore._index";
import type { MediaItem } from "~/server/getImages";
import { PageHeader, Segmented, Select, EmptyState, ArtTile, Button, Avatar } from "~/components/ps";
import { PaginationControls } from "~/components";
import { cn } from "@/lib/utils";

type MediaTypeFilter = "all" | "images" | "videos";
type SortKey = "trending" | "newest" | "liked";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "liked", label: "Most liked" },
];

// Filter taxonomies inlined here (not pulled from the route module) to avoid
// a circular import: routes/explore._index → pages/ExplorePage → routes/explore._index.
// Keep in sync with MODEL_FILTER_OPTIONS / TAG_FILTER_OPTIONS in routes/explore._index.tsx.
const MODEL_OPTIONS = [
  { value: "", label: "All models" },
  { value: "sd", label: "Stable Diffusion" },
  { value: "dall-e", label: "DALL-E" },
  { value: "flux", label: "Flux" },
  { value: "ideogram", label: "Ideogram" },
  { value: "runway", label: "Runway" },
  { value: "luma", label: "Luma" },
];

const TAG_OPTIONS = [
  { value: "", label: "All Tags" },
  { value: "person", label: "Person" },
  { value: "landscape", label: "Landscape" },
  { value: "abstract", label: "Abstract" },
  { value: "animal", label: "Animal" },
  { value: "architecture", label: "Architecture" },
  { value: "fantasy", label: "Fantasy" },
  { value: "sci-fi", label: "Sci-Fi" },
  { value: "portrait", label: "Portrait" },
  { value: "nature", label: "Nature" },
];

interface MasonryItem {
  id: string;
  href: string;
  prompt: string;
  /** Preferred URL — the resized thumbnail. */
  src: string;
  /** Original full-size URL; ArtTile retries with this if `src` 404s. */
  fallbackSrc?: string;
  isVideo?: boolean;
  user?: {
    id?: string;
    name?: string | null;
    username?: string | null;
    image?: string | null;
  } | null;
  likeCount?: number;
}

function ArtCard({ item }: { item: MasonryItem }) {
  return (
    <Link
      to={item.href}
      prefetch="intent"
      className="group relative mb-4 block break-inside-avoid overflow-hidden rounded-md border border-[var(--border)] bg-surface-2 transition-all duration-200 ease-ps hover:-translate-y-[3px] hover:border-border-accent hover:shadow-lg"
    >
      <ArtTile
        src={item.src}
        fallbackSrc={item.fallbackSrc}
        alt={item.prompt}
        isVideo={item.isVideo}
        radius=""
      />
      {/* Hover overlay */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/30 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <p className="line-clamp-2 text-[13px] font-medium text-white">
          {item.prompt}
        </p>
        <div className="mt-2 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Avatar
              name={item.user?.name || item.user?.username || "U"}
              src={item.user?.image}
              size={22}
            />
            <span className="text-[12px] font-medium">
              {item.user?.username || item.user?.name || "Anonymous"}
            </span>
          </div>
          {typeof item.likeCount === "number" && item.likeCount > 0 && (
            <span className="flex items-center gap-1 text-[12px]">
              <Heart className="h-3.5 w-3.5" />
              {item.likeCount}
            </span>
          )}
        </div>
      </div>
      {/* Quick actions */}
      <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <span className="grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur">
          <Heart className="h-3.5 w-3.5" />
        </span>
        <span className="grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur">
          <Bookmark className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

function toMasonry(items: MediaItem[]): MasonryItem[] {
  return items.map((raw) => {
    const it = raw as unknown as Record<string, unknown>;
    const id = String(it.id ?? "");
    const isVideo = "duration" in it || "videoUrl" in it || it.type === "video";
    const thumbnail =
      (it.thumbnailURL as string) || (it.thumbnailUrl as string) || "";
    const original =
      (it.url as string) || (it.videoUrl as string) || "";
    return {
      id,
      href: isVideo ? `/explore/video/${id}` : `/explore/${id}`,
      prompt:
        (it.prompt as string) ||
        (it.title as string) ||
        "Untitled creation",
      // Prefer the resized thumbnail; fall back to the original if 404.
      src: thumbnail || original,
      fallbackSrc: thumbnail && original && thumbnail !== original ? original : undefined,
      isVideo: Boolean(isVideo),
      user: (it.user as MasonryItem["user"]) ?? null,
      likeCount:
        ((it._count as { likes?: number } | undefined)?.likes as number) ??
        (it.likeCount as number | undefined),
    };
  });
}

export default function ExplorePage() {
  const data = useLoaderData<ExplorePageLoader>();
  const [params, setParams] = useSearchParams();

  const type = (params.get("type") || "all") as MediaTypeFilter;
  const model = params.get("model") || "";
  const sort = (params.get("sort") || "trending") as SortKey;
  const tag = params.get("tag") || "";
  const q = params.get("q") || "";

  const update = (next: Record<string, string>) => {
    const merged = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v) merged.set(k, v);
      else merged.delete(k);
    }
    merged.delete("page");
    setParams(merged, { preventScrollReset: true });
  };

  return (
    <div className="py-8">
      <PageHeader
        icon={<SearchIcon className="h-[20px] w-[20px]" strokeWidth={2} />}
        title="Explore"
        subtitle="Discover creations from the Pixel Studio community"
        actions={
          <div className="relative hidden md:block">
            <SearchIcon className="absolute left-3 top-1/2 h-[16px] w-[16px] -translate-y-1/2 text-fg-subtle" />
            <input
              type="text"
              defaultValue={q}
              placeholder="Search creations…"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  update({ q: (e.target as HTMLInputElement).value });
                }
              }}
              className="h-[38px] w-[260px] rounded-sm border border-border-strong bg-surface-2 pl-9 pr-3 text-[13.5px] text-fg placeholder:text-fg-subtle"
            />
          </div>
        }
      />

      {(() => {
        const r = data.imagesData as unknown as {
          items?: unknown[];
          pagination?: {
            totalCount?: number;
            currentPage?: number;
            totalPages?: number;
            hasNextPage?: boolean;
            hasPrevPage?: boolean;
          };
        };
        const items = toMasonry((r.items as MediaItem[]) || []);
        const totalCount = r.pagination?.totalCount ?? items.length;
        const pagination = r.pagination;

        return (
          <>
            {/* Filter row */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Segmented
                value={type}
                onChange={(v) => update({ type: v })}
                options={[
                  { value: "all", label: "All" },
                  {
                    value: "images",
                    label: "Images",
                    icon: <ImageIcon className="h-3.5 w-3.5" />,
                  },
                  {
                    value: "videos",
                    label: "Videos",
                    icon: <VideoIcon className="h-3.5 w-3.5" />,
                  },
                ]}
              />
              <Select
                value={model}
                onChange={(v) => update({ model: v })}
                options={MODEL_OPTIONS}
              />
              <Select
                value={sort}
                onChange={(v) => update({ sort: v })}
                options={SORT_OPTIONS}
              />
              <div className="ml-auto text-[12.5px] text-fg-subtle">
                <span className="mono font-semibold text-fg">
                  {totalCount.toLocaleString()}
                </span>{" "}
                results
              </div>
            </div>

            {/* Tag chip row */}
            <div className="mb-6 -mx-1 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TAG_OPTIONS.map((opt) => {
                const on = tag === opt.value;
                return (
                  <button
                    key={opt.value || "all"}
                    type="button"
                    onClick={() => update({ tag: opt.value })}
                    className={cn(
                      "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                      on
                        ? "border-border-accent bg-accent-soft text-[var(--accent-text)]"
                        : "border-[var(--border)] bg-surface-2 text-fg-muted hover:bg-surface-hover hover:text-fg",
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Masonry grid */}
            {items.length === 0 ? (
              <EmptyState
                icon={<Compass className="h-[27px] w-[27px]" strokeWidth={1.8} />}
                title="No creations match those filters"
                subtitle="Try clearing your filters or searching for something else."
                action={
                  <Button
                    variant="soft"
                    size="md"
                    onClick={() =>
                      setParams(new URLSearchParams(), {
                        preventScrollReset: true,
                      })
                    }
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <>
                <div className="columns-2 gap-4 [column-fill:_balance] sm:columns-3 lg:columns-4">
                  {items.map((item) => (
                    <ArtCard key={item.id} item={item} />
                  ))}
                </div>
                {pagination && (pagination.totalPages ?? 1) > 1 && (
                  <PaginationControls
                    currentPage={pagination.currentPage ?? 1}
                    totalPages={pagination.totalPages ?? 1}
                    hasNextPage={pagination.hasNextPage ?? false}
                    hasPrevPage={pagination.hasPrevPage ?? false}
                    basePath="/explore"
                    searchTerm={q}
                    className="mt-10"
                  />
                )}
              </>
            )}
          </>
        );
      })()}
    </div>
  );
}
