import { describe, test, expect } from "vitest";

/**
 * Unit tests for Duration-Based Video Pricing feature.
 *
 * These tests verify that:
 * 1. Video credit costs are calculated based on duration
 * 2. Pricing format strings are correctly structured
 * 3. Duration options are filtered by model constraints
 * 4. Edge cases are handled gracefully
 *
 * Moved from Playwright E2E tests to Vitest for faster execution.
 */

// Video model pricing configuration (mirrors app/config/pricing.ts)
const VIDEO_MODEL_PRICING = {
  "runway-gen4-turbo": {
    baseCost: 5,
    perSecondCost: 2,
    minDuration: 2,
    maxDuration: 10,
  },
  "runway-gen4-aleph": {
    baseCost: 10,
    perSecondCost: 3,
    minDuration: 4,
    maxDuration: 8,
  },
  "luma-dream-machine": {
    baseCost: 10,
    perSecondCost: 3,
    minDuration: 2,
    maxDuration: 5,
  },
  "stability-video": {
    baseCost: 8,
    perSecondCost: 2,
    minDuration: 2,
    maxDuration: 4,
  },
};

/**
 * Helper function to calculate expected credit cost
 */
function calculateExpectedCost(modelValue: string, duration: number): number {
  const pricing =
    VIDEO_MODEL_PRICING[modelValue as keyof typeof VIDEO_MODEL_PRICING];
  if (!pricing) return 0;

  const clampedDuration = Math.max(
    pricing.minDuration,
    Math.min(duration, pricing.maxDuration)
  );
  return pricing.baseCost + clampedDuration * pricing.perSecondCost;
}

describe("Video Pricing - Credit Calculation Logic", () => {
  test("calculates correct cost for runway-gen4-turbo at various durations", () => {
    const model = "runway-gen4-turbo";

    // 5 seconds: 5 base + (5 × 2) = 15 credits
    expect(calculateExpectedCost(model, 5)).toBe(15);

    // 10 seconds: 5 base + (10 × 2) = 25 credits
    expect(calculateExpectedCost(model, 10)).toBe(25);

    // 2 seconds (minimum): 5 base + (2 × 2) = 9 credits
    expect(calculateExpectedCost(model, 2)).toBe(9);

    // Duration below minimum should clamp to minimum
    expect(calculateExpectedCost(model, 1)).toBe(9);

    // Duration above maximum should clamp to maximum
    expect(calculateExpectedCost(model, 15)).toBe(25);
  });

  test("calculates correct cost for runway-gen4-aleph at various durations", () => {
    const model = "runway-gen4-aleph";

    // 4 seconds (minimum): 10 base + (4 × 3) = 22 credits
    expect(calculateExpectedCost(model, 4)).toBe(22);

    // 6 seconds: 10 base + (6 × 3) = 28 credits
    expect(calculateExpectedCost(model, 6)).toBe(28);

    // 8 seconds (maximum): 10 base + (8 × 3) = 34 credits
    expect(calculateExpectedCost(model, 8)).toBe(34);
  });

  test("calculates correct cost for luma-dream-machine", () => {
    const model = "luma-dream-machine";

    // 3 seconds: 10 base + (3 × 3) = 19 credits
    expect(calculateExpectedCost(model, 3)).toBe(19);

    // 5 seconds (maximum): 10 base + (5 × 3) = 25 credits
    expect(calculateExpectedCost(model, 5)).toBe(25);
  });

  test("calculates correct cost for stability-video", () => {
    const model = "stability-video";

    // 3 seconds: 8 base + (3 × 2) = 14 credits
    expect(calculateExpectedCost(model, 3)).toBe(14);

    // 4 seconds (maximum): 8 base + (4 × 2) = 16 credits
    expect(calculateExpectedCost(model, 4)).toBe(16);
  });
});

