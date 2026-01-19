/**
 * Smart Image Tagging Service
 *
 * Uses AI vision models to analyze images and extract:
 * - Tags (subject matter, objects, themes)
 * - Attributes (colors, styles, moods, techniques)
 */

import OpenAI from "openai";
import { prisma } from "~/services/prisma.server";
import { Logger } from "~/utils/logger.server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Types for tag analysis results
interface TagAnalysis {
  tags: Array<{
    tag: string;
    confidence: number;
  }>;
  attributes: Array<{
    category: string;
    value: string;
    confidence: number;
  }>;
}

// Predefined categories for consistent attribute classification
const ATTRIBUTE_CATEGORIES = {
  color: [
    "warm",
    "cool",
    "vibrant",
    "muted",
    "monochrome",
    "pastel",
    "neon",
    "earthy",
    "dark",
    "bright",
  ],
  style: [
    "realistic",
    "surreal",
    "abstract",
    "minimalist",
    "detailed",
    "impressionist",
    "photorealistic",
    "cartoon",
    "anime",
    "digital art",
    "oil painting",
    "watercolor",
    "sketch",
    "3D render",
    "pixel art",
  ],
  mood: [
    "peaceful",
    "dramatic",
    "mysterious",
    "joyful",
    "melancholic",
    "energetic",
    "serene",
    "ominous",
    "whimsical",
    "romantic",
    "dystopian",
    "nostalgic",
  ],
  subject: [
    "portrait",
    "landscape",
    "architecture",
    "nature",
    "urban",
    "fantasy",
    "sci-fi",
    "still life",
    "animal",
    "character",
    "vehicle",
    "food",
  ],
  technique: [
    "high contrast",
    "soft lighting",
    "dramatic lighting",
    "bokeh",
    "macro",
    "wide angle",
    "symmetrical",
    "rule of thirds",
    "depth of field",
    "motion blur",
  ],
};

/**
 * Analyze an image using OpenAI's vision API
 */
export async function analyzeImageWithVision(
  imageUrl: string
): Promise<TagAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert image analyst. Analyze images and provide structured tags and attributes.

For tags, identify the main subjects, objects, and themes (e.g., "person", "mountain", "sunset", "robot").

For attributes, categorize into these specific categories:
- color: ${ATTRIBUTE_CATEGORIES.color.join(", ")}
- style: ${ATTRIBUTE_CATEGORIES.style.join(", ")}
- mood: ${ATTRIBUTE_CATEGORIES.mood.join(", ")}
- subject: ${ATTRIBUTE_CATEGORIES.subject.join(", ")}
- technique: ${ATTRIBUTE_CATEGORIES.technique.join(", ")}

Provide confidence scores from 0 to 1 based on how certain you are.

Respond ONLY with valid JSON in this exact format:
{
  "tags": [{"tag": "string", "confidence": 0.95}],
  "attributes": [{"category": "color", "value": "warm", "confidence": 0.85}]
}`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image and provide tags and attributes as specified.",
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "low", // Use low detail for cost efficiency
              },
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from vision API");
    }

    // Parse the JSON response
    const analysis = JSON.parse(content) as TagAnalysis;

    // Validate and normalize the response
    return {
      tags: analysis.tags.filter(
        (t) =>
          t.tag &&
          typeof t.confidence === "number" &&
          t.confidence >= 0 &&
          t.confidence <= 1
      ),
      attributes: analysis.attributes.filter(
        (a) =>
          a.category &&
          a.value &&
          typeof a.confidence === "number" &&
          a.confidence >= 0 &&
          a.confidence <= 1
      ),
    };
  } catch (error) {
    Logger.error({
      message: "[ImageTagging] Error analyzing image with vision API",
      error: error instanceof Error ? error : undefined,
      metadata: { imageUrl },
    });
    throw error;
  }
}

/**
 * Tag an image and store results in the database
 */
export async function tagImage(imageId: string): Promise<{
  tags: number;
  attributes: number;
}> {
  try {
    // Get the image
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { id: true },
    });

    if (!image) {
      throw new Error(`Image not found: ${imageId}`);
    }

    // Get the image URL from S3
    const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageId}`;

    // Analyze the image
    const analysis = await analyzeImageWithVision(imageUrl);

    // Store tags (upsert to handle duplicates)
    const tagPromises = analysis.tags.map((t) =>
      prisma.imageTag.upsert({
        where: {
          imageId_tag: {
            imageId,
            tag: t.tag.toLowerCase(),
          },
        },
        update: {
          confidence: t.confidence,
        },
        create: {
          imageId,
          tag: t.tag.toLowerCase(),
          confidence: t.confidence,
          source: "ai_vision",
        },
      })
    );

    // Store attributes (upsert to handle duplicates)
    const attributePromises = analysis.attributes.map((a) =>
      prisma.imageAttribute.upsert({
        where: {
          imageId_category_value: {
            imageId,
            category: a.category.toLowerCase(),
            value: a.value.toLowerCase(),
          },
        },
        update: {
          confidence: a.confidence,
        },
        create: {
          imageId,
          category: a.category.toLowerCase(),
          value: a.value.toLowerCase(),
          confidence: a.confidence,
        },
      })
    );

    await Promise.all([...tagPromises, ...attributePromises]);

    Logger.info({
      message: "[ImageTagging] Image tagged successfully",
      metadata: {
        imageId,
        tagsCount: analysis.tags.length,
        attributesCount: analysis.attributes.length,
      },
    });

    return {
      tags: analysis.tags.length,
      attributes: analysis.attributes.length,
    };
  } catch (error) {
    Logger.error({
      message: "[ImageTagging] Error tagging image",
      error: error instanceof Error ? error : undefined,
      metadata: { imageId },
    });
    throw error;
  }
}

