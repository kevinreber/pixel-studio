import {
  type LoaderFunctionArgs,
  ActionFunctionArgs,
  json,
  MetaFunction,
  redirect,
} from "@remix-run/node";
import { GeneralErrorBoundary } from "~/components/GeneralErrorBoundary";
import { requireUserLogin } from "~/services";
import CreatePage from "~/pages/CreatePage";
import { createNewImages, updateUserCredits } from "~/server";

export const meta: MetaFunction = () => {
  return [{ title: "Create AI Generated Images" }];
};

const MODEL_OPTIONS = [
  {
    name: "Stable Diffusion 1.6",
    value: "stable-diffusion-v1-6",
    image: "/assets/model-thumbs/sd-1-5.jpg",
    description: "The most popular first-generation stable diffusion model.",
  },
  {
    name: "Stable Diffusion XL",
    value: "stable-diffusion-xl-1024-v1-0",
    image: "/assets/model-thumbs/sdxlv1.jpg",
    description: "The state-of-the-art in open-source image generation.",
  },
  {
    name: "DALL-E 2",
    value: "dall-e",
    image: "/assets/model-thumbs/dalle2.jpg",
    description: "State-of-the-art image generator from OpenAI.",
  },
  // {
  //   name: "Dreamshaper XL Lightning",
  //   image: "/assets/model-thumbs/ds-xl-lightning.jpg",
  //   description: "Dreamshaper XL, accelerated. High quality, fast and cheap.",
  // },
  // {
  //   name: "Flux",
  //   image: "/assets/model-thumbs/flux-dev-thumb-2.jpg",
  //   description:
  //     "The largest open-source text-to-image model to date, by Black Forest Labs.",
  // },
  // {
  //   name: "DALL-E 3",
  //   image: "/assets/model-thumbs/dalle3.jpg",
  //   description: "State-of-the-art image generator from OpenAI.",
  // },
  // {
  //   name: "Ideogram 2.0",
  //   image: "/assets/model-thumbs/ideogram-v1.jpg",
  //   description: "A model by Ideogram that is amazing at Typography.",
  // },
  // {
  //   name: "Google Imagen 3.0",
  //   image: "/assets/model-thumbs/imagen-3-0-thumb.jpg",
  //   description:
  //     "A model by Google DeepMind that is great at typography & prompt adherence.",
  // },
];

const STYLE_OPTIONS = [
  {
    name: "3d Model",
    value: "3d-model",
    image: "/assets/preset-text-styles/3d-game-v2.jpg",
  },
  {
    name: "Anime",
    value: "anime",
    image: "/assets/preset-text-styles/anime-v2.jpg",
  },
  {
    name: "Cinematic",
    value: "cinematic",
    image: "/assets/preset-text-styles/cinematic.jpg",
  },
  {
    name: "Comic Book",
    value: "comic-book",
    image: "/assets/preset-text-styles/modern-comic.jpg",
  },
  {
    name: "Digital Art",
    value: "digital-art",
    image: "/assets/preset-text-styles/artistic-portrait.jpg",
  },
  {
    name: "Fantasy Art",
    value: "fantasy-art",
    image: "/assets/preset-text-styles/fantasy.jpg",
  },
  {
    name: "Neon Punk",
    value: "neon-punk",
    image: "/assets/preset-text-styles/cyberpunk.jpg",
  },
  {
    name: "Origami",
    value: "origami",
    image: "/assets/preset-text-styles/epic-origami.jpg",
  },
  {
    name: "Photographic",
    value: "photographic",
    image: "/assets/preset-text-styles/photo.jpg",
  },
  // { name: "Enhance", image: "/assets/preset-text-styles/.jpg" },
  // { name: "Isometric", image: "/assets/preset-text-styles/.jpg" },
  // { name: "Line Art", image: "/assets/preset-text-styles/.jpg" },
  // { name: "Low Poly", image: "/assets/preset-text-styles/.jpg" },
  // {
  //   name: "Modeling Compound",
  //   image: "/assets/preset-text-styles/.jpg",
  // },
  // { name: "Analog Film", image: "/assets/preset-text-styles/jpg" },
  // { name: "Pixel Art", image: "/assets/preset-text-styles/.jpg" },
  // {
  //   name: "Tile Texture",
  //   image: "/assets/preset-text-styles/.jpg",
  // },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUserLogin(request);

  return json({ modelOptions: MODEL_OPTIONS, styleOptions: STYLE_OPTIONS });
};

export type CreatePageLoader = typeof loader;

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await requireUserLogin(request);
  const formData = await request.formData();
  const prompt = formData.get("prompt") || "";
  const model = formData.get("model") || "";
  const stylePreset = formData.get("style") || "";
  const numberOfImages = formData.get("numberOfImages") || "1";

  const payload = {
    prompt: prompt.toString(),
    stylePreset: stylePreset.toString(),
    numberOfImages: parseInt(numberOfImages.toString()),
    model: model.toString(),
  };

  // Verify user has enough credits
  try {
    await updateUserCredits(user.id, payload.numberOfImages);
  } catch (error: unknown) {
    console.error(error);

    return json(
      {
        message: "Error updating user credits",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }

  const response = await createNewImages(payload, user.id);

  if (response.setId) {
    return redirect(`/set/${response.setId}`);
  }

  return json({ error: "Failed to create set" }, { status: 500 });
};

export default function Index() {
  return <CreatePage />;
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
