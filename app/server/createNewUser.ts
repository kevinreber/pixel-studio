import { prisma } from "~/services";
import { UserGoogleData } from "~/types";
import type { User } from "@supabase/supabase-js";

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
  try {
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
  } catch (error) {
    console.error("Error in createNewUserWithGoogleSSOData:", error);
    throw new Error(error instanceof Error ? error.message : String(error));
  }
};

/**
 * @description
 * This function creates a new user in the database using the user's Supabase session auth data.
 * If the user already exists in the database, it will return the existing user.
 * If the user does not exist in the database, it will create a new user and return the new user data.
 *
 * @param userSupabaseData - The user's Supabase session auth data.
 * @param provider - The provider of the user.
 * @returns The user data.
 */
export const createNewUserWithSupabaseData = async (
  user: User,
  provider: string
) => {
  try {
    if (!user.id) {
      throw new Error("User ID not found");
    }
    if (!provider) {
      throw new Error("Invalid provider");
    }
    // Check if the user already exists in the database
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (existingUser) {
      console.log(`User already exists in the database: ${user.id}`);
      return existingUser;
    }

    // Look for user by email as fallback
    const userByEmail = await prisma.user.findUnique({
      where: { email: user.email! },
    });

    if (userByEmail) {
      // This case should be rare/impossible if migration was done correctly
      console.warn(`Found user by email but not ID: ${user.email}`);
      return userByEmail;
    }
    console.log(`Creating new user with Supabase auth data: ${user.id}`);

    const userData = {
      id: user.id,
      name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0],
      username: user.user_metadata?.username || user.email?.split("@")[0],
      email: user.email || user.user_metadata?.email,
      image: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      archived_google_id: user.user_metadata?.provider_id,
      new_supabase_id: user.id,
      roles: { connect: { name: "user" } },
    };

    return await prisma.user.create({
      data: userData,
    });
  } catch (error) {
    console.error("Error in createNewUserWithSupabaseData:", error);
    throw error;
  }
};
