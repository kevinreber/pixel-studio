import * as React from "react";
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import {
  Video as VideoIcon,
  Sparkles,
  Coins,
  Loader2,
  Check,
  AlertTriangle,
  Compass,
  Play,
} from "lucide-react";
import { PageHeader, Button, Badge, Segmented, Select } from "~/components/ps";
import { ImagePicker } from "~/components/ImagePicker";
import { useLoggedInUser } from "~/hooks";
import type { CreateVideoPageLoader } from "~/routes/create-video";
import {
  calculateVideoCreditCost,
  type VideoModelOption,
  type VideoGenerationMode,
} from "~/config/videoModels";
import { cn } from "@/lib/utils";

type Mode = VideoGenerationMode;

interface ActionResponse {
  success: boolean;
  async?: boolean;
  requestId?: string;
  processingUrl?: string;
  error?: string;
  message?: string;
}

export default function CreateVideoPageRedesigned() {
  const { modelOptions, aspectRatioOptions, durationOptions } =
    useLoaderData<CreateVideoPageLoader>();
  const fetcher = useFetcher<ActionResponse>();
  const user = useLoggedInUser();
  const navigate = useNavigate();
  const balance = (user as { credits?: number } | null)?.credits ?? 0;

  const [prompt, setPrompt] = React.useState("");
  const [selectedModel, setSelectedModel] = React.useState<string>(
    modelOptions[0]?.value || "",
  );
  const [mode, setMode] = React.useState<Mode>("text-to-video");
  const [duration, setDuration] = React.useState<number>(
    Number(durationOptions[0]?.value) || 4,
  );
  const [aspect, setAspect] = React.useState<string>(
    aspectRatioOptions[0]?.value || "16:9",
  );
  const [providerFilter, setProviderFilter] = React.useState<string>("All");
  const [sourceImageUrl, setSourceImageUrl] = React.useState("");
  const [sourceImageId, setSourceImageId] = React.useState("");

  const model =
    modelOptions.find((m) => m.value === selectedModel) || modelOptions[0];

  const providers = React.useMemo(() => {
    const set = new Set<string>(["All"]);
    modelOptions.forEach((m) => set.add(m.company));
    return Array.from(set);
  }, [modelOptions]);

  const filteredModels = React.useMemo(() => {
    if (providerFilter === "All") return modelOptions;
    return modelOptions.filter((m) => m.company === providerFilter);
  }, [modelOptions, providerFilter]);

  const supportedModes = (model?.supportedModes as Mode[]) || ["text-to-video"];
  // Auto-shift mode if current selection isn't supported by the model.
  React.useEffect(() => {
    if (supportedModes.length > 0 && !supportedModes.includes(mode)) {
      setMode(supportedModes[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel]);

  const totalCost = model
    ? calculateVideoCreditCost(model as VideoModelOption, duration)
    : 0;
  const overBudget = totalCost > balance;
  const submitting = fetcher.state !== "idle";
  const generating = submitting && !fetcher.data;
  const done = fetcher.data?.success && !!fetcher.data?.requestId;

  React.useEffect(() => {
    if (done && fetcher.data?.processingUrl) {
      navigate(fetcher.data.processingUrl);
    }
  }, [done, fetcher.data, navigate]);

  const requiresSourceImage =
    supportedModes.length === 1 && supportedModes[0] === "image-to-video";
  const needsSourceImage = mode === "image-to-video" || requiresSourceImage;
  const missingSourceImage = needsSourceImage && !sourceImageUrl;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (overBudget || missingSourceImage) return;
    const fd = new FormData();
    fd.set("prompt", prompt);
    fd.set("model", selectedModel);
    fd.set("duration", String(duration));
    fd.set("aspectRatio", aspect);
    if (needsSourceImage) {
      fd.set("sourceImageUrl", sourceImageUrl);
      if (sourceImageId) fd.set("sourceImageId", sourceImageId);
    }
    fetcher.submit(fd, { method: "post", action: "/create-video" });
  }

  return (
    <div className="py-8">
      <PageHeader
        icon={<VideoIcon className="h-[20px] w-[20px]" strokeWidth={2} />}
        title="Create video"
        subtitle="Generate motion from a prompt or animate an existing image."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[388px_1fr]">
        {/* Left composer */}
        <form
          onSubmit={onSubmit}
          // Sticky composer, but cap height at viewport and let contents scroll.
          className="sticky top-[58px] flex max-h-[calc(100vh-72px)] flex-col gap-4 overflow-y-auto rounded-lg border border-[var(--border)] bg-surface-1 p-5"
        >
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="ps-video-prompt"
                className="text-[13px] font-semibold text-fg"
              >
                Prompt
              </label>
              <span className="mono text-[11.5px] text-fg-subtle">
                {prompt.length}/500
              </span>
            </div>
            <textarea
              id="ps-video-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
              rows={4}
              placeholder="A drone shot pulling back from a snowy mountain peak at golden hour…"
              className="w-full resize-none rounded-sm border border-border-strong bg-surface-inset px-3 py-2.5 font-sans text-[14px] leading-[1.55] text-fg placeholder:text-fg-subtle"
            />
          </div>

          {/* Selected model summary */}
          <div>
            <div className="u-label mb-2">Model</div>
            <div className="flex items-center gap-3 rounded-sm border border-border-strong bg-surface-2 p-2.5">
              <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-sm bg-surface-3">
                {model?.image && (
                  <img
                    src={model.image}
                    alt={model.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-semibold text-fg">
                  {model?.name}
                </div>
                <div className="truncate text-[11.5px] text-fg-subtle">
                  {model?.company} · {model?.baseCreditCost} + {model?.perSecondCreditCost}/s
                </div>
              </div>
            </div>
          </div>

          {/* Mode */}
          {supportedModes.length > 1 && (
            <div>
              <div className="u-label mb-2">Mode</div>
              <Segmented
                value={mode}
                onChange={(v) => setMode(v as Mode)}
                options={supportedModes.map((m) => ({
                  value: m,
                  label: m === "text-to-video" ? "Text" : "Image",
                }))}
              />
            </div>
          )}

          {/* Source image — only for image-to-video. ImagePicker opens the
              user's recent generations as a dialog; URL field is the fallback. */}
          {needsSourceImage && (
            <div>
              <div className="u-label mb-2">Source image</div>
              <ImagePicker
                onSelect={(img) => {
                  if (img) {
                    setSourceImageUrl(img.url);
                    setSourceImageId(img.id);
                  } else {
                    setSourceImageUrl("");
                    setSourceImageId("");
                  }
                }}
                selectedImageUrl={sourceImageUrl}
                disabled={submitting}
              />
              <div className="mt-2 text-[11.5px] text-fg-subtle">
                Or paste a URL:
              </div>
              <input
                type="url"
                inputMode="url"
                placeholder="https://example.com/image.jpg"
                value={sourceImageUrl}
                onChange={(e) => {
                  setSourceImageUrl(e.target.value);
                  setSourceImageId("");
                }}
                disabled={submitting}
                className="mt-1 h-[38px] w-full rounded-sm border border-border-strong bg-surface-inset px-3 text-[13.5px] text-fg placeholder:text-fg-subtle"
              />
            </div>
          )}

          {/* Aspect */}
          <div>
            <div className="u-label mb-2">Aspect ratio</div>
            <div className="grid grid-cols-3 gap-2">
              {aspectRatioOptions.map((a) => {
                const on = aspect === a.value;
                return (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setAspect(a.value)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 rounded-sm border py-2.5 text-[11.5px] font-semibold transition-colors",
                      on
                        ? "border-[var(--accent)] bg-accent-soft text-[var(--accent-text)]"
                        : "border-border-strong bg-surface-2 text-fg-muted hover:bg-surface-hover",
                    )}
                  >
                    <span
                      className={cn(
                        "rounded-xs border-2",
                        on ? "border-[var(--accent)]" : "border-fg-faint",
                      )}
                      style={
                        a.value === "16:9"
                          ? { width: 26, height: 14 }
                          : a.value === "9:16"
                            ? { width: 14, height: 26 }
                            : { width: 20, height: 20 }
                      }
                    />
                    {a.value}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration */}
          <div>
            <div className="u-label mb-2">Duration</div>
            <div className="grid grid-cols-4 gap-2">
              {durationOptions.map((d) => {
                const v = Number(d.value);
                const enabled =
                  !model ||
                  (v >= (model.minDuration ?? 0) &&
                    v <= (model.maxDuration ?? Infinity));
                const on = duration === v;
                return (
                  <button
                    key={String(v)}
                    type="button"
                    disabled={!enabled}
                    onClick={() => setDuration(v)}
                    className={cn(
                      "rounded-sm border py-2 text-[13px] font-semibold transition-colors",
                      on
                        ? "border-[var(--accent)] bg-accent-soft text-[var(--accent-text)]"
                        : "border-border-strong bg-surface-2 text-fg-muted hover:bg-surface-hover",
                      !enabled && "cursor-not-allowed opacity-40",
                    )}
                  >
                    {v}s
                  </button>
                );
              })}
            </div>
          </div>

          {/* OOC banner */}
          {overBudget && (
            <div className="flex items-start gap-2 rounded-sm border border-danger/40 bg-danger-soft p-3 text-[12.5px] text-danger">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Not enough credits — needs {totalCost}, you have {balance}.
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="mt-2 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
            <div className="flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-fg-subtle" />
              <span
                className={cn(
                  "mono text-[15px] font-semibold",
                  overBudget ? "text-danger" : "text-fg",
                )}
              >
                {totalCost}
              </span>
              <span className="mono text-[11.5px] text-fg-subtle">
                {model?.baseCreditCost}+{duration}×{model?.perSecondCreditCost}
              </span>
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={
                submitting || !prompt.trim() || overBudget || missingSourceImage
              }
              icon={
                generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )
              }
            >
              {generating
                ? "Generating…"
                : overBudget
                  ? "Insufficient credits"
                  : missingSourceImage
                    ? "Pick a source image"
                    : "Generate video"}
            </Button>
          </div>
        </form>

        {/* Right gallery */}
        <div className="flex flex-col">
          {generating || done ? (
            <GenerationPanel
              prompt={prompt}
              modelName={model?.name || ""}
              duration={duration}
              done={!!done}
            />
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[18px] font-semibold tracking-[-0.01em]">
                  Choose a model
                  <span className="mono ml-2 text-[11.5px] text-fg-subtle">
                    {filteredModels.length}
                  </span>
                </h2>
                <div className="min-w-[180px]">
                  <Select
                    value={providerFilter}
                    onChange={setProviderFilter}
                    options={providers.map((p) => ({
                      value: p,
                      label: p === "All" ? "All providers" : p,
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2">
                {filteredModels.map((m) => {
                  const on = selectedModel === m.value;
                  const tag = m.perSecondCreditCost <= 2 ? "Fast" : "Pro";
                  const tone: "success" | "info" = tag === "Fast" ? "success" : "info";
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setSelectedModel(m.value)}
                      className={cn(
                        "group relative overflow-hidden rounded-lg border bg-surface-1 text-left transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md",
                        on
                          ? "border-[var(--accent)] shadow-glow"
                          : "border-[var(--border)] hover:border-border-strong",
                      )}
                    >
                      <div className="relative h-[180px] overflow-hidden bg-surface-3">
                        {m.image && (
                          <img
                            src={m.image}
                            alt={m.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                        <span className="absolute left-3 top-3">
                          <Badge
                            tone="neutral"
                            icon={<Coins className="h-3 w-3" />}
                          >
                            {m.baseCreditCost}+{m.perSecondCreditCost}/s
                          </Badge>
                        </span>
                        <span className="absolute left-3 top-12">
                          <Badge tone="info">
                            <Play className="h-2.5 w-2.5" strokeWidth={2.4} />{" "}
                            {m.minDuration}–{m.maxDuration}s
                          </Badge>
                        </span>
                        {on && (
                          <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-[var(--accent)] text-white">
                            <Check
                              className="h-3.5 w-3.5"
                              strokeWidth={2.6}
                            />
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5 p-4">
                        <div className="font-semibold text-fg">{m.name}</div>
                        <div className="flex items-center gap-2 text-[12px] text-fg-subtle">
                          {m.company}
                          <Badge tone={tone}>{tag}</Badge>
                        </div>
                        <p className="line-clamp-2 text-[13px] leading-[1.45] text-fg-muted">
                          {m.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function GenerationPanel({
  prompt,
  modelName,
  duration,
  done,
}: {
  prompt: string;
  modelName: string;
  duration: number;
  done: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-surface-1 p-6">
      <div className="mb-4 flex items-center gap-3">
        {done ? (
          <span className="grid h-9 w-9 place-items-center rounded-full bg-success-soft text-success">
            <Check className="h-5 w-5" strokeWidth={2.4} />
          </span>
        ) : (
          <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft text-[var(--accent-text)]">
            <Loader2 className="h-5 w-5 animate-spin" />
          </span>
        )}
        <div>
          <div className="text-[15px] font-semibold">
            {done ? "Video ready" : "Generating video…"}
          </div>
          <div className="text-[12.5px] text-fg-subtle">
            {modelName} · {duration}s
          </div>
        </div>
      </div>
      <p className="mb-5 line-clamp-3 rounded-sm border border-[var(--border)] bg-surface-inset p-3 text-[13.5px] text-fg-muted">
        {prompt}
      </p>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface-inset">
        <div
          className={cn(
            "h-full rounded-full bg-[var(--accent)] transition-[width] duration-500",
            done ? "w-full" : "w-1/2 animate-pulse",
          )}
        />
      </div>
      <div className="aspect-video w-full overflow-hidden rounded-md border border-[var(--border)] bg-[linear-gradient(110deg,var(--surface-2)_8%,var(--surface-3)_18%,var(--surface-2)_33%)] [background-size:200%_100%]" />
      {!done && (
        <p className="mt-4 flex items-center justify-center gap-1.5 text-[12.5px] text-fg-subtle">
          <Compass className="h-3.5 w-3.5" /> Video generation typically takes a
          few minutes — we&apos;ll notify you when it&apos;s ready.
        </p>
      )}
    </div>
  );
}
