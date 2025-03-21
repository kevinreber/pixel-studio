import React from "react";
import {
  json,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  // useRouteLoaderData,
} from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/node";
import { Analytics } from "@vercel/analytics/react";
// import { Toaster, toast as showToast } from "sonner";
import { Toaster } from "@/components/ui/toaster";
import NavigationSidebar from "components/NavigationSidebar";
import { csrf } from "./utils/csrf.server";
import { getEnv } from "./utils/env.server";
import { combineHeaders } from "./utils/combineHeaders";
import { AuthenticityTokenProvider } from "remix-utils/csrf/react";
import { HoneypotProvider } from "remix-utils/honeypot/react";
import { honeypot } from "utils/honeypot.server";
// import { getToast, type Toast } from "utils/toast.server";
import { getLoggedInUserGoogleSSOData } from "./server";
import { GeneralErrorBoundary } from "./components/GeneralErrorBoundary";
import {
  // sessionStorage,
  // getSessionCookie,
  // authenticator,
  getGoogleSessionAuth,
  // USER_ID_KEY,
} from "./services";
import "./tailwind.css";
import "./globals.css";

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
    userData = await getLoggedInUserGoogleSSOData(sessionAuth);
  }

  // console.log("userData in root loader:", userData);

  return json(
    {
      userData,
      // toast,
      ENV: getEnv(),
      csrfToken,
      honeyProps,
      domainUrl: process.env.ORIGIN || "",
      supabaseBaseUrl: process.env.DATABASE_BASE_URL || "",
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

function Document({
  children,
}: // env,
{
  children: React.ReactNode;
  // env?: Record<string, string>;
}) {
  return (
    <html lang="en" className="dark h-full overflow-x-hidden">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Pixel Studio AI</title>
        <meta property="og:title" content="Pixel Studio AI" />
        <meta
          name="description"
          content="Generate images with the power of AI"
        />
        <Meta />
        <Links />
        {/* Google Analytics Script */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-2TQ0PM7CJ4"
        ></script>
        <script
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
      <body>
        {children}
        {/* <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(env)}`,
          }}
        /> */}
        {/* <Toaster closeButton position="top-center" /> */}
        <ScrollRestoration />
        <Scripts />
        <Analytics />
      </body>
    </html>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  // const loaderData = useRouteLoaderData<typeof loader>("root");
  // console.log(loaderData);
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <>
      {/* <Document env={loaderData.ENV}> */}
      <Document>
        {!isHome && <NavigationSidebar />} {children}
        {/* {loaderData && loaderData.toast ? (
          <ShowToast toast={loaderData.toast} />
        ) : null} */}
      </Document>
    </>
  );
}

export default function App() {
  const loaderData = useLoaderData<typeof loader>();
  console.log("loaderData in root:", loaderData.supabaseBaseUrl);

  return (
    <HoneypotProvider {...loaderData.honeyProps}>
      <AuthenticityTokenProvider token={loaderData.csrfToken}>
        <Outlet context={{ userData: loaderData.userData }} />
        <Toaster />
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
