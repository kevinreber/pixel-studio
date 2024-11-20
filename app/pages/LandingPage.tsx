import { PageContainer } from "~/components";
import PixelStudioIcon from "components/PixelStudioIcon";
import { Link, useNavigation } from "@remix-run/react";
import { Loader2 } from "lucide-react";

/**
 *
 * @bio1
 * At ImageGenius, we've harnessed the power of Artificial Intelligence to revolutionize image creation. Our web app provides a seamless and intuitive platform for users like you to effortlessly generate stunning and unique AI-generated images.
 * Embrace your artistic side without any design skills or technical knowledge. With ImageGenius, the possibilities are endless. Simply choose from a vast array of styles, themes, and concepts, and watch as our advanced AI algorithms bring your vision to life.
 * Whether you need eye-catching graphics for your blog, social media posts, presentations, or personal projects, ImageGenius has got you covered. Our AI models have been trained extensively to produce high-quality images with incredible detail and realism, ensuring that your content stands out from the crowd.
 * Not only does ImageGenius offer a vast library of pre-generated images, but you can also customize and fine-tune every aspect of your creation. Adjust colors, shapes, textures, and more to achieve the perfect result that aligns with your unique vision. The user-friendly interface makes it easy to experiment and iterate until you're completely satisfied.
 *
 * With our cutting-edge technology, your creative journey is limitless. ImageGenius empowers you to explore new frontiers, experiment with different art styles, and push the boundaries of what's possible. Unleash your imagination and let our AI-powered tools be your creative collaborator.
 * Join our community of artists, designers, and enthusiasts who trust ImageGenius to amplify their creativity. Start creating breathtaking AI-generated images today and experience the future of visual art.
 * Take the leap into the world of limitless creativity with ImageGenius - your gateway to AI-inspired wonders.
 * Sign up now and get ready to be amazed!
 *
 * @bio2
 * Unleash your creativity with ImageGenius, the web app that empowers you to effortlessly create stunning AI-generated images. No design skills required. Sign up now and experience the limitless possibilities of visual art.
 *
 * @bio3
 * Elevate your artistic expression with ImageGenius - the ultimate web app for effortlessly generating captivating AI-generated images. No design experience needed. Join us now and unlock a world of limitless creativity!
 *
 * @bio4
 * Discover the future of image creation with ImageGenius - the user-friendly web app that harnesses the power of AI to help you create extraordinary visuals in seconds. Sign up today and let your imagination soar.
 *
 * @bio5
 * Welcome to ImageGenius, where AI meets artistry. Create mesmerizing AI-generated images with ease using our intuitive web app. Join our community of creative minds and revolutionize the way you bring your ideas to life.
 */

const BONSAI_TREE_SRC =
  "https://ai-icon-generator-resized.s3.us-east-2.amazonaws.com/resized-clov1aotv003pr2ygixlp9pmi";
const ISO_SPACE_STATION =
  "https://ai-icon-generator-resized.s3.us-east-2.amazonaws.com/resized-clov0tnth001hr2ygj2wec2wn";
const PIRATE_SPACE_SHIP =
  "https://ai-icon-generator-resized.s3.us-east-2.amazonaws.com/resized-clkp3riui0001r2wj7q3t8tav";
const MAN_STANDING_STARGATE =
  "https://ai-icon-generator-resized.s3.us-east-2.amazonaws.com/resized-cllfyj6la0001r2otvu0ms49w";
const BROOKLYN_BRIDGE_FROM_TRAIN =
  "https://ai-icon-generator-resized.s3.us-east-2.amazonaws.com/resized-clov3hb17001gr2qvnx15mvf7";