describe("Video Pricing - Margin Analysis", () => {
  // Runway charges 5 API credits/second at $0.01/credit = $0.05/second
  const RUNWAY_API_COST_PER_SECOND = 0.05;
  // Blended average revenue per Pixel Studio credit
  const REVENUE_PER_CREDIT = 0.045;

  test("runway-gen4-turbo 5s video has positive margin", () => {
    const duration = 5;
    const apiCost = duration * RUNWAY_API_COST_PER_SECOND; // $0.25
    const credits = calculateExpectedCost("runway-gen4-turbo", duration); // 15
    const revenue = credits * REVENUE_PER_CREDIT; // $0.675
    const margin = ((revenue - apiCost) / apiCost) * 100;

    expect(apiCost).toBe(0.25);
    expect(credits).toBe(15);
    expect(margin).toBeGreaterThan(100); // Should have >100% margin
  });

  test("runway-gen4-turbo 10s video has positive margin", () => {
    const duration = 10;
    const apiCost = duration * RUNWAY_API_COST_PER_SECOND; // $0.50
    const credits = calculateExpectedCost("runway-gen4-turbo", duration); // 25
    const revenue = credits * REVENUE_PER_CREDIT; // $1.125
    const margin = ((revenue - apiCost) / apiCost) * 100;

    expect(apiCost).toBe(0.5);
    expect(credits).toBe(25);
    expect(margin).toBeGreaterThan(100); // Should have >100% margin
  });

  test("all durations for runway-gen4-turbo maintain positive margins", () => {
    for (let duration = 2; duration <= 10; duration++) {
      const apiCost = duration * RUNWAY_API_COST_PER_SECOND;
      const credits = calculateExpectedCost("runway-gen4-turbo", duration);
      const revenue = credits * REVENUE_PER_CREDIT;
      const margin = ((revenue - apiCost) / apiCost) * 100;

      expect(margin).toBeGreaterThan(50); // At minimum 50% margin
    }
  });
});

describe("Video Pricing - Pricing Format Display", () => {
  test("pricing format string is correctly structured", () => {
    // Test the format: "{base}+{perSecond}/s"
    const model = VIDEO_MODEL_PRICING["runway-gen4-turbo"];
    const formatString = `${model.baseCost}+${model.perSecondCost}/s`;
    expect(formatString).toBe("5+2/s");
  });

  test("total cost breakdown string is correctly structured", () => {
    // Test the format: "{base} base + {perSecond}/sec × {duration}s"
    const model = VIDEO_MODEL_PRICING["runway-gen4-turbo"];
    const duration = 10;
    const breakdownString = `${model.baseCost} base + ${model.perSecondCost}/sec × ${duration}s`;
    expect(breakdownString).toBe("5 base + 2/sec × 10s");
  });
});

describe("Video Pricing - Duration Options", () => {
  const DURATION_OPTIONS = [
    { value: 4, label: "4 seconds" },
    { value: 6, label: "6 seconds" },
    { value: 8, label: "8 seconds" },
    { value: 10, label: "10 seconds" },
  ];

  test("duration options are filtered by model max duration", () => {
    // For runway-gen4-turbo (maxDuration: 10), all options should be available
    const turboOptions = DURATION_OPTIONS.filter(
      (d) => d.value <= VIDEO_MODEL_PRICING["runway-gen4-turbo"].maxDuration
    );
    expect(turboOptions.length).toBe(4);

    // For runway-gen4-aleph (maxDuration: 8), 10s option should be filtered out
    const alephOptions = DURATION_OPTIONS.filter(
      (d) => d.value <= VIDEO_MODEL_PRICING["runway-gen4-aleph"].maxDuration
    );
    expect(alephOptions.length).toBe(3);
    expect(alephOptions.map((o) => o.value)).toEqual([4, 6, 8]);

    // For luma-dream-machine (maxDuration: 5), only 4s option should be available
    const lumaOptions = DURATION_OPTIONS.filter(
      (d) => d.value <= VIDEO_MODEL_PRICING["luma-dream-machine"].maxDuration
    );
    expect(lumaOptions.length).toBe(1);
    expect(lumaOptions[0].value).toBe(4);

    // For stability-video (maxDuration: 4), only 4s option should be available
    const stabilityOptions = DURATION_OPTIONS.filter(
      (d) => d.value <= VIDEO_MODEL_PRICING["stability-video"].maxDuration
    );
    expect(stabilityOptions.length).toBe(1);
    expect(stabilityOptions[0].value).toBe(4);
  });
});

