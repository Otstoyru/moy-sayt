import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Отдаём фото с Ozon как есть, без прогона через Vercel Image Optimization —
    // у 300+ товаров это быстро упирается в бесплатный лимит оптимизации
    // (402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED), а Ozon и так отдаёт сжатые фото.
    unoptimized: true,
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
