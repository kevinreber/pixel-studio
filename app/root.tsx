import React from "react";
import { captureRemixErrorBoundaryError } from "@sentry/remix";
import {
  json,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useRouteError,
} from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/node";
import { Analytics } from "@vercel/analytics/react";
import { Toaster, toast as showToast } from "sonner";
import NavigationSidebar from "components/NavigationSidebar";
import { csrf } from "./utils/csrf.server";
import { getEnv } from "./utils/env.server";
import { combineHeaders } from "./utils/combineHeaders";
import { AuthenticityTokenProvider } from "remix-utils/csrf/react";
import { HoneypotProvider } from "remix-utils/honeypot/react";
import { honeypot } from "utils/honeypot.server";
import { getToast, type Toast } from "utils/toast.server";
import {
  sessionStorage,
  getSessionCookie,
  authenticator,
  getGoogleSessionAuth,
  USER_ID_KEY,
} from "./services";

import "./tailwind.css";
import "./globals.css";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request);

  const sessionAuth = await getGoogleSessionAuth(request);
  if (sessionAuth) {
    const cookieSession = await getSessionCookie(request);
    cookieSession.set(USER_ID_KEY, sessionAuth.id);
    await sessionStorage.commitSession(cookieSession);
  }

  const [csrfToken, csrfCookieHeader] = await csrf.commitToken(request);
  const honeyProps = honeypot.getInputProps();

  const { toast, headers: toastHeaders } = await getToast(request);

  return json(
    {
      user,
      toast,
      ENV: getEnv(),
      csrfToken,
      honeyProps,
      domainUrl: process.env.ORIGIN || "",
    },
    {
      headers: combineHeaders(
        csrfCookieHeader ? { "set-cookie": csrfCookieHeader } : null,
        toastHeaders
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
        <Toaster closeButton position="top-center" />
        <ScrollRestoration />
        <Scripts />
        <Analytics />
      </body>
    </html>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const loaderData = useLoaderData<typeof loader>();
  console.log(loaderData);
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <>
      {/* <Document env={loaderData.ENV}> */}
      <Document>
        {!isHome && <NavigationSidebar />} {children}
        {loaderData && loaderData.toast ? (
          <ShowToast toast={loaderData.toast} />
        ) : null}
      </Document>
    </>
  );
}

export default function App() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <HoneypotProvider {...loaderData.honeyProps}>
      <AuthenticityTokenProvider token={loaderData.csrfToken}>
        <Outlet context={{ user: loaderData.user }} />
      </AuthenticityTokenProvider>
    </HoneypotProvider>
  );
}

function ShowToast({ toast }: { toast: Toast }) {
  const { id, type, title, description } = toast;
  React.useEffect(() => {
    setTimeout(() => {
      showToast[type](title, { id, description });
    }, 0);
  }, [description, id, title, type]);
  return null;
}

export const ErrorBoundary = () => {
  const error = useRouteError();
  captureRemixErrorBoundaryError(error);
  return <div>Something went wrong</div>;
};
