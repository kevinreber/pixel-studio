import React from "react";
import { Form, useLoaderData } from "@remix-run/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
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
import { ChevronDown, Check } from "lucide-react";
import { CreatePageLoader } from "~/routes/create";

const MOBILE_WIDTH = 768;
const MAX_TEXT_AREA_CHAR_COUNT = 500;

const Image = ({
  src,
  alt,
  size = 24,
}: {
  src: string;
  alt: string;
  size?: number;
}) => {
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
      />
    </div>
  );
};

const DEFAULT_SELECTED_MODEL = {
  name: "Stable Diffusion 1.6",
  value: "stable-diffusion-v1-6",
  image: "/assets/model-thumbs/sd-1-5.jpg",
  description: "The most popular first-generation stable diffusion model.",
};

const DEFAULT_SELECTED_STYLE = {
  name: "Anime",
  value: "anime",
  image: "/assets/preset-text-styles/anime-v2.jpg",
};

const CreatePageForm = () => {
  const loaderData = useLoaderData<CreatePageLoader>();
  const styleOptions = loaderData.styleOptions || [];
  const modelOptions = loaderData.modelOptions || [];

  const [isMobile, setIsMobile] = React.useState(false);
  const [modelDialogOpen, setModelDialogOpen] = React.useState(false);
  const [styleDialogOpen, setStyleDialogOpen] = React.useState(false);
  const [selectedModel, setSelectedModel] = React.useState(
    DEFAULT_SELECTED_MODEL
  );
  const [selectedStyle, setSelectedStyle] = React.useState(
    DEFAULT_SELECTED_STYLE
  );
  const [prompt, setPrompt] = React.useState("");
  const [selectedSection, setSelectedSection] = React.useState<
    "model" | "style" | null
  >(null);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_WIDTH);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
                  className="w-full justify-between mt-1 border"
                  onClick={handleModelClick}
                >
                  <div className="flex justify-between pl-2 pr-2 w-full items-center">
                    <div className="flex items-center">
                      <Image
                        src={selectedModel.image}
                        alt={selectedModel.name}
                        size={40}
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
                  className="w-full justify-between mt-1 border"
                  onClick={handleStyleClick}
                >
                  <div className="flex justify-between pl-2 pr-2 w-full items-center">
                    <div className="flex items-center">
                      <Image
                        src={selectedStyle.image}
                        alt={selectedStyle.name}
                        size={40}
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
                  className="mt-1 border placeholder-gray-400 min-h-[200px] bg-inherit"
                />
                <span className="text-xs text-gray-400 text-right">
                  {prompt.length}/{MAX_TEXT_AREA_CHAR_COUNT}
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white">
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
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold">{model.name}</h3>
                      {selectedModel.name === model.name && (
                        <Check className="w-5 h-5 " />
                      )}
                    </div>
                    <p className="mt-2 text-sm">{model.description}</p>
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
                    className="w-full justify-between mt-1 border p-2"
                    onClick={handleModelClick}
                  >
                    <div className="flex justify-between pl-2 pr-2 w-full items-center">
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
                    className="w-full justify-between mt-1 border p-2"
                    onClick={handleStyleClick}
                  >
                    <div className="flex justify-between pl-2 pr-2 w-full items-center">
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
                  className="mt-1 border  placeholder-gray-400 min-h-[200px] max-h-[400px] flex-grow bg-inherit"
                />
                <span className="text-xs text-gray-400 text-right">
                  {prompt.length}/{MAX_TEXT_AREA_CHAR_COUNT}
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white">
                Generate
              </Button>
            </CardFooter>
          </Card>
        </Form>
      </div>
      <div className="flex-1 pl-4 pr-4">
        {selectedSection === "model" && (
          <ScrollArea className="h-[calc(100vh-6rem)]">
            <div className="grid grid-cols-3 gap-4">
              {modelOptions.map((model) => (
                <Card
                  key={model.name}
                  className={`cursor-pointer border hover:bg-zing-800 ${
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
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold  ">{model.name}</h3>
                        {selectedModel.name === model.name && (
                          <Check className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <p className="text-sm">{model.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
        {selectedSection === "style" && (
          <ScrollArea className="h-[calc(100vh-6rem)]">
            <div className="grid grid-cols-4 gap-4">
              {styleOptions.map((style) => (
                <Card
                  key={style.name}
                  className={`cursor-pointer border hover:bg-zing-800 border-r ${
                    selectedStyle.name === style.name
                      ? "bg-blue-600 hover:bg-blue-600"
                      : ""
                  }`}
                  onClick={() => setSelectedStyle(style)}
                >
                  <CardContent className="p-4">
                    <div className="relative">
                      <Image src={style.image} alt={style.name} size={100} />
                      {selectedStyle.name === style.name && (
                        <div className="absolute top-2 right-2">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-center text-sm ">{style.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
        {!selectedSection && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Select a model or style to view options</p>
          </div>
        )}
      </div>
    </div>
  );

  return isMobile ? renderMobileLayout() : renderDesktopLayout();
};

export { CreatePageForm };
