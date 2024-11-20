import { type LoaderFunctionArgs, defer } from "@remix-run/node";
import { requireUserLogin } from "~/services";
import { getUserCollections } from "~/server/getUserCollections";
import UserCollectionsPage from "~/pages/UserCollectionsPage";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUserLogin(request);

  // Wrap the data fetching in a promise for defer
  const collectionsPromise = getUserCollections(user.id).then((data) => ({
    collections: data.collections,
    count: data.count,
  }));

  return defer({
    data: collectionsPromise,
  });
};

export default function Index() {
  return <UserCollectionsPage />;
}
