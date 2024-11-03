import { type LoaderFunctionArgs, json, MetaFunction } from "@remix-run/node";
import { GeneralErrorBoundary } from "~/components/GeneralErrorBoundary";
import { requireUserLogin } from "~/services";

import CreatePage from "~/pages/CreatePage";

export const meta: MetaFunction = () => {
  return [{ title: "Create AI Generated Images" }];
};

const MODEL_OPTIONS = [
  {
    name: "Dreamshaper XL Lightning",
    image: "/assets/model-thumbs/ds-xl-lightning.jpg",
    description: "Dreamshaper XL, accelerated. High quality, fast and cheap.",
  },
  {
    name: "Flux",
    image: "/assets/model-thumbs/flux-dev-thumb-2.jpg",
    description:
      "The largest open-source text-to-image model to date, by Black Forest Labs.",
  },
  {
    name: "DALL-E 2",
    image: "/assets/model-thumbs/dalle2.jpg",
    description: "State-of-the-art image generator from OpenAI.",
  },
  {
    name: "DALL-E 3",
    image: "/assets/model-thumbs/dalle3.jpg",
    description: "State-of-the-art image generator from OpenAI.",
  },
  // {
  //   name: "Ideogram 2.0",
  //   image: "/assets/model-thumbs/ideogram-v1.jpg",
  //   description: "A model by Ideogram that is amazing at Typography.",
  // },
  {
    name: "Google Imagen 3.0",
    image: "/assets/model-thumbs/imagen-3-0-thumb.jpg",
    description:
      "A model by Google DeepMind that is great at typography & prompt adherence.",
  },
];

const STYLE_OPTIONS = [
  { name: "NightCafe", image: "/assets/preset-text-styles/nightcafe-4.jpg" },
  { name: "Cinematic", image: "/assets/preset-text-styles/cinematic.jpg" },
  { name: "Realistic Anime", image: "/assets/preset-text-styles/anime-v2.jpg" },
  {
    name: "Artistic Portrait",
    image: "/assets/preset-text-styles/artistic-portrait.jpg",
  },
  { name: "Vibrant", image: "/assets/preset-text-styles/vibrant.jpg" },
  {
    name: "Epic Origami",
    image: "/assets/preset-text-styles/epic-origami.jpg",
  },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserLogin(request);

  return json({ modelOptions: MODEL_OPTIONS, styleOptions: STYLE_OPTIONS });
};

export type CreatePageLoader = typeof loader;

export default function Index() {
  return <CreatePage />;
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
