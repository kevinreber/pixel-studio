import { prisma } from "~/services";
import { UserGoogleData } from "~/types";

export const createNewUser = async (
  userData: UserGoogleData | Record<string, unknown>
) => {
  const isGoogleUser = "id" in userData;
  if (isGoogleUser) {
    return createNewUserWithGoogleSSOData(userData as UserGoogleData);
  }
};

/**
 * @description
 * This function creates a new user in the database using the user's Google session auth data.
 * @param userGoogleData - The user's Google session auth data.
 * @returns The new user data.
 */
export const createNewUserWithGoogleSSOData = async (
  userGoogleData: UserGoogleData
) => {
  if (!userGoogleData.id) {
    throw new Error("User ID not found");
  }
  const { name, email, picture } = userGoogleData._json;

  const userData = await prisma.user.create({
    data: {
      id: userGoogleData.id,
      name,
      username: userGoogleData.displayName,
      email,
      image: picture,
      roles: { connect: { name: "user" } },
    },
  });

  return userData;
};
