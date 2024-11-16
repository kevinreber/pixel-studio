import { type LoaderFunctionArgs, json } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { getUserCollections } from "~/server/getUserCollections";
import UserCollectionsPage from "~/pages/UserCollectionsPage";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUserLogin(request);
  const { collections, count } = await getUserCollections(user.id);

  return json({
    data: {
      collections,
      count,
    },
  });
};

export default function CollectionsRoute() {
  return <UserCollectionsPage />;
}
