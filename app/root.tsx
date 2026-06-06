import React, { useEffect, useRef } from "react";
import {
  json,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  ShouldRevalidateFunctionArgs,
  useRouteLoaderData,
} from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/node";
import { Analytics } from "@vercel/analytics/react";
import posthog from "posthog-js";
// import { Toaster, toast as showToast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "components/ps";
import { isUserAdmin, type UserWithRoles } from "~/utils/isAdmin";
import { csrf } from "./utils/csrf.server";
import { getEnv } from "./utils/env.server";
import { combineHeaders } from "./utils/combineHeaders";
import { AuthenticityTokenProvider } from "remix-utils/csrf/react";
import { HoneypotProvider } from "remix-utils/honeypot/react";
import { honeypot } from "utils/honeypot.server";
import { GenerationProgressProvider } from "~/contexts/GenerationProgressContext";
// import { getToast, type Toast } from "utils/toast.server";
import { getLoggedInUserData } from "./server";
import { GeneralErrorBoundary } from "./components/GeneralErrorBoundary";
import { claimDailyBonus } from "~/services/loginStreak.server";
import { checkAndUnlockAchievements } from "~/services/achievements.server";
import { cacheGet, cacheSet, getCachedDataWithRevalidate } from "~/utils/cache.server";
import {
  // sessionStorage,
  // getSessionCookie,
  // authenticator,
  getGoogleSessionAuth,
  // USER_ID_KEY,
} from "./services";
import "./tailwind.css";
import "./globals.css";

