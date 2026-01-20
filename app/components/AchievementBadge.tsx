import React from "react";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Image,
  Crown,
  UserPlus,
  Users,
  Star,
  Flame,
  Trophy,
  Heart,
  MessageCircle,
  Folder,
  Lock,
} from "lucide-react";

interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  icon: string | null;
  tier: string;
  requirement: number;
  xpReward: number;
  creditReward: number;
  isSecret: boolean;
  isUnlocked: boolean;
  unlockedAt: Date | string | null; // Can be string when serialized from JSON
  progress: number;
  progressPercent: number;
}

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  onClick?: () => void;
}

// Map icon names to Lucide icons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  image: Image,
  crown: Crown,
  "user-plus": UserPlus,
  users: Users,
  star: Star,
  flame: Flame,
  trophy: Trophy,
  heart: Heart,
  "message-circle": MessageCircle,
  folder: Folder,
};

// Tier colors
const tierColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  bronze: {
    bg: "bg-gradient-to-br from-amber-700 to-amber-900",
    border: "border-amber-600",
    text: "text-amber-400",
    glow: "shadow-amber-500/20",
  },
  silver: {
    bg: "bg-gradient-to-br from-slate-400 to-slate-600",
    border: "border-slate-400",
    text: "text-slate-300",
    glow: "shadow-slate-400/20",
  },
  gold: {
    bg: "bg-gradient-to-br from-yellow-500 to-yellow-700",
    border: "border-yellow-400",
    text: "text-yellow-400",
    glow: "shadow-yellow-500/30",
  },
  platinum: {
    bg: "bg-gradient-to-br from-cyan-400 to-blue-600",
    border: "border-cyan-400",
    text: "text-cyan-300",
    glow: "shadow-cyan-500/30",
  },
};

const sizeClasses = {
  sm: {
    container: "w-12 h-12",
    icon: "h-5 w-5",
    text: "text-xs",
  },
  md: {
    container: "w-16 h-16",
    icon: "h-7 w-7",
    text: "text-sm",
  },
  lg: {
    container: "w-20 h-20",
    icon: "h-9 w-9",
    text: "text-base",
  },
};

export const AchievementBadge = ({
  achievement,
  size = "md",
  showProgress = true,
  onClick,
}: AchievementBadgeProps) => {
  const IconComponent = achievement.icon
    ? iconMap[achievement.icon] || Sparkles
    : Sparkles;
  const tierStyle = tierColors[achievement.tier] || tierColors.bronze;
  const sizeStyle = sizeClasses[size];

  const isLocked = !achievement.isUnlocked;
  const isSecret = achievement.isSecret && isLocked;

  // Generate accessible label for screen readers
  const ariaLabel = isSecret
    ? "Secret achievement - complete to reveal"
    : `${achievement.name} - ${achievement.tier} tier - ${
        isLocked
          ? `locked, ${achievement.progress} of ${achievement.requirement} progress`
          : "unlocked"
      }`;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200",
        onClick && "cursor-pointer hover:bg-zinc-800/50",
        isLocked && "opacity-60"
      )}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
    >
      {/* Badge icon */}
      <div
        className={cn(
          "relative rounded-full flex items-center justify-center border-2 transition-all",
          sizeStyle.container,
          isLocked
            ? "bg-zinc-800 border-zinc-700"
            : cn(tierStyle.bg, tierStyle.border, "shadow-lg", tierStyle.glow)
        )}
      >
        {isSecret ? (
          <Lock className={cn(sizeStyle.icon, "text-zinc-500")} />
        ) : (
          <IconComponent
            className={cn(
              sizeStyle.icon,
              isLocked ? "text-zinc-500" : "text-white"
            )}
          />
        )}

        {/* Unlocked checkmark */}
        {achievement.isUnlocked && (
          <div
            className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5"
            aria-hidden="true"
          >
            <svg
              className="h-3 w-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Name and description */}
      <div className="text-center">
        <p
          className={cn(
            "font-semibold",
            sizeStyle.text,
            isLocked ? "text-zinc-400" : tierStyle.text
          )}
        >
          {isSecret ? "???" : achievement.name}
        </p>
        {size !== "sm" && (
          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
            {isSecret ? "Complete to reveal" : achievement.description}
          </p>
        )}
      </div>

      {/* Progress bar (for locked achievements) */}
      {showProgress && isLocked && !isSecret && (
        <div className="w-full max-w-[80px]">
          <div className="w-full bg-zinc-800 rounded-full h-1.5">
            <div
              className={cn("h-1.5 rounded-full transition-all", tierStyle.bg)}
              style={{ width: `${achievement.progressPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-500 text-center mt-0.5">
            {achievement.progress}/{achievement.requirement}
          </p>
        </div>
      )}

      {/* Rewards */}
      {size !== "sm" && achievement.isUnlocked && (
        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
          {achievement.xpReward > 0 && (
            <span className="flex items-center gap-0.5">
              <Star className="h-2.5 w-2.5 text-purple-400" />
              {achievement.xpReward} XP
            </span>
          )}
          {achievement.creditReward > 0 && (
            <span className="flex items-center gap-0.5">
              <Sparkles className="h-2.5 w-2.5 text-yellow-400" />
              {achievement.creditReward}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

interface AchievementsGridProps {
  achievements: Achievement[];
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  onAchievementClick?: (achievement: Achievement) => void;
  className?: string;
}

export const AchievementsGrid = ({
  achievements,
  size = "md",
  showProgress = true,
  onAchievementClick,
  className,
}: AchievementsGridProps) => {
  // Group by category
  const grouped = achievements.reduce(
    (acc, achievement) => {
      const category = achievement.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(achievement);
      return acc;
    },
    {} as Record<string, Achievement[]>
  );

  const categoryLabels: Record<string, string> = {
    generation: "Creation",
    social: "Social",
    streak: "Streak",
    engagement: "Engagement",
  };

  return (
    <div className={cn("space-y-6", className)}>
      {Object.entries(grouped).map(([category, categoryAchievements]) => (
        <div key={category}>
          <h4 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wide">
            {categoryLabels[category] || category}
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {categoryAchievements.map((achievement) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                size={size}
                showProgress={showProgress}
                onClick={() => onAchievementClick?.(achievement)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
