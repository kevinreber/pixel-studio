/**
 * Blog Service
 * Handles CRUD operations for blog posts and tutorials
 */

import { prisma } from "./prisma.server";

export type BlogPostStatus = "draft" | "published" | "archived";
export type BlogCategory = "tutorial" | "guide" | "news" | "tips";

export interface CreateBlogPostInput {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  authorId: string;
  category?: BlogCategory;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  status?: BlogPostStatus;
}

export interface UpdateBlogPostInput {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  category?: BlogCategory;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  status?: BlogPostStatus;
}

// Re-export generateSlug from shared utility for backwards compatibility
export { generateSlug } from "~/utils/slug";

/**
 * Ensure slug is unique by appending a number if needed
 */
export async function ensureUniqueSlug(
  slug: string,
  excludeId?: string
): Promise<string> {
  let uniqueSlug = slug;
  const maxAttempts = 100;

  for (let counter = 1; counter <= maxAttempts; counter++) {
    const existing = await prisma.blogPost.findUnique({
      where: { slug: uniqueSlug },
      select: { id: true },
    });

    if (!existing || existing.id === excludeId) {
      return uniqueSlug;
    }

    uniqueSlug = `${slug}-${counter}`;
  }

  // Fallback - should never reach here with reasonable maxAttempts
  return `${slug}-${Date.now()}`;
}

/**
 * Create a new blog post
 */
export async function createBlogPost(input: CreateBlogPostInput) {
  const slug = await ensureUniqueSlug(input.slug);

  return prisma.blogPost.create({
    data: {
      title: input.title,
      slug,
      excerpt: input.excerpt,
      content: input.content,
      coverImage: input.coverImage,
      authorId: input.authorId,
      category: input.category || "tutorial",
      tags: input.tags || [],
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      status: input.status || "draft",
      publishedAt: input.status === "published" ? new Date() : null,
    },
    include: {
      author: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
  });
}

/**
 * Update an existing blog post
 */
export async function updateBlogPost(id: string, input: UpdateBlogPostInput) {
  // If slug is being changed, ensure it's unique
  let slug = input.slug;
  if (slug) {
    slug = await ensureUniqueSlug(slug, id);
  }

  // Get current post to check status change
  const currentPost = await prisma.blogPost.findUnique({
    where: { id },
    select: { status: true, publishedAt: true },
  });

  // Build the update data object
  const updateData: {
    title?: string;
    slug?: string;
    excerpt?: string | null;
    content?: string;
    coverImage?: string | null;
    category?: string;
    tags?: string[];
    metaTitle?: string | null;
    metaDescription?: string | null;
    status?: string;
    publishedAt?: Date;
  } = {};

  if (input.title) updateData.title = input.title;
  if (slug) updateData.slug = slug;
  if (input.excerpt !== undefined) updateData.excerpt = input.excerpt || null;
  if (input.content) updateData.content = input.content;
  if (input.coverImage !== undefined) updateData.coverImage = input.coverImage || null;
  if (input.category) updateData.category = input.category;
  if (input.tags) updateData.tags = input.tags;
  if (input.metaTitle !== undefined) updateData.metaTitle = input.metaTitle || null;
  if (input.metaDescription !== undefined) updateData.metaDescription = input.metaDescription || null;
  if (input.status) updateData.status = input.status;

  // Set publishedAt when transitioning to published
  if (input.status === "published" && currentPost?.status !== "published") {
    updateData.publishedAt = new Date();
  }

  return prisma.blogPost.update({
    where: { id },
    data: updateData,
    include: {
      author: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
  });
}

/**
 * Delete a blog post
 */
export async function deleteBlogPost(id: string) {
  return prisma.blogPost.delete({
    where: { id },
  });
}

/**
 * Get a blog post by ID (for admin)
 */
export async function getBlogPostById(id: string) {
  return prisma.blogPost.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
  });
}

/**
 * Get a published blog post by slug (for public viewing)
 */
export async function getPublishedBlogPostBySlug(slug: string) {
  const post = await prisma.blogPost.findFirst({
    where: {
      slug,
      status: "published",
    },
    include: {
      author: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
  });

  if (post) {
    // Increment view count (fire and forget)
    prisma.blogPost
      .update({
        where: { id: post.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {
        // Silently ignore view count errors
      });
  }

  return post;
}

/**
 * Get all blog posts (for admin)
 */
export async function getAllBlogPosts(options?: {
  status?: BlogPostStatus;
  category?: BlogCategory;
  authorId?: string;
  skip?: number;
  take?: number;
}) {
  const { status, category, authorId, skip = 0, take = 50 } = options || {};

  const where = {
    ...(status && { status }),
    ...(category && { category }),
    ...(authorId && { authorId }),
  };

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return { posts, total };
}

/**
 * Get published blog posts (for public listing)
 */
export async function getPublishedBlogPosts(options?: {
  category?: BlogCategory;
  tag?: string;
  skip?: number;
  take?: number;
}) {
  const { category, tag, skip = 0, take = 12 } = options || {};

  const where = {
    status: "published" as const,
    ...(category && { category }),
    ...(tag && { tags: { has: tag } }),
  };

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
      orderBy: { publishedAt: "desc" },
      skip,
      take,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return { posts, total };
}

/**
 * Get featured/latest posts for homepage or sidebar
 */
export async function getFeaturedBlogPosts(take = 3) {
  return prisma.blogPost.findMany({
    where: { status: "published" },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      category: true,
      publishedAt: true,
      author: {
        select: { name: true, username: true, image: true },
      },
    },
    orderBy: { publishedAt: "desc" },
    take,
  });
}

/**
 * Get related posts by category or tags
 */
export async function getRelatedBlogPosts(
  currentPostId: string,
  category: string,
  tags: string[],
  take = 3
) {
  return prisma.blogPost.findMany({
    where: {
      id: { not: currentPostId },
      status: "published",
      OR: [{ category }, { tags: { hasSome: tags } }],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      category: true,
      publishedAt: true,
    },
    orderBy: { publishedAt: "desc" },
    take,
  });
}

/**
 * Get all unique tags from published posts
 */
export async function getBlogTags() {
  const posts = await prisma.blogPost.findMany({
    where: { status: "published" },
    select: { tags: true },
  });

  const tagCounts = new Map<string, number>();
  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get blog categories with post counts
 */
export async function getBlogCategories() {
  const categories = await prisma.blogPost.groupBy({
    by: ["category"],
    where: { status: "published" },
    _count: { category: true },
  });

  return categories.map((c) => ({
    category: c.category,
    count: c._count.category,
  }));
}
