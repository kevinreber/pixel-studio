import { useRouteLoaderData } from "@remix-run/react";
import type { loader as RootLoaderData } from "~/root"; // Make sure to export the loader type from root.tsx

export function useOptionalUser() {
  const data = useRouteLoaderData<typeof RootLoaderData>("root");
  return data?.userData ?? null;
}

export function useLoggedInUser() {
  const maybeUser = useOptionalUser();
  if (!maybeUser) {
    console.log(
      "No user found in root loader, but user is required by useLoggedInUser. If user is optional, try useOptionalUser instead."
    );
  }

  return maybeUser;
}
