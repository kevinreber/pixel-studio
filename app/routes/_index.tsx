import { MetaFunction } from "@remix-run/node";
import LandingPage from "pages/LandingPage";
import { PageContainer, GeneralErrorBoundary } from "~/components";
import {
  generateMetaTags,
  generateOrganizationSchema,
  generateWebSiteSchema,
  serializeSchema,
  SITE_CONFIG,
} from "~/utils/seo";

export const meta: MetaFunction = () => {
  return generateMetaTags({
    title: "Pixel Studio AI - Create Stunning AI Art & Videos",
    description:
      "Generate beautiful AI images and videos with DALL-E, Stable Diffusion, Flux, Runway, and more. Join our creative community of AI artists today.",
    url: SITE_CONFIG.url,
    type: "website",
    keywords: [
      "AI art generator",
      "AI image generator",
      "AI video generator",
      "DALL-E",
      "Stable Diffusion",
      "Flux",
      "text to image",
      "AI art",
      "generative AI",
    ],
  });
};

export default function Index() {
  // Generate structured data for homepage
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebSiteSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeSchema([organizationSchema, websiteSchema]),
        }}
      />
      <LandingPage />
    </>
  );
}

export const ErrorBoundary = () => {
  return (
    <PageContainer>
      <GeneralErrorBoundary />
    </PageContainer>
  );
};
