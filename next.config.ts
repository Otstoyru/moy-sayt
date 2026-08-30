import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ir.ozone.ru",
      },
    ],
  },
  // PDF generation (счёт/прайс-лист) reads font files from disk at runtime —
  // make sure they're bundled into the serverless function.
  outputFileTracingIncludes: {
    "/api/**/*": ["./lib/fonts/**/*"],
  },
};

export default nextConfig;
