/**
 * Model and Style configuration for image generation
 * Separated to avoid circular dependencies between routes and components
 */

export const MODEL_OPTIONS = [
  {
    name: "Stable Diffusion 1.6",
    value: "stable-diffusion-v1-6",
    image: "/assets/model-thumbs/sd-1-5.jpg",
    description: "The most popular first-generation stable diffusion model.",
    company: "Stability AI",
    supportsStyles: true,
    creditCost: 1,
  },
  {
    name: "Stable Diffusion XL",
    value: "stable-diffusion-xl-1024-v1-0",
    image: "/assets/model-thumbs/sdxlv1.jpg",
    description: "The state-of-the-art in open-source image generation.",
    company: "Stability AI",
    supportsStyles: true,
    creditCost: 2,
  },
  {
    name: "Flux Pro",
    value: "flux-pro",
    image: "/assets/model-thumbs/flux-schnell.jpg",
    description: "High-quality image generation by Black Forest Labs.",
    company: "Black Forest Labs",
    supportsStyles: false,
    creditCost: 2,
  },
  {
    name: "Flux Pro 1.1",
    value: "flux-pro-1.1",
    image: "/assets/model-thumbs/flux-pro-1-1.jpg",
    description:
      "Professional grade image generation with excellent prompt following and visual quality.",
    company: "Black Forest Labs",
    supportsStyles: false,
    creditCost: 4,
  },
  {
    name: "Flux Dev",
    value: "flux-dev",
    image: "/assets/model-thumbs/flux-dev-thumb-2.jpg",
    description:
      "Development version offering cost-effective image generation while maintaining good quality.",
    company: "Black Forest Labs",
    supportsStyles: false,
    creditCost: 2,
  },
  {
    name: "DALL-E 3",
    value: "dall-e-3",
    image: "/assets/model-thumbs/dalle3.jpg",
    description: "State-of-the-art image generator from OpenAI.",
    company: "OpenAI",
    supportsStyles: false,
    creditCost: 6,
  },
  {
    name: "DALL-E 2",
    value: "dall-e-2",
    image: "/assets/model-thumbs/dalle2.jpg",
    description: "Reliable image generator from OpenAI.",
    company: "OpenAI",
    supportsStyles: false,
    creditCost: 1,
  },

  // Replicate Models
  {
    name: "Playground v2.5",
    value: "replicate-playground-v2.5",
    image: "/assets/model-thumbs/dreamshaper-xl-alpha2.jpg",
    description: "High-quality aesthetic model with excellent prompt following.",
    company: "Replicate",
    supportsStyles: false,
    creditCost: 2,
  },
  {
    name: "Kandinsky 2.2",
    value: "replicate-kandinsky-2.2",
    image: "/assets/model-thumbs/starlight-xl.jpg",
    description: "Multilingual model with unique artistic style.",
    company: "Replicate",
    supportsStyles: false,
    creditCost: 2,
  },

  // Ideogram Models
  {
    name: "Ideogram V2",
    value: "ideogram-v2",
    image: "/assets/model-thumbs/ideogram-v2-nightcafe.jpg",
    description: "Best-in-class text rendering for logos, signs, and typography.",
    company: "Ideogram",
    supportsStyles: false,
    creditCost: 4,
  },
  {
    name: "Ideogram V2 Turbo",
    value: "ideogram-v2-turbo",
    image: "/assets/model-thumbs/ideogram-v2-turbo-nightcafe.jpg",
    description: "Fast version of Ideogram V2 with great text rendering.",
    company: "Ideogram",
    supportsStyles: false,
    creditCost: 2,
  },
  {
    name: "Ideogram V1",
    value: "ideogram-v1",
    image: "/assets/model-thumbs/ideogram-v1.jpg",
    description: "Original Ideogram model with excellent typography support.",
    company: "Ideogram",
    supportsStyles: false,
    creditCost: 2,
  },
  {
    name: "Ideogram V1 Turbo",
    value: "ideogram-v1-turbo",
    image: "/assets/model-thumbs/ideogram-v1-turbo.jpg",
    description: "Budget-friendly Ideogram with quick generation.",
    company: "Ideogram",
    supportsStyles: false,
    creditCost: 1,
  },

  // Fal.ai Models (unique offerings only)
  {
    name: "SDXL Lightning",
    value: "fal-sdxl-lightning",
    image: "/assets/model-thumbs/ds-xl-lightning.jpg",
    description: "Lightning-fast SDXL with 4-step generation.",
    company: "Fal.ai",
    supportsStyles: true,
    creditCost: 1,
  },
  {
    name: "Stable Cascade",
    value: "fal-stable-cascade",
    image: "/assets/model-thumbs/stable-core.jpg",
    description: "Wurstchen architecture for high-quality images.",
    company: "Fal.ai",
    supportsStyles: false,
    creditCost: 2,
  },

  // Together AI Models (unique offerings only)
  {
    name: "SDXL Turbo",
    value: "together-sd-turbo",
    image: "/assets/model-thumbs/sdxl-lcm.jpg",
    description: "Distilled SDXL for instant generation.",
    company: "Together AI",
    supportsStyles: false,
    creditCost: 1,
  },
] as const;

export const STYLE_OPTIONS = [
  {
    name: "3d Model",
    value: "3d-model",
    image: "/assets/preset-text-styles/3d-game-v2.jpg",
  },
  {
    name: "Anime",
    value: "anime",
    image: "/assets/preset-text-styles/anime-v2.jpg",
  },
  {
    name: "Cinematic",
    value: "cinematic",
    image: "/assets/preset-text-styles/cinematic.jpg",
  },
  {
    name: "Comic Book",
    value: "comic-book",
    image: "/assets/preset-text-styles/modern-comic.jpg",
  },
  {
    name: "Digital Art",
    value: "digital-art",
    image: "/assets/preset-text-styles/artistic-portrait.jpg",
  },
  {
    name: "Fantasy Art",
    value: "fantasy-art",
    image: "/assets/preset-text-styles/fantasy.jpg",
  },
  {
    name: "Neon Punk",
    value: "neon-punk",
    image: "/assets/preset-text-styles/cyberpunk.jpg",
  },
  {
    name: "Origami",
    value: "origami",
    image: "/assets/preset-text-styles/epic-origami.jpg",
  },
  {
    name: "Photographic",
    value: "photographic",
    image: "/assets/preset-text-styles/photo.jpg",
  },
  {
    name: "None",
    value: "none",
    image: "",
  },
] as const;

export type ModelOption = (typeof MODEL_OPTIONS)[number];
export type StyleOption = (typeof STYLE_OPTIONS)[number];
