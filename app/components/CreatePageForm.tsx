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
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, Check, Loader2, Sparkles, Coins, Settings2, Star } from "lucide-react";
import { CreatePageLoader } from "~/routes/create";
import { MODEL_OPTIONS, STYLE_OPTIONS } from "~/config/models";
import { toast } from "sonner";
import type { ActionData } from "~/routes/create";
import { ProviderBadge } from "./ModelBadge";

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

// Helper to check if model is Stable Diffusion
const isStableDiffusionModel = (modelValue: string): boolean => {
  return modelValue.includes("stable-diffusion");
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

const MOBILE_WIDTH = 768;
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
              className={`w-14 h-[40px] text-lg ${
                value === number
                  ? "bg-zinc-700 hover:bg-zinc-600"
                  : "bg-zinc-800/50 hover:bg-zinc-700/50"
              }`}
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
              className={`w-14 h-[40px] text-lg ${
                value === number
                  ? "bg-zinc-700 hover:bg-zinc-600"
                  : "bg-zinc-800/50 hover:bg-zinc-700/50"
              }`}
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

  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

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
    const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_WIDTH);
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
    // Show error toast if we get an error from the action
    if (actionData?.error) {
      let errorMessage: string;

      // Handle both string errors and validation errors
      if (typeof actionData.error === "object") {
        // Handle Zod validation errors
        const firstError = Object.values(actionData.error)[0]?.[0];
        errorMessage = firstError || "Validation error";
      } else {
        errorMessage = actionData.error;
      }

      // Try to parse the error if it's a JSON string
      try {
        const parsedError = JSON.parse(errorMessage);
        if (parsedError.message) {
          errorMessage = parsedError.message;
        }
      } catch {
        // Not JSON, use as-is
      }

      toast.error("Error", {
        description: errorMessage || actionData.message || "Please try again",
      });
    }
  }, [actionData]);

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
    <div className="mb-8">
      <main className="flex-1 overflow-auto">
        <Form method="POST">
          <Card className="max-w-md mx-auto border p-4">
            <CardContent className="space-y-4 mb-4">
              <div>
                <Label htmlFor="model">MODEL</Label>
                <input type="hidden" name="model" value={selectedModel.value} />
                <Button
                  variant="outline"
                  type="button"
                  className="w-full justify-between mt-1 border min-h-[80px]"
                  onClick={handleModelClick}
                  disabled={isSubmitting}
                >
                  <div className="flex justify-between pl-2 pr-2 w-full items-center ">
                    <div className="flex items-center">
                      <Image
                        src={selectedModel.image}
                        alt={selectedModel.name}
                        size={60}
                      />
                      <span className="ml-2">{selectedModel.name}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </div>
                </Button>
              </div>
              <div>
                <Label htmlFor="style">STYLE</Label>
                <input type="hidden" name="style" value={selectedStyle.value} />
                <Button
                  variant="outline"
                  type="button"
                  className="w-full justify-between mt-1 border min-h-[80px]"
                  onClick={handleStyleClick}
                  disabled={isSubmitting}
                >
                  <div className="flex justify-between pl-2 pr-2 w-full items-center ">
                    <div className="flex items-center">
                      <Image
                        src={selectedStyle.image}
                        alt={selectedStyle.name}
                        size={60}
                      />
                      <span className="ml-2">{selectedStyle.name}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </div>
                </Button>
              </div>
              <div>
                <Label htmlFor="prompt">TEXT PROMPT</Label>
                <Textarea
                  maxLength={MAX_TEXT_AREA_CHAR_COUNT}
                  id="prompt"
                  name="prompt"
                  placeholder="Describe what you want the AI to create..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="mt-1 border placeholder-gray-400 min-h-[150px] bg-inherit"
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
                  >
                    <Sparkles className="w-3 h-3" />
                    Try an example
                  </button>
                  <span className="text-xs text-gray-400">
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
                  creditCostPerImage={selectedModel.creditCost}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                CREATE
              </Button>
            </CardFooter>
          </Card>
        </Form>
      </main>

      <Dialog open={modelDialogOpen} onOpenChange={setModelDialogOpen}>
        <DialogOverlay className="fixed inset-0 bg-black bg-opacity-50" />
        <DialogContent className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-[425px] bg-zinc-900">
          <DialogHeader className="relative flex items-center justify-center">
            <DialogTitle>Choose a model</DialogTitle>
          </DialogHeader>
          <ScrollArea className="mt-2 max-h-[60vh]">
            {modelOptions.map((model) => (
              <Card
                key={model.name}
                className={`cursor-pointer hover:bg-zinc-800 ${
                  selectedModel.name === model.name
                    ? "bg-blue-600 hover:bg-blue-600"
                    : ""
                }`}
                onClick={() => {
                  setSelectedModel(model);
                  setModelDialogOpen(false);
                }}
              >
                <CardContent className="p-4 flex items-start space-x-4 flex-col">
                  <Image src={model.image} alt={model.name} size={80} />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold">{model.name}</h3>
                      {selectedModel.name === model.name && (
                        <Check className="w-5 h-5" />
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
                    <p className="mt-2 text-sm text-gray-300">
                      {model.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={styleDialogOpen} onOpenChange={setStyleDialogOpen}>
        <DialogOverlay className="fixed inset-0 bg-black bg-opacity-50" />
        <DialogContent className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-[425px] bg-zinc-900 ">
          <DialogHeader className="flex items-center justify-center">
            <DialogTitle>Choose a preset style</DialogTitle>
          </DialogHeader>
          <ScrollArea className="mt-2 max-h-[60vh]">
            <div className="grid grid-cols-2">
              {styleOptions.map((style) => (
                <Card
                  key={style.name}
                  className={`cursor-pointer hover:bg-zinc-800 ${
                    selectedStyle.name === style.name
                      ? "bg-blue-600 hover:bg-blue-600"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectedStyle(style);
                    setStyleDialogOpen(false);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="relative">
                      <Image src={style.image} alt={style.name} size={100} />
                      {selectedStyle.name === style.name && (
                        <div className="absolute top-2 right-2">
                          <Check className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-center text-sm">{style.name}</p>
                  </CardContent>
                </Card>
              ))}
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
                <div>
                  <Label htmlFor="model">Model</Label>
                  <input
                    type="hidden"
                    name="model"
                    value={selectedModel.value}
                  />
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
                  >
                    <Sparkles className="w-3 h-3" />
                    Try an example
                  </button>
                  <span className="text-xs text-gray-400">
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
                  creditCostPerImage={selectedModel.creditCost}
                />
              </div>

              {/* Advanced Options Collapsible Section */}
              <div className="border-t border-zinc-700 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors w-full"
                >
                  <Settings2 className="w-4 h-4" />
                  Advanced Options
                  <ChevronDown
                    className={`w-4 h-4 ml-auto transition-transform ${
                      showAdvanced ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showAdvanced && (
                  <div className="mt-4 space-y-4">
                    {/* Hidden inputs for advanced options */}
                    <input type="hidden" name="negativePrompt" value={negativePrompt} />
                    <input type="hidden" name="seed" value={seed ?? ""} />
                    <input type="hidden" name="cfgScale" value={cfgScale} />
                    <input type="hidden" name="steps" value={steps} />
                    <input type="hidden" name="promptUpsampling" value={promptUpsampling.toString()} />

                    {/* Negative Prompt - Stable Diffusion only */}
                    {isStableDiffusionModel(selectedModel.value) && (
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
                    {isStableDiffusionModel(selectedModel.value) && (
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
                    {isStableDiffusionModel(selectedModel.value) && (
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
            <CardFooter>
              <Button
                type="submit"
                className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Generate
              </Button>
            </CardFooter>
          </Card>
        </Form>
      </div>
      <div className="flex-1 pl-4 pr-4">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4">
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
          <ScrollArea className="h-[calc(100vh-10rem)]">
            <div className="grid grid-cols-3 gap-4">
              {modelOptions.map((model) => (
                <Card
                  key={model.name}
                  className={`cursor-pointer border hover:bg-zinc-800 ${
                    selectedModel.name === model.name
                      ? "bg-blue-600 hover:bg-blue-600"
                      : ""
                  }`}
                  onClick={() => setSelectedModel(model)}
                >
                  <CardContent className="p-4 flex items-start space-x-4 flex-col">
                    <div className="relative mb-4 ml-auto mr-auto">
                      <Image src={model.image} alt={model.name} size={140} />
                    </div>
                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold">{model.name}</h3>
                        {selectedModel.name === model.name && (
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
              ))}
            </div>
          </ScrollArea>
        )}
        {selectedSection === "style" && (
          <ScrollArea className="h-[calc(100vh-10rem)]">
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
