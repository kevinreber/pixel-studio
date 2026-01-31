import { prisma } from "~/services/prisma.server";
import { getS3VideoURL, getS3VideoThumbnailURL } from "~/utils/s3Utils";

interface VideoUser {
  id: string;
  image: string | null;
  username: string;
}

interface VideoComment {
  id: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
  parentId: string | null;
  user: VideoUser;
  likes: Array<{ userId: string }>;
}

interface VideoLike {
  userId: string;
}

export interface VideoData {
  id: string;
  title: string | null;
  prompt: string;
  model: string | null;
  private: boolean | null;
  user: VideoUser;
  createdAt: Date;
  comments: VideoComment[];
  likes: VideoLike[];
  setId: string | null;
  // Video-specific parameters
  duration: number | null;
  fps: number | null;
  aspectRatio: string | null;
  resolution: string | null;
  sourceImageId: string | null;
  sourceImageUrl: string | null;
  status: string | null;
}

export interface FormattedVideoData extends VideoData {
  url: string;
  thumbnailURL: string;
}

export interface GetVideoDataAPIResponse extends VideoData {
  url: string;
  thumbnailURL: string;
}

export const getVideo = async (
  videoId: string
): Promise<GetVideoDataAPIResponse | null> => {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: {
      id: true,
      title: true,
      prompt: true,
      model: true,
      private: true,
      user: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
      createdAt: true,
      comments: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          message: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              username: true,
              image: true,
            },
          },
          parentId: true,
          likes: true,
        },
      },
      likes: {
        select: {
          userId: true,
        },
      },
      setId: true,
      // Video-specific parameters
      duration: true,
      fps: true,
      aspectRatio: true,
      resolution: true,
      sourceImageId: true,
      sourceImageUrl: true,
      status: true,
    },
  });

  if (!video) return null;

  // Append Video source URL since we cannot use `env` variables in our UI
  const formattedVideo = {
    ...video,
    url: getS3VideoURL(videoId),
    thumbnailURL: getS3VideoThumbnailURL(videoId),
  };

  return formattedVideo;
};

export type VideoDetail = Awaited<ReturnType<typeof getVideo>>;
