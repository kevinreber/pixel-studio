import { PageContainer } from "~/components";
import PixelStudioIcon from "components/PixelStudioIcon";
import { Link, useNavigation } from "@remix-run/react";
import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  Sparkles,
  Zap,
  Users,
  ImageIcon,
  Video,
  ArrowRight,
} from "lucide-react";

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

const ROTATING_WORDS = [
  "stunning portraits",
  "epic landscapes",
  "abstract art",
  "cinematic scenes",
  "fantasy worlds",
  "AI videos",
];

const EXAMPLE_PROMPTS = [
  "A cyberpunk city at sunset with neon reflections on wet streets",
  "An enchanted forest with bioluminescent mushrooms and fireflies",
  "A steampunk airship floating above Victorian London",
  "An astronaut playing guitar on the surface of Mars",
  "A cozy Japanese café during cherry blossom season",
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "10+ AI Models",
    description: "DALL-E, Flux, Stable Diffusion, Ideogram, and more",
  },
  {
    icon: Video,
    title: "AI Video Generation",
    description: "Create videos with Runway, Luma, and Stability AI",
  },
  {
    icon: Users,
    title: "Creative Community",
    description: "Share, explore, and remix art from other creators",
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Generate high-quality images in seconds",
  },
];

function useRotatingText(words: string[], intervalMs: number) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [words.length, intervalMs]);
  return words[index];
}

function useTypewriter(prompts: string[], typingSpeed = 40, pauseMs = 2000) {
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);

  useEffect(() => {
    const fullText = prompts[promptIndex];
    let charIndex = 0;
    let isDeleting = false;
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (!isDeleting) {
        setCurrentPrompt(fullText.slice(0, charIndex + 1));
        charIndex++;
        if (charIndex === fullText.length) {
          isDeleting = true;
          timeout = setTimeout(tick, pauseMs);
          return;
        }
        timeout = setTimeout(tick, typingSpeed);
      } else {
        setCurrentPrompt(fullText.slice(0, charIndex - 1));
        charIndex--;
        if (charIndex === 0) {
          isDeleting = false;
          setPromptIndex((prev) => (prev + 1) % prompts.length);
          return;
        }
        timeout = setTimeout(tick, typingSpeed / 2);
      }
    };

    timeout = setTimeout(tick, typingSpeed);
    return () => clearTimeout(timeout);
  }, [promptIndex, prompts, typingSpeed, pauseMs]);

  return currentPrompt;
}

