import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Dev only: let a phone on the same private network load the dev server's
  // scripts (http://<mac-ip>:3000 or http://<mac-name>.local:3000). Without
  // this, Next blocks them and the page renders but nothing is interactive.
  // Has no effect on `next build` / `next start`.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
  // The floating dev badge sits over the bottom tab bar on phones and swallows taps.
  // Compile/runtime errors are still shown when this is off.
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
