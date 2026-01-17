/**
 * Video generation model configuration
 */

export const VIDEO_MODEL_OPTIONS = [
  {
    name: "Runway Gen-3 Alpha",
    value: "runway-gen3",
    image: "/assets/model-thumbs/runway-gen3.jpg",
    description:
      "High-quality video generation with excellent motion and consistency. Supports text-to-video and image-to-video.",
    company: "Runway",
    creditCost: 20,
    supportedModes: ["text-to-video", "image-to-video"],
    maxDuration: 10,
  },
  {
    name: "Runway Gen-3 Turbo",
    value: "runway-gen3-turbo",
    image: "/assets/model-thumbs/runway-gen3-turbo.jpg",
    description:
      "Faster video generation with good quality. Great for quick iterations and previews.",
    company: "Runway",
    creditCost: 10,
    supportedModes: ["text-to-video", "image-to-video"],
    maxDuration: 10,
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
] as const;

export type VideoModelOption = (typeof VIDEO_MODEL_OPTIONS)[number];

export const ASPECT_RATIO_OPTIONS = [
  { label: "Landscape", value: "16:9", width: 1280, height: 720 },
  { label: "Portrait", value: "9:16", width: 720, height: 1280 },
  { label: "Square", value: "1:1", width: 1024, height: 1024 },
] as const;

export const DURATION_OPTIONS = [
  { label: "5 seconds", value: 5 },
  { label: "10 seconds", value: 10 },
] as const;