const LandingPage = () => {
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";

  return (
    <PageContainer
      styles={{ width: "100%", height: "100%", padding: 0, margin: 0 }}
    >
      <main className="h-full relative">
        {isNavigating && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </div>
        )}
        <div className="absolute top-6 left-6 z-10">
          <Link to="/" className="flex align-baseline">
            <div className="w-8 mr-3">
              <PixelStudioIcon />
            </div>
            <h2 className="text-2xl m-0">Pixel Studio</h2>
          </Link>
        </div>
        <div className="relative isolate overflow-hidden bg-zinc-950 h-full">
          <svg
            className="absolute inset-0 -z-10 h-full w-full stroke-white/10 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="983e3e4c-de6d-4c3f-8d64-b9761d1534cc"
                width={200}
                height={200}
                x="50%"
                y={-1}
                patternUnits="userSpaceOnUse"
              >
                <path d="M.5 200V.5H200" fill="none" />
              </pattern>
            </defs>
            <svg x="50%" y={-1} className="overflow-visible fill-gray-800/20">
              <path
                d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
                strokeWidth={0}
              />
            </svg>
            <rect
              width="100%"
              height="100%"
              strokeWidth={0}
              fill="url(#983e3e4c-de6d-4c3f-8d64-b9761d1534cc)"
            />
          </svg>
          <div
            className="absolute left-1/2 right-0 top-0 -z-10 -ml-24 transform-gpu overflow-hidden blur-3xl lg:ml-24 xl:ml-48"
            aria-hidden="true"
          >
            <div
              className="aspect-[801/1036] w-[50.0625rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
              style={{
                clipPath:
                  "polygon(63.1% 29.5%, 100% 17.1%, 76.6% 3%, 48.4% 0%, 44.6% 4.7%, 54.5% 25.3%, 59.8% 49%, 55.2% 57.8%, 44.4% 57.2%, 27.8% 47.9%, 35.1% 81.5%, 0% 97.7%, 39.2% 100%, 35.2% 81.4%, 97.2% 52.8%, 63.1% 29.5%)",
              }}
            />
          </div>
          <div className="overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 pb-32 pt-36 sm:pt-60 lg:px-8 lg:pt-32 h-screen">
              <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
                <div className="w-full max-w-xl lg:shrink-0 xl:max-w-2xl">
                  <h1 className="text-4xl font-bold tracking-tight text-gray-200 sm:text-4xl">
                    Amplify your creativity effortlessly.
                  </h1>
                  <p className="relative mt-6 text-lg leading-8 text-gray-500 sm:max-w-md lg:max-w-none">
                    Create mesmerizing AI-generated art with in seconds, no
                    design experience needed. Join our community of creative
                    minds and revolutionize the way you bring your ideas to
                    life.
                  </p>
                  <div className="mt-10 flex items-center gap-x-6">
                    <Link
                      to="/create"
                      prefetch="intent"
                      className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Get started
                    </Link>
                    <Link
                      to="/explore"
                      prefetch="intent"
                      className="rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 border border-gray-500 hover:bg-gray-800 hover:text-gray-200"
                    >
                      Explore
                    </Link>
                  </div>
                </div>
                <div className="mt-14 flex justify-end gap-8 sm:-mt-44 sm:justify-start sm:pl-20 lg:mt-0 lg:pl-0">
                  <div className="ml-auto w-44 flex-none space-y-8 pt-32 sm:ml-0 sm:pt-80 lg:order-last lg:pt-36 xl:order-none xl:pt-80">
                    <div className="relative">
                      <img
                        src={BONSAI_TREE_SRC}
                        alt=""
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                        decoding="async"
                        loading="lazy"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                  </div>
                  <div className="mr-auto w-44 flex-none space-y-8 sm:mr-0 sm:pt-52 lg:pt-36">
                    <div className="relative">
                      <img
                        src={BROOKLYN_BRIDGE_FROM_TRAIN}
                        alt=""
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                        decoding="async"
                        loading="lazy"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                    <div className="relative">
                      <img
                        src={PIRATE_SPACE_SHIP}
                        alt=""
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                        decoding="async"
                        loading="lazy"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                  </div>
                  <div className="w-44 flex-none space-y-8 pt-32 sm:pt-0">
                    <div className="relative">
                      <img
                        src={MAN_STANDING_STARGATE}
                        alt=""
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                        decoding="async"
                        loading="lazy"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                    <div className="relative">
                      <img
                        src={ISO_SPACE_STATION}
                        alt=""
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                        decoding="async"
                        loading="lazy"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </PageContainer>
  );
};

export default LandingPage;
