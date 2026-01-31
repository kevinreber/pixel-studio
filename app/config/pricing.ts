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
 * Video model pricing with duration-based costs
 *
 * Video generation APIs charge per second, so we need to charge accordingly.
 * Formula: totalCredits = baseCost + (duration * perSecondCost)
 */
export interface VideoModelPricing {
  baseCost: number; // Fixed cost per generation (covers overhead)
  perSecondCost: number; // Additional cost per second of video
  tier: PricingTier;
  apiCostPerSecond: number; // Actual API cost per second for margin tracking
  minDuration: number; // Minimum duration in seconds
  maxDuration: number; // Maximum duration in seconds
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
 *
 * Pricing strategy (targeting 100%+ margins):
 * - Runway charges 5 API credits/second at $0.01/credit = $0.05/second
 * - At $0.045/Pixel credit (blended avg), we need ~1.1 credits/second to break even
 * - We charge 2 credits/second for healthy margins
 *
 * Example: 10-second runway-gen4-turbo video
 * - API cost: 10s × $0.05 = $0.50
 * - Our charge: 5 base + (10 × 2) = 25 credits = $1.125 revenue
 * - Margin: 125%
 */
export const VIDEO_MODEL_PRICING: Record<string, VideoModelPricing> = {
  // Runway Gen-3/4 Turbo - Fast image-to-video (2-10 seconds)
  "runway-gen4-turbo": {
    baseCost: 5, // Base overhead
    perSecondCost: 2, // 2 credits per second
    tier: "standard",
    apiCostPerSecond: 0.05, // Runway: 5 credits × $0.01
    minDuration: 2,
    maxDuration: 10,
  },
  // Legacy alias for gen4-turbo
  "runway-gen3-turbo": {
    baseCost: 5,
    perSecondCost: 2,
    tier: "standard",
    apiCostPerSecond: 0.05,
    minDuration: 2,
    maxDuration: 10,
  },

  // Runway Veo 3.1 - Premium text-to-video (4-8 seconds)
  "runway-gen4-aleph": {
    baseCost: 10, // Higher base for premium model
    perSecondCost: 3, // 3 credits per second (premium)
    tier: "premium",
    apiCostPerSecond: 0.08, // Higher quality model costs more
    minDuration: 4,
    maxDuration: 8,
  },
  // Legacy alias for gen4-aleph
  "runway-gen3": {
    baseCost: 10,
    perSecondCost: 3,
    tier: "premium",
    apiCostPerSecond: 0.08,
    minDuration: 4,
    maxDuration: 8,
  },

  // Stability Video - Image-to-video (up to 4 seconds)
  "stability-video": {
    baseCost: 8,
    perSecondCost: 2,
    tier: "standard",
    apiCostPerSecond: 0.06,
    minDuration: 2,
    maxDuration: 4,
  },

  // Luma Dream Machine - Cinematic video (up to 5 seconds)
  "luma-dream-machine": {
    baseCost: 10,
    perSecondCost: 3,
    tier: "premium",
    apiCostPerSecond: 0.10, // Luma is more expensive
    minDuration: 2,
    maxDuration: 5,
  },
} as const;

/**
 * Default credit cost for unknown models (fallback)
 */
export const DEFAULT_CREDIT_COST = 2;
export const DEFAULT_VIDEO_BASE_COST = 10;
export const DEFAULT_VIDEO_PER_SECOND_COST = 2;

/**
 * Get the credit cost for a specific image model
 */
export function getModelCreditCost(modelValue: string): number {
  return MODEL_PRICING[modelValue]?.credits ?? DEFAULT_CREDIT_COST;
}

/**
 * Get the credit cost for a specific video model based on duration
 *
 * @param modelValue - The video model identifier
 * @param duration - Video duration in seconds
 * @returns Total credit cost for the video generation
 */
export function getVideoModelCreditCost(
  modelValue: string,
  duration: number = 5
): number {
  const pricing = VIDEO_MODEL_PRICING[modelValue];

  if (!pricing) {
    // Fallback for unknown models
    return DEFAULT_VIDEO_BASE_COST + duration * DEFAULT_VIDEO_PER_SECOND_COST;
  }

  // Clamp duration to model's supported range
  const clampedDuration = Math.max(
    pricing.minDuration,
    Math.min(duration, pricing.maxDuration)
  );

  return pricing.baseCost + clampedDuration * pricing.perSecondCost;
}

/**
 * Get the pricing breakdown for a video model
 * Useful for displaying cost details in the UI
 */
export function getVideoModelPricingBreakdown(
  modelValue: string,
  duration: number = 5
): {
  baseCost: number;
  perSecondCost: number;
  duration: number;
  totalCost: number;
  estimatedApiCost: number;
  estimatedMargin: number;
} {
  const pricing = VIDEO_MODEL_PRICING[modelValue];

  if (!pricing) {
    const totalCost =
      DEFAULT_VIDEO_BASE_COST + duration * DEFAULT_VIDEO_PER_SECOND_COST;
    return {
      baseCost: DEFAULT_VIDEO_BASE_COST,
      perSecondCost: DEFAULT_VIDEO_PER_SECOND_COST,
      duration,
      totalCost,
      estimatedApiCost: duration * 0.05,
      estimatedMargin: 0,
    };
  }

  const clampedDuration = Math.max(
    pricing.minDuration,
    Math.min(duration, pricing.maxDuration)
  );
  const totalCost =
    pricing.baseCost + clampedDuration * pricing.perSecondCost;
  const estimatedApiCost = clampedDuration * pricing.apiCostPerSecond;
  // Using blended average of $0.045 per credit
  const estimatedRevenue = totalCost * 0.045;
  const estimatedMargin =
    estimatedApiCost > 0
      ? ((estimatedRevenue - estimatedApiCost) / estimatedApiCost) * 100
      : 0;

  return {
    baseCost: pricing.baseCost,
    perSecondCost: pricing.perSecondCost,
    duration: clampedDuration,
    totalCost,
    estimatedApiCost,
    estimatedMargin: Math.round(estimatedMargin),
  };
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
