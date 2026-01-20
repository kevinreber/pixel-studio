import React from "react";
import { useFetcher } from "@remix-run/react";
import { Button } from "@/components/ui/button";
import { Flame, Gift, Loader2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  canClaimDailyBonus: boolean;
  nextMilestone: number | null;
  daysUntilMilestone: number;
  totalDaysLoggedIn: number;
}

interface ClaimResult {
  success: boolean;
  creditsAwarded: number;
  streakBonus: number;
  newStreak: number;
  isNewDay: boolean;
  streakMilestone: number | null;
  message: string;
}

interface StreakDisplayProps {
  initialData?: StreakData;
  compact?: boolean;
  className?: string;
}

export const StreakDisplay = ({
  initialData,
  compact = false,
  className,
}: StreakDisplayProps) => {
  const fetcher = useFetcher<{ success: boolean; data: StreakData }>();
  const claimFetcher = useFetcher<{ success: boolean; data: ClaimResult }>();

  const [showCelebration, setShowCelebration] = React.useState(false);
  const [lastClaimResult, setLastClaimResult] = React.useState<ClaimResult | null>(null);
  const [claimError, setClaimError] = React.useState<string | null>(null);
  const [processedClaimId, setProcessedClaimId] = React.useState<number>(0);

  // Load initial data on mount
  React.useEffect(() => {
    if (!initialData) {
      fetcher.load("/api/streaks");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  // Handle claim result - track processed state to prevent refetch loops
  React.useEffect(() => {
    // Generate a unique ID for this claim result to track if we've processed it
    const claimId = claimFetcher.data ? Date.now() : 0;
    if (claimId === 0 || claimId === processedClaimId) return;

    setProcessedClaimId(claimId);
    setClaimError(null);

    if (claimFetcher.data?.success && claimFetcher.data.data?.isNewDay) {
      setLastClaimResult(claimFetcher.data.data);
      setShowCelebration(true);
      // Refresh streak data only once on successful claim
      fetcher.load("/api/streaks");
      // Hide celebration after 3 seconds
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    } else if (claimFetcher.data && !claimFetcher.data.success) {
      // Handle claim failure
      setClaimError(claimFetcher.data.data?.message || "Failed to claim bonus");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimFetcher.data]);

  const data = initialData || fetcher.data?.data;
  const isLoading = fetcher.state === "loading";
  const isClaiming = claimFetcher.state === "submitting";
  const hasError = fetcher.data && !fetcher.data.success;

  const handleClaimBonus = () => {
    setClaimError(null);
    claimFetcher.submit(
      {},
      { method: "POST", action: "/api/streaks" }
    );
  };

  if (isLoading && !data) {
    return (
      <div className={cn("flex items-center gap-2 text-zinc-400", className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading streak...</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={cn("flex flex-col items-center gap-2 text-zinc-400 py-4", className)}>
        <Flame className="h-6 w-6 text-zinc-600" />
        <p className="text-sm">Unable to load streak data</p>
        <button
          onClick={() => fetcher.load("/api/streaks")}
          className="text-xs text-zinc-500 hover:text-white underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full px-3 py-1.5">
          <Flame className="h-4 w-4 text-orange-500" />
          <span className="font-bold text-orange-500">{data.currentStreak}</span>
          <span className="text-xs text-zinc-400">day streak</span>
        </div>
        {data.canClaimDailyBonus && (
          <Button
            size="sm"
            onClick={handleClaimBonus}
            disabled={isClaiming}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold text-xs px-2 py-1 h-auto"
          >
            {isClaiming ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <Gift className="h-3 w-3 mr-1" />
                Claim
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("bg-zinc-900 rounded-xl p-4 border border-zinc-800", className)}>
      {/* Celebration overlay */}
      {showCelebration && lastClaimResult && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl z-10 animate-in fade-in duration-300">
          <div className="text-center p-4">
            <div className="text-4xl mb-2">
              {lastClaimResult.streakMilestone ? "🎉" : "🔥"}
            </div>
            <p className="text-lg font-bold text-white mb-1">
              {lastClaimResult.message}
            </p>
            <p className="text-sm text-green-400">
              +{lastClaimResult.creditsAwarded} credits
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Daily Streak
        </h3>
        {data.longestStreak > 0 && (
          <div className="flex items-center gap-1 text-xs text-zinc-400">
            <Trophy className="h-3 w-3 text-yellow-500" />
            Best: {data.longestStreak} days
          </div>
        )}
      </div>

      {/* Streak counter */}
      <div className="text-center mb-4">
        <div className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
          {data.currentStreak}
        </div>
        <p className="text-zinc-400 text-sm">
          {data.currentStreak === 1 ? "day" : "days"} in a row
        </p>
      </div>

      {/* Progress to next milestone */}
      {data.nextMilestone && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-zinc-400 mb-1">
            <span>Next milestone</span>
            <span>{data.nextMilestone} days</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (data.currentStreak / data.nextMilestone) * 100)}%`,
              }}
            />
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {data.daysUntilMilestone} days until bonus credits!
          </p>
        </div>
      )}

      {/* Claim button */}
      {data.canClaimDailyBonus ? (
        <div className="space-y-2">
          <Button
            onClick={handleClaimBonus}
            disabled={isClaiming}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold"
          >
            {isClaiming ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Gift className="h-4 w-4 mr-2" />
            )}
            Claim Daily Bonus
          </Button>
          {claimError && (
            <p className="text-xs text-red-400 text-center">{claimError}</p>
          )}
        </div>
      ) : (
        <div className="text-center text-sm text-zinc-500 py-2">
          Come back tomorrow for your next bonus!
        </div>
      )}

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-zinc-800 text-xs text-zinc-500 text-center">
        Total days logged in: {data.totalDaysLoggedIn}
      </div>
    </div>
  );
};