const LandingPage = () => {
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";
  const rotatingWord = useRotatingText(ROTATING_WORDS, 3000);
  const typedPrompt = useTypewriter(EXAMPLE_PROMPTS);
  const [activePrompt, setActivePrompt] = useState<number | null>(null);

  const handlePromptClick = useCallback((index: number) => {
    setActivePrompt(index);
  }, []);

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

        {/* Navigation */}
        <div className="absolute top-6 left-6 z-10 opacity-0 animate-fade-in">
          <Link to="/" className="flex align-baseline">
            <div className="w-8 mr-3">
              <PixelStudioIcon />
            </div>
            <h2 className="text-2xl m-0">Pixel Studio</h2>
          </Link>
        </div>

        <div className="relative isolate overflow-hidden bg-zinc-950">
          {/* Animated background grid */}
          <svg
            className="absolute inset-0 -z-10 h-full w-full stroke-white/10 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="grid-pattern"
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
              fill="url(#grid-pattern)"
            />
          </svg>

          {/* Animated gradient blob */}
          <div
            className="absolute left-1/2 right-0 top-0 -z-10 -ml-24 transform-gpu overflow-hidden blur-3xl lg:ml-24 xl:ml-48"
            aria-hidden="true"
          >
            <div
              className="aspect-[801/1036] w-[50.0625rem] bg-gradient-to-tr from-[#ff80b5] via-[#9089fc] to-[#ff80b5] opacity-30 bg-[length:200%_200%] animate-gradient-shift"
              style={{
                clipPath:
                  "polygon(63.1% 29.5%, 100% 17.1%, 76.6% 3%, 48.4% 0%, 44.6% 4.7%, 54.5% 25.3%, 59.8% 49%, 55.2% 57.8%, 44.4% 57.2%, 27.8% 47.9%, 35.1% 81.5%, 0% 97.7%, 39.2% 100%, 35.2% 81.4%, 97.2% 52.8%, 63.1% 29.5%)",
              }}
            />
          </div>

          {/* Second gradient blob for depth */}
          <div
            className="absolute left-0 bottom-0 -z-10 transform-gpu overflow-hidden blur-3xl"
            aria-hidden="true"
          >
            <div
              className="aspect-[1036/801] w-[40rem] bg-gradient-to-tr from-[#9089fc] via-[#ff80b5] to-[#9089fc] opacity-20 bg-[length:200%_200%] animate-gradient-shift"
              style={{
                clipPath:
                  "polygon(20% 80%, 40% 60%, 60% 70%, 80% 40%, 100% 60%, 100% 100%, 0% 100%)",
                animationDelay: "4s",
              }}
            />
          </div>

          <div className="overflow-hidden">
            {/* Hero Section */}
            <div className="mx-auto max-w-7xl px-6 pb-32 pt-36 sm:pt-60 lg:px-8 lg:pt-32 min-h-screen">
              <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
                {/* Hero Text */}
                <div className="w-full max-w-xl lg:shrink-0 xl:max-w-2xl relative z-10">
                  <h1
                    className="text-4xl font-bold tracking-tight text-gray-200 sm:text-5xl opacity-0 animate-fade-in-up"
                    style={{ animationDelay: "0.1s" }}
                  >
                    Create{" "}
                    <span className="relative inline-block">
                      <span
                        key={rotatingWord}
                        className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 animate-text-reveal"
                      >
                        {rotatingWord}
                      </span>
                    </span>{" "}
                    with AI.
                  </h1>
                  <p
                    className="relative mt-6 text-lg leading-8 text-gray-400 sm:max-w-md lg:max-w-none opacity-0 animate-fade-in-up"
                    style={{ animationDelay: "0.3s" }}
                  >
                    Transform your ideas into mesmerizing art and videos in
                    seconds. No design experience needed — just describe what
                    you imagine and watch AI bring it to life.
                  </p>

                  {/* CTA Buttons */}
                  <div
                    className="mt-10 flex items-center gap-x-6 opacity-0 animate-fade-in-up"
                    style={{ animationDelay: "0.5s" }}
                  >
                    <Link
                      to="/create"
                      prefetch="intent"
                      className="group relative rounded-md bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 hover:shadow-indigo-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-300"
                    >
                      <span className="flex items-center gap-2">
                        Start creating
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </Link>
                    <Link
                      to="/explore"
                      prefetch="intent"
                      className="rounded-md px-5 py-3 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 border border-gray-600 hover:border-gray-400 hover:bg-white/5 transition-all duration-300"
                    >
                      Explore gallery
                    </Link>
                  </div>

                  {/* Interactive Prompt Typewriter */}
                  <div
                    className="mt-12 opacity-0 animate-fade-in-up"
                    style={{ animationDelay: "0.7s" }}
                  >
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                      Try a prompt like...
                    </p>
                    <div className="relative rounded-lg border border-gray-700/50 bg-gray-900/50 backdrop-blur-sm p-4 hover:border-indigo-500/30 transition-colors duration-500">
                      <div className="flex items-start gap-3">
                        <ImageIcon className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {typedPrompt}
                          <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 animate-pulse align-middle" />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Image Gallery with animations */}
                <div className="mt-14 flex justify-end gap-8 sm:-mt-44 sm:justify-start sm:pl-20 lg:mt-0 lg:pl-0 relative z-0">
                  <div className="ml-auto w-44 flex-none space-y-8 pt-32 sm:ml-0 sm:pt-80 lg:order-last lg:pt-36 xl:order-none xl:pt-80">
                    <GalleryImage
                      src={BONSAI_TREE_SRC}
                      alt="AI generated bonsai tree"
                      delay="0.2s"
                      floatClass="animate-float"
                    />
                  </div>
                  <div className="mr-auto w-44 flex-none space-y-8 sm:mr-0 sm:pt-52 lg:pt-36">
                    <GalleryImage
                      src={BROOKLYN_BRIDGE_FROM_TRAIN}
                      alt="AI generated Brooklyn Bridge scene"
                      delay="0.4s"
                      floatClass="animate-float-slow"
                    />
                    <GalleryImage
                      src={PIRATE_SPACE_SHIP}
                      alt="AI generated pirate space ship"
                      delay="0.6s"
                      floatClass="animate-float-slower"
                    />
                  </div>
                  <div className="w-44 flex-none space-y-8 pt-32 sm:pt-0">
                    <GalleryImage
                      src={MAN_STANDING_STARGATE}
                      alt="AI generated man at stargate"
                      delay="0.5s"
                      floatClass="animate-float-slow"
                    />
                    <GalleryImage
                      src={ISO_SPACE_STATION}
                      alt="AI generated isometric space station"
                      delay="0.7s"
                      floatClass="animate-float"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
              <div className="mx-auto max-w-2xl text-center mb-16">
                <h2
                  className="text-3xl font-bold tracking-tight text-gray-200 sm:text-4xl opacity-0 animate-fade-in-up"
                  style={{ animationDelay: "0.9s" }}
                >
                  Everything you need to create
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {FEATURES.map((feature, i) => (
                  <FeatureCard
                    key={feature.title}
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                    delay={`${1.0 + i * 0.15}s`}
                  />
                ))}
              </div>
            </div>

            {/* Prompt Showcase Section */}
            <div className="mx-auto max-w-7xl px-6 pb-32 lg:px-8">
              <div
                className="opacity-0 animate-fade-in-up"
                style={{ animationDelay: "1.6s" }}
              >
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4 text-center">
                  Get inspired — click a prompt to try it
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {EXAMPLE_PROMPTS.map((prompt, i) => (
                    <Link
                      key={i}
                      to={`/create?prompt=${encodeURIComponent(prompt)}`}
                      prefetch="intent"
                      className={`group rounded-full border px-4 py-2 text-sm transition-all duration-300 ${
                        activePrompt === i
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                          : "border-gray-700 text-gray-400 hover:border-indigo-500/50 hover:text-gray-200 hover:bg-white/5"
                      }`}
                      onClick={() => handlePromptClick(i)}
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        {prompt.length > 50
                          ? prompt.slice(0, 50) + "..."
                          : prompt}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </PageContainer>
  );
};

function GalleryImage({
  src,
  alt,
  delay,
  floatClass,
}: {
  src: string;
  alt: string;
  delay: string;
  floatClass: string;
}) {
  return (
    <div
      className={`relative opacity-0 animate-fade-in-up ${floatClass}`}
      style={{ animationDelay: delay }}
    >
      <img
        src={src}
        alt={alt}
        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/10"
        decoding="async"
        loading="lazy"
      />
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10 transition-all duration-500 hover:ring-indigo-500/20" />
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  delay: string;
}) {
  return (
    <div
      className="group relative rounded-2xl border border-gray-800 bg-gray-900/30 backdrop-blur-sm p-6 hover:border-indigo-500/30 hover:bg-gray-900/50 transition-all duration-500 opacity-0 animate-fade-in-up"
      style={{ animationDelay: delay }}
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors duration-300">
        <Icon className="h-5 w-5 text-indigo-400" />
      </div>
      <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 group-hover:text-gray-400 transition-colors duration-300">
        {description}
      </p>
    </div>
  );
}

export default LandingPage;
