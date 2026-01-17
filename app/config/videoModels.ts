/**
 * Video generation model configuration
 */

export type VideoGenerationMode = "text-to-video" | "image-to-video";

export interface VideoModelOption {
  name: string;
  value: string;
  image: string;
  description: string;
  company: string;
  creditCost: number;
  supportedModes: VideoGenerationMode[];
  maxDuration: number;
  apiModel?: string;
}

export const VIDEO_MODEL_OPTIONS: VideoModelOption[] = [
  {
    name: "Runway Gen-3 Turbo",
    value: "runway-gen4-turbo",
    image: "/assets/model-thumbs/runway-gen3-turbo.jpg",
    description:
      "Fast image-to-video generation. Converts images to video efficiently (2-10 seconds).",
    company: "Runway",
    creditCost: 10,
    supportedModes: ["image-to-video"],
    maxDuration: 10,
    apiModel: "gen3a_turbo",
  },
  {
    name: "Runway Veo 3.1",
    value: "runway-gen4-aleph",
    image: "/assets/model-thumbs/runway-gen3.jpg",
    description:
      "Advanced video generation from text prompts. Premium quality output (4-8 seconds).",
    company: "Runway",
    creditCost: 25,
    supportedModes: ["text-to-video", "image-to-video"],
    maxDuration: 8,
    apiModel: "veo3.1",
  },
  {
    name: "Luma Dream Machine",
    value: "luma-dream-machine",
    image: "/assets/model-thumbs/luma-dream-machine.jpg",
    description:
      "Cinematic video generation with realistic physics and natural motion. Great for storytelling.",
    company: "Luma AI",
    creditCost: 25,
    supportedModes: ["text-to-video", "image-to-video"],
    maxDuration: 5,
  },
  {
    name: "Stable Video Diffusion",
    value: "stability-video",
    image: "/assets/model-thumbs/stability-video.jpg",
    description:
      "Image-to-video generation using Stable Diffusion technology. Requires a source image.",
    company: "Stability AI",
    creditCost: 12,
    supportedModes: ["image-to-video"],
    maxDuration: 4,
  },
];

export const ASPECT_RATIO_OPTIONS = [
  { label: "Landscape", value: "16:9", width: 1280, height: 720 },
  { label: "Portrait", value: "9:16", width: 720, height: 1280 },
  { label: "Square", value: "1:1", width: 1024, height: 1024 },
] as const;

export const DURATION_OPTIONS = [
  { label: "4 seconds", value: 4 },
  { label: "6 seconds", value: 6 },
  { label: "8 seconds", value: 8 },
  { label: "10 seconds", value: 10 },
] as const;
