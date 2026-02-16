export interface BuildLogEntry {
  id: string;
  date: string;
  title: string;
  description: string;
  category: "feature" | "improvement" | "fix" | "announcement";
  highlights?: string[];
}

/**
 * User-facing build logs / changelog entries.
 * Add new entries at the top of the array (newest first).
 */
export const buildLogs: BuildLogEntry[] = [
  {
    id: "2026-02-video-stability",
    date: "2026-02-10",
    title: "Stability AI Video Generation",
    description:
      "You can now create videos using Stability AI directly from the Create Video page. Choose from multiple Stability models for different styles and effects.",
    category: "feature",
    highlights: [
      "New Stability AI video models available",
      "Multiple style options for video generation",
      "Accessible from the Create Video page",
    ],
  },
  {
    id: "2026-01-achievements",
    date: "2026-01-20",
    title: "Achievements & Login Streaks",
    description:
      "Stay motivated with our new achievements system! Earn badges for creating content, engaging with the community, and maintaining daily login streaks.",
    category: "feature",
    highlights: [
      "Earn achievement badges for milestones",
      "Track your daily login streak",
      "View achievements on your profile",
    ],
  },
  {
    id: "2026-01-trending",
    date: "2026-01-08",
    title: "Trending Content Page",
    description:
      "Discover the most popular images, videos, and creators on Pixel Studio. Filter by time period to see what's trending right now or over the past month.",
    category: "feature",
    highlights: [
      "See top images, videos, and creators",
      "Filter by 24 hours, 48 hours, 1 week, or 1 month",
      "Updated in real-time",
    ],
  },
  {
    id: "2025-12-marketplace",
    date: "2025-12-15",
    title: "Prompt Marketplace",
    description:
      "Browse and purchase high-quality prompts from other creators, or list your own prompts for sale. Read reviews from other users before purchasing.",
    category: "feature",
    highlights: [
      "Buy and sell prompts from the community",
      "User reviews and ratings",
      "Earn credits from your prompt sales",
    ],
  },
  {
    id: "2025-12-tipping",
    date: "2025-12-01",
    title: "Tip Your Favorite Creators",
    description:
      "Show appreciation for amazing content by sending tips to creators. Support the artists and creators you love directly through Pixel Studio.",
    category: "feature",
    highlights: [
      "Send tips to any creator",
      "Tips are credited directly to the creator's account",
    ],
  },
  {
    id: "2025-11-collections",
    date: "2025-11-20",
    title: "Premium Collections",
    description:
      "Organize your favorite images into collections. Premium collections offer additional features like custom cover images and sharing options.",
    category: "feature",
    highlights: [
      "Create and manage image collections",
      "Premium collection features for subscribers",
      "Share your curated collections with others",
    ],
  },
  {
    id: "2025-11-video-gen",
    date: "2025-11-05",
    title: "Video Generation with Runway & Luma",
    description:
      "Create stunning AI-generated videos with Runway ML and Luma AI. Transform your ideas into motion with our new video generation tools.",
    category: "feature",
    highlights: [
      "Generate videos with Runway ML",
      "Generate videos with Luma AI",
      "Video gallery and playback on your profile",
    ],
  },
  {
    id: "2025-10-realtime",
    date: "2025-10-18",
    title: "Real-Time Generation Updates",
    description:
      "No more waiting and refreshing! You can now see your image generation progress in real-time. Get instant notifications when your images are ready.",
    category: "improvement",
    highlights: [
      "Live progress updates while generating",
      "Instant notification when images are complete",
      "Continue browsing while images generate in the background",
    ],
  },
  {
    id: "2025-10-remix",
    date: "2025-10-05",
    title: "Image Remixing",
    description:
      "Found an image you love? Remix it! Use any image as a starting point and modify it with your own prompt to create something new.",
    category: "feature",
    highlights: [
      "Remix any public image",
      "Modify prompts and styles",
      "Remixed images link back to the original",
    ],
  },
  {
    id: "2025-09-multi-model",
    date: "2025-09-21",
    title: "Multi-Model Image Comparison",
    description:
      "Generate images with multiple AI models side-by-side to compare results. Try DALL-E, Stable Diffusion, Flux, Ideogram, and more with the same prompt.",
    category: "feature",
    highlights: [
      "Compare outputs from different AI models",
      "Side-by-side image comparison view",
      "Choose your favorite result to save",
    ],
  },
  {
    id: "2025-09-faster",
    date: "2025-09-10",
    title: "Faster Image Generation",
    description:
      "We've upgraded our backend infrastructure so your images are generated much faster. Submit your prompt and get results without the long wait.",
    category: "improvement",
    highlights: [
      "Faster queue processing",
      "Reduced wait times across all models",
      "Background processing so you can keep browsing",
    ],
  },
  {
    id: "2025-08-ai-tags",
    date: "2025-08-25",
    title: "AI-Powered Image Tagging",
    description:
      "Images are now automatically tagged using AI, making it easier to discover content through search. Tags help you find exactly what you're looking for.",
    category: "improvement",
    highlights: [
      "Automatic AI-generated tags on new images",
      "Better search results",
      "Browse images by tag",
    ],
  },
  {
    id: "2025-08-new-models",
    date: "2025-08-10",
    title: "New AI Models: Ideogram & FAL",
    description:
      "We've added two new AI image generation models: Ideogram and FAL AI. Each brings unique strengths for different types of creative work.",
    category: "feature",
    highlights: [
      "Ideogram - great for text in images and graphic design",
      "FAL AI - fast, high-quality image generation",
      "Available on the Create page",
    ],
  },
  {
    id: "2025-07-social",
    date: "2025-07-15",
    title: "Social Features: Follow, Like & Comment",
    description:
      "Pixel Studio is now more social than ever. Follow your favorite creators, like images you love, and leave comments to start conversations.",
    category: "feature",
    highlights: [
      "Follow creators to see their work in your feed",
      "Like images and videos",
      "Comment on any image or video",
      "Personalized feed based on who you follow",
    ],
  },
];

/**
 * Get the display label for a build log category.
 */
export function getCategoryLabel(
  category: BuildLogEntry["category"]
): string {
  switch (category) {
    case "feature":
      return "New Feature";
    case "improvement":
      return "Improvement";
    case "fix":
      return "Bug Fix";
    case "announcement":
      return "Announcement";
  }
}
