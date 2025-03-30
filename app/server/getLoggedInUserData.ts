import { prisma } from "~/services";
import {
  createNewUserWithGoogleSSOData,
  createNewUserWithSupabaseData,
} from "./createNewUser";
import { UserGoogleData } from "~/types";
import type { User } from "@supabase/supabase-js";

/**
 * @description
 * This function retrieves the logged-in user's data from the database.
 * If the user does not exist, it creates a new user in the database.
 * @param userGoogleData - The user's Google session auth data.
 * @returns The logged-in user's data.
 */
export const getLoggedInUserData = async (userData: User | UserGoogleData) => {
  const userId = userData.id;
  const user = await prisma.user.findUnique({
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

  if (!user || !user.id) {
    if (userData.provider && userData.provider === "google") {
      console.log("Creating new user with Google SSO data");
      return createNewUserWithGoogleSSOData(userData as UserGoogleData);
    }
    console.log("Creating new user with Supabase data");
    return createNewUserWithSupabaseData(userData as User, "google");
  }

  return user;
};
