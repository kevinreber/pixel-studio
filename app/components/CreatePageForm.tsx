import React from "react";
import {
  Form,
  useLoaderData,
  useNavigation,
  useActionData,
} from "@remix-run/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, Check, Loader2, Sparkles, Coins, Settings2, Star, GitCompare } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { CreatePageLoader } from "~/routes/create";
import { MODEL_OPTIONS, STYLE_OPTIONS } from "~/config/models";
import { toast } from "sonner";
import type { ActionData } from "~/routes/create";
import { ProviderBadge } from "./ModelBadge";
import { useGenerationProgress } from "~/contexts/GenerationProgressContext";
import { parseActionError } from "~/utils/errors";
import { MOBILE_BREAKPOINT } from "~/config/breakpoints";

// Size options per model type
type SizeOption = { label: string; ratio: string; width: number; height: number };

const SIZE_OPTIONS: Record<string, SizeOption[]> = {
  "dall-e-3": [
    { label: "Square", ratio: "1:1", width: 1024, height: 1024 },
    { label: "Landscape", ratio: "16:9", width: 1792, height: 1024 },
    { label: "Portrait", ratio: "9:16", width: 1024, height: 1792 },
  ],
  "dall-e-2": [
    { label: "Small", ratio: "1:1", width: 256, height: 256 },
    { label: "Medium", ratio: "1:1", width: 512, height: 512 },
    { label: "Large", ratio: "1:1", width: 1024, height: 1024 },
  ],
  "stable-diffusion": [
    { label: "Square", ratio: "1:1", width: 1024, height: 1024 },
    { label: "Landscape", ratio: "4:3", width: 1152, height: 896 },
    { label: "Portrait", ratio: "3:4", width: 896, height: 1152 },
  ],
  flux: [
    { label: "Square", ratio: "1:1", width: 1024, height: 1024 },
    { label: "Landscape", ratio: "16:9", width: 1344, height: 768 },
    { label: "Portrait", ratio: "9:16", width: 768, height: 1344 },
  ],
};

// Helper to get size options for a model
const getSizeOptionsForModel = (modelValue: string): SizeOption[] => {
  if (modelValue.includes("dall-e-3")) return SIZE_OPTIONS["dall-e-3"];
  if (modelValue.includes("dall-e-2")) return SIZE_OPTIONS["dall-e-2"];
  if (modelValue.includes("stable-diffusion")) return SIZE_OPTIONS["stable-diffusion"];
  if (modelValue.includes("flux")) return SIZE_OPTIONS["flux"];
  return SIZE_OPTIONS["stable-diffusion"]; // default
};

// Helper to check if model is a Flux model
const isFluxModel = (modelValue: string): boolean => {
  return modelValue.includes("flux");
};

// Helper to check if model is a Stability AI model (supports negative prompts, CFG scale, steps)
const isStabilityAIModel = (modelValue: string): boolean => {
  return (
    modelValue.includes("stable-diffusion") ||
    modelValue.startsWith("sd") ||
    modelValue.startsWith("stable-image")
  );
};

// Helper to check if model is DALL-E 3
const isDallE3Model = (modelValue: string): boolean => {
  return modelValue === "dall-e-3";
};

const PROMPT_EXAMPLES = [
  "A serene Japanese garden at sunset with cherry blossoms floating in the breeze",
  "A futuristic cyberpunk city street with neon signs and flying cars",
  "A cozy coffee shop interior on a rainy day, warm lighting, watercolor style",
  "An astronaut riding a horse on Mars, cinematic lighting",
  "A magical forest with bioluminescent mushrooms and fireflies",
];

const MAX_TEXT_AREA_CHAR_COUNT = 500;

type ModelOption = {
  name: string;
  value: string;
  image: string;
  description: string;
  company: string;
  supportsStyles: boolean;
  creditCost: number;
  recommended: boolean;
};

type StyleOption = {
  name: string;
  value: string;
  image: string;
};

const DEFAULT_SELECTED_MODEL: ModelOption = MODEL_OPTIONS[0] as ModelOption;
const DEFAULT_SELECTED_STYLE: StyleOption = STYLE_OPTIONS.find(
  (style) => style.value === "none"
) as StyleOption;

