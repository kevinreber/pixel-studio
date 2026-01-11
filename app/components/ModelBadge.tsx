import { cn } from "@/lib/utils";

interface ModelBadgeProps {
  model: string | null | undefined;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// OpenAI logo SVG
const OpenAILogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
  </svg>
);

// Stability AI logo SVG
const StabilityAILogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.4c5.302 0 9.6 4.298 9.6 9.6 0 5.302-4.298 9.6-9.6 9.6-5.302 0-9.6-4.298-9.6-9.6 0-5.302 4.298-9.6 9.6-9.6zm-1.2 4.8v9.6h2.4V7.2h-2.4zm-3.6 2.4v7.2h2.4V9.6H7.2zm7.2 0v7.2h2.4V9.6h-2.4z" />
  </svg>
);

// Black Forest Labs logo (tree icon)
const BlackForestLabsLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 2L8 8h2v2H7l-3 6h4v6h8v-6h4l-3-6h-3V8h2l-4-6zm0 2.5L14.5 8h-5L12 4.5zM9 10h6v2H9v-2zm-2.5 4h11l1.5 3H13v5h-2v-5H5l1.5-3z" />
  </svg>
);

// Provider info type
interface ProviderInfo {
  provider: string;
  Logo: ((props: { className?: string }) => JSX.Element) | null;
  color: string;
  bgColor: string;
  borderColor: string;
}

// Map model names to provider info
const getProviderInfo = (model: string): ProviderInfo => {
  const modelLower = model.toLowerCase();

  if (modelLower.includes("dall-e") || modelLower.includes("dalle")) {
    return {
      provider: "OpenAI",
      Logo: OpenAILogo,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
      borderColor: "border-emerald-400/30",
    };
  }

  if (
    modelLower.includes("stable-diffusion") ||
    modelLower.includes("stability") ||
    modelLower.includes("sdxl")
  ) {
    return {
      provider: "Stability AI",
      Logo: StabilityAILogo,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
      borderColor: "border-purple-400/30",
    };
  }

  if (
    modelLower.includes("flux") ||
    modelLower.includes("black forest")
  ) {
    return {
      provider: "Black Forest Labs",
      Logo: BlackForestLabsLogo,
      color: "text-orange-400",
      bgColor: "bg-orange-400/10",
      borderColor: "border-orange-400/30",
    };
  }

  // Default fallback
  return {
    provider: "AI",
    Logo: null,
    color: "text-zinc-400",
    bgColor: "bg-zinc-400/10",
    borderColor: "border-zinc-400/30",
  };
};

// Get provider info by company name (for create page)
export const getProviderInfoByCompany = (company: string): ProviderInfo => {
  const companyLower = company.toLowerCase();

  if (companyLower.includes("openai")) {
    return {
      provider: "OpenAI",
      Logo: OpenAILogo,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
      borderColor: "border-emerald-400/30",
    };
  }

  if (companyLower.includes("stability")) {
    return {
      provider: "Stability AI",
      Logo: StabilityAILogo,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
      borderColor: "border-purple-400/30",
    };
  }

  if (companyLower.includes("black forest")) {
    return {
      provider: "Black Forest Labs",
      Logo: BlackForestLabsLogo,
      color: "text-orange-400",
      bgColor: "bg-orange-400/10",
      borderColor: "border-orange-400/30",
    };
  }

  // Default fallback
  return {
    provider: company,
    Logo: null,
    color: "text-zinc-400",
    bgColor: "bg-zinc-400/10",
    borderColor: "border-zinc-400/30",
  };
};

// Format model name for display
const formatModelName = (model: string): string => {
  return model
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace("Dall E", "DALL-E")
    .replace("Sdxl", "SDXL")
    .replace("Xl", "XL")
    .replace("V1 6", "v1.6")
    .replace("1024 V1 0", "1024 v1.0");
};

const sizeClasses = {
  sm: {
    container: "px-2 py-1 text-xs gap-1.5",
    logo: "w-3.5 h-3.5",
  },
  md: {
    container: "px-2.5 py-1.5 text-sm gap-2",
    logo: "w-4 h-4",
  },
  lg: {
    container: "px-3 py-2 text-base gap-2",
    logo: "w-5 h-5",
  },
};

export const ModelBadge = ({
  model,
  showLabel = true,
  size = "md",
  className,
}: ModelBadgeProps) => {
  if (!model) return null;

  const { provider, Logo, color, bgColor, borderColor } = getProviderInfo(model);
  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border",
        bgColor,
        borderColor,
        sizes.container,
        className
      )}
      title={`${provider}: ${model}`}
    >
      {Logo && <Logo className={cn(sizes.logo, color)} />}
      {showLabel && (
        <span className={cn("font-medium", color)}>
          {formatModelName(model)}
        </span>
      )}
    </div>
  );
};

// Just the logo without badge styling
export const ModelLogo = ({
  model,
  className,
}: {
  model: string | null | undefined;
  className?: string;
}) => {
  if (!model) return null;

  const { Logo, color } = getProviderInfo(model);

  if (!Logo) return null;

  return <Logo className={cn("w-5 h-5", color, className)} />;
};

// Provider badge - shows just the company name with logo (for create page model cards)
interface ProviderBadgeProps {
  company: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ProviderBadge = ({
  company,
  size = "sm",
  className,
}: ProviderBadgeProps) => {
  const { provider, Logo, color, bgColor, borderColor } = getProviderInfoByCompany(company);
  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border",
        bgColor,
        borderColor,
        sizes.container,
        className
      )}
      title={provider}
    >
      {Logo && <Logo className={cn(sizes.logo, color)} />}
      <span className={cn("font-medium", color)}>{provider}</span>
    </div>
  );
};

export default ModelBadge;