/**
 * Get tags for an image
 */
export async function getImageTags(imageId: string) {
  return prisma.imageTag.findMany({
    where: { imageId },
    orderBy: { confidence: "desc" },
  });
}

/**
 * Get attributes for an image
 */
export async function getImageAttributes(imageId: string) {
  return prisma.imageAttribute.findMany({
    where: { imageId },
    orderBy: [{ category: "asc" }, { confidence: "desc" }],
  });
}

/**
 * Search images by tag
 */
export async function searchImagesByTag(
  tag: string,
  options: {
    limit?: number;
    offset?: number;
    minConfidence?: number;
    includePrivate?: boolean;
    userId?: string;
  } = {}
) {
  const { limit = 20, offset = 0, minConfidence = 0.5, includePrivate = false, userId } = options;

  return prisma.image.findMany({
    where: {
      tags: {
        some: {
          tag: tag.toLowerCase(),
          confidence: { gte: minConfidence },
        },
      },
      OR: includePrivate
        ? undefined
        : [{ private: false }, { private: null }, ...(userId ? [{ userId }] : [])],
    },
    include: {
      user: {
        select: { id: true, username: true, image: true },
      },
      tags: {
        orderBy: { confidence: "desc" },
        take: 5,
      },
      _count: {
        select: { likes: true, comments: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}

/**
 * Search images by attribute
 */
export async function searchImagesByAttribute(
  category: string,
  value: string,
  options: {
    limit?: number;
    offset?: number;
    minConfidence?: number;
  } = {}
) {
  const { limit = 20, offset = 0, minConfidence = 0.5 } = options;

  return prisma.image.findMany({
    where: {
      attributes: {
        some: {
          category: category.toLowerCase(),
          value: value.toLowerCase(),
          confidence: { gte: minConfidence },
        },
      },
      OR: [{ private: false }, { private: null }],
    },
    include: {
      user: {
        select: { id: true, username: true, image: true },
      },
      attributes: {
        where: { category: category.toLowerCase() },
        orderBy: { confidence: "desc" },
      },
      _count: {
        select: { likes: true, comments: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}

/**
 * Get popular tags across all images
 */
export async function getPopularTags(limit: number = 20) {
  const tags = await prisma.imageTag.groupBy({
    by: ["tag"],
    _count: { tag: true },
    _avg: { confidence: true },
    orderBy: { _count: { tag: "desc" } },
    take: limit,
  });

  return tags.map((t) => ({
    tag: t.tag,
    count: t._count.tag,
    averageConfidence: t._avg.confidence,
  }));
}

/**
 * Get attribute distribution for a category
 */
export async function getAttributeDistribution(category: string) {
  const attributes = await prisma.imageAttribute.groupBy({
    by: ["value"],
    where: { category: category.toLowerCase() },
    _count: { value: true },
    _avg: { confidence: true },
    orderBy: { _count: { value: "desc" } },
    take: 20,
  });

  return attributes.map((a) => ({
    value: a.value,
    count: a._count.value,
    averageConfidence: a._avg.confidence,
  }));
}

/**
 * Add a manual tag to an image
 */
export async function addManualTag(
  imageId: string,
  tag: string,
  userId: string
) {
  // Verify user owns the image
  const image = await prisma.image.findFirst({
    where: { id: imageId, userId },
  });

  if (!image) {
    throw new Error("Image not found or unauthorized");
  }

  return prisma.imageTag.upsert({
    where: {
      imageId_tag: {
        imageId,
        tag: tag.toLowerCase(),
      },
    },
    update: {
      confidence: 1.0, // Manual tags have full confidence
      source: "user",
    },
    create: {
      imageId,
      tag: tag.toLowerCase(),
      confidence: 1.0,
      source: "user",
    },
  });
}

/**
 * Remove a tag from an image
 */
export async function removeTag(imageId: string, tag: string, userId: string) {
  // Verify user owns the image
  const image = await prisma.image.findFirst({
    where: { id: imageId, userId },
  });

  if (!image) {
    throw new Error("Image not found or unauthorized");
  }

  return prisma.imageTag.delete({
    where: {
      imageId_tag: {
        imageId,
        tag: tag.toLowerCase(),
      },
    },
  });
}

/**
 * Batch tag multiple images (for background processing)
 */
export async function batchTagImages(imageIds: string[]): Promise<{
  successful: number;
  failed: number;
  errors: Array<{ imageId: string; error: string }>;
}> {
  const results = {
    successful: 0,
    failed: 0,
    errors: [] as Array<{ imageId: string; error: string }>,
  };

  for (const imageId of imageIds) {
    try {
      await tagImage(imageId);
      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        imageId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Add a small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * Get images that haven't been tagged yet
 */
export async function getUntaggedImages(limit: number = 100) {
  return prisma.image.findMany({
    where: {
      tags: { none: {} },
    },
    select: { id: true },
    take: limit,
    orderBy: { createdAt: "desc" },
  });
}
