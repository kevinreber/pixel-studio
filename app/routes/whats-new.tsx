import { type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { PageContainer, GeneralErrorBoundary } from "~/components";
import WhatsNewPage from "pages/WhatsNewPage";
import { requireUserLogin } from "~/services/auth.server";

export const meta: MetaFunction = () => {
  return [
    { title: "What's New - Pixel Studio" },
    {
      name: "description",
      content:
        "See the latest features and updates on Pixel Studio. Stay up to date with new AI models, tools, and improvements.",
    },
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserLogin(request);
  return null;
};

export default function WhatsNew() {
  return (
    <PageContainer>
      <WhatsNewPage />
    </PageContainer>
  );
}

export const ErrorBoundary = () => {
  return (
    <PageContainer>
      <GeneralErrorBoundary />
    </PageContainer>
  );
};
