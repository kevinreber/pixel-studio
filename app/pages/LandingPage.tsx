import * as React from "react";
import { Link } from "@remix-run/react";
import {
  ArrowRight,
  Sparkles,
  Cpu,
  Video,
  Palette,
  Shuffle,
  Wallet,
  Users,
  Check,
} from "lucide-react";
import PixelStudioIcon from "components/PixelStudioIcon";
import { Button, Badge, ArtTile, ThemeToggle } from "~/components/ps";
import { cn } from "@/lib/utils";

const HERO_IMAGES: { src: string; alt: string }[] = [
  {
    src: "/assets/hero/resized-clov1aotv003pr2ygixlp9pmi.jpg",
    alt: "Treehouse with cherry blossoms",
  },
  {
    src: "/assets/hero/resized-clov3hb17001gr2qvnx15mvf7.jpg",
    alt: "View of the Brooklyn Bridge from a subway car",
  },
  {
    src: "/assets/hero/resized-cllfyj6la0001r2otvu0ms49w.jpg",
    alt: "Figure standing before a stargate above a city",
  },
  {
    src: "/assets/hero/resized-clkp3riui0001r2wj7q3t8tav.jpg",
    alt: "Pirate ship sailing through space",
  },
  {
    src: "/assets/hero/resized-clov0tnth001hr2ygj2wec2wn.jpg",
    alt: "Isometric neon space station",
  },
];

// Visually distinct samples drawn from the style-preset library so the gallery
// section below the hero doesn't have to repeat the 5 hero tiles to fill 8
// slots. Chosen for cross-style variety (sketch, painterly, anime, cubist,
// cinematic, abstract) — pulled from public/assets/preset-text-styles/.
const GALLERY_EXTRAS: { src: string; alt: string }[] = [
  {
    src: "/assets/preset-text-styles/cinematic.jpg",
    alt: "Cinematic gothic interior with sun rays through arched windows",
  },
  {
    src: "/assets/preset-text-styles/anime.jpg",
    alt: "Anime figure with a parasol in a kimono garden",
  },
  {
    src: "/assets/preset-text-styles/charcoal.jpg",
    alt: "Charcoal sketch of a forest cabin",
  },
  {
    src: "/assets/preset-text-styles/cubist.jpg",
    alt: "Cubist painting of a wood cabin among trees",
  },
  {
    src: "/assets/preset-text-styles/candy.jpg",
    alt: "Vibrant candy-style oil painting of a small cottage",
  },
  {
    src: "/assets/preset-text-styles/cosmic.jpg",
    alt: "Cosmic fantasy cabin glowing in a magical forest",
  },
  {
    src: "/assets/preset-text-styles/abstract-curves.jpg",
    alt: "Abstract swirling portrait of a unicorn",
  },
];

const EXAMPLE_PROMPTS = [
  "An astronaut playing guitar on Mars",
  "Cyberpunk Tokyo in the rain",
  "Cozy cabin, snowfall, oil painting",
  "Bioluminescent forest at night",
];

const STATS = [
  { value: "1.9M", label: "creations" },
  { value: "12,000+", label: "creators" },
  { value: "12", label: "models" },
  { value: "4.9★", label: "rating" },
];

const FEATURES = [
  {
    icon: <Cpu className="h-5 w-5" />,
    title: "12 leading models",
    desc: "Stable Diffusion, Flux, DALL·E, Ideogram and more — switch any time without leaving your flow.",
    tone: "accent",
  },
  {
    icon: <Video className="h-5 w-5" />,
    title: "Images & video",
    desc: "Generate stills, then bring them to life with text- and image-to-video models.",
    tone: "info",
  },
  {
    icon: <Palette className="h-5 w-5" />,
    title: "Style presets",
    desc: "Anime, cinematic, photographic, 3D, comic and more, applied with one click.",
    tone: "warning",
  },
  {
    icon: <Shuffle className="h-5 w-5" />,
    title: "Remix & compare",
    desc: "Iterate from anyone's image. Side-by-side compare across multiple models.",
    tone: "accent",
  },
  {
    icon: <Wallet className="h-5 w-5" />,
    title: "Sell prompts",
    desc: "Publish prompts and premium collections — earn credits when others buy.",
    tone: "success",
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Community feed",
    desc: "Follow makers you love, like and comment, get notified on remixes.",
    tone: "info",
  },
] as const;

const PROVIDERS = [
  "Stability AI",
  "Black Forest Labs",
  "OpenAI",
  "Ideogram",
  "Runway",
  "Luma AI",
  "Replicate",
  "Hugging Face",
];

