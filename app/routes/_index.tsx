import LandingPage from "pages/LandingPage";
import { PageContainer, GeneralErrorBoundary } from "~/components";

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
