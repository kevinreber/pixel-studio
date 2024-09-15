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
import {
  LoaderFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
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
import { rootAuthLoader } from "@clerk/remix/ssr.server";
import { ClerkApp } from "@clerk/remix";

import "./tailwind.css";
import "./globals.css";

export const meta: MetaFunction = () => [
  {
    charset: "utf-8",
    title: "Pixel Studio AI",
    viewport: "width=device-width,initial-scale=1",
    property: "og:title",
    content: "Pixel Studio AI",
  },
];

// export async function loader({ request }: LoaderFunctionArgs) {
export const loader: LoaderFunction = (args) => {
  return rootAuthLoader(args, async ({ request }) => {
    const [csrfToken, csrfCookieHeader] = await csrf.commitToken(request);
    const honeyProps = honeypot.getInputProps();
    const users = (await prisma.user.findMany()) || [];

    const { toast, headers: toastHeaders } = await getToast(request);

    return json(
      {
        // username: os.userInfo().username,
        // theme: getTheme(request),
        users: users.length,
        toast,
        ENV: getEnv(),
        csrfToken,
        honeyProps,
      },
      {
        headers: combineHeaders(
          csrfCookieHeader ? { "set-cookie": csrfCookieHeader } : null,
          toastHeaders
        ),
      }
    );
  });
};

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
        <meta
          name="description"
          content="Generate images with the power of AI"
        />
        <Meta />
        <Links />
      </head>
      {/* <body className="dark"> */}
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
      </body>
    </html>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader>();
  // console.log(data);
  // const location = useLocation();
  // const isHome = location.pathname === "/";

  return (
    <>
      <Document
      // env={data.ENV}
      >
        {children}
        {data && data.toast ? <ShowToast toast={data.toast} /> : null}
      </Document>
    </>
  );
}

function App() {
  const data = useLoaderData<typeof loader>();
  const location = useLocation();
  const isHome = location.pathname === "/";
  return (
    <HoneypotProvider {...data.honeyProps}>
      <AuthenticityTokenProvider token={data.csrfToken}>
        {!isHome && <NavigationSidebar />}
        <Outlet />
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

export default ClerkApp(App);
