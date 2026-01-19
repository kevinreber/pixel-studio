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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronDown,
  Check,
  Loader2,
  Sparkles,
  Coins,
  Video,
  Image as ImageIcon,
} from "lucide-react";
import {
  VIDEO_MODEL_OPTIONS,
  ASPECT_RATIO_OPTIONS,
  DURATION_OPTIONS,
  type VideoModelOption,
  calculateVideoCreditCost,
} from "~/config/videoModels";
import { toast } from "sonner";
import type { ActionData, CreateVideoPageLoader } from "~/routes/create-video";
import { ProviderBadge } from "./ModelBadge";
import { useGenerationProgress } from "~/contexts/GenerationProgressContext";

const PROMPT_EXAMPLES = [
  "A serene lake at dawn with mist rising from the water, cinematic camera movement",
  "A bustling city street at night with neon signs reflecting on wet pavement",
  "A magical forest where fireflies dance among ancient trees",
  "Waves crashing against a rocky coastline during a golden sunset",
  "A cozy coffee shop interior with steam rising from cups, people chatting",
];

const MOBILE_WIDTH = 768;
const MAX_TEXT_AREA_CHAR_COUNT = 500;

const DEFAULT_SELECTED_MODEL: VideoModelOption = VIDEO_MODEL_OPTIONS[0];

