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
};

export default nextConfig;
