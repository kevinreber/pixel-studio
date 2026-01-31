import { prisma } from "~/services/prisma.server";
import { SITE_CONFIG } from "~/utils/seo";

/**
 * Dynamic sitemap.xml generator
 * Lists all public content for search engine indexing
 */
export async function loader() {
  const baseUrl = SITE_CONFIG.url;

  // Fetch public images (last 10,000 for sitemap limits)
  const images = await prisma.image.findMany({
    where: { private: false },
    select: { id: true, updatedAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 10000,
  });

  // Fetch public videos
  const videos = await prisma.video.findMany({
    where: { private: false, status: "complete" },
    select: { id: true, updatedAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  // Fetch users with public content
  const users = await prisma.user.findMany({
    where: {
      images: {
        some: { private: false },
      },
    },
    select: { id: true, updatedAt: true, createdAt: true },
    take: 5000,
  });

  // Fetch published marketplace prompts
  const prompts = await prisma.marketplacePrompt.findMany({
    where: { isPublished: true },
    select: { id: true, updatedAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });

  // Static pages with their priorities
  const staticPages = [
    { url: "/", priority: "1.0", changefreq: "daily" },
    { url: "/explore", priority: "0.9", changefreq: "hourly" },
    { url: "/create", priority: "0.9", changefreq: "weekly" },
    { url: "/create-video", priority: "0.8", changefreq: "weekly" },
    { url: "/marketplace", priority: "0.8", changefreq: "daily" },
    { url: "/trending", priority: "0.8", changefreq: "hourly" },
  ];

  // Build the sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages
    .map(
      (page) => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join("")}
  ${images
    .map(
      (image) => `
  <url>
    <loc>${baseUrl}/explore/${image.id}</loc>
    <lastmod>${(image.updatedAt || image.createdAt).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
    )
    .join("")}
  ${videos
    .map(
      (video) => `
  <url>
    <loc>${baseUrl}/explore/video/${video.id}</loc>
    <lastmod>${(video.updatedAt || video.createdAt).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
    )
    .join("")}
  ${users
    .map(
      (user) => `
  <url>
    <loc>${baseUrl}/profile/${user.id}</loc>
    <lastmod>${(user.updatedAt || user.createdAt).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`
    )
    .join("")}
  ${prompts
    .map(
      (prompt) => `
  <url>
    <loc>${baseUrl}/marketplace/${prompt.id}</loc>
    <lastmod>${prompt.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`
    )
    .join("")}
</urlset>`;

  return new Response(sitemap, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    },
  });
}