const Image = ({
  src,
  alt,
  size = 24,
}: {
  src: string;
  alt: string;
  size?: number;
}) => {
  if (src === "") {
    return (
      <div
        className="relative overflow-hidden m-auto w-full h-full bg-zinc-700 rounded flex items-center justify-center"
        style={{ maxWidth: size, maxHeight: size }}
      >
        <Video className="w-6 h-6 text-zinc-500" />
      </div>
    );
  }
  return (
    <div
      className="relative overflow-hidden m-auto w-full h-full"
      style={{ maxWidth: size, maxHeight: size }}
    >
      <img
        className="inset-0 object-cover cursor-pointer w-full h-full rounded"
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
};

const CreateVideoPageForm = () => {
  const loaderData = useLoaderData<CreateVideoPageLoader>();
  const modelOptions = (loaderData.modelOptions || []) as VideoModelOption[];
  const actionData = useActionData<ActionData>();
  const { addJob } = useGenerationProgress();

  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Track which requestIds we've already added to prevent duplicates
  const processedRequestIdsRef = React.useRef<Set<string>>(new Set());

  const [isMobile, setIsMobile] = React.useState(false);
  const [modelDialogOpen, setModelDialogOpen] = React.useState(false);
  const [selectedModel, setSelectedModel] =
    React.useState<VideoModelOption>(DEFAULT_SELECTED_MODEL);
  const [prompt, setPrompt] = React.useState("");
  const [selectedAspectRatio, setSelectedAspectRatio] = React.useState("16:9");
  const [selectedDuration, setSelectedDuration] = React.useState(5);
  const [sourceImageUrl, setSourceImageUrl] = React.useState("");
  const [generationMode, setGenerationMode] = React.useState<
    "text-to-video" | "image-to-video"
  >("text-to-video");

  // Check if current model supports text-to-video
  const supportsTextToVideo = selectedModel.supportedModes.includes(
    "text-to-video"
  );
  const supportsImageToVideo = selectedModel.supportedModes.includes(
    "image-to-video"
  );

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_WIDTH);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Reset generation mode when model changes
  React.useEffect(() => {
    if (!supportsTextToVideo && supportsImageToVideo) {
      setGenerationMode("image-to-video");
    } else if (supportsTextToVideo) {
      setGenerationMode("text-to-video");
    }
  }, [selectedModel.value, supportsTextToVideo, supportsImageToVideo]);

  // Adjust duration if it exceeds model's max
  React.useEffect(() => {
    if (selectedDuration > selectedModel.maxDuration) {
      setSelectedDuration(selectedModel.maxDuration);
    }
  }, [selectedModel.maxDuration, selectedDuration]);

  React.useEffect(() => {
    // Handle async generation response - show progress toast
    if (actionData?.async && actionData?.requestId) {
      // Prevent adding duplicate jobs
      if (!processedRequestIdsRef.current.has(actionData.requestId)) {
        processedRequestIdsRef.current.add(actionData.requestId);
        addJob({
          requestId: actionData.requestId,
          type: "video",
          status: "queued",
          progress: 0,
          message: "Starting video generation...",
          prompt: actionData.prompt,
        });
        // Reset the prompt after successful submission
        setPrompt("");
      }
      return;
    }

    // Show error toast if we get an error from the action
    if (actionData?.error) {
      let errorMessage: string;

      if (typeof actionData.error === "object") {
        const firstError = Object.values(actionData.error)[0]?.[0];
        errorMessage = firstError || "Validation error";
      } else {
        errorMessage = actionData.error;
      }

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
  }, [actionData, addJob]);

  const handleModelClick = () => {
    setModelDialogOpen(true);
  };

  const renderMobileLayout = () => (
    <div className="mb-8">
      <main className="flex-1 overflow-auto">
        <Form method="POST">
          <Card className="max-w-md mx-auto border p-4">
            <CardContent className="space-y-4 mb-4">
              <div className="flex items-center gap-2 text-pink-400 mb-4">
                <Video className="w-5 h-5" />
                <span className="font-semibold">Create Video</span>
              </div>

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
                  <div className="flex justify-between pl-2 pr-2 w-full items-center">
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

              {/* Generation Mode Toggle */}
              {supportsTextToVideo && supportsImageToVideo && (
                <div>
                  <Label>Generation Mode</Label>
                  <div className="flex gap-2 mt-1">
                    <Button
                      type="button"
                      variant={
                        generationMode === "text-to-video"
                          ? "secondary"
                          : "outline"
                      }
                      onClick={() => setGenerationMode("text-to-video")}
                      disabled={isSubmitting}
                      className={`flex-1 gap-2 ${
                        generationMode === "text-to-video"
                          ? "bg-zinc-700"
                          : "bg-zinc-800/50"
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      Text to Video
                    </Button>
                    <Button
                      type="button"
                      variant={
                        generationMode === "image-to-video"
                          ? "secondary"
                          : "outline"
                      }
                      onClick={() => setGenerationMode("image-to-video")}
                      disabled={isSubmitting}
                      className={`flex-1 gap-2 ${
                        generationMode === "image-to-video"
                          ? "bg-zinc-700"
                          : "bg-zinc-800/50"
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" />
                      Image to Video
                    </Button>
                  </div>
                </div>
              )}

              {/* Source Image Input for Image-to-Video */}
              {generationMode === "image-to-video" && (
                <div>
                  <Label htmlFor="sourceImageUrl">Source Image URL</Label>
                  <input
                    type="hidden"
                    name="sourceImageUrl"
                    value={sourceImageUrl}
                  />
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="sourceImageUrl"
                      placeholder="Enter image URL..."
                      value={sourceImageUrl}
                      onChange={(e) => setSourceImageUrl(e.target.value)}
                      disabled={isSubmitting}
                      className="flex-1 bg-zinc-800/50"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a URL to an image to animate
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="prompt">TEXT PROMPT</Label>
                <Textarea
                  maxLength={MAX_TEXT_AREA_CHAR_COUNT}
                  id="prompt"
                  name="prompt"
                  placeholder="Describe the video you want to create..."
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

              {/* Aspect Ratio */}
              <div>
                <Label>Aspect Ratio</Label>
                <input
                  type="hidden"
                  name="aspectRatio"
                  value={selectedAspectRatio}
                />
                <div className="flex gap-2 mt-1">
                  {ASPECT_RATIO_OPTIONS.map((ar) => (
                    <Button
                      key={ar.value}
                      type="button"
                      variant={
                        selectedAspectRatio === ar.value
                          ? "secondary"
                          : "outline"
                      }
                      onClick={() => setSelectedAspectRatio(ar.value)}
                      disabled={isSubmitting}
                      className={`flex-1 ${
                        selectedAspectRatio === ar.value
                          ? "bg-zinc-700"
                          : "bg-zinc-800/50"
                      }`}
                    >
                      {ar.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <Label>Duration</Label>
                <input type="hidden" name="duration" value={selectedDuration} />
                <div className="flex gap-2 mt-1">
                  {DURATION_OPTIONS.filter(
                    (d) => d.value <= selectedModel.maxDuration
                  ).map((duration) => (
                    <Button
                      key={duration.value}
                      type="button"
                      variant={
                        selectedDuration === duration.value
                          ? "secondary"
                          : "outline"
                      }
                      onClick={() => setSelectedDuration(duration.value)}
                      disabled={isSubmitting}
                      className={`flex-1 ${
                        selectedDuration === duration.value
                          ? "bg-zinc-700"
                          : "bg-zinc-800/50"
                      }`}
                    >
                      {duration.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Credit Cost Display */}
              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Cost</span>
                  <span className="text-xs text-zinc-400">
                    {selectedModel.baseCreditCost} base + {selectedModel.perSecondCreditCost}/sec
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Coins className="w-4 h-4" />
                  <span className="font-semibold">
                    {calculateVideoCreditCost(selectedModel, selectedDuration)} credits
                  </span>
                </div>
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
                <Video className="mr-2 h-4 w-4" />
                GENERATE VIDEO
              </Button>
            </CardFooter>
          </Card>
        </Form>
      </main>

      <Dialog open={modelDialogOpen} onOpenChange={setModelDialogOpen}>
        <DialogOverlay className="fixed inset-0 bg-black bg-opacity-50" />
        <DialogContent className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-[425px] bg-zinc-900">
          <DialogHeader className="relative flex items-center justify-center">
            <DialogTitle>Choose a video model</DialogTitle>
          </DialogHeader>
          <ScrollArea className="mt-2 max-h-[60vh]">
            {modelOptions.map((model) => (
              <Card
                key={model.name}
                className={`cursor-pointer hover:bg-zinc-800 mb-2 ${
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
                        {model.baseCreditCost}+{model.perSecondCreditCost}/s
                      </span>
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
    </div>
  );

  const renderDesktopLayout = () => (
    <div className="flex justify-between w-full max-w-5xl m-auto">
      <div className="w-1/3 border flex flex-col h-full">
        <Form method="POST">
          <Card className="flex flex-col flex-grow p-4">
            <CardContent className="space-y-4 flex-grow flex flex-col justify-between mb-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-pink-400">
                  <Video className="w-5 h-5" />
                  <span className="font-semibold">Create Video</span>
                </div>

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
                        <span className="ml-2 text-start">
                          {selectedModel.name}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </div>
                  </Button>
                </div>

                {/* Generation Mode Toggle */}
                {supportsTextToVideo && supportsImageToVideo && (
                  <div>
                    <Label>Generation Mode</Label>
                    <div className="flex gap-2 mt-1">
                      <Button
                        type="button"
                        variant={
                          generationMode === "text-to-video"
                            ? "secondary"
                            : "outline"
                        }
                        onClick={() => setGenerationMode("text-to-video")}
                        disabled={isSubmitting}
                        className={`flex-1 gap-2 ${
                          generationMode === "text-to-video"
                            ? "bg-zinc-700 hover:bg-zinc-600"
                            : "bg-zinc-800/50 hover:bg-zinc-700/50"
                        }`}
                      >
                        <Sparkles className="w-4 h-4" />
                        Text to Video
                      </Button>
                      <Button
                        type="button"
                        variant={
                          generationMode === "image-to-video"
                            ? "secondary"
                            : "outline"
                        }
                        onClick={() => setGenerationMode("image-to-video")}
                        disabled={isSubmitting}
                        className={`flex-1 gap-2 ${
                          generationMode === "image-to-video"
                            ? "bg-zinc-700 hover:bg-zinc-600"
                            : "bg-zinc-800/50 hover:bg-zinc-700/50"
                        }`}
                      >
                        <ImageIcon className="w-4 h-4" />
                        Image to Video
                      </Button>
                    </div>
                  </div>
                )}

                {/* Source Image Input for Image-to-Video */}
                {generationMode === "image-to-video" && (
                  <div>
                    <Label htmlFor="sourceImageUrl">Source Image URL</Label>
                    <input
                      type="hidden"
                      name="sourceImageUrl"
                      value={sourceImageUrl}
                    />
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="sourceImageUrl"
                        placeholder="Enter image URL..."
                        value={sourceImageUrl}
                        onChange={(e) => setSourceImageUrl(e.target.value)}
                        disabled={isSubmitting}
                        className="flex-1 bg-zinc-800/50"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Enter a URL to an image to animate into a video
                    </p>
                  </div>
                )}

                {/* Aspect Ratio Selector */}
                <div>
                  <Label>Aspect Ratio</Label>
                  <input
                    type="hidden"
                    name="aspectRatio"
                    value={selectedAspectRatio}
                  />
                  <div className="flex gap-2 mt-1">
                    {ASPECT_RATIO_OPTIONS.map((ar) => {
                      const isSelected = selectedAspectRatio === ar.value;
                      // Visual aspect ratio indicator
                      const aspectW =
                        ar.width > ar.height ? 1 : ar.width / ar.height;
                      const aspectH =
                        ar.height > ar.width ? 1 : ar.height / ar.width;
                      const isSquare = ar.width === ar.height;

                      return (
                        <Button
                          key={ar.value}
                          type="button"
                          variant={isSelected ? "secondary" : "outline"}
                          onClick={() => setSelectedAspectRatio(ar.value)}
                          disabled={isSubmitting}
                          className={`flex-1 flex flex-col items-center gap-1.5 py-3 h-auto ${
                            isSelected
                              ? "bg-zinc-700 hover:bg-zinc-600 border-pink-500"
                              : "bg-zinc-800/50 hover:bg-zinc-700/50"
                          }`}
                        >
                          <div
                            className={`border-2 rounded-sm ${
                              isSelected ? "border-pink-400" : "border-zinc-500"
                            }`}
                            style={{
                              width: isSquare ? 20 : aspectW * 24,
                              height: isSquare ? 20 : aspectH * 24,
                            }}
                          />
                          <span className="text-xs font-medium">{ar.value}</span>
                          <span className="text-[10px] text-zinc-400">
                            {ar.label}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Duration Selector */}
                <div>
                  <Label>Duration</Label>
                  <input
                    type="hidden"
                    name="duration"
                    value={selectedDuration}
                  />
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {DURATION_OPTIONS.filter(
                      (d) => d.value <= selectedModel.maxDuration
                    ).map((duration) => (
                      <Button
                        key={duration.value}
                        type="button"
                        variant={
                          selectedDuration === duration.value
                            ? "secondary"
                            : "outline"
                        }
                        onClick={() => setSelectedDuration(duration.value)}
                        disabled={isSubmitting}
                        className={`${
                          selectedDuration === duration.value
                            ? "bg-zinc-700 hover:bg-zinc-600"
                            : "bg-zinc-800/50 hover:bg-zinc-700/50"
                        }`}
                      >
                        {duration.label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Max duration for {selectedModel.name}:{" "}
                    {selectedModel.maxDuration}s
                  </p>
                </div>
              </div>

              <div className="flex-grow flex flex-col">
                <Label htmlFor="prompt">Text Prompt</Label>
                <Textarea
                  maxLength={MAX_TEXT_AREA_CHAR_COUNT}
                  id="prompt"
                  name="prompt"
                  placeholder="Describe the video you want to create..."
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

              {/* Credit Cost Display */}
              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border-t border-zinc-700 pt-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Total Cost</span>
                  <span className="text-xs text-zinc-400">
                    {selectedModel.baseCreditCost} base + {selectedModel.perSecondCreditCost}/sec × {selectedDuration}s
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Coins className="w-4 h-4" />
                  <span className="font-semibold">
                    {calculateVideoCreditCost(selectedModel, selectedDuration)} credits
                  </span>
                </div>
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
                <Video className="mr-2 h-4 w-4" />
                Generate Video
              </Button>
            </CardFooter>
          </Card>
        </Form>
      </div>
      <div className="flex-1 pl-4 pr-4">
        {/* Model Selection Grid */}
        <div className="flex gap-2 mb-4">
          <Button
            type="button"
            variant="secondary"
            className="bg-zinc-700 text-white"
          >
            Video Models
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-10rem)]">
          <div className="grid grid-cols-2 gap-4">
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
                        {model.baseCreditCost}+{model.perSecondCreditCost}/s
                      </span>
                    </div>
                    <p className="text-sm mt-2 text-gray-300">
                      {model.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {model.supportedModes.map((mode) => (
                        <span
                          key={mode}
                          className="text-xs px-2 py-0.5 bg-zinc-700 rounded text-zinc-300"
                        >
                          {mode.replace("-", " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  return isMobile ? renderMobileLayout() : renderDesktopLayout();
};

export { CreateVideoPageForm };
