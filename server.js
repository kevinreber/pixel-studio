/* eslint-disable no-undef */
import './instrumentation.server.mjs';
import { createRequestHandler } from "@remix-run/express";
import express from "express";
import { prisma } from "./services/prisma.server";
// import * as build from "./build/server/index.js";

// notice that the result of `remix vite:build` is "just a module"

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? null
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        })
      );

const app = express();

app.use(
  viteDevServer ? viteDevServer.middlewares : express.static("build/client")
);

// const build = viteDevServer
//   ? () =>
//       viteDevServer.ssrLoadModule(
//         "virtual:remix/server-build"
//       )
//   : await import("./build/server/index.js");

// and your app is "just a request handler"
// app.all("*", createRequestHandler({ build }));

const getBuild = viteDevServer
  ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
  : await import("./build/server/index.js");

app.all(
  "*",
  createRequestHandler({
    build: await getBuild(),
    getLoadContext() {
      return { prisma }; // Pass Prisma client into Remix context
    },
  })
);

app.listen(3000, () => {
  console.log("App listening on http://localhost:3000");
});
