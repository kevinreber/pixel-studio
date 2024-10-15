import { prisma } from "~/services";
import { createNewUserWithGoogleSSOData } from "./createNewUser";
import { UserGoogleData } from "~/types";

/**
 * @description
 * This function retrieves the logged-in user's data from the database.
 * If the user does not exist, it creates a new user in the database.
 * @param userGoogleData - The user's Google session auth data.
 * @returns The logged-in user's data.
 */
export const getLoggedInUserData = async (userGoogleData: UserGoogleData) => {
  // TODO: Will add other handlers that are not Google SSO later...
  return getLoggedInUserGoogleSSOData(userGoogleData);
};

/**
 * @description
 * This function retrieves the logged-in user's data from the database.
 * If the user does not exist, it creates a new user in the database.
 * @param userGoogleData - The user's Google session auth data.
 * @returns The logged-in user's data.
 */
export const getLoggedInUserGoogleSSOData = async (
  userGoogleData: UserGoogleData
) => {
  const userId = userGoogleData.id;
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      image: true,
      createdAt: true,
      credits: true,
      collections: {
        select: {
          id: true,
          title: true,
          description: true,
          images: {
            select: {
              imageId: true,
            },
          },
        },
      },
      roles: {
        select: {
          name: true,
          permissions: {
            select: {
              action: true,
              entity: true,
              access: true,
            },
          },
        },
      },
      // TODO: setup later during session management
      // sessions: true,
    },
  });

  if (!userData || !userData.id) {
    return createNewUserWithGoogleSSOData(userGoogleData);
  }

  return userData;
};
