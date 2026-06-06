import * as React from "react";
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import {
  Wand2,
  Sparkles,
  Shuffle,
  ChevronDown,
  Minus,
  Plus,
  Coins,
  Loader2,
  Check,
  Compass,
  AlertTriangle,
} from "lucide-react";
import { PageHeader, Button, Badge, Select, Segmented } from "~/components/ps";
import { GenerationQueue } from "~/components/GenerationQueue";
import { useLoggedInUser } from "~/hooks";
import type { CreatePageLoader, ActionData } from "~/routes/create";
import type { ModelOption, StyleOption } from "~/config/models";
import { cn } from "@/lib/utils";

type Aspect = "1:1" | "4:3" | "3:4" | "16:9";

const ASPECTS: { value: Aspect; label: string; dim: string; w: number; h: number }[] = [
  { value: "1:1", label: "1:1", dim: "1024×1024", w: 1024, h: 1024 },
  { value: "4:3", label: "4:3", dim: "1152×896", w: 1152, h: 896 },
  { value: "3:4", label: "3:4", dim: "896×1152", w: 896, h: 1152 },
  { value: "16:9", label: "16:9", dim: "1344×768", w: 1344, h: 768 },
];

const PROVIDER_TAGS: Record<string, "Flagship" | "Pro" | "Fast" | "Value"> = {
  "sd3.5-large": "Flagship",
  "sd3.5-large-turbo": "Fast",
  "sd3.5-medium": "Value",
  "stable-image-core": "Value",
  "stable-image-ultra": "Pro",
  "flux-pro-1.1": "Pro",
  "flux-dev": "Fast",
  "dalle-3": "Flagship",
  "dalle-2": "Value",
  "ideogram-v2": "Pro",
  "ideogram-v2-turbo": "Fast",
};

function pickTag(m: ModelOption): "Flagship" | "Pro" | "Fast" | "Value" {
  return PROVIDER_TAGS[m.value] || (m.creditCost >= 5 ? "Pro" : m.creditCost <= 2 ? "Fast" : "Value");
}

function providerOf(m: ModelOption): string {
  return m.company || "Other";
}

const isStabilityAIModel = (v: string) =>
  v.includes("stable-diffusion") ||
  v.startsWith("sd") ||
  v.startsWith("stable-image");
const isDallE3Model = (v: string) => v === "dall-e-3";
const isFluxProModel = (v: string) => v === "flux-pro-1.1";

