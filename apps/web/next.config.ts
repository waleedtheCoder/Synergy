import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  org: "synergi-0x",
  project: "synergi-web",
  silent: true,
  webpack: {
    treeshake: { removeDebugLogging: true },
  },
});
