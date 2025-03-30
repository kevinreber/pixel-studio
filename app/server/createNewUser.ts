import { prisma } from "~/services";
import { UserGoogleData } from "~/types";
import type { User } from "@supabase/supabase-js";

const generateUsernameFromEmail = (email: string): string => {
  return email.split("@")[0];
};

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
  userSupabaseData: User,
  provider = "google"
) => {
  if (!userSupabaseData.id) {
    throw new Error("User ID not found");
  }
  if (!provider) {
    throw new Error("Invalid provider");
  }

  // Check if the user already exists in the database
  const existingUser = await prisma.user.findUnique({
    where: {
      id: userSupabaseData.id,
    },
  });

  if (existingUser) {
    console.log(`User already exists in the database: ${userSupabaseData.id}`);
    return existingUser;
  }

  // Look for user by email as fallback
  const userByEmail = await prisma.user.findUnique({
    where: { email: userSupabaseData.email! },
  });

  if (userByEmail) {
    // This case should be rare/impossible if migration was done correctly
    console.warn(`Found user by email but not ID: ${userSupabaseData.email}`);
    return userByEmail;
  }

  console.log(
    `Creating new user with Supabase auth data: ${userSupabaseData.id}`
  );
  const new_supabase_id = userSupabaseData.id;
  const name = userSupabaseData.user_metadata.name;
  const email = userSupabaseData.email || userSupabaseData.user_metadata.email;
  const image = userSupabaseData.user_metadata.picture;
  const archived_google_id = userSupabaseData.user_metadata.provider_id;

  const username =
    userSupabaseData.user_metadata.full_name ??
    generateUsernameFromEmail(userSupabaseData.email!);

  const userData = await prisma.user.create({
    data: {
      id: new_supabase_id,
      name,
      username,
      email,
      image,
      archived_google_id,
      new_supabase_id,
      roles: { connect: { name: "user" } },
    },
  });

  return userData;
};
