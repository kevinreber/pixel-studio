import { prisma } from "~/services/prisma.server";
import { getS3VideoURL, getS3VideoThumbnailURL } from "~/utils/s3Utils";

export type CreateNewVideoResponse = ReturnType<typeof createNewVideo>;
export type FormattedCreateVideoData = ReturnType<typeof getFormattedVideoData>;

export const getFormattedVideoData = (
  videoData: Awaited<CreateNewVideoResponse>
) => {
  const videoURL = getS3VideoURL(videoData.id);
  const thumbnailURL = getS3VideoThumbnailURL(videoData.id);

  const formattedVideoData = {
    ...videoData,
    url: videoURL,
    thumbnailURL,
  };
  return formattedVideoData;
};

/**
 * @description
 * This function creates a new video record in our DB
 */
export const createNewVideo = async ({
  prompt,
  userId,
  model,
  isVideoPrivate = false,
  setId,
  duration,
  fps,
  aspectRatio,
  resolution,
  sourceImageId,
  sourceImageUrl,
  status = "pending",
  externalId,
}: {
  prompt: string;
  userId: string;
  model: string;
  isVideoPrivate?: boolean;
  setId: string;
  duration?: number;
  fps?: number;
  aspectRatio?: string;
  resolution?: string;
  sourceImageId?: string;
  sourceImageUrl?: string;
  status?: string;
  externalId?: string;
}) => {
  console.log("Creating new video in DB...");
  if (!setId) {
    throw new Error("Set ID is required");
  }

  try {
    const video = await prisma.video.create({
      data: {
        prompt,
        title: prompt.substring(0, 100),
        userId,
        model,
        private: isVideoPrivate,
        setId,
        duration,
        fps,
        aspectRatio,
        resolution,
        sourceImageId,
        sourceImageUrl,
        status,
        progress: 0,
        externalId,
      },
    });
    console.log(`Successfully created new video in DB: ${video.id}`);

    return video;
  } catch (error) {
    console.error(`Error creating new video in DB: ${error}`);
    throw error;
  }
};

/**
 * Update video status and progress
 */
export const updateVideoStatus = async ({
  videoId,
  status,
  progress,
  errorMessage,
  externalId,
}: {
  videoId: string;
  status?: string;
  progress?: number;
  errorMessage?: string;
  externalId?: string;
}) => {
  try {
    const video = await prisma.video.update({
      where: { id: videoId },
      data: {
        ...(status && { status }),
        ...(progress !== undefined && { progress }),
        ...(errorMessage && { errorMessage }),
        ...(externalId && { externalId }),
        updatedAt: new Date(),
      },
    });
    return video;
  } catch (error) {
    console.error(`Error updating video status: ${error}`);
    throw error;
  }
};

/**
 * Get video by ID
 */
export const getVideoById = async (videoId: string) => {
  try {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
      },
    });
    return video;
  } catch (error) {
    console.error(`Error getting video: ${error}`);
    throw error;
  }
};
