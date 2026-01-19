import { prisma } from "~/services/prisma.server";

/**
 * @description
 * This function deletes a User's Like for a Video
 */
export const deleteVideoLike = async ({
  videoId,
  userId,
}: {
  videoId: string;
  userId: string;
}) => {
  console.log(
    `Deleting Video Like for VideoId: ${videoId} and UserId: ${userId}`
  );
  const data = { userId, videoId };

  const response = await prisma.videoLike.delete({
    where: { userId_videoId: data },
  });

  return response;
};