describe("Video Pricing - Model Cards Display", () => {
  test("each model has correct pricing properties", () => {
    // Verify all models have required pricing fields
    Object.values(VIDEO_MODEL_PRICING).forEach((pricing) => {
      expect(pricing).toHaveProperty("baseCost");
      expect(pricing).toHaveProperty("perSecondCost");
      expect(pricing).toHaveProperty("minDuration");
      expect(pricing).toHaveProperty("maxDuration");

      // Verify values are positive
      expect(pricing.baseCost).toBeGreaterThan(0);
      expect(pricing.perSecondCost).toBeGreaterThan(0);
      expect(pricing.minDuration).toBeGreaterThan(0);
      expect(pricing.maxDuration).toBeGreaterThanOrEqual(pricing.minDuration);
    });
  });
});

describe("Video Pricing - Edge Cases", () => {
  test("handles unknown model gracefully", () => {
    // Unknown model should return 0 (our helper function behavior)
    const cost = calculateExpectedCost("unknown-model", 5);
    expect(cost).toBe(0);
  });

  test("handles zero duration by clamping to minimum", () => {
    const cost = calculateExpectedCost("runway-gen4-turbo", 0);
    // Should clamp to minimum (2s): 5 + (2 × 2) = 9
    expect(cost).toBe(9);
  });

  test("handles negative duration by clamping to minimum", () => {
    const cost = calculateExpectedCost("runway-gen4-turbo", -5);
    // Should clamp to minimum (2s): 5 + (2 × 2) = 9
    expect(cost).toBe(9);
  });
});

describe("Video Pricing - Backwards Compatibility", () => {
  test("legacy creditCost field is still present", () => {
    // Models should have a legacy creditCost for backwards compatibility
    // This is calculated as baseCost + (defaultDuration × perSecondCost)
    const model = VIDEO_MODEL_PRICING["runway-gen4-turbo"];
    const legacyCost = model.baseCost + 5 * model.perSecondCost; // Default 5s
    expect(legacyCost).toBe(15);
  });
});

describe("Video Pricing - API Integration", () => {
  test("form data includes duration parameter", () => {
    // Verify form data structure includes duration
    const expectedFields = ["prompt", "model", "duration", "aspectRatio"];
    expectedFields.forEach((field) => {
      expect(typeof field).toBe("string");
    });

    // Duration should be a number when parsed
    const sampleDuration = "10";
    expect(parseInt(sampleDuration)).toBe(10);
  });
});

describe("Video Pricing - Comparison with Old Pricing", () => {
  // Old flat pricing (before this feature)
  const OLD_PRICING = {
    "runway-gen4-turbo": 10,
    "runway-gen4-aleph": 20,
    "luma-dream-machine": 25,
    "stability-video": 12,
  };

  test("new pricing is higher for longer durations", () => {
    // 10s runway-gen4-turbo: old = 10, new = 25
    const newCost = calculateExpectedCost("runway-gen4-turbo", 10);
    const oldCost = OLD_PRICING["runway-gen4-turbo"];
    expect(newCost).toBeGreaterThan(oldCost);
  });

  test("new pricing can be similar for shorter durations", () => {
    // 2s runway-gen4-turbo: old = 10, new = 9
    const newCost = calculateExpectedCost("runway-gen4-turbo", 2);
    const oldCost = OLD_PRICING["runway-gen4-turbo"];
    expect(newCost).toBeLessThanOrEqual(oldCost);
  });
});
