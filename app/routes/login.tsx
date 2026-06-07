import { Sparkles, Shield } from "lucide-react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  Form,
  json,
  useNavigation,
  useSearchParams,
  type MetaFunction,
} from "@remix-run/react";
import PixelStudioIcon from "components/PixelStudioIcon";
import { Avatar, Badge, ThemeToggle } from "components/ps";
import { GeneralErrorBoundary } from "~/components";
import { cn } from "@/lib/utils";
import { requireAnonymous } from "~/services";

export const meta: MetaFunction = () => {
  return [{ title: "Login to Pixel Studio AI" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAnonymous(request);
  return json({});
}

const SHOWCASE_TILES = [
  {
    src: "/assets/login/art-04.jpg",
    style: {
      width: 176,
      height: 240,
      top: "16%",
      left: "20%",
      zIndex: 3,
    },
    delay: "0.2s",
    duration: "7.4s",
  },
  {
    src: "/assets/login/art-11.jpg",
    style: {
      width: 160,
      height: 214,
      top: "8%",
      left: "54%",
      zIndex: 2,
    },
    delay: "1.3s",
    duration: "8.6s",
  },
  {
    src: "/assets/login/art-19.jpg",
    style: {
      width: 168,
      height: 232,
      top: "44%",
      left: "13%",
      zIndex: 2,
    },
    delay: "0.7s",
    duration: "7.9s",
  },
  {
    src: "/assets/login/art-23.jpg",
    style: {
      width: 182,
      height: 248,
      top: "40%",
      left: "48%",
      zIndex: 3,
    },
    delay: "1.8s",
    duration: "9.1s",
  },
] as const;

const TRUST_AVATARS = ["novarte", "pogiboyz", "studioK", "paelma"];

function GoogleG({ size = 19 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function LogoMark({ size = 34 }: { size?: number }) {
  // Matches the brand mark used in the AppShell sidebar — the project's real
  // logo at the chosen size, no gradient tile (per the handoff guidance to
  // "use the app's real logo asset if one exists").
  return (
    <div className="flex-shrink-0" style={{ width: size, height: size }}>
      <PixelStudioIcon />
    </div>
  );
}

export default function LoginRoute() {
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "";

  const isSubmitting =
    navigation.state === "submitting" &&
    navigation.formAction === "/auth/v2/google";

  return (
    <div className="grid min-h-full grid-cols-1 bg-bg min-[881px]:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* Theme toggle — fixed top-right */}
      <div className="fixed right-6 top-[22px] z-50">
        <ThemeToggle />
      </div>

      {/* ============ LEFT — brand showcase ============ */}
      <div
        className={cn(
          "login-showcase",
          "relative overflow-hidden border-r border-[var(--border)]",
          "hidden min-[881px]:block",
        )}
      >
        {/* ambient gradients */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(700px 540px at 30% 12%, var(--accent-soft), transparent 62%), radial-gradient(620px 520px at 82% 88%, var(--accent-soft-2), transparent 66%)",
          }}
        />
        {/* grid overlay */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-45"
          style={{
            backgroundImage:
              "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage:
              "radial-gradient(120% 110% at 35% 25%, #000 30%, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(120% 110% at 35% 25%, #000 30%, transparent 78%)",
          }}
        />

        {/* floating art collage */}
        <div className="absolute inset-0" style={{ zIndex: 1 }}>
          <div
            aria-hidden
            className="absolute"
            style={{
              top: "34%",
              left: "46%",
              width: 360,
              height: 360,
              transform: "translate(-50%,-50%)",
              background:
                "radial-gradient(50% 50% at 50% 50%, var(--accent-glow), transparent 70%)",
              filter: "blur(38px)",
              opacity: 0.6,
            }}
          />
          {SHOWCASE_TILES.map((tile) => (
            <div
              key={tile.src}
              className="absolute overflow-hidden rounded-lg border border-strong shadow-lg"
              style={{
                ...tile.style,
                animation: `ps-float ${tile.duration} ease-in-out ${tile.delay} infinite`,
              }}
            >
              <img
                src={tile.src}
                alt=""
                className="block h-full w-full object-cover"
                loading="eager"
              />
            </div>
          ))}
        </div>

        {/* top brand row */}
        <div
          className="relative flex items-center gap-3"
          style={{ zIndex: 4, padding: "34px 40px" }}
        >
          <LogoMark size={32} />
          <span className="text-[18px] font-bold tracking-tight">
            Pixel Studio
          </span>
        </div>

        {/* scrim — guarantees legibility over tiles */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{
            zIndex: 3,
            height: 320,
            background:
              "linear-gradient(to top, var(--bg) 18%, transparent)",
          }}
        />

        {/* bottom copy block */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{ zIndex: 5, padding: "0 48px 44px" }}
        >
          <div className="anim-fade-up">
            <Badge
              tone="accent"
              icon={<Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />}
              className="whitespace-nowrap px-3 py-[5px] text-[12.5px]"
            >
              1.9M creations and counting
            </Badge>
          </div>

          <h2
            className="anim-fade-up m-0 mt-[18px] font-extrabold"
            style={{
              animationDelay: "60ms",
              fontSize: "clamp(26px, 3vw, 38px)",
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
              maxWidth: 460,
            }}
          >
            Where a sentence
            <br />
            becomes a&nbsp;
            <span
              style={{
                background:
                  "linear-gradient(100deg, var(--accent), #c4a3ff 60%, #ff9ad1)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              masterpiece.
            </span>
          </h2>

          <div
            className="anim-fade-up mt-[22px] flex items-center gap-[13px]"
            style={{ animationDelay: "130ms" }}
          >
            <div className="flex">
              {TRUST_AVATARS.map((name, i) => (
                <div
                  key={name}
                  className="rounded-full"
                  style={{
                    marginLeft: i ? -10 : 0,
                    border: "2px solid var(--bg)",
                  }}
                >
                  <Avatar name={name} size={30} />
                </div>
              ))}
            </div>
            <div className="text-[13.5px] text-fg-muted">
              <strong className="text-fg">12,000+</strong> creators joined
              this week
            </div>
          </div>
        </div>
      </div>

      {/* ============ RIGHT — sign-in ============ */}
      <div className="relative grid place-items-center px-7 py-10">
        <div
          className="anim-fade-up w-full"
          style={{ maxWidth: 392 }}
        >
          {/* compact brand mark — mobile only */}
          <div className="mb-[30px] flex items-center gap-[11px] min-[881px]:hidden">
            <LogoMark size={34} />
            <span className="text-[19px] font-bold tracking-tight">
              Pixel Studio
            </span>
          </div>

          <h1
            className="m-0 font-bold"
            style={{
              fontSize: 30,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              color: "var(--fg)",
            }}
          >
            Welcome to Pixel Studio
          </h1>
          <p
            className="mt-[9px] text-[15px] leading-[1.55] text-fg-muted"
            style={{ margin: "9px 0 0" }}
          >
            Sign in or create your account with Google to start creating.
          </p>

          {/* Google OAuth — primary CTA */}
          <Form method="post" action="/auth/v2/google" className="mt-[30px]">
            <input type="hidden" name="intent" value="user-log-in" />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "focusable flex w-full items-center justify-center gap-[11px]",
                "rounded-md border border-strong bg-surface-2 text-fg",
                "text-[15px] font-semibold",
                "transition-[background-color,border-color,transform] duration-150",
                "hover:bg-surface-hover hover:border-fg-faint",
                "disabled:cursor-default disabled:hover:bg-surface-2 disabled:hover:border-strong",
              )}
              style={{ height: 50, fontFamily: "var(--font-sans)" }}
            >
              {isSubmitting ? (
                <span
                  aria-hidden
                  className="inline-block"
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: "2px solid var(--fg-faint)",
                    borderTopColor: "var(--fg)",
                    animation: "ps-spin .7s linear infinite",
                  }}
                />
              ) : (
                <GoogleG size={19} />
              )}
              <span className="whitespace-nowrap">
                {isSubmitting ? "Signing in…" : "Continue with Google"}
              </span>
            </button>
          </Form>

          <p className="mt-4 text-center text-[12.5px] leading-[1.5] text-fg-subtle">
            New accounts are created automatically on your first sign-in.
          </p>

          {/* footer trust row */}
          <div className="mt-[30px] flex items-center justify-center gap-2 border-t border-[var(--border)] pt-[22px]">
            <Shield
              className="h-[15px] w-[15px] text-fg-subtle"
              strokeWidth={2}
            />
            <span className="text-[13px] text-fg-muted">
              Secure sign-in, powered by Google
            </span>
          </div>
        </div>

        {/* fine print — pinned to viewport bottom */}
        <div
          className="absolute inset-x-0 text-center text-[12px] text-fg-faint"
          style={{ bottom: 22, padding: "0 24px" }}
        >
          By continuing you agree to our{" "}
          <a
            href="/terms"
            className="text-fg-subtle no-underline hover:text-fg-muted"
          >
            Terms
          </a>{" "}
          &amp;{" "}
          <a
            href="/privacy"
            className="text-fg-subtle no-underline hover:text-fg-muted"
          >
            Privacy Policy
          </a>
          .
        </div>
      </div>
    </div>
  );
}

export const ErrorBoundary = () => {
  return (
    <div className="grid min-h-full place-items-center p-6">
      <GeneralErrorBoundary />
    </div>
  );
};