// One-time credit packs. Source of truth is `CREDIT_PACKAGES` in
// `app/config/pricing.ts` — keep prices and credit counts in sync with that
// file (the checkout flow reads from the same constant). The landing page used
// to advertise monthly Pro / Studio subscriptions with features like API
// access and team workspaces that the product doesn't actually offer; we sell
// one type of thing (credits) and these are the three packs.
const PRICING = [
  {
    name: "Starter",
    price: "$2.99",
    cadence: "one-time",
    description: "Try every model without committing.",
    features: [
      "50 credits",
      "Any image or video model",
      "Credits never expire",
      "Community support",
    ],
    cta: "Buy starter",
    featured: false,
  },
  {
    name: "Standard",
    price: "$6.99",
    cadence: "one-time",
    description: "Best balance for regular makers.",
    features: [
      "150 credits",
      "Any image or video model",
      "~$0.047 per credit",
      "Credits never expire",
    ],
    cta: "Buy standard",
    featured: true,
  },
  {
    name: "Pro",
    price: "$14.99",
    cadence: "one-time",
    description: "Best value per credit.",
    features: [
      "400 credits",
      "Any image or video model",
      "~$0.037 per credit",
      "Credits never expire",
    ],
    cta: "Buy pro",
    featured: false,
  },
] as const;

const TONE_TILE: Record<string, string> = {
  accent: "bg-accent-soft text-[var(--accent-text)] border-border-accent",
  info: "bg-info-soft text-info border-transparent",
  warning: "bg-warning-soft text-warning border-transparent",
  success: "bg-success-soft text-success border-transparent",
};

function useTypewriter(words: string[], delay = 46) {
  const [text, setText] = React.useState("");
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    let i = 0;
    let deleting = false;
    const target = words[idx];
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (!deleting) {
        i++;
        setText(target.slice(0, i));
        if (i >= target.length) {
          t = setTimeout(() => {
            deleting = true;
            tick();
          }, 1800);
          return;
        }
        t = setTimeout(tick, delay);
      } else {
        i -= 2;
        setText(target.slice(0, Math.max(i, 0)));
        if (i <= 0) {
          setIdx((p) => (p + 1) % words.length);
          return;
        }
        t = setTimeout(tick, delay / 2);
      }
    };
    t = setTimeout(tick, 400);
    return () => clearTimeout(t);
  }, [idx, words, delay]);
  return text;
}

