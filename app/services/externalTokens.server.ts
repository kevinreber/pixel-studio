/**
 * Service to fetch token/credit balances from external AI service providers
 * Used in admin dashboard to monitor API usage across all integrated services
 */

export interface TokenBalance {
  service: string;
  displayName: string;
  balance?: number;
  used?: number;
  limit?: number;
  unit: string;
  status: "available" | "low" | "depleted" | "error" | "unknown";
  error?: string;
  lastUpdated: Date;
  dashboardUrl?: string;
}

interface OpenAIBillingResponse {
  total_usage: number;
}

interface OpenAISubscriptionResponse {
  hard_limit_usd: number;
  soft_limit_usd: number;
  system_hard_limit_usd: number;
}

interface TogetherBalanceResponse {
  available_balance?: number;
  current_balance?: number;
}

interface StabilityBalanceResponse {
  credits: number;
}

interface FalBalanceResponse {
  balance?: number;
  used?: number;
}

/**
 * Fetch OpenAI account balance and usage
 */
async function getOpenAIBalance(): Promise<TokenBalance> {
  const apiKey = process.env.DALLE_API_KEY;
  const dashboardUrl = "https://platform.openai.com/usage";

  if (!apiKey) {
    return {
      service: "openai",
      displayName: "OpenAI (DALL-E)",
      unit: "USD",
      status: "error",
      error: "API key not configured",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  }

  try {
    // Get current month's usage
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const usageResponse = await fetch(
      `https://api.openai.com/v1/dashboard/billing/usage?start_date=${startDate.toISOString().split("T")[0]}&end_date=${endDate.toISOString().split("T")[0]}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const subscriptionResponse = await fetch(
      "https://api.openai.com/v1/dashboard/billing/subscription",
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (!usageResponse.ok || !subscriptionResponse.ok) {
      // Try alternative organization endpoint
      const orgResponse = await fetch("https://api.openai.com/v1/organization/usage", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!orgResponse.ok) {
        return {
          service: "openai",
          displayName: "OpenAI (DALL-E)",
          unit: "USD",
          status: "unknown",
          error: "Could not fetch usage data. Check dashboard manually.",
          lastUpdated: new Date(),
          dashboardUrl,
        };
      }
    }

    const usageData: OpenAIBillingResponse = await usageResponse.json();
    const subscriptionData: OpenAISubscriptionResponse =
      await subscriptionResponse.json();

    const usedUsd = (usageData.total_usage || 0) / 100; // Convert cents to dollars
    const limitUsd = subscriptionData.hard_limit_usd || subscriptionData.system_hard_limit_usd || 0;
    const remainingUsd = Math.max(0, limitUsd - usedUsd);

    let status: TokenBalance["status"] = "available";
    if (limitUsd > 0) {
      const usagePercent = (usedUsd / limitUsd) * 100;
      if (usagePercent >= 100) status = "depleted";
      else if (usagePercent >= 80) status = "low";
    }

    return {
      service: "openai",
      displayName: "OpenAI (DALL-E)",
      balance: remainingUsd,
      used: usedUsd,
      limit: limitUsd,
      unit: "USD",
      status,
      lastUpdated: new Date(),
      dashboardUrl,
    };
  } catch (error) {
    return {
      service: "openai",
      displayName: "OpenAI (DALL-E)",
      unit: "USD",
      status: "unknown",
      error: "Could not fetch balance. Check dashboard manually.",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  }
}

/**
 * Fetch Hugging Face account info
 */
async function getHuggingFaceBalance(): Promise<TokenBalance> {
  const apiToken = process.env.HUGGING_FACE_API_TOKEN;
  const dashboardUrl = "https://huggingface.co/settings/billing";

  if (!apiToken) {
    return {
      service: "huggingface",
      displayName: "Hugging Face",
      unit: "credits",
      status: "error",
      error: "API token not configured",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  }

  try {
    // HF Inference API doesn't have a direct billing endpoint
    // We verify the token works and report status
    const response = await fetch("https://huggingface.co/api/whoami-v2", {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });

    if (!response.ok) {
      return {
        service: "huggingface",
        displayName: "Hugging Face",
        unit: "credits",
        status: "error",
        error: "Invalid API token",
        lastUpdated: new Date(),
        dashboardUrl,
      };
    }

    const data = await response.json();
    const isPro = data.auth?.accessToken?.role === "pro" || data.orgs?.some((o: { isPro?: boolean }) => o.isPro);

    return {
      service: "huggingface",
      displayName: "Hugging Face",
      unit: isPro ? "Pro Plan" : "Free Tier",
      status: "available",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  } catch (error) {
    return {
      service: "huggingface",
      displayName: "Hugging Face",
      unit: "credits",
      status: "unknown",
      error: "Could not verify account. Check dashboard manually.",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  }
}

/**
 * Fetch Replicate account info
 */
async function getReplicateBalance(): Promise<TokenBalance> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  const dashboardUrl = "https://replicate.com/account/billing";

  if (!apiToken) {
    return {
      service: "replicate",
      displayName: "Replicate",
      unit: "USD",
      status: "error",
      error: "API token not configured",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  }

  try {
    const response = await fetch("https://api.replicate.com/v1/account", {
      headers: {
        Authorization: `Token ${apiToken}`,
      },
    });

    if (!response.ok) {
      return {
        service: "replicate",
        displayName: "Replicate",
        unit: "USD",
        status: "error",
        error: `API error: ${response.status}`,
        lastUpdated: new Date(),
        dashboardUrl,
      };
    }

    // Replicate doesn't expose billing details directly via API
    // We can verify the account works
    return {
      service: "replicate",
      displayName: "Replicate",
      unit: "USD",
      status: "available",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  } catch (error) {
    return {
      service: "replicate",
      displayName: "Replicate",
      unit: "USD",
      status: "unknown",
      error: "Could not verify account. Check dashboard manually.",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  }
}

/**
 * Fetch Fal.ai account balance
 */
async function getFalBalance(): Promise<TokenBalance> {
  const apiKey = process.env.FAL_API_KEY;
  const dashboardUrl = "https://fal.ai/dashboard/billing";

  if (!apiKey) {
    return {
      service: "fal",
      displayName: "Fal.ai",
      unit: "USD",
      status: "error",
      error: "API key not configured",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  }

  try {
    // Fal.ai has a billing endpoint
    const response = await fetch("https://rest.alpha.fal.ai/billing/balance", {
      headers: {
        Authorization: `Key ${apiKey}`,
      },
    });

    if (!response.ok) {
      return {
        service: "fal",
        displayName: "Fal.ai",
        unit: "USD",
        status: "unknown",
        error: "Could not fetch balance. Check dashboard manually.",
        lastUpdated: new Date(),
        dashboardUrl,
      };
    }

    const data: FalBalanceResponse = await response.json();
    const balance = data.balance ?? 0;

    return {
      service: "fal",
      displayName: "Fal.ai",
      balance,
      unit: "USD",
      status: balance > 5 ? "available" : balance > 0 ? "low" : "depleted",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  } catch (error) {
    return {
      service: "fal",
      displayName: "Fal.ai",
      unit: "USD",
      status: "unknown",
      error: "Could not fetch balance. Check dashboard manually.",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  }
}

/**
 * Fetch Together AI account balance
 */
async function getTogetherBalance(): Promise<TokenBalance> {
  const apiKey = process.env.TOGETHER_API_KEY;
  const dashboardUrl = "https://api.together.xyz/settings/billing";

  if (!apiKey) {
    return {
      service: "together",
      displayName: "Together AI",
      unit: "USD",
      status: "error",
      error: "API key not configured",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  }

  try {
    const response = await fetch("https://api.together.xyz/v1/billing/balance", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      return {
        service: "together",
        displayName: "Together AI",
        unit: "USD",
        status: "unknown",
        error: "Could not fetch balance. Check dashboard manually.",
        lastUpdated: new Date(),
        dashboardUrl,
      };
    }

    const data: TogetherBalanceResponse = await response.json();
    const balance = data.available_balance ?? data.current_balance ?? 0;

    return {
      service: "together",
      displayName: "Together AI",
      balance,
      unit: "USD",
      status: balance > 5 ? "available" : balance > 0 ? "low" : "depleted",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  } catch (error) {
    return {
      service: "together",
      displayName: "Together AI",
      unit: "USD",
      status: "unknown",
      error: "Could not fetch balance. Check dashboard manually.",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  }
}

/**
 * Fetch Black Forest Labs (Flux) account info
 */
async function getBlackForestBalance(): Promise<TokenBalance> {
  const apiKey = process.env.BLACK_FOREST_LABS_API_KEY;
  const dashboardUrl = "https://api.bfl.ml";

  if (!apiKey) {
    return {
      service: "blackforest",
      displayName: "Black Forest Labs (Flux)",
      unit: "credits",
      status: "error",
      error: "API key not configured",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  }

  try {
    // BFL has a credits endpoint
    const response = await fetch("https://api.bfl.ml/v1/credits", {
      headers: {
        "X-Key": apiKey,
      },
    });

    if (!response.ok) {
      return {
        service: "blackforest",
        displayName: "Black Forest Labs (Flux)",
        unit: "credits",
        status: "unknown",
        error: "Could not fetch balance. Check dashboard manually.",
        lastUpdated: new Date(),
        dashboardUrl,
      };
    }

    const data = await response.json();
    const balance = data.credits ?? data.balance ?? 0;

    return {
      service: "blackforest",
      displayName: "Black Forest Labs (Flux)",
      balance,
      unit: "credits",
      status: balance > 100 ? "available" : balance > 0 ? "low" : "depleted",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  } catch (error) {
    return {
      service: "blackforest",
      displayName: "Black Forest Labs (Flux)",
      unit: "credits",
      status: "unknown",
      error: "Could not fetch balance. Check dashboard manually.",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  }
}

/**
 * Fetch Stability AI account balance
 */
async function getStabilityBalance(): Promise<TokenBalance> {
  const apiKey = process.env.STABILITY_API_KEY;
  const dashboardUrl = "https://platform.stability.ai/account/credits";

  if (!apiKey) {
    return {
      service: "stability",
      displayName: "Stability AI",
      unit: "credits",
      status: "error",
      error: "API key not configured",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  }

  try {
    const response = await fetch("https://api.stability.ai/v1/user/balance", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      return {
        service: "stability",
        displayName: "Stability AI",
        unit: "credits",
        status: "unknown",
        error: "Could not fetch balance. Check dashboard manually.",
        lastUpdated: new Date(),
        dashboardUrl,
      };
    }

    const data: StabilityBalanceResponse = await response.json();
    const credits = data.credits ?? 0;

    return {
      service: "stability",
      displayName: "Stability AI",
      balance: credits,
      unit: "credits",
      status: credits > 100 ? "available" : credits > 0 ? "low" : "depleted",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  } catch (error) {
    return {
      service: "stability",
      displayName: "Stability AI",
      unit: "credits",
      status: "unknown",
      error: "Could not fetch balance. Check dashboard manually.",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  }
}

/**
 * Fetch Runway account info
 */
async function getRunwayBalance(): Promise<TokenBalance> {
  const apiKey = process.env.RUNWAY_API_KEY;
  const dashboardUrl = "https://app.runwayml.com";

  if (!apiKey) {
    return {
      service: "runway",
      displayName: "Runway",
      unit: "credits",
      status: "error",
      error: "API key not configured",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  }

  // Runway doesn't have a public billing API
  return {
    service: "runway",
    displayName: "Runway",
    unit: "credits",
    status: "available",
    lastUpdated: new Date(),
    dashboardUrl,
  };
}

/**
 * Fetch Luma AI account info
 */
async function getLumaBalance(): Promise<TokenBalance> {
  const apiKey = process.env.LUMA_API_KEY;
  const dashboardUrl = "https://lumalabs.ai/dream-machine/api";

  if (!apiKey) {
    return {
      service: "luma",
      displayName: "Luma AI",
      unit: "credits",
      status: "error",
      error: "API key not configured",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  }

  try {
    // Luma has a credits endpoint
    const response = await fetch("https://api.lumalabs.ai/dream-machine/v1/credits", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      return {
        service: "luma",
        displayName: "Luma AI",
        unit: "credits",
        status: "unknown",
        error: "Could not fetch balance. Check dashboard manually.",
        lastUpdated: new Date(),
        dashboardUrl,
      };
    }

    const data = await response.json();
    const balance = data.credit_balance ?? 0;

    return {
      service: "luma",
      displayName: "Luma AI",
      balance,
      unit: "credits",
      status: balance > 100 ? "available" : balance > 0 ? "low" : "depleted",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  } catch (error) {
    return {
      service: "luma",
      displayName: "Luma AI",
      unit: "credits",
      status: "unknown",
      error: "Could not fetch balance. Check dashboard manually.",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  }
}

/**
 * Fetch Stripe account balance
 */
async function getStripeBalance(): Promise<TokenBalance> {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  const dashboardUrl = "https://dashboard.stripe.com/balance";

  if (!apiKey) {
    return {
      service: "stripe",
      displayName: "Stripe",
      unit: "USD",
      status: "error",
      error: "API key not configured",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  }

  try {
    const response = await fetch("https://api.stripe.com/v1/balance", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      return {
        service: "stripe",
        displayName: "Stripe",
        unit: "USD",
        status: "unknown",
        error: "Could not fetch balance. Check dashboard manually.",
        lastUpdated: new Date(),
        dashboardUrl,
      };
    }

    const data = await response.json();
    const availableBalance = data.available?.reduce(
      (sum: number, b: { amount: number }) => sum + b.amount,
      0
    ) ?? 0;
    const pendingBalance = data.pending?.reduce(
      (sum: number, b: { amount: number }) => sum + b.amount,
      0
    ) ?? 0;

    const totalBalance = (availableBalance + pendingBalance) / 100; // Convert cents to dollars

    return {
      service: "stripe",
      displayName: "Stripe",
      balance: totalBalance,
      unit: "USD",
      status: "available",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  } catch (error) {
    return {
      service: "stripe",
      displayName: "Stripe",
      unit: "USD",
      status: "unknown",
      error: "Could not fetch balance. Check dashboard manually.",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  }
}

/**
 * Check Upstash Redis usage
 */
async function getUpstashStatus(): Promise<TokenBalance> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const dashboardUrl = "https://console.upstash.com";

  if (!url || !token) {
    return {
      service: "upstash",
      displayName: "Upstash Redis",
      unit: "commands",
      status: "error",
      error: "Redis URL or token not configured",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  }

  try {
    // Simple ping to verify connection
    const response = await fetch(`${url}/ping`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return {
        service: "upstash",
        displayName: "Upstash Redis",
        unit: "commands",
        status: "error",
        error: "Connection failed",
        lastUpdated: new Date(),
        dashboardUrl,
      };
    }

    return {
      service: "upstash",
      displayName: "Upstash Redis",
      unit: "commands",
      status: "available",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  } catch (error) {
    return {
      service: "upstash",
      displayName: "Upstash Redis",
      unit: "commands",
      status: "unknown",
      error: "Could not verify connection. Check dashboard manually.",
      lastUpdated: new Date(),
      dashboardUrl,
    };
  }
}

/**
 * Fetch all external service token balances
 */
export async function getAllTokenBalances(): Promise<TokenBalance[]> {
  const balances = await Promise.allSettled([
    getOpenAIBalance(),
    getHuggingFaceBalance(),
    getReplicateBalance(),
    getFalBalance(),
    getTogetherBalance(),
    getBlackForestBalance(),
    getStabilityBalance(),
    getRunwayBalance(),
    getLumaBalance(),
    getStripeBalance(),
    getUpstashStatus(),
  ]);

  return balances.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }

    // Fallback for rejected promises
    const serviceNames = [
      "openai",
      "huggingface",
      "replicate",
      "fal",
      "together",
      "blackforest",
      "stability",
      "runway",
      "luma",
      "stripe",
      "upstash",
    ];
    const displayNames = [
      "OpenAI (DALL-E)",
      "Hugging Face",
      "Replicate",
      "Fal.ai",
      "Together AI",
      "Black Forest Labs (Flux)",
      "Stability AI",
      "Runway",
      "Luma AI",
      "Stripe",
      "Upstash Redis",
    ];

    return {
      service: serviceNames[index],
      displayName: displayNames[index],
      unit: "unknown",
      status: "error" as const,
      error: "Failed to fetch balance",
      lastUpdated: new Date(),
    };
  });
}

/**
 * Get token balance for a specific service
 */
export async function getTokenBalance(service: string): Promise<TokenBalance | null> {
  const fetchFunctions: Record<string, () => Promise<TokenBalance>> = {
    openai: getOpenAIBalance,
    huggingface: getHuggingFaceBalance,
    replicate: getReplicateBalance,
    fal: getFalBalance,
    together: getTogetherBalance,
    blackforest: getBlackForestBalance,
    stability: getStabilityBalance,
    runway: getRunwayBalance,
    luma: getLumaBalance,
    stripe: getStripeBalance,
    upstash: getUpstashStatus,
  };

  const fetchFn = fetchFunctions[service.toLowerCase()];
  if (!fetchFn) {
    return null;
  }

  return fetchFn();
}
