import { useRouteLoaderData } from "@remix-run/react";
import type { loader as rootLoader } from "~/root"; // Make sure to export the loader type from root.tsx

export const useLoggedInUser = () => {
  const rootData = useRouteLoaderData<typeof rootLoader>("root");

  return rootData?.userData;
};
