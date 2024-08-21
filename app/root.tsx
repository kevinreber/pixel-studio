import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import "./tailwind.css";
import { prisma } from "./services/prisma.server";
// import { LoaderFunctionArgs } from "@remix-run/node";

export const loader = async () => {
  const users = await prisma.user.findMany();
  return users;
  // return { test: process.env.DATABASE_URL };
  return [];
};

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData();
  console.log(data);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
