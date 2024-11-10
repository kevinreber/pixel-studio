import LandingPage from "pages/LandingPage";
import { PageContainer } from "~/components";
import { GeneralErrorBoundary } from "~/components/GeneralErrorBoundary";

export default function Index() {
  return <LandingPage />;
}

export const ErrorBoundary = () => {
  return (
    <PageContainer>
      <GeneralErrorBoundary />
    </PageContainer>
  );
};