const Image = ({
  src,
  alt,
  size = 24,
}: {
  src: string;
  alt: string;
  size?: number;
}) => {
  if (src === "") return null;
  return (
    <div
      className="relative overflow-hidden m-auto w-full h-full"
      style={{ maxWidth: size, maxHeight: size }}
    >
      <img
        className="inset-0 object-cover cursor-pointer w-full h-full"
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
};

const NumberSelector = ({
  value = 1,
  onChange,
  disabled = false,
  creditCostPerImage = 1,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
  creditCostPerImage: number;
}) => {
  const firstRow = [1, 2, 3, 4];
  const secondRow = [5, 6, 7, 8];
  const totalCost = value * creditCostPerImage;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Number of Images</span>
        <div className="flex items-center gap-1.5 text-sm text-amber-400">
          <Coins className="w-4 h-4" />
          <span>{totalCost} credit{totalCost !== 1 ? "s" : ""}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {/* First Row */}
        <div className="flex gap-2">
          {firstRow.map((number) => (
            <Button
              key={number}
              type="button"
              disabled={disabled}
              onClick={() => onChange(number)}
              variant={value === number ? "secondary" : "outline"}
              className={cn(
                "w-14 h-[40px] text-lg",
                value === number
                  ? "bg-zinc-700 hover:bg-zinc-600"
                  : "bg-zinc-800/50 hover:bg-zinc-700/50"
              )}
            >
              {number}
            </Button>
          ))}
        </div>
        {/* Second Row */}
        <div className="flex gap-2">
          {secondRow.map((number) => (
            <Button
              key={number}
              type="button"
              disabled={disabled}
              onClick={() => onChange(number)}
              variant={value === number ? "secondary" : "outline"}
              className={cn(
                "w-14 h-[40px] text-lg",
                value === number
                  ? "bg-zinc-700 hover:bg-zinc-600"
                  : "bg-zinc-800/50 hover:bg-zinc-700/50"
              )}
            >
              {number}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

const CreatePageForm = () => {
  const loaderData = useLoaderData<CreatePageLoader>();
  const styleOptions = (loaderData.styleOptions || []) as StyleOption[];
  const modelOptions = (loaderData.modelOptions || []) as ModelOption[];
  const actionData = useActionData<ActionData>();
  const { addJob } = useGenerationProgress();

  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Track which requestIds we've already added to prevent duplicates
  const processedRequestIdsRef = React.useRef<Set<string>>(new Set());

  const [isMobile, setIsMobile] = React.useState(false);
  const [modelDialogOpen, setModelDialogOpen] = React.useState(false);
  const [styleDialogOpen, setStyleDialogOpen] = React.useState(false);
  const [selectedModel, setSelectedModel] =
    React.useState<ModelOption>(DEFAULT_SELECTED_MODEL);
  const [selectedStyle, setSelectedStyle] =
    React.useState<StyleOption>(DEFAULT_SELECTED_STYLE);
  const [prompt, setPrompt] = React.useState("");
  const [selectedSection, setSelectedSection] = React.useState<
    "model" | "style"
  >("model");
  const [numImages, setNumImages] = React.useState(1);

  // Comparison mode state
  const [comparisonMode, setComparisonMode] = React.useState(false);
  const [selectedModels, setSelectedModels] = React.useState<ModelOption[]>([]);
  const MAX_COMPARISON_MODELS = 4;

  // New generation parameter states
  const [selectedSize, setSelectedSize] = React.useState({ width: 1024, height: 1024 });
  const [quality, setQuality] = React.useState<"standard" | "hd">("standard");
  const [generationStyle, setGenerationStyle] = React.useState<"vivid" | "natural">("vivid");
  const [negativePrompt, setNegativePrompt] = React.useState("");
  const [seed, setSeed] = React.useState<number | undefined>(undefined);
  const [cfgScale, setCfgScale] = React.useState(7);
  const [steps, setSteps] = React.useState(40);
  const [promptUpsampling, setPromptUpsampling] = React.useState(false);
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Reset size to default when model changes
  React.useEffect(() => {
    const sizeOptions = getSizeOptionsForModel(selectedModel.value);
    const defaultSize = sizeOptions[0]; // First option is always the default (usually square)
    setSelectedSize({ width: defaultSize.width, height: defaultSize.height });
  }, [selectedModel.value]);

  React.useEffect(() => {
    if (actionData) {
      console.log("actionData", actionData);
    }

    // Handle async generation response - show progress toast
    if (actionData?.async && actionData?.requestId) {
      // Prevent adding duplicate jobs
      if (!processedRequestIdsRef.current.has(actionData.requestId)) {
        processedRequestIdsRef.current.add(actionData.requestId);
        addJob({
          requestId: actionData.requestId,
          type: "image",
          status: "queued",
          progress: 0,
          message: "Starting image generation...",
          prompt: actionData.prompt,
        });
        // Reset the prompt after successful submission
        setPrompt("");
      }
      return;
    }

    // Show error toast if we get an error from the action
    if (actionData?.error) {
      const errorMessage = parseActionError(actionData.error, "Please try again");
      toast.error("Error", {
        description: errorMessage,
      });
    }
  }, [actionData, addJob]);

  // Toggle a model in comparison mode
  const toggleModelSelection = (model: ModelOption) => {
    if (comparisonMode) {
      setSelectedModels((prev) => {
        const isSelected = prev.some((m) => m.value === model.value);
        if (isSelected) {
          return prev.filter((m) => m.value !== model.value);
        }
        if (prev.length >= MAX_COMPARISON_MODELS) {
          toast.error("Maximum models reached", {
            description: `You can compare up to ${MAX_COMPARISON_MODELS} models at once.`,
          });
          return prev;
        }
        return [...prev, model];
      });
    } else {
      setSelectedModel(model);
    }
  };

  // Calculate total credits for comparison mode
  const totalCredits = React.useMemo(() => {
    if (comparisonMode) {
      return selectedModels.reduce((sum, m) => sum + m.creditCost * numImages, 0);
    }
    return selectedModel.creditCost * numImages;
  }, [comparisonMode, selectedModels, selectedModel.creditCost, numImages]);

  // Get credit cost per image (for display purposes)
  const creditCostPerImage = React.useMemo(() => {
    if (comparisonMode) {
      return selectedModels.reduce((sum, m) => sum + m.creditCost, 0);
    }
    return selectedModel.creditCost;
  }, [comparisonMode, selectedModels, selectedModel.creditCost]);

  const handleModelClick = () => {
    if (isMobile) {
      setModelDialogOpen(true);
    } else {
      setSelectedSection("model");
    }
  };

  const handleStyleClick = () => {
    if (isMobile) {
      setStyleDialogOpen(true);
    } else {
      setSelectedSection("style");
    }
  };

  const renderMobileLayout = () => (
    <div className="mb-8 px-4">
      <main className="flex-1 overflow-auto">
        <Form method="POST">
          <Card className="max-w-md mx-auto border-0 bg-zinc-900/50 backdrop-blur">
            <CardContent className="space-y-5 p-4">
              {/* Comparison Mode Toggle - Mobile */}
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <GitCompare className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <Label htmlFor="comparisonModeMobile" className="text-sm font-medium cursor-pointer">
                      Compare Models
                    </Label>
                    <p className="text-xs text-gray-400">Test multiple models at once</p>
                  </div>
                </div>
                <Switch
                  id="comparisonModeMobile"
                  checked={comparisonMode}
                  onCheckedChange={(checked) => {
                    setComparisonMode(checked);
                    if (checked) {
                      setSelectedModels([selectedModel]);
                    } else {
                      if (selectedModels.length > 0) {
                        setSelectedModel(selectedModels[0]);
                      }
                      setSelectedModels([]);
                    }
                  }}
                  disabled={isSubmitting}
                />
              </div>

              {/* Hidden inputs for form submission */}
              <input type="hidden" name="comparisonMode" value={comparisonMode.toString()} />
              {comparisonMode ? (
                <input
                  type="hidden"
                  name="models"
                  value={JSON.stringify(selectedModels.map((m) => m.value))}
                />
              ) : (
                <input type="hidden" name="model" value={selectedModel.value} />
              )}

              {/* Model Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-gray-300">
                    {comparisonMode ? `Models (${selectedModels.length}/${MAX_COMPARISON_MODELS})` : "Model"}
                  </Label>
                  {comparisonMode && selectedModels.length > 0 && (
                    <span className="text-xs text-purple-400 flex items-center gap-1">
                      <Coins className="w-3 h-3" />
                      {totalCredits} credits
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  type="button"
                  className="w-full justify-between border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl h-auto py-3"
                  onClick={handleModelClick}
                  disabled={isSubmitting}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-700 flex-shrink-0">
                      <Image src={selectedModel.image} alt={selectedModel.name} size={48} />
                    </div>
                    <div className="text-left">
                      <span className="block font-medium">{selectedModel.name}</span>
                      <span className="text-xs text-amber-400 flex items-center gap-1">
                        <Coins className="w-3 h-3" />
                        {selectedModel.creditCost} credit{selectedModel.creditCost !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </Button>
              </div>

              {/* Style Selector */}
              <div>
                <Label className="text-sm font-medium text-gray-300 mb-2 block">Style</Label>
                <input type="hidden" name="style" value={selectedStyle.value} />
                <Button
                  variant="outline"
                  type="button"
                  className="w-full justify-between border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl h-auto py-3"
                  onClick={handleStyleClick}
                  disabled={isSubmitting}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-700 flex-shrink-0">
                      {selectedStyle.image ? (
                        <Image src={selectedStyle.image} alt={selectedStyle.name} size={48} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                          None
                        </div>
                      )}
                    </div>
                    <span className="font-medium">{selectedStyle.name}</span>
                  </div>
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </Button>
              </div>

              {/* Aspect Ratio Selector - Mobile */}
              <div>
                <Label className="text-sm font-medium text-gray-300 mb-2 block">Aspect Ratio</Label>
                <input type="hidden" name="width" value={selectedSize.width} />
                <input type="hidden" name="height" value={selectedSize.height} />
                <div className="grid grid-cols-3 gap-2">
                  {getSizeOptionsForModel(selectedModel.value).map((size) => {
                    const isSelected = selectedSize.width === size.width && selectedSize.height === size.height;
                    const aspectW = size.width > size.height ? 1 : size.width / size.height;
                    const aspectH = size.height > size.width ? 1 : size.height / size.width;
                    const isSquare = size.width === size.height;

                    return (
                      <Button
                        key={`${size.width}x${size.height}`}
                        type="button"
                        variant={isSelected ? "secondary" : "outline"}
                        onClick={() => setSelectedSize({ width: size.width, height: size.height })}
                        disabled={isSubmitting}
                        className={cn(
                          "flex flex-col items-center gap-1 py-3 h-auto rounded-xl",
                          isSelected
                            ? "bg-pink-600/20 border-pink-500 text-white"
                            : "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700/50"
                        )}
                      >
                        <div
                          className={cn(
                            "border-2 rounded-sm",
                            isSelected ? "border-pink-400" : "border-zinc-500"
                          )}
                          style={{
                            width: isSquare ? 18 : (aspectW * 22),
                            height: isSquare ? 18 : (aspectH * 22),
                          }}
                        />
                        <span className="text-xs font-medium">{size.ratio}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Prompt Input */}
              <div>
                <Label className="text-sm font-medium text-gray-300 mb-2 block">Prompt</Label>
                <Textarea
                  maxLength={MAX_TEXT_AREA_CHAR_COUNT}
                  id="prompt"
                  name="prompt"
                  placeholder="Describe what you want the AI to create..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="border-zinc-700 bg-zinc-800/50 placeholder-gray-500 min-h-[120px] rounded-xl resize-none focus:border-pink-500 focus:ring-pink-500/20"
                />
                <div className="flex items-center justify-between mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const randomExample =
                        PROMPT_EXAMPLES[
                          Math.floor(Math.random() * PROMPT_EXAMPLES.length)
                        ];
                      setPrompt(randomExample);
                    }}
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 transition-colors disabled:opacity-50 py-1"
                    aria-label="Fill prompt with a random example"
                  >
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    Try an example
                  </button>
                  <span className="text-xs text-gray-500" aria-live="polite">
                    {prompt.length}/{MAX_TEXT_AREA_CHAR_COUNT}
                  </span>
                </div>
              </div>

              {/* Number of Images */}
              <div>
                <input type="hidden" name="numberOfImages" value={numImages} />
                <NumberSelector
                  value={numImages}
                  onChange={setNumImages}
                  disabled={isSubmitting}
                  creditCostPerImage={creditCostPerImage}
                />
                {comparisonMode && selectedModels.length > 1 && (
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    {numImages} image{numImages !== 1 ? "s" : ""} × {selectedModels.length} models = {numImages * selectedModels.length} total
                  </p>
                )}
              </div>

              {/* Advanced Options - Mobile */}
              <div className="border-t border-zinc-700 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors w-full"
                  aria-expanded={showAdvanced}
                  aria-controls="advanced-options-mobile"
                >
                  <Settings2 className="w-4 h-4" aria-hidden="true" />
                  Advanced Options
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 ml-auto transition-transform",
                      showAdvanced && "rotate-180"
                    )}
                    aria-hidden="true"
                  />
                </button>

                {showAdvanced && (
                  <div id="advanced-options-mobile" className="mt-4 space-y-4">
                    <input type="hidden" name="negativePrompt" value={negativePrompt} />
                    <input type="hidden" name="seed" value={seed ?? ""} />
                    <input type="hidden" name="cfgScale" value={cfgScale} />
                    <input type="hidden" name="steps" value={steps} />
                    <input type="hidden" name="promptUpsampling" value={promptUpsampling.toString()} />

                    {/* DALL-E 3 Quality */}
                    {isDallE3Model(selectedModel.value) && (
                      <div>
                        <Label className="text-sm text-gray-300 mb-2 block">Quality</Label>
                        <input type="hidden" name="quality" value={quality} />
                        <div className="grid grid-cols-2 gap-2">
                          {(["standard", "hd"] as const).map((q) => (
                            <Button
                              key={q}
                              type="button"
                              variant={quality === q ? "secondary" : "outline"}
                              onClick={() => setQuality(q)}
                              disabled={isSubmitting}
                              className={cn(
                                "rounded-xl",
                                quality === q
                                  ? "bg-pink-600/20 border-pink-500"
                                  : "bg-zinc-800/50 border-zinc-700"
                              )}
                            >
                              {q === "hd" ? "HD" : "Standard"}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* DALL-E 3 Style */}
                    {isDallE3Model(selectedModel.value) && (
                      <div>
                        <Label className="text-sm text-gray-300 mb-2 block">Generation Style</Label>
                        <input type="hidden" name="generationStyle" value={generationStyle} />
                        <div className="grid grid-cols-2 gap-2">
                          {(["vivid", "natural"] as const).map((s) => (
                            <Button
                              key={s}
                              type="button"
                              variant={generationStyle === s ? "secondary" : "outline"}
                              onClick={() => setGenerationStyle(s)}
                              disabled={isSubmitting}
                              className={cn(
                                "rounded-xl",
                                generationStyle === s
                                  ? "bg-pink-600/20 border-pink-500"
                                  : "bg-zinc-800/50 border-zinc-700"
                              )}
                            >
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Negative Prompt */}
                    {isStabilityAIModel(selectedModel.value) && (
                      <div>
                        <Label className="text-sm text-gray-300 mb-2 block">Negative Prompt</Label>
                        <Textarea
                          placeholder="What to avoid..."
                          value={negativePrompt}
                          onChange={(e) => setNegativePrompt(e.target.value)}
                          disabled={isSubmitting}
                          className="min-h-[80px] bg-zinc-800/50 border-zinc-700 rounded-xl"
                          maxLength={1000}
                        />
                      </div>
                    )}

                    {/* Seed */}
                    <div>
                      <Label className="text-sm text-gray-300 mb-2 block">Seed</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Random"
                          value={seed ?? ""}
                          onChange={(e) =>
                            setSeed(e.target.value ? parseInt(e.target.value) : undefined)
                          }
                          disabled={isSubmitting}
                          className="flex-1 bg-zinc-800/50 border-zinc-700 rounded-xl"
                          min={0}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSeed(undefined)}
                          disabled={isSubmitting}
                          className="bg-zinc-800/50 border-zinc-700 rounded-xl"
                        >
                          Random
                        </Button>
                      </div>
                    </div>

                    {/* CFG Scale */}
                    {isStabilityAIModel(selectedModel.value) && (
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <Label className="text-sm text-gray-300">CFG Scale</Label>
                          <span className="text-sm font-medium text-pink-400">{cfgScale}</span>
                        </div>
                        <Slider
                          value={[cfgScale]}
                          onValueChange={(value) => setCfgScale(value[0])}
                          min={1}
                          max={20}
                          step={1}
                          disabled={isSubmitting}
                          className="w-full"
                        />
                      </div>
                    )}

                    {/* Steps */}
                    {isStabilityAIModel(selectedModel.value) && (
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <Label className="text-sm text-gray-300">Steps</Label>
                          <span className="text-sm font-medium text-pink-400">{steps}</span>
                        </div>
                        <Slider
                          value={[steps]}
                          onValueChange={(value) => setSteps(value[0])}
                          min={10}
                          max={50}
                          step={5}
                          disabled={isSubmitting}
                          className="w-full"
                        />
                      </div>
                    )}

                    {/* Prompt Upsampling - Flux */}
                    {isFluxModel(selectedModel.value) && (
                      <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl">
                        <input
                          type="checkbox"
                          id="promptUpsamplingMobile"
                          checked={promptUpsampling}
                          onChange={(e) => setPromptUpsampling(e.target.checked)}
                          disabled={isSubmitting}
                          className="w-5 h-5 rounded border-zinc-600 bg-zinc-800/50"
                        />
                        <Label htmlFor="promptUpsamplingMobile" className="cursor-pointer">
                          <span className="block text-sm">Prompt Upsampling</span>
                          <span className="text-xs text-gray-500">Enhance prompt for better results</span>
                        </Label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="px-4 pb-4 pt-0 flex flex-col gap-2">
              {comparisonMode && selectedModels.length < 2 && (
                <p className="text-xs text-amber-400 text-center">
                  Select at least 2 models to compare
                </p>
              )}
              <Button
                type="submit"
                className={cn(
                  "w-full text-white font-semibold py-6 rounded-xl text-base",
                  comparisonMode
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    : "bg-pink-600 hover:bg-pink-700"
                )}
                disabled={isSubmitting || (comparisonMode && selectedModels.length < 2)}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : comparisonMode ? (
                  <>
                    <GitCompare className="mr-2 h-5 w-5" />
                    Compare {selectedModels.length} Model{selectedModels.length !== 1 ? "s" : ""}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </Form>
      </main>

      {/* Model Selection Dialog - Mobile */}
      <Dialog open={modelDialogOpen} onOpenChange={setModelDialogOpen}>
        <DialogContent
          className="fixed inset-x-4 top-[5%] bottom-[5%] translate-x-0 translate-y-0 left-0 right-0 mx-auto max-w-lg bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col"
          overlayClassName="backdrop-blur-sm"
        >
          <DialogHeader className="px-4 py-3 border-b border-zinc-800">
            <DialogTitle className="text-lg font-semibold">
              {comparisonMode ? `Select Models (${selectedModels.length}/${MAX_COMPARISON_MODELS})` : "Choose a Model"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 px-4 py-3">
            <div className="space-y-2">
              {modelOptions.map((model) => {
                const isSelected = comparisonMode
                  ? selectedModels.some((m) => m.value === model.value)
                  : selectedModel.name === model.name;
                const selectionIndex = comparisonMode
                  ? selectedModels.findIndex((m) => m.value === model.value) + 1
                  : 0;

                return (
                  <button
                    key={model.name}
                    type="button"
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all active:scale-[0.98] w-full text-left",
                      isSelected
                        ? comparisonMode
                          ? "bg-purple-600/30 border border-purple-500"
                          : "bg-pink-600/30 border border-pink-500"
                        : "bg-zinc-800/50 border border-transparent hover:bg-zinc-800"
                    )}
                    onClick={() => {
                      if (comparisonMode) {
                        toggleModelSelection(model);
                      } else {
                        setSelectedModel(model);
                        setModelDialogOpen(false);
                      }
                    }}
                  >
                    {/* Model Image */}
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-zinc-700">
                        <Image src={model.image} alt={model.name} size={56} />
                      </div>
                      {comparisonMode && isSelected && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{selectionIndex}</span>
                        </div>
                      )}
                    </div>

                    {/* Model Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{model.name}</span>
                        {model.recommended && (
                          <Star className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{model.company}</span>
                        <span className="text-xs text-amber-400 flex items-center gap-0.5">
                          <Coins className="w-3 h-3" />
                          {model.creditCost}
                        </span>
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    {isSelected && !comparisonMode && (
                      <Check className="w-5 h-5 text-pink-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
          {comparisonMode && (
            <div className="px-4 py-3 border-t border-zinc-800">
              <Button
                onClick={() => setModelDialogOpen(false)}
                className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl py-5"
                disabled={selectedModels.length < 2}
              >
                {selectedModels.length < 2
                  ? `Select at least ${2 - selectedModels.length} more`
                  : `Done (${selectedModels.length} models)`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Style Selection Dialog - Mobile */}
      <Dialog open={styleDialogOpen} onOpenChange={setStyleDialogOpen}>
        <DialogContent
          className="fixed inset-x-4 top-[10%] bottom-[10%] translate-x-0 translate-y-0 left-0 right-0 mx-auto max-w-lg bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col"
          overlayClassName="backdrop-blur-sm"
        >
          <DialogHeader className="px-4 py-3 border-b border-zinc-800">
            <DialogTitle className="text-lg font-semibold">Choose a Style</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 px-4 py-3">
            <div className="grid grid-cols-3 gap-2">
              {styleOptions.map((style) => {
                const isSelected = selectedStyle.name === style.name;
                return (
                  <button
                    key={style.name}
                    type="button"
                    className={cn(
                      "flex flex-col items-center p-2 rounded-xl cursor-pointer transition-all active:scale-[0.98]",
                      isSelected
                        ? "bg-pink-600/30 border border-pink-500"
                        : "bg-zinc-800/50 border border-transparent hover:bg-zinc-800"
                    )}
                    onClick={() => {
                      setSelectedStyle(style);
                      setStyleDialogOpen(false);
                    }}
                  >
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-zinc-700 mb-2">
                      {style.image ? (
                        <img
                          src={style.image}
                          alt={style.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                          None
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium text-center truncate w-full">{style.name}</span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderDesktopLayout = () => (
    <div className="flex justify-between w-full max-w-5xl m-auto">
      <div className="w-1/3 border flex flex-col h-full">
        <Form method="POST">
          <Card className="flex flex-col flex-grow p-4">
            <CardContent className="space-y-4 flex-grow flex flex-col justify-between mb-4">
              <div className="space-y-4">
                {/* Comparison Mode Toggle */}
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                  <div className="flex items-center gap-2">
                    <GitCompare className="w-4 h-4 text-purple-400" />
                    <div>
                      <Label htmlFor="comparisonMode" className="text-sm font-medium cursor-pointer">
                        Compare Models
                      </Label>
                      <p className="text-xs text-gray-400">Generate with multiple models at once</p>
                    </div>
                  </div>
                  <Switch
                    id="comparisonMode"
                    checked={comparisonMode}
                    onCheckedChange={(checked) => {
                      setComparisonMode(checked);
                      if (checked) {
                        // Pre-select current model when enabling comparison
                        setSelectedModels([selectedModel]);
                      } else {
                        // Keep first selected model as the single model
                        if (selectedModels.length > 0) {
                          setSelectedModel(selectedModels[0]);
                        }
                        setSelectedModels([]);
                      }
                    }}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Hidden inputs for form submission */}
                <input type="hidden" name="comparisonMode" value={comparisonMode.toString()} />
                {comparisonMode ? (
                  <input
                    type="hidden"
                    name="models"
                    value={JSON.stringify(selectedModels.map((m) => m.value))}
                  />
                ) : (
                  <input type="hidden" name="model" value={selectedModel.value} />
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="model">
                      {comparisonMode ? `Models (${selectedModels.length}/${MAX_COMPARISON_MODELS})` : "Model"}
                    </Label>
                    {comparisonMode && selectedModels.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-purple-400">
                        <Coins className="w-3 h-3" />
                        <span>{totalCredits} credits total</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full justify-between mt-1 border p-2 h-fit"
                    onClick={handleModelClick}
                    disabled={isSubmitting}
                  >
                    <div className="flex justify-between pl-2 pr-2 w-full items-center min-h-[40px] h-fit">
                      <div className="flex items-center">
                        <Image
                          src={selectedModel.image}
                          alt={selectedModel.name}
                          size={80}
                        />
                        <span className="ml-2  text-start">
                          {selectedModel.name}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </div>
                  </Button>
                </div>
                <div>
                  <Label htmlFor="style">Style</Label>
                  <input
                    type="hidden"
                    name="style"
                    value={selectedStyle.value}
                  />
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full justify-between mt-1 border p-2 h-fit"
                    onClick={handleStyleClick}
                    disabled={isSubmitting}
                  >
                    <div className="flex justify-between pl-2 pr-2 w-full items-center min-h-[40px] h-fit">
                      <div className="flex items-center">
                        <Image
                          src={selectedStyle.image}
                          alt={selectedStyle.name}
                          size={80}
                        />
                        <span className="ml-2 text-start">
                          {selectedStyle.name}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </div>
                  </Button>
                </div>

                {/* Aspect Ratio Selector */}
                <div>
                  <Label>Aspect Ratio</Label>
                  <input type="hidden" name="width" value={selectedSize.width} />
                  <input type="hidden" name="height" value={selectedSize.height} />
                  <div className="flex gap-2 mt-1">
                    {getSizeOptionsForModel(selectedModel.value).map((size) => {
                      const isSelected = selectedSize.width === size.width && selectedSize.height === size.height;
                      // Calculate aspect ratio for the visual indicator
                      const aspectW = size.width > size.height ? 1 : size.width / size.height;
                      const aspectH = size.height > size.width ? 1 : size.height / size.width;
                      const isSquare = size.width === size.height;

                      return (
                        <Button
                          key={`${size.width}x${size.height}`}
                          type="button"
                          variant={isSelected ? "secondary" : "outline"}
                          onClick={() => setSelectedSize({ width: size.width, height: size.height })}
                          disabled={isSubmitting}
                          className={`flex-1 flex flex-col items-center gap-1.5 py-3 h-auto ${
                            isSelected
                              ? "bg-zinc-700 hover:bg-zinc-600 border-pink-500"
                              : "bg-zinc-800/50 hover:bg-zinc-700/50"
                          }`}
                        >
                          {/* Visual aspect ratio indicator */}
                          <div
                            className={`border-2 rounded-sm ${isSelected ? "border-pink-400" : "border-zinc-500"}`}
                            style={{
                              width: isSquare ? 20 : (aspectW * 24),
                              height: isSquare ? 20 : (aspectH * 24),
                            }}
                          />
                          <span className="text-xs font-medium">{size.ratio}</span>
                          <span className="text-[10px] text-zinc-400">{size.width}x{size.height}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* DALL-E 3 Quality Toggle */}
                {isDallE3Model(selectedModel.value) && (
                  <div>
                    <Label>Quality</Label>
                    <input type="hidden" name="quality" value={quality} />
                    <div className="flex gap-2 mt-1">
                      {(["standard", "hd"] as const).map((q) => (
                        <Button
                          key={q}
                          type="button"
                          variant={quality === q ? "secondary" : "outline"}
                          onClick={() => setQuality(q)}
                          disabled={isSubmitting}
                          className={`flex-1 ${
                            quality === q
                              ? "bg-zinc-700 hover:bg-zinc-600"
                              : "bg-zinc-800/50 hover:bg-zinc-700/50"
                          }`}
                        >
                          {q === "hd" ? "HD" : "Standard"}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">HD creates finer details but takes longer</p>
                  </div>
                )}

                {/* DALL-E 3 Style Toggle */}
                {isDallE3Model(selectedModel.value) && (
                  <div>
                    <Label>Generation Style</Label>
                    <input type="hidden" name="generationStyle" value={generationStyle} />
                    <div className="flex gap-2 mt-1">
                      {(["vivid", "natural"] as const).map((s) => (
                        <Button
                          key={s}
                          type="button"
                          variant={generationStyle === s ? "secondary" : "outline"}
                          onClick={() => setGenerationStyle(s)}
                          disabled={isSubmitting}
                          className={`flex-1 ${
                            generationStyle === s
                              ? "bg-zinc-700 hover:bg-zinc-600"
                              : "bg-zinc-800/50 hover:bg-zinc-700/50"
                          }`}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Vivid is hyper-real, Natural is more realistic</p>
                  </div>
                )}
              </div>
              <div className="flex-grow flex flex-col">
                <Label htmlFor="prompt">Text Prompt</Label>
                <Textarea
                  maxLength={MAX_TEXT_AREA_CHAR_COUNT}
                  id="prompt"
                  name="prompt"
                  placeholder="Describe what you want the AI to create..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="mt-1 border placeholder-gray-400 min-h-[150px] max-h-[300px] flex-grow bg-inherit"
                />
                <div className="flex items-center justify-between mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const randomExample =
                        PROMPT_EXAMPLES[
                          Math.floor(Math.random() * PROMPT_EXAMPLES.length)
                        ];
                      setPrompt(randomExample);
                    }}
                    disabled={isSubmitting}
                    className="flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300 transition-colors disabled:opacity-50"
                    aria-label="Fill prompt with a random example"
                  >
                    <Sparkles className="w-3 h-3" aria-hidden="true" />
                    Try an example
                  </button>
                  <span className="text-xs text-gray-400" aria-live="polite">
                    {prompt.length}/{MAX_TEXT_AREA_CHAR_COUNT}
                  </span>
                </div>
              </div>
              <div>
                <input type="hidden" name="numberOfImages" value={numImages} />
                <NumberSelector
                  value={numImages}
                  onChange={setNumImages}
                  disabled={isSubmitting}
                  creditCostPerImage={creditCostPerImage}
                />
                {comparisonMode && selectedModels.length > 1 && (
                  <p className="text-xs text-gray-400 mt-2">
                    {numImages} image{numImages !== 1 ? "s" : ""} × {selectedModels.length} models = {numImages * selectedModels.length} total images
                  </p>
                )}
              </div>

              {/* Advanced Options Collapsible Section */}
              <div className="border-t border-zinc-700 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors w-full"
                  aria-expanded={showAdvanced}
                  aria-controls="advanced-options"
                >
                  <Settings2 className="w-4 h-4" aria-hidden="true" />
                  Advanced Options
                  <ChevronDown
                    className={`w-4 h-4 ml-auto transition-transform ${
                      showAdvanced ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {showAdvanced && (
                  <div id="advanced-options" className="mt-4 space-y-4">
                    {/* Hidden inputs for advanced options */}
                    <input type="hidden" name="negativePrompt" value={negativePrompt} />
                    <input type="hidden" name="seed" value={seed ?? ""} />
                    <input type="hidden" name="cfgScale" value={cfgScale} />
                    <input type="hidden" name="steps" value={steps} />
                    <input type="hidden" name="promptUpsampling" value={promptUpsampling.toString()} />

                    {/* Negative Prompt - Stable Diffusion only */}
                    {isStabilityAIModel(selectedModel.value) && (
                      <div>
                        <Label htmlFor="negativePrompt">Negative Prompt</Label>
                        <Textarea
                          id="negativePrompt"
                          placeholder="Describe what to avoid in the image..."
                          value={negativePrompt}
                          onChange={(e) => setNegativePrompt(e.target.value)}
                          disabled={isSubmitting}
                          className="mt-1 min-h-[80px] bg-zinc-800/50"
                          maxLength={1000}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Elements to exclude from the generated image
                        </p>
                      </div>
                    )}

                    {/* Seed - All models */}
                    <div>
                      <Label htmlFor="seed">Seed</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="seed"
                          type="number"
                          placeholder="Random"
                          value={seed ?? ""}
                          onChange={(e) =>
                            setSeed(e.target.value ? parseInt(e.target.value) : undefined)
                          }
                          disabled={isSubmitting}
                          className="flex-1 bg-zinc-800/50"
                          min={0}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSeed(undefined)}
                          disabled={isSubmitting}
                          className="bg-zinc-800/50"
                        >
                          Random
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Use a specific seed for reproducible results
                      </p>
                    </div>

                    {/* CFG Scale - Stable Diffusion only */}
                    {isStabilityAIModel(selectedModel.value) && (
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <Label>CFG Scale</Label>
                          <span className="text-sm font-medium text-pink-400">{cfgScale}</span>
                        </div>
                        <Slider
                          value={[cfgScale]}
                          onValueChange={(value) => setCfgScale(value[0])}
                          min={1}
                          max={20}
                          step={1}
                          disabled={isSubmitting}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>1</span>
                          <span>Creative</span>
                          <span>Strict</span>
                          <span>20</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          How closely to follow the prompt (higher = stricter)
                        </p>
                      </div>
                    )}

                    {/* Steps - Stable Diffusion only */}
                    {isStabilityAIModel(selectedModel.value) && (
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <Label>Steps</Label>
                          <span className="text-sm font-medium text-pink-400">{steps}</span>
                        </div>
                        <Slider
                          value={[steps]}
                          onValueChange={(value) => setSteps(value[0])}
                          min={10}
                          max={50}
                          step={5}
                          disabled={isSubmitting}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>10</span>
                          <span>Fast</span>
                          <span>Quality</span>
                          <span>50</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          More steps = higher quality but slower
                        </p>
                      </div>
                    )}

                    {/* Prompt Upsampling - Flux only */}
                    {isFluxModel(selectedModel.value) && (
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="promptUpsampling"
                          checked={promptUpsampling}
                          onChange={(e) => setPromptUpsampling(e.target.checked)}
                          disabled={isSubmitting}
                          className="w-4 h-4 rounded border-zinc-600 bg-zinc-800/50"
                        />
                        <div>
                          <Label htmlFor="promptUpsampling" className="cursor-pointer">
                            Prompt Upsampling
                          </Label>
                          <p className="text-xs text-gray-500">
                            Enhance your prompt for better results
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              {comparisonMode && selectedModels.length < 2 && (
                <p className="text-xs text-amber-400 text-center">
                  Select at least 2 models to compare
                </p>
              )}
              <Button
                type="submit"
                className={`w-full text-white ${
                  comparisonMode
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    : "bg-pink-600 hover:bg-pink-700"
                }`}
                disabled={isSubmitting || (comparisonMode && selectedModels.length < 2)}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {comparisonMode ? (
                  <>
                    <GitCompare className="mr-2 h-4 w-4" />
                    Compare {selectedModels.length} Model{selectedModels.length !== 1 ? "s" : ""}
                  </>
                ) : (
                  "Generate"
                )}
              </Button>
            </CardFooter>
          </Card>
        </Form>
      </div>
      <div className="flex-1 pl-4 pr-4 flex flex-col min-h-0 max-h-[calc(100vh-8rem)]">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4 flex-shrink-0">
          <Button
            type="button"
            variant={selectedSection === "model" ? "secondary" : "ghost"}
            onClick={() => setSelectedSection("model")}
            className={`${
              selectedSection === "model"
                ? "bg-zinc-700 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Models
          </Button>
          <Button
            type="button"
            variant={selectedSection === "style" ? "secondary" : "ghost"}
            onClick={() => setSelectedSection("style")}
            className={`${
              selectedSection === "style"
                ? "bg-zinc-700 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Styles
            {!selectedModel?.supportsStyles && (
              <span className="ml-1.5 text-xs text-gray-500">(SD only)</span>
            )}
          </Button>
        </div>

        {selectedSection === "model" && (
          <ScrollArea className="flex-1 min-h-0">
            {/* Comparison mode hint */}
            {comparisonMode && (
              <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-200 text-sm">
                <div className="flex items-center gap-2">
                  <GitCompare className="w-4 h-4" />
                  <span>Select 2-{MAX_COMPARISON_MODELS} models to compare. Each model will generate images from your prompt.</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              {modelOptions.map((model) => {
                const isSelected = comparisonMode
                  ? selectedModels.some((m) => m.value === model.value)
                  : selectedModel.name === model.name;

                return (
                  <Card
                    key={model.name}
                    className={`cursor-pointer border hover:bg-zinc-800 transition-all ${
                      isSelected
                        ? comparisonMode
                          ? "bg-purple-600/50 hover:bg-purple-600/60 border-purple-500"
                          : "bg-blue-600 hover:bg-blue-600"
                        : ""
                    }`}
                    onClick={() => toggleModelSelection(model)}
                  >
                    <CardContent className="p-4 flex items-start space-x-4 flex-col">
                      <div className="relative mb-4 ml-auto mr-auto">
                        <Image src={model.image} alt={model.name} size={140} />
                        {/* Selection indicator for comparison mode */}
                        {comparisonMode && isSelected && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-white">
                              {selectedModels.findIndex((m) => m.value === model.value) + 1}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 w-full">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-semibold">{model.name}</h3>
                          {isSelected && (
                            <Check className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <ProviderBadge company={model.company} />
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-600/20 text-amber-400 border border-amber-600/30">
                            <Coins className="w-3 h-3" />
                            {model.creditCost} credit{model.creditCost !== 1 ? "s" : ""}
                          </span>
                          {model.recommended && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-600/20 text-emerald-400 border border-emerald-600/30">
                              <Star className="w-3 h-3 fill-current" />
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-sm mt-2 text-gray-300">
                          {model.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
        {selectedSection === "style" && (
          <ScrollArea className="flex-1 min-h-0">
            {!selectedModel?.supportsStyles && (
              <div className="mb-4 p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg text-amber-200 text-sm">
                Style presets only work with Stable Diffusion models. Select a
                Stable Diffusion model to enable styles.
              </div>
            )}
            <div className="grid grid-cols-4 gap-4">
              {styleOptions.map((style) => (
                <Card
                  key={style.name}
                  className={`cursor-pointer border hover:bg-zinc-800 ${
                    selectedStyle.name === style.name
                      ? "bg-blue-600 hover:bg-blue-600"
                      : ""
                  } ${!selectedModel?.supportsStyles ? "opacity-50" : ""}`}
                  onClick={() => {
                    if (selectedModel?.supportsStyles) {
                      setSelectedStyle(style);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="relative">
                      {style.image ? (
                        <Image src={style.image} alt={style.name} size={100} />
                      ) : (
                        <div className="w-[100px] h-[100px] mx-auto bg-zinc-700 rounded flex items-center justify-center text-gray-400 text-xs">
                          No style
                        </div>
                      )}
                      {selectedStyle.name === style.name && (
                        <div className="absolute top-2 right-2">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-center text-sm">{style.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );

  return isMobile ? renderMobileLayout() : renderDesktopLayout();
};

export { CreatePageForm };
