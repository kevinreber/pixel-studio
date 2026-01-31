import { type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { PageContainer } from "~/components";
import { AchievementsGrid } from "~/components/AchievementBadge";
import { StreakDisplay } from "~/components/StreakDisplay";
import { requireUserLogin } from "~/services";
import { getUserAchievements, getAchievementStats, seedAchievements } from "~/services/achievements.server";
import { getStreakStats } from "~/services/loginStreak.server";
import { Trophy, Star, Sparkles, Target } from "lucide-react";

export const meta: MetaFunction = () => {
  return [{ title: "Achievements - Pixel Studio" }];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUserLogin(request);

  // Ensure achievements are seeded
  await seedAchievements();

  const [achievements, stats, streakStats] = await Promise.all([
    getUserAchievements(user.id),
    getAchievementStats(user.id),
    getStreakStats(user.id),
  ]);

  return { achievements, stats, streakStats };
};

export default function AchievementsPage() {
  const { achievements, stats, streakStats } = useLoaderData<typeof loader>();

  return (
    <PageContainer>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Achievements
          </h1>
          <p className="text-zinc-400">
            Track your progress and unlock rewards
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
              <Trophy className="h-4 w-4" />
              Unlocked
            </div>
            <div className="text-2xl font-bold">
              {stats.unlockedCount}
              <span className="text-sm text-zinc-500 font-normal ml-1">
                / {stats.totalAchievements}
              </span>
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              {stats.completionPercent}% complete
            </div>
          </div>

          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
              <Star className="h-4 w-4 text-purple-400" />
              XP Earned
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {stats.earnedXp}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              From achievements
            </div>
          </div>

          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
              <Sparkles className="h-4 w-4 text-yellow-400" />
              Bonus Credits
            </div>
            <div className="text-2xl font-bold text-yellow-400">
              {stats.earnedCredits}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              Earned from unlocks
            </div>
          </div>

          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
              <Target className="h-4 w-4 text-green-400" />
              By Tier
            </div>
            <div className="flex gap-2 text-sm">
              <span className="text-amber-600">{stats.tierCounts.bronze || 0}B</span>
              <span className="text-slate-400">{stats.tierCounts.silver || 0}S</span>
              <span className="text-yellow-500">{stats.tierCounts.gold || 0}G</span>
              <span className="text-cyan-400">{stats.tierCounts.platinum || 0}P</span>
            </div>
          </div>
        </div>

        {/* Two column layout */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Streak Display */}
          <div className="md:col-span-1">
            <StreakDisplay initialData={streakStats} />
          </div>

          {/* Achievements Grid */}
          <div className="md:col-span-2">
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h2 className="text-lg font-semibold mb-4">All Achievements</h2>
              <AchievementsGrid
                achievements={achievements}
                size="md"
                showProgress={true}
              />
            </div>
          </div>
        </div>

        {/* Progress bar for overall completion */}
        <div className="mt-8 bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-zinc-400">Overall Progress</span>
            <span className="text-white font-medium">
              {stats.unlockedCount} / {stats.totalAchievements} achievements
            </span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${stats.completionPercent}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500 mt-2 text-center">
            Keep creating and engaging to unlock more achievements!
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
