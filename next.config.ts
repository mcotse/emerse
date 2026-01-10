import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Use webpack in development to support Serwist
  // Turbopack doesn't yet fully support all webpack plugins
  turbopack: {},
};

export default withSerwist(nextConfig);
