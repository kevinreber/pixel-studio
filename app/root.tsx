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
import { Toaster, toast as showToast } from "sonner";
import { prisma } from "services/prisma.server";
import NavigationSidebar from "components/NavigationSidebar";
import { csrf } from "./utils/csrf.server";
import { getEnv } from "./utils/env.server";
import { combineHeaders } from "./utils/combineHeaders";
import { AuthenticityTokenProvider } from "remix-utils/csrf/react";
import { HoneypotProvider } from "remix-utils/honeypot/react";
import { honeypot } from "utils/honeypot.server";
import { getToast, type Toast } from "utils/toast.server";
import { getSupabaseEnv,  getSupabaseWithSessionAndHeaders } from "./services/supabase.server";
import { useSupabaseClient } from "./hooks/useSupabaseClient";

import "./tailwind.css";
import "./globals.css";

export async function loader({ request }: LoaderFunctionArgs) {
  const [csrfToken, csrfCookieHeader] = await csrf.commitToken(request);
  const honeyProps = honeypot.getInputProps();
  const users = (await prisma.user.findMany()) || [];

  const { toast, headers: toastHeaders } = await getToast(request);


  const { serverSession, headers: supabaseHeaders } = await getSupabaseWithSessionAndHeaders({
    request,
  });

  const { DATABASE_URL, DATABASE_ANON_KEY } = getSupabaseEnv()

  return json(
    {
      // username: os.userInfo().username,
      // theme: getTheme(request),
      users: users.length,
      toast,
      ENV: getEnv(),
      csrfToken,
      honeyProps,
      DATABASE_URL,
      DATABASE_ANON_KEY,
      serverSession,
      domainUrl: process.env.ORIGIN || '',
    },
    {
      headers: combineHeaders(
        csrfCookieHeader ? { "set-cookie": csrfCookieHeader } : null,
        toastHeaders, supabaseHeaders
      ),
    }
  );
}

function Document({
  children,
  env,
}: {
  children: React.ReactNode;
  env?: Record<string, string>;
}) {
  return (
    <html lang="en" className="dark h-full overflow-x-hidden">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      {/* <body className="dark"> */}
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(env)}`,
          }}
        />
        <Toaster closeButton position="top-center" />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader>();
  

console.log(data);
const location = useLocation();
const isHome = location.pathname === "/";

return (
  <>
      <Document>
      {/* <Document env={data.ENV}> */}
        {!isHome && <NavigationSidebar />} {children}
        {data && data.toast ? <ShowToast toast={data.toast} /> : null}
      </Document>
    </>
  );
}

export default function App() {
  const data = useLoaderData<typeof loader>();
  const {supabase} = useSupabaseClient(
  {
  env: {
    SUPABASE_URL: data.DATABASE_URL,
    SUPABASE_ANON_KEY: data.DATABASE_ANON_KEY,
  },
  serverSession: data.serverSession,
  })

  return (
    <HoneypotProvider {...data.honeyProps}>
      <AuthenticityTokenProvider token={data.csrfToken}>
        {/* <Outlet />; */}
        <Outlet context={{ supabase, domainUrl: data.domainUrl }} />
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
