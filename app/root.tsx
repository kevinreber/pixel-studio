import { captureRemixErrorBoundaryError } from "@sentry/remix";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useRouteError,
} from "@remix-run/react";
import "./tailwind.css";
import { prisma } from "./services/prisma.server";
import NavigationSidebar from "./components/NavigationSidebar";
// import { LoaderFunctionArgs } from "@remix-run/node";

import "./globals.css";

export const loader = async () => {
  const users = (await prisma.user.findMany()) || [];
  return { users: users.length };
};

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData();
  console.log(data);
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="dark">
        {!isHome && <NavigationSidebar />} {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export const ErrorBoundary = () => {
  const error = useRouteError();
  captureRemixErrorBoundaryError(error);
  return <div>Something went wrong</div>;
};

export default function App() {
  return <Outlet />;
}