export default function CreatePageRedesigned() {
  const { modelOptions, styleOptions } = useLoaderData<CreatePageLoader>();
  const fetcher = useFetcher<ActionData>();
  const user = useLoggedInUser();
  const navigate = useNavigate();

  const balance = (user as { credits?: number } | null)?.credits ?? 0;

  const [prompt, setPrompt] = React.useState("");
  const [selectedModel, setSelectedModel] = React.useState<string>(
    modelOptions[0]?.value || "",
  );
  const [aspect, setAspect] = React.useState<Aspect>("1:1");
  const [count, setCount] = React.useState(1);
  const [style, setStyle] = React.useState<string>("none");
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const [negativePrompt, setNegativePrompt] = React.useState("");
  const [seed, setSeed] = React.useState<string>("");
  const [compareMode, setCompareMode] = React.useState(false);
  const [compareSet, setCompareSet] = React.useState<string[]>([]);
  const [providerFilter, setProviderFilter] = React.useState<string>("All");
  // Model-specific advanced controls
  const [quality, setQuality] = React.useState<"standard" | "hd">("standard");
  const [generationStyle, setGenerationStyle] = React.useState<
    "vivid" | "natural"
  >("vivid");
  const [cfgScale, setCfgScale] = React.useState(7);
  const [steps, setSteps] = React.useState(40);
  const [promptUpsampling, setPromptUpsampling] = React.useState(false);

  const model = modelOptions.find((m) => m.value === selectedModel) || modelOptions[0];
  const aspectChoice = ASPECTS.find((a) => a.value === aspect) ?? ASPECTS[0];
  const providers = React.useMemo(() => {
    const set = new Set<string>(["All"]);
    modelOptions.forEach((m) => set.add(providerOf(m as ModelOption)));
    return Array.from(set);
  }, [modelOptions]);

  const filteredModels = React.useMemo(() => {
    if (providerFilter === "All") return modelOptions;
    return modelOptions.filter((m) => providerOf(m as ModelOption) === providerFilter);
  }, [modelOptions, providerFilter]);

  const totalCost = React.useMemo(() => {
    if (compareMode && compareSet.length > 0) {
      return compareSet.reduce((sum, v) => {
        const m = modelOptions.find((x) => x.value === v);
        return sum + (m?.creditCost ?? 0) * count;
      }, 0);
    }
    return (model?.creditCost ?? 0) * count;
  }, [compareMode, compareSet, modelOptions, model, count]);

  const overBudget = totalCost > balance;
  const submitting = fetcher.state !== "idle";
  const generating = submitting && !fetcher.data;
  const done = fetcher.data?.success && !!fetcher.data?.requestId;

  React.useEffect(() => {
    // If async path returned, hop to the processing page so the existing
    // progress page handles the rest.
    if (done && fetcher.data?.processingUrl) {
      navigate(fetcher.data.processingUrl);
    }
  }, [done, fetcher.data, navigate]);

  function toggleCompareModel(v: string) {
    setCompareSet((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v].slice(0, 4),
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (overBudget) return;

    const fd = new FormData();
    fd.set("prompt", prompt);
    fd.set("numberOfImages", String(count));
    fd.set("width", String(aspectChoice.w));
    fd.set("height", String(aspectChoice.h));
    if (style && style !== "none") fd.set("style", style);
    if (negativePrompt) fd.set("negativePrompt", negativePrompt);
    if (seed) fd.set("seed", seed);

    // Model-specific extras only sent when the active model supports them.
    if (isDallE3Model(selectedModel)) {
      fd.set("quality", quality);
      fd.set("generationStyle", generationStyle);
    }
    if (isStabilityAIModel(selectedModel)) {
      fd.set("cfgScale", String(cfgScale));
      fd.set("steps", String(steps));
    }
    if (isFluxProModel(selectedModel)) {
      fd.set("promptUpsampling", String(promptUpsampling));
    }

    if (compareMode && compareSet.length >= 2) {
      fd.set("comparisonMode", "true");
      fd.set("models", JSON.stringify(compareSet));
    } else {
      fd.set("model", selectedModel);
    }
    fetcher.submit(fd, { method: "post", action: "/create" });
  }

  function surpriseMe() {
    const samples = [
      "A bioluminescent forest at night, floating spores, cinematic volumetric light",
      "Cyberpunk Tokyo street market in heavy rain, neon reflections",
      "Astronaut tending a garden on Mars, wide cinematic, golden hour",
      "Oil painting of a cozy mountain cabin in winter snowfall",
    ];
    setPrompt(samples[Math.floor(Math.random() * samples.length)]);
  }

  return (
    <div className="py-8">
      <PageHeader
        icon={<Wand2 className="h-[20px] w-[20px]" strokeWidth={2} />}
        title="Create images"
        subtitle="Describe an idea, pick a model, and generate."
        actions={
          <Button
            variant={compareMode ? "soft" : "outline"}
            size="md"
            icon={<Shuffle className="h-4 w-4" />}
            onClick={() => setCompareMode((v) => !v)}
          >
            Compare models
          </Button>
        }
      />

      {/* Active generation jobs — inline card preserves the pre-redesign UX. */}
      <GenerationQueue showCompleted={false} maxJobs={5} className="mb-6" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[388px_1fr]">
        {/* Left composer */}
        <form
          onSubmit={onSubmit}
          // Sticky composer, but cap its height at viewport minus the top bar
          // and let it scroll its own contents. Without this, expanding
          // Advanced options pushes the Generate button below the fold and
          // the user can't reach it because the sticky positioning blocks
          // page scroll inside the column.
          className="sticky top-[58px] flex max-h-[calc(100vh-72px)] flex-col gap-4 overflow-y-auto rounded-lg border border-[var(--border)] bg-surface-1 p-5"
        >
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="ps-prompt" className="text-[13px] font-semibold text-fg">
                Prompt
              </label>
              <span className="mono text-[11.5px] text-fg-subtle">
                {prompt.length}/500
              </span>
            </div>
            <textarea
              id="ps-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
              rows={4}
              placeholder="A bioluminescent forest at night, floating spores, cinematic volumetric light…"
              className="w-full resize-none rounded-sm border border-border-strong bg-surface-inset px-3 py-2.5 font-sans text-[14px] leading-[1.55] text-fg placeholder:text-fg-subtle"
            />
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="soft"
                icon={<Sparkles className="h-[14px] w-[14px]" />}
                onClick={() => setPrompt((p) => p + (p ? " " : "") + "highly detailed, 8k, dramatic lighting")}
              >
                Enhance
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                icon={<Shuffle className="h-[14px] w-[14px]" />}
                onClick={surpriseMe}
              >
                Surprise me
              </Button>
            </div>
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
                  {compareMode && compareSet.length > 0
                    ? `${compareSet.length} models selected`
                    : model?.name}
                </div>
                <div className="truncate text-[11.5px] text-fg-subtle">
                  {compareMode ? "Comparison mode" : `${providerOf(model as ModelOption)} · ${model?.creditCost} cr`}
                </div>
              </div>
            </div>
          </div>

          {/* Aspect ratio */}
          <div>
            <div className="u-label mb-2">Aspect ratio</div>
            <div className="grid grid-cols-4 gap-2">
              {ASPECTS.map((a) => {
                const on = aspect === a.value;
                return (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setAspect(a.value)}
                    className={cn(
                      "flex aspect-square flex-col items-center justify-center gap-1 rounded-sm border text-[11.5px] font-semibold transition-colors",
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
                        a.value === "1:1"
                          ? { width: 18, height: 18 }
                          : a.value === "4:3"
                            ? { width: 22, height: 16 }
                            : a.value === "3:4"
                              ? { width: 16, height: 22 }
                              : { width: 26, height: 14 }
                      }
                    />
                    {a.label}
                  </button>
                );
              })}
            </div>
            <div className="mono mt-2 text-center text-[11.5px] text-fg-subtle">
              {aspectChoice.dim}
            </div>
          </div>

          {/* Count + style */}
          <div className="grid grid-cols-[120px_1fr] gap-3">
            <div>
              <div className="u-label mb-2">Images</div>
              <div className="flex items-center justify-between rounded-sm border border-border-strong bg-surface-2 px-2 py-1.5">
                <button
                  type="button"
                  className="grid h-7 w-7 place-items-center rounded-xs text-fg-muted hover:bg-surface-hover hover:text-fg"
                  onClick={() => setCount((c) => Math.max(1, c - 1))}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="mono text-[14px] font-semibold">{count}</span>
                <button
                  type="button"
                  className="grid h-7 w-7 place-items-center rounded-xs text-fg-muted hover:bg-surface-hover hover:text-fg"
                  onClick={() => setCount((c) => Math.min(10, c + 1))}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div>
              <div className="u-label mb-2">Style</div>
              <Select
                value={style}
                onChange={setStyle}
                options={[
                  { value: "none", label: "None" },
                  ...((styleOptions as StyleOption[]) || []).map((s) => ({
                    value: s.value,
                    label: s.name,
                  })),
                ]}
              />
            </div>
          </div>

          {/* Advanced */}
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="flex items-center justify-between rounded-sm border border-[var(--border)] bg-surface-2 px-3 py-2 text-[13px] font-semibold text-fg-muted hover:text-fg"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" /> Advanced options
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                advancedOpen && "rotate-180",
              )}
            />
          </button>
          {advancedOpen && (
            <div className="flex flex-col gap-3">
              <div>
                <div className="u-label mb-2">Negative prompt</div>
                <textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-sm border border-border-strong bg-surface-inset px-3 py-2 text-[13.5px] text-fg"
                />
              </div>
              <div>
                <div className="u-label mb-2">Seed</div>
                <input
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Random"
                  className="mono h-[38px] w-full rounded-sm border border-border-strong bg-surface-inset px-3 text-[14px] text-fg"
                />
              </div>

              {/* DALL-E 3 only: quality + generationStyle */}
              {isDallE3Model(selectedModel) && (
                <>
                  <div>
                    <div className="u-label mb-2">Quality</div>
                    <Segmented
                      value={quality}
                      onChange={(v) => setQuality(v as "standard" | "hd")}
                      options={[
                        { value: "standard", label: "Standard" },
                        { value: "hd", label: "HD" },
                      ]}
                    />
                  </div>
                  <div>
                    <div className="u-label mb-2">Style</div>
                    <Segmented
                      value={generationStyle}
                      onChange={(v) =>
                        setGenerationStyle(v as "vivid" | "natural")
                      }
                      options={[
                        { value: "vivid", label: "Vivid" },
                        { value: "natural", label: "Natural" },
                      ]}
                    />
                  </div>
                </>
              )}

              {/* Stability AI: CFG scale + steps */}
              {isStabilityAIModel(selectedModel) && (
                <>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="u-label">CFG scale</span>
                      <span className="mono text-[12px] text-fg-subtle">
                        {cfgScale}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={35}
                      step={0.5}
                      value={cfgScale}
                      onChange={(e) => setCfgScale(Number(e.target.value))}
                      className="w-full accent-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="u-label">Steps</span>
                      <span className="mono text-[12px] text-fg-subtle">
                        {steps}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={50}
                      step={1}
                      value={steps}
                      onChange={(e) => setSteps(Number(e.target.value))}
                      className="w-full accent-[var(--accent)]"
                    />
                  </div>
                </>
              )}

              {/* Flux Pro: prompt upsampling */}
              {isFluxProModel(selectedModel) && (
                <div className="flex items-center justify-between gap-3 rounded-sm border border-[var(--border)] bg-surface-2 px-3 py-2.5">
                  <div>
                    <label
                      htmlFor="ps-prompt-upsampling"
                      className="block text-[13px] font-semibold text-fg"
                    >
                      Prompt upsampling
                    </label>
                    <div className="text-[11.5px] text-fg-subtle">
                      Auto-expand brief prompts before generation
                    </div>
                  </div>
                  <input
                    id="ps-prompt-upsampling"
                    type="checkbox"
                    checked={promptUpsampling}
                    onChange={(e) => setPromptUpsampling(e.target.checked)}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                </div>
              )}
            </div>
          )}

          {/* Insufficient credits banner */}
          {overBudget && (
            <div className="flex items-start gap-2 rounded-sm border border-danger/40 bg-danger-soft p-3 text-[12.5px] text-danger">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Not enough credits — needs {totalCost}, you have {balance}.
              </span>
            </div>
          )}

          {/* Sticky footer: total cost + Generate */}
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
                {model?.creditCost}×{count}
              </span>
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={
                submitting ||
                !prompt.trim() ||
                overBudget ||
                (compareMode && compareSet.length < 2)
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
                  : "Generate"}
            </Button>
          </div>
        </form>

        {/* Right gallery */}
        <div className="flex flex-col">
          {generating || done ? (
            <GenerationPanel
              prompt={prompt}
              modelName={model?.name || ""}
              count={count}
              done={!!done}
            />
          ) : (
            <>
              {/* Header — title on the left, provider filter as a compact
                  Select so 8 provider names don't fight for horizontal space. */}
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
                  const on =
                    compareMode
                      ? compareSet.includes(m.value)
                      : selectedModel === m.value;
                  const tag = pickTag(m as ModelOption);
                  const tone: "success" | "info" | "warning" | "neutral" =
                    tag === "Flagship"
                      ? "info"
                      : tag === "Pro"
                        ? "neutral"
                        : tag === "Fast"
                          ? "success"
                          : "warning";
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() =>
                        compareMode
                          ? toggleCompareModel(m.value)
                          : setSelectedModel(m.value)
                      }
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
                          <Badge tone="neutral" icon={<Coins className="h-3 w-3" />}>
                            {m.creditCost}
                          </Badge>
                        </span>
                        {on && (
                          <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-[var(--accent)] text-white">
                            <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5 p-4">
                        <div className="font-semibold text-fg">{m.name}</div>
                        <div className="flex items-center gap-2 text-[12px] text-fg-subtle">
                          {providerOf(m as ModelOption)}
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
  count,
  done,
}: {
  prompt: string;
  modelName: string;
  count: number;
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
            {done ? "Generation complete" : "Generating…"}
          </div>
          <div className="text-[12.5px] text-fg-subtle">
            {modelName} · {count} image{count > 1 ? "s" : ""}
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
            done ? "w-full" : "w-2/3 animate-pulse",
          )}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="aspect-square overflow-hidden rounded-md border border-[var(--border)] bg-[linear-gradient(110deg,var(--surface-2)_8%,var(--surface-3)_18%,var(--surface-2)_33%)] [background-size:200%_100%]"
            style={{
              animation: done
                ? undefined
                : "ps-fade 1.4s ease-in-out infinite",
              animationDelay: `${i * 90}ms`,
            }}
          />
        ))}
      </div>
      {!done && (
        <p className="mt-4 flex items-center justify-center gap-1.5 text-[12.5px] text-fg-subtle">
          <Compass className="h-3.5 w-3.5" /> You can keep browsing — we&apos;ll
          notify you when it&apos;s done.
        </p>
      )}
    </div>
  );
}
