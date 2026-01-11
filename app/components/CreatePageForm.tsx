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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, Check, Loader2, Sparkles, Coins } from "lucide-react";
import {
  CreatePageLoader,
  STYLE_OPTIONS,
  MODEL_OPTIONS,
} from "~/routes/create";
import { toast } from "sonner";
import type { ActionData } from "~/routes/create";
import { ProviderBadge } from "./ModelBadge";

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

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_WIDTH);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
