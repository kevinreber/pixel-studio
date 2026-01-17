/**
 * Centralized pricing configuration for Pixel Studio
 *
 * Credit costs are based on actual API costs with healthy margins:
 * - Budget tier (1 credit): ~$0.02 API cost, $0.05 revenue = +150% margin
 * - Standard tier (2 credits): ~$0.025-0.035 API cost, $0.10 revenue = +185-300% margin
 * - Premium tier (4-6 credits): ~$0.04-0.08 API cost, $0.20-0.30 revenue = +275-400% margin
 *
 * Video generation is more expensive due to higher API costs:
 * - Video Standard tier (10-15 credits): ~$0.25-0.40 API cost
 * - Video Premium tier (20-30 credits): ~$0.50-1.00 API cost
 */

export type PricingTier = "budget" | "standard" | "premium";
export type MediaType = "image" | "video";

export interface ModelPricing {
  credits: number;
  tier: PricingTier;
  apiCostEstimate: number; // For internal reference
}

/**
 * Credit cost per model based on actual API costs
 */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // Budget Tier (1 credit) - Older/cheaper models
  "dall-e-2": {
    credits: 1,
    tier: "budget",
    apiCostEstimate: 0.02,
  },

  // Standard Tier (2 credits) - Good balance of quality/cost
  "stable-diffusion-xl-1024-v1-0": {
    credits: 2,
    tier: "standard",
    apiCostEstimate: 0.035,
  },
  "flux-dev": {
    credits: 2,
    tier: "standard",
    apiCostEstimate: 0.025,
  },
  "flux-pro": {
    credits: 2,
    tier: "standard",
    apiCostEstimate: 0.025,
  },

  // Premium Tier (4-6 credits) - Highest quality models
  "flux-pro-1.1": {
    credits: 4,
    tier: "premium",
    apiCostEstimate: 0.04,
  },
  "dall-e-3": {
    credits: 6,
    tier: "premium",
    apiCostEstimate: 0.08,
  },

  // Replicate Models
  "replicate-playground-v2.5": {
    credits: 2,
    tier: "standard",
    apiCostEstimate: 0.03,
  },
  "replicate-kandinsky-2.2": {
    credits: 2,
    tier: "standard",
    apiCostEstimate: 0.025,
  },

  // Ideogram Models
  "ideogram-v2": {
    credits: 4,
    tier: "premium",
    apiCostEstimate: 0.05,
  },
  "ideogram-v2-turbo": {
    credits: 2,
    tier: "standard",
    apiCostEstimate: 0.02,
  },
  "ideogram-v1": {
    credits: 2,
    tier: "standard",
    apiCostEstimate: 0.03,
  },
  "ideogram-v1-turbo": {
    credits: 1,
    tier: "budget",
    apiCostEstimate: 0.015,
  },

  // Fal.ai Models (unique offerings only)
  "fal-sdxl-lightning": {
    credits: 1,
    tier: "budget",
    apiCostEstimate: 0.005,
  },
  "fal-stable-cascade": {
    credits: 2,
    tier: "standard",
    apiCostEstimate: 0.02,
  },

  // Together AI Models (unique offerings only)
  "together-sd3": {
    credits: 2,
    tier: "standard",
    apiCostEstimate: 0.035,
  },
} as const;

/**
 * Credit cost per video model based on actual API costs
 * Video generation is significantly more expensive than image generation
 */
export const VIDEO_MODEL_PRICING: Record<string, ModelPricing> = {
  // Standard Tier (10-15 credits) - Fast video generation
  "runway-gen3-turbo": {
    credits: 10,
    tier: "standard",
    apiCostEstimate: 0.25,
  },
  "stability-video": {
    credits: 12,
    tier: "standard",
    apiCostEstimate: 0.30,
  },

  // Premium Tier (20-30 credits) - High quality video generation
  "runway-gen3": {
    credits: 20,
    tier: "premium",
    apiCostEstimate: 0.50,
  },
  "luma-dream-machine": {
    credits: 25,
    tier: "premium",
    apiCostEstimate: 0.60,
  },
} as const;

/**
 * Default credit cost for unknown models (fallback)
 */
export const DEFAULT_CREDIT_COST = 2;
export const DEFAULT_VIDEO_CREDIT_COST = 15;

/**
 * Get the credit cost for a specific image model
 */
export function getModelCreditCost(modelValue: string): number {
  return MODEL_PRICING[modelValue]?.credits ?? DEFAULT_CREDIT_COST;
}

/**
 * Get the credit cost for a specific video model
 */
export function getVideoModelCreditCost(modelValue: string): number {
  return VIDEO_MODEL_PRICING[modelValue]?.credits ?? DEFAULT_VIDEO_CREDIT_COST;
}

/**
 * Get the pricing tier for a specific image model
 */
export function getModelTier(modelValue: string): PricingTier {
  return MODEL_PRICING[modelValue]?.tier ?? "standard";
}

/**
 * Get the pricing tier for a specific video model
 */
export function getVideoModelTier(modelValue: string): PricingTier {
  return VIDEO_MODEL_PRICING[modelValue]?.tier ?? "standard";
}

/**
 * Credit packages available for purchase
 */
export const CREDIT_PACKAGES = {
  starter: {
    credits: 50,
    priceInCents: 299,
    priceDisplay: "$2.99",
    perCreditCost: 0.06,
  },
  standard: {
    credits: 150,
    priceInCents: 699,
    priceDisplay: "$6.99",
    perCreditCost: 0.047,
  },
  pro: {
    credits: 400,
    priceInCents: 1499,
    priceDisplay: "$14.99",
    perCreditCost: 0.037,
  },
} as const;

/**
 * Tier display information for UI
 */
export const TIER_INFO: Record<
  PricingTier,
  { label: string; description: string; color: string }
> = {
  budget: {
    label: "Budget",
    description: "Cost-effective generation",
    color: "text-green-500",
  },
  standard: {
    label: "Standard",
    description: "Balanced quality and cost",
    color: "text-blue-500",
  },
  premium: {
    label: "Premium",
    description: "Highest quality output",
    color: "text-purple-500",
  },
};