// Prevent revalidation after fetcher actions (like follow/unfollow)
// The UI handles optimistic updates, so we don't need to refetch all data
export const shouldRevalidate = ({
  formAction,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) => {
  // Don't revalidate after follow/unfollow actions - UI handles optimistic updates
  if (formAction?.includes("/follow")) {
    return false;
  }
  return defaultShouldRevalidate;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const [csrfToken, csrfCookieHeader] = await csrf.commitToken(request);
  const honeyProps = honeypot.getInputProps();

  // const { toast, headers: toastHeaders } = await getToast(request);

  // let user;
  // try {
  //   const session = await getSession(request.headers.get("Cookie"));
  //   console.log("session cookies: ", session.data);

  //   // user = await authenticator.isAuthenticated(request);
  // } catch (error) {
  //   console.error("Authentication error:", error);
  //   throw error;
  // }

  let userData;
  const sessionAuth = await getGoogleSessionAuth(request);
  if (sessionAuth) {
    const cacheKey = `user-login:${sessionAuth.id}`;
    userData = await getCachedDataWithRevalidate(cacheKey, () =>
      getLoggedInUserData(sessionAuth)
    );

    // Track daily login streak (fire-and-forget, don't block page load)
    // Use a cache flag to avoid running the serializable transaction on every navigation
    if (userData?.id) {
      const streakCacheKey = `streak-claimed-today:${userData.id}`;
      cacheGet<string>(streakCacheKey)
        .then((cached) => {
          if (cached) return; // Already claimed today, skip
          return claimDailyBonus(userData!.id).then((result) => {
            // Cache for 1 hour to avoid repeated DB calls
            cacheSet(streakCacheKey, "true", 3600).catch(() => {});
            if (result.success && result.streakMilestone) {
              checkAndUnlockAchievements(userData!.id, "streak").catch(() => {});
            }
          });
        })
        .catch(() => {});
    }
  }

  // console.log("userData in root loader:", userData);

  return json(
    {
      userData: userData ?? null,
      // toast,
      ENV: getEnv(),
      csrfToken,
      honeyProps,
    },
    {
      headers: combineHeaders(
        csrfCookieHeader ? { "set-cookie": csrfCookieHeader } : null
        // toastHeaders
        // sessionCookieHeader
      ),
    }
  );
}

function getThemeClass(theme?: string | null): string {
  if (theme === "light") return "light";
  if (theme === "system") return ""; // Let the system preference apply
  return "dark"; // Default to dark
}

function getDataTheme(theme?: string | null): string | undefined {
  if (theme === "light") return "light";
  if (theme === "dark") return "dark";
  if (theme === "system") return undefined;
  return "dark";
}

function Document({
  children,
  env,
  theme,
}: {
  children: React.ReactNode;
  env?: Record<string, string | undefined>;
  theme?: string | null;
}) {
  const themeClass = getThemeClass(theme);
  const dataTheme = getDataTheme(theme);
  return (
    <html
      lang="en"
      className={`${themeClass} h-full overflow-x-hidden`.trim()}
      data-theme={dataTheme}
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {/* Onest (UI) + Geist Mono (numbers/stats) per redesign tokens */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Onest:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap"
        />
        {/* Default SEO tags - overridden by route-specific meta functions */}
        <title>Pixel Studio AI - Create Stunning AI Art & Videos</title>
        <meta
          name="description"
          content="Generate beautiful AI images and videos with DALL-E, Stable Diffusion, Flux, Runway, and more. Join our creative community of AI artists today."
        />
        {/* Default Open Graph tags */}
        <meta property="og:title" content="Pixel Studio AI - Create Stunning AI Art & Videos" />
        <meta
          property="og:description"
          content="Generate beautiful AI images and videos with DALL-E, Stable Diffusion, Flux, Runway, and more. Join our creative community of AI artists today."
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Pixel Studio AI" />
        <meta property="og:image" content="https://pixelstudio.ai/og-image.png" />
        <meta property="og:url" content="https://pixelstudio.ai" />
        <meta property="og:locale" content="en_US" />
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pixel Studio AI - Create Stunning AI Art & Videos" />
        <meta
          name="twitter:description"
          content="Generate beautiful AI images and videos with DALL-E, Stable Diffusion, Flux, Runway, and more."
        />
        <meta name="twitter:image" content="https://pixelstudio.ai/og-image.png" />
        {/* Additional SEO meta tags */}
        <meta name="theme-color" content="#000000" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://pixelstudio.ai" />
        {/* Handle "system" theme preference */}
        {themeClass === "" && (
          <script
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var d=document.documentElement;var sys=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';d.classList.add(sys);d.setAttribute('data-theme',sys);}catch(e){}})()`,
            }}
          />
        )}
        <Meta />
        <Links />
        {/* Google Analytics Script */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-2TQ0PM7CJ4"
        ></script>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-2TQ0PM7CJ4');
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        {children}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(env ?? {})}`,
          }}
        />
        <ScrollRestoration />
        <Scripts />
        <Analytics />
      </body>
    </html>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  // Use useRouteLoaderData instead of useLoaderData to avoid errors in ErrorBoundary
  // useRouteLoaderData returns undefined when data isn't available (e.g., during error rendering)
  const loaderData = useRouteLoaderData<typeof loader>("root");
  const location = useLocation();
  // Routes that intentionally render *without* the app shell:
  // landing (own marketing nav), login, processing splash.
  const path = location.pathname;
  const isBare =
    path === "/" || path.startsWith("/login") || path.startsWith("/auth");

  const userData = loaderData?.userData ?? null;
  const isAdmin = isUserAdmin(userData as UserWithRoles | null);
  const shellUser = userData
    ? {
        id: userData.id,
        name: userData.name ?? null,
        username: userData.username ?? null,
        image: userData.image ?? null,
        credits: (userData as { credits?: number }).credits ?? 0,
      }
    : null;

  return (
    <Document env={loaderData?.ENV} theme={userData?.theme}>
      {isBare ? (
        children
      ) : (
        <AppShell user={shellUser} isAdmin={isAdmin}>
          {children}
        </AppShell>
      )}
    </Document>
  );
}

/**
 * Identifies the current user in PostHog so client-side web events
 * are associated with the user's identity (email, name, etc.)
 * instead of showing as anonymous UUIDs.
 */
function usePostHogIdentify(userData: {
  id: string;
  email: string | null;
  name: string | null;
  username: string | null;
  image: string | null;
} | null) {
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!userData?.id) {
      // User logged out - reset was already handled by LogOutButton
      previousUserId.current = null;
      return;
    }

    // Skip if already identified this user
    if (previousUserId.current === userData.id) return;
    previousUserId.current = userData.id;

    try {
      posthog.identify(userData.id, {
        email: userData.email,
        name: userData.name,
        username: userData.username,
        avatar: userData.image,
      });
    } catch (error) {
      console.error("[Analytics] Failed to identify user in PostHog:", error);
    }
  }, [userData]);
}

export default function App() {
  const loaderData = useLoaderData<typeof loader>();

  usePostHogIdentify(loaderData.userData);

  return (
    <HoneypotProvider {...loaderData.honeyProps}>
      <AuthenticityTokenProvider token={loaderData.csrfToken}>
        <GenerationProgressProvider>
          <Outlet context={{ userData: loaderData.userData }} />
          <Toaster richColors position="top-right" />
        </GenerationProgressProvider>
      </AuthenticityTokenProvider>
    </HoneypotProvider>
  );
}

// function ShowToast({ toast }: { toast: Toast }) {
//   const { id, type, title, description } = toast;
//   React.useEffect(() => {
//     setTimeout(() => {
//       showToast[type](title, { id, description });
//     }, 0);
//   }, [description, id, title, type]);
//   return null;
// }

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
