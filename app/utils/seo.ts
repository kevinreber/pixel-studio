/**
 * SEO Utilities for Pixel Studio
 *
 * Provides helper functions to generate consistent meta tags, Open Graph tags,
 * Twitter Cards, and structured data across all pages.
 */

// Site configuration
export const SITE_CONFIG = {
  name: "Pixel Studio AI",
  tagline: "AI-Powered Image & Video Generation",
  description:
    "Create stunning AI-generated images and videos with multiple models including DALL-E, Stable Diffusion, Flux, and more. Join our creative community today.",
  url: "https://pixelstudio.ai",
  twitterHandle: "@pixelstudioai",
  defaultImage: "https://pixelstudio.ai/og-image.png",
  locale: "en_US",
};

export interface SeoConfig {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile" | "video.other";
  noIndex?: boolean;
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

/**
 * Generate a full page title with site suffix
 */
export function getPageTitle(title: string): string {
  if (title.includes(SITE_CONFIG.name)) {
    return title;
  }
  return `${title} | ${SITE_CONFIG.name}`;
}

/**
 * Truncate description to optimal length for SEO (150-160 chars)
 */
export function truncateDescription(
  description: string,
  maxLength = 155
): string {
  if (description.length <= maxLength) {
    return description;
  }
  return description.substring(0, maxLength - 3).trim() + "...";
}

/**
 * Generate meta tags array for Remix MetaFunction
 */
export function generateMetaTags(config: SeoConfig): Array<
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string }
  | { tagName: string; rel: string; href: string }
> {
  const {
    title,
    description = SITE_CONFIG.description,
    image = SITE_CONFIG.defaultImage,
    url = SITE_CONFIG.url,
    type = "website",
    noIndex = false,
    keywords = [],
    author,
  } = config;

  const fullTitle = getPageTitle(title);
  const truncatedDescription = truncateDescription(description);

  const tags: Array<
    | { title: string }
    | { name: string; content: string }
    | { property: string; content: string }
    | { tagName: string; rel: string; href: string }
  > = [
    // Basic meta tags
    { title: fullTitle },
    { name: "description", content: truncatedDescription },

    // Open Graph tags
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: truncatedDescription },
    { property: "og:image", content: image },
    { property: "og:url", content: url },
    { property: "og:type", content: type },
    { property: "og:site_name", content: SITE_CONFIG.name },
    { property: "og:locale", content: SITE_CONFIG.locale },

    // Twitter Card tags
    { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: truncatedDescription },
    { name: "twitter:image", content: image },
    { name: "twitter:site", content: SITE_CONFIG.twitterHandle },

    // Canonical URL
    { tagName: "link", rel: "canonical", href: url },
  ];

  // Add optional tags
  if (noIndex) {
    tags.push({ name: "robots", content: "noindex, nofollow" });
  }

  if (keywords.length > 0) {
    tags.push({ name: "keywords", content: keywords.join(", ") });
  }

  if (author) {
    tags.push({ name: "author", content: author });
    tags.push({ property: "article:author", content: author });
  }

  return tags;
}

/**
 * Generate meta tags for an image detail page
 */
export function generateImageMetaTags(image: {
  id: string;
  prompt: string;
  title?: string | null;
  model?: string | null;
  user?: { username: string; name?: string | null } | null;
  createdAt?: string | Date;
}): ReturnType<typeof generateMetaTags> {
  // Use S3 URL pattern for generated images
  const imageUrl = `https://pixel-studio-public.s3.us-west-1.amazonaws.com/${image.id}.png`;

  const title = image.title && image.title !== "Untitled"
    ? image.title
    : `AI Generated Image`;

  const description =
    image.prompt.length > 100
      ? image.prompt.substring(0, 100) + "..."
      : image.prompt;

  const authorName = image.user?.name || image.user?.username || "Anonymous";
  const modelName = image.model || "AI";

  return generateMetaTags({
    title,
    description: `${description} - Created by ${authorName} using ${modelName}`,
    image: imageUrl,
    url: `${SITE_CONFIG.url}/explore/${image.id}`,
    type: "article",
    author: authorName,
    keywords: ["AI art", "AI generated", modelName, "digital art"],
  });
}

/**
 * Generate meta tags for a video detail page
 */
export function generateVideoMetaTags(video: {
  id: string;
  prompt: string;
  title?: string | null;
  model?: string | null;
  user?: { username: string; name?: string | null } | null;
  sourceImageUrl?: string | null;
}): ReturnType<typeof generateMetaTags> {
  // Use source image as thumbnail or default
  const thumbnailUrl =
    video.sourceImageUrl || SITE_CONFIG.defaultImage;

  const title = video.title && video.title !== "Untitled"
    ? video.title
    : `AI Generated Video`;

  const description =
    video.prompt.length > 100
      ? video.prompt.substring(0, 100) + "..."
      : video.prompt;

  const authorName = video.user?.name || video.user?.username || "Anonymous";
  const modelName = video.model || "AI";

  return generateMetaTags({
    title,
    description: `${description} - Created by ${authorName} using ${modelName}`,
    image: thumbnailUrl,
    url: `${SITE_CONFIG.url}/explore/video/${video.id}`,
    type: "video.other",
    author: authorName,
    keywords: ["AI video", "AI generated", modelName, "video generation"],
  });
}

