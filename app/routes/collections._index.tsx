import { type LoaderFunctionArgs, json } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { getUserCollections } from "~/server/getUserCollections";
import UserCollectionsPage from "~/pages/UserCollectionsPage";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUserLogin(request);

  const data = await getUserCollections(user.id);

  return json({
    data: {
      collections: data.collections,
      count: data.count,
    },
  });
};

export default function Index() {
  return <UserCollectionsPage />;
}
