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
  /** @deprecated Use baseCreditCost and perSecondCreditCost instead */
  creditCost: number;
  /** Base credit cost per generation (fixed overhead) */
  baseCreditCost: number;
  /** Additional credit cost per second of video */
  perSecondCreditCost: number;
  supportedModes: VideoGenerationMode[];
  minDuration: number;
  maxDuration: number;
  apiModel?: string;
}

/**
 * Calculate total credit cost for a video model based on duration
 */
export function calculateVideoCreditCost(
  model: VideoModelOption,
  duration: number
): number {
  const clampedDuration = Math.max(
    model.minDuration,
    Math.min(duration, model.maxDuration)
  );
  return model.baseCreditCost + clampedDuration * model.perSecondCreditCost;
}

export const VIDEO_MODEL_OPTIONS: VideoModelOption[] = [
  {
    name: "Runway Gen-3 Turbo",
    value: "runway-gen4-turbo",
    image: "/assets/model-thumbs/runway-gen3-turbo.jpg",
    description:
      "Fast image-to-video generation. Converts images to video efficiently (2-10 seconds).",
    company: "Runway",
    creditCost: 15, // Legacy: 5 base + 5s × 2/s (for default 5s)
    baseCreditCost: 5,
    perSecondCreditCost: 2,
    supportedModes: ["image-to-video"],
    minDuration: 2,
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
    creditCost: 22, // Legacy: 10 base + 4s × 3/s (for default 4s)
    baseCreditCost: 10,
    perSecondCreditCost: 3,
    supportedModes: ["text-to-video", "image-to-video"],
    minDuration: 4,
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
    creditCost: 19, // Legacy: 10 base + 3s × 3/s (for default 3s)
    baseCreditCost: 10,
    perSecondCreditCost: 3,
    supportedModes: ["text-to-video", "image-to-video"],
    minDuration: 2,
    maxDuration: 5,
  },
  {
    name: "Stable Video Diffusion",
    value: "stability-video",
    image: "/assets/model-thumbs/stability-video.jpg",
    description:
      "Image-to-video generation using Stable Diffusion technology. Requires a source image.",
    company: "Stability AI",
    creditCost: 14, // Legacy: 8 base + 3s × 2/s (for default 3s)
    baseCreditCost: 8,
    perSecondCreditCost: 2,
    supportedModes: ["image-to-video"],
    minDuration: 2,
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