/**
 * Generate meta tags for a user profile page
 */
export function generateProfileMetaTags(user: {
  id: string;
  username: string;
  name?: string | null;
  image?: string | null;
  _count?: { images?: number; videos?: number };
}): ReturnType<typeof generateMetaTags> {
  const displayName = user.name || user.username;
  const imageCount = user._count?.images || 0;
  const videoCount = user._count?.videos || 0;

  let description = `Check out ${displayName}'s AI-generated creations on Pixel Studio.`;
  if (imageCount > 0 || videoCount > 0) {
    const parts: string[] = [];
    if (imageCount > 0) parts.push(`${imageCount} images`);
    if (videoCount > 0) parts.push(`${videoCount} videos`);
    description = `${displayName} has created ${parts.join(" and ")} on Pixel Studio.`;
  }

  return generateMetaTags({
    title: `${displayName}'s Profile`,
    description,
    image: user.image || SITE_CONFIG.defaultImage,
    url: `${SITE_CONFIG.url}/profile/${user.id}`,
    type: "profile",
    author: displayName,
    keywords: ["AI artist", "AI art creator", displayName],
  });
}

// JSON-LD Structured Data Types
export interface OrganizationSchema {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
  sameAs?: string[];
  description?: string;
}

export interface WebSiteSchema {
  "@context": "https://schema.org";
  "@type": "WebSite";
  name: string;
  url: string;
  description?: string;
  potentialAction?: {
    "@type": "SearchAction";
    target: string;
    "query-input": string;
  };
}

export interface ImageObjectSchema {
  "@context": "https://schema.org";
  "@type": "ImageObject";
  name: string;
  description: string;
  contentUrl: string;
  thumbnailUrl: string;
  uploadDate: string;
  author: {
    "@type": "Person";
    name: string;
    url?: string;
  };
  creator?: {
    "@type": "Organization";
    name: string;
  };
}

export interface VideoObjectSchema {
  "@context": "https://schema.org";
  "@type": "VideoObject";
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  contentUrl?: string;
  author: {
    "@type": "Person";
    name: string;
    url?: string;
  };
}

export interface BreadcrumbSchema {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item?: string;
  }>;
}

/**
 * Generate Organization structured data for the homepage
 */
export function generateOrganizationSchema(): OrganizationSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/logo.png`,
    description: SITE_CONFIG.description,
    sameAs: [
      // Add social media URLs when available
      // "https://twitter.com/pixelstudioai",
      // "https://www.instagram.com/pixelstudioai",
    ],
  };
}

/**
 * Generate WebSite structured data with search action
 */
export function generateWebSiteSchema(): WebSiteSchema {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_CONFIG.url}/explore?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Generate ImageObject structured data for an image page
 */
export function generateImageSchema(image: {
  id: string;
  prompt: string;
  title?: string | null;
  createdAt: string | Date;
  user?: { username: string; name?: string | null; id?: string } | null;
}): ImageObjectSchema {
  const imageUrl = `https://pixel-studio-public.s3.us-west-1.amazonaws.com/${image.id}.png`;
  const authorName = image.user?.name || image.user?.username || "Anonymous";
  const uploadDate = image.createdAt instanceof Date
    ? image.createdAt.toISOString()
    : image.createdAt;

  return {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    name: image.title || "AI Generated Image",
    description: image.prompt,
    contentUrl: imageUrl,
    thumbnailUrl: imageUrl,
    uploadDate,
    author: {
      "@type": "Person",
      name: authorName,
      url: image.user?.id ? `${SITE_CONFIG.url}/profile/${image.user.id}` : undefined,
    },
    creator: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
    },
  };
}

/**
 * Generate VideoObject structured data for a video page
 */
export function generateVideoSchema(video: {
  id: string;
  prompt: string;
  title?: string | null;
  createdAt: string | Date;
  sourceImageUrl?: string | null;
  user?: { username: string; name?: string | null; id?: string } | null;
}): VideoObjectSchema {
  const authorName = video.user?.name || video.user?.username || "Anonymous";
  const uploadDate = video.createdAt instanceof Date
    ? video.createdAt.toISOString()
    : video.createdAt;

  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title || "AI Generated Video",
    description: video.prompt,
    thumbnailUrl: video.sourceImageUrl || SITE_CONFIG.defaultImage,
    uploadDate,
    author: {
      "@type": "Person",
      name: authorName,
      url: video.user?.id ? `${SITE_CONFIG.url}/profile/${video.user.id}` : undefined,
    },
  };
}

/**
 * Generate Breadcrumb structured data
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url?: string }>
): BreadcrumbSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Serialize JSON-LD schema for use in a script tag
 */
export function serializeSchema(
  schema: OrganizationSchema | WebSiteSchema | ImageObjectSchema | VideoObjectSchema | BreadcrumbSchema | Array<OrganizationSchema | WebSiteSchema | ImageObjectSchema | VideoObjectSchema | BreadcrumbSchema>
): string {
  return JSON.stringify(schema);
}
