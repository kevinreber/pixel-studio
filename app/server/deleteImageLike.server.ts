import { prisma } from "~/services/prisma.server";

/**
 * @description
 * This function deletes a User's Like for an Image
 */
export const deleteImageLike = async ({
  imageId,
  userId,
}: {
  imageId: string;
  userId: string;
}) => {
  console.log(
    `Deleting Image Like for ImageId: ${imageId} and UserId: ${userId}`
  );
  const data = { userId, imageId };

  const response = await prisma.imageLike.delete({
    where: { userId_imageId: data },
  });

  return response;
};