export default function LandingPage() {
  const typed = useTypewriter(EXAMPLE_PROMPTS);

  // Manual smooth-scroll for in-page anchors. Remix's <ScrollRestoration />
  // intercepts plain <a href="#…"> clicks and prevents the native scroll,
  // so the URL hash updates but the viewport stays put. Wire it ourselves.
  const scrollToAnchor =
    (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const el = document.getElementById(id);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.scrollY - 72; // account for sticky nav
      window.scrollTo({ top, behavior: "smooth" });
      // Keep the URL in sync so users can share / bookmark the section.
      if (typeof history !== "undefined") {
        history.replaceState(null, "", `#${id}`);
      }
    };

  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* Marketing nav */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between px-4 md:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8">
              <PixelStudioIcon />
            </div>
            <span className="text-lg font-bold tracking-tight">Pixel Studio</span>
          </Link>
          <nav className="hidden items-center gap-6 text-[14px] font-medium text-fg-muted md:flex">
            <Link to="/explore" className="hover:text-fg">
              Explore
            </Link>
            <a
              href="#lp-models"
              onClick={scrollToAnchor("lp-models")}
              className="hover:text-fg"
            >
              Models
            </a>
            <a
              href="#lp-pricing"
              onClick={scrollToAnchor("lp-pricing")}
              className="hover:text-fg"
            >
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login" className="hidden md:block">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link to="/create">
              <Button
                variant="primary"
                size="sm"
                iconRight={<ArrowRight className="h-4 w-4" />}
              >
                Start creating
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 60% at 18% 18%, var(--accent-soft) 0%, transparent 60%), radial-gradient(60% 60% at 82% 18%, rgba(255,90,180,0.15) 0%, transparent 60%)",
          }}
        />
        <div className="mx-auto grid w-full max-w-[1280px] gap-12 px-4 py-16 md:grid-cols-[1.1fr_1fr] md:px-8 md:py-24">
          <div>
            <Badge tone="accent" icon={<Sparkles className="h-3 w-3" />}>
              1.9M creations and counting
            </Badge>
            <h1 className="mt-5 text-[44px] font-bold leading-[1.02] tracking-[-0.035em] md:text-[64px]">
              Create stunning{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(100deg, var(--accent), #c4a3ff 60%, #ff9ad1)",
                }}
              >
                art &amp; video
              </span>{" "}
              from a sentence.
            </h1>
            <p className="mt-5 max-w-[560px] text-[16px] leading-[1.55] text-fg-muted">
              Pixel Studio brings 12 leading AI image and video models into a
              single creative workspace. Prompt, remix, compare, and ship.
            </p>

            {/* Auto-typing prompt bar */}
            <div className="mt-7 flex h-[58px] items-center gap-2 rounded-md border border-border-strong bg-surface-1 px-3 shadow-sm">
              <Sparkles className="h-5 w-5 text-[var(--accent-text)]" />
              <span className="flex-1 truncate font-sans text-[15px] text-fg">
                {typed}
                <span className="animate-ps-caret text-[var(--accent-text)]">▎</span>
              </span>
              <Link to="/create">
                <Button
                  variant="primary"
                  size="md"
                  iconRight={<ArrowRight className="h-4 w-4" />}
                >
                  Generate
                </Button>
              </Link>
            </div>

            {/* Example chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.slice(0, 3).map((p) => (
                <span
                  key={p}
                  className="rounded-full border border-[var(--border)] bg-surface-2 px-3 py-1.5 text-[12.5px] text-fg-muted"
                >
                  {p}
                </span>
              ))}
            </div>

            {/* Social proof */}
            <div className="mt-7 flex items-center gap-3">
              <div className="flex -space-x-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="grid h-8 w-8 place-items-center overflow-hidden rounded-full border-2 border-bg bg-surface-3"
                  >
                    <img
                      src={HERO_IMAGES[i].src}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <p className="text-[13px] text-fg-muted">
                Joined by 12,000+ creators this month
              </p>
            </div>
          </div>

          {/* Floating gallery */}
          <div className="relative hidden h-[520px] md:block">
            <FloatTile
              image={HERO_IMAGES[0]}
              style={{ top: 0, right: "44%", width: 180, height: 240 }}
              delay={0}
            />
            <FloatTile
              image={HERO_IMAGES[1]}
              style={{ top: 30, right: 0, width: 200, height: 260 }}
              delay={1.4}
            />
            <FloatTile
              image={HERO_IMAGES[2]}
              style={{ top: 230, right: "30%", width: 170, height: 220 }}
              delay={0.6}
            />
            <FloatTile
              image={HERO_IMAGES[3]}
              style={{ top: 270, right: 0, width: 200, height: 200 }}
              delay={2.1}
            />
            <FloatTile
              image={HERO_IMAGES[4]}
              style={{ top: 80, right: "60%", width: 150, height: 180 }}
              delay={1}
            />
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-[var(--border)] bg-surface-1">
        <div className="mx-auto grid w-full max-w-[1280px] grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4 md:px-8">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="mono text-[32px] font-bold leading-none tracking-[-0.02em] text-fg">
                {s.value}
              </div>
              <div className="mt-1 text-[12.5px] text-fg-subtle">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-[1280px] px-4 py-20 md:px-8">
        <h2 className="text-[34px] font-bold tracking-[-0.025em] md:text-[42px]">
          Everything you need to{" "}
          <span className="text-[var(--accent-text)]">make</span>.
        </h2>
        <p className="mt-3 max-w-[560px] text-[15px] text-fg-muted">
          One workspace. Every model. Every output type. Built so you stay in
          the flow instead of switching tabs.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="rounded-lg border border-[var(--border)] bg-surface-1 p-5 transition-colors hover:border-border-strong"
            >
              <div
                className={cn(
                  "mb-4 grid h-10 w-10 place-items-center rounded-md border",
                  TONE_TILE[f.tone],
                )}
              >
                {f.icon}
              </div>
              <h3 className="text-[17px] font-semibold tracking-[-0.01em]">
                {f.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-[1.55] text-fg-muted">
                {f.desc}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Providers */}
      <section
        id="lp-models"
        className="border-y border-[var(--border)] bg-surface-1 py-16"
      >
        <div className="mx-auto w-full max-w-[1280px] px-4 md:px-8">
          <p className="u-label">Powered by the world&apos;s best models</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {PROVIDERS.map((p) => (
              <span
                key={p}
                className="rounded-full border border-[var(--border)] bg-surface-2 px-3.5 py-1.5 text-[13px] font-semibold text-fg"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Community gallery */}
      <section className="mx-auto w-full max-w-[1280px] px-4 py-20 md:px-8">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <h2 className="text-[32px] font-bold tracking-[-0.025em] md:text-[40px]">
              Made with Pixel Studio
            </h2>
            <p className="mt-2 max-w-[520px] text-[14px] text-fg-muted">
              A taste of the styles you can reach for — anime, cinematic,
              charcoal, cubist, and everything in between.
            </p>
          </div>
          <Link
            to="/explore"
            className="hidden text-[13.5px] font-semibold text-[var(--accent-text)] hover:underline md:inline"
          >
            Explore all →
          </Link>
        </div>
        <div className="columns-2 gap-4 [column-fill:_balance] md:columns-4">
          {/* Mix the 5 hero showcase images with 7 style-preset samples so
              every visible tile is unique and the grid spans a wide variety
              of styles. Ordered to avoid neighbour-matching tones. */}
          {[
            HERO_IMAGES[0],
            GALLERY_EXTRAS[0], // cinematic
            HERO_IMAGES[2], // stargate
            GALLERY_EXTRAS[1], // anime
            GALLERY_EXTRAS[2], // charcoal
            HERO_IMAGES[3], // pirate ship
            GALLERY_EXTRAS[3], // cubist
            HERO_IMAGES[1], // brooklyn bridge
            GALLERY_EXTRAS[4], // candy
            HERO_IMAGES[4], // space station
            GALLERY_EXTRAS[5], // cosmic
            GALLERY_EXTRAS[6], // abstract-curves
          ].map((img, i) => (
            <div
              key={`${img.src}-${i}`}
              className="mb-4 break-inside-avoid overflow-hidden rounded-md border border-[var(--border)]"
            >
              <ArtTile src={img.src} radius="" alt={img.alt} />
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="lp-pricing" className="bg-surface-1 py-20">
        <div className="mx-auto w-full max-w-[1280px] px-4 md:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-[36px] font-bold tracking-[-0.025em] md:text-[44px]">
              Pay once, generate anything
            </h2>
            <p className="mx-auto mt-3 max-w-[520px] text-[15px] text-fg-muted">
              Buy a credit pack, use any model. No subscription — credits never
              expire.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {PRICING.map((tier) => (
              <div
                key={tier.name}
                className={cn(
                  "relative flex flex-col gap-4 rounded-lg border p-6",
                  tier.featured
                    ? "border-[var(--accent)] bg-surface-1 shadow-glow"
                    : "border-[var(--border)] bg-surface-2",
                )}
              >
                {tier.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge tone="accent">Popular</Badge>
                  </span>
                )}
                <div>
                  <div className="text-[15px] font-semibold text-fg">
                    {tier.name}
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="mono text-[44px] font-bold leading-none tracking-[-0.02em] text-fg">
                      {tier.price}
                    </span>
                    <span className="text-[14px] text-fg-subtle">
                      {tier.cadence}
                    </span>
                  </div>
                  <p className="mt-2 text-[13px] text-fg-muted">
                    {tier.description}
                  </p>
                </div>
                <ul className="flex flex-col gap-2 text-[13.5px]">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-fg">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/checkout" className="mt-auto">
                  <Button
                    variant={tier.featured ? "primary" : "outline"}
                    size="md"
                    className="w-full"
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto w-full max-w-[1280px] px-4 py-20 md:px-8">
        <div
          className="relative overflow-hidden rounded-2xl px-8 py-16 text-center md:px-16 md:py-24"
          style={{
            background:
              "linear-gradient(120deg, var(--accent) 0%, rgba(255,90,180,0.85) 55%, rgba(255,170,90,0.85) 100%)",
          }}
        >
          <h2 className="mx-auto max-w-[640px] text-[34px] font-bold tracking-[-0.025em] text-white md:text-[44px]">
            Make something nobody&apos;s ever seen.
          </h2>
          <p className="mx-auto mt-3 max-w-[520px] text-[15px] text-white/85">
            Get 50 free credits when you join. Try every model. No credit card.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/create">
              <Button variant="secondary" size="lg">
                Start creating
              </Button>
            </Link>
            <Link to="/explore">
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                Browse community
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-surface-1">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-between gap-6 px-4 py-10 md:flex-row md:px-8">
          <div className="flex items-center gap-2 text-[13.5px] text-fg-muted">
            <div className="h-6 w-6">
              <PixelStudioIcon />
            </div>
            © {new Date().getFullYear()} Pixel Studio
          </div>
          <div className="flex flex-wrap gap-5 text-[13px] text-fg-muted">
            <Link to="/explore">Explore</Link>
            <Link to="/whats-new">What&apos;s new</Link>
            <Link to="/checkout">Pricing</Link>
            <a href="https://github.com" className="hover:text-fg">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FloatTile({
  image,
  style,
  delay,
}: {
  image: { src: string; alt: string };
  style: React.CSSProperties;
  delay: number;
}) {
  return (
    <div
      className="absolute overflow-hidden rounded-lg border border-border-strong shadow-lg"
      style={{
        ...style,
        animation: `ps-float 7s ease-in-out ${delay}s infinite`,
      }}
    >
      <ArtTile src={image.src} radius="" alt={image.alt} priority fill />
    </div>
  );
}
