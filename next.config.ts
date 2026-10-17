import type {NextConfig} from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    return [{
      source: "/images/:path*",
      has: [{type: "query", key: "v", value: "[a-f0-9]{12}"}],
      headers: [{key: "Cache-Control", value: "public, max-age=31536000, immutable"}],
    }];
  },
  async redirects() {
    return [
      {"source":"/catalog/balka/balka-25s1x12000-gost-27772-s255-tm","destination":"/catalog/balka/balka-shirokopolochnaya/balka-shirokopolochnaya#variant-local-122247","permanent":true},
      {"source":"/catalog/balka/balka-30s1x12000-gost-27772-s255-tm","destination":"/catalog/balka/balka-shirokopolochnaya/balka-shirokopolochnaya#variant-local-115982","permanent":true},
      {"source":"/catalog/balka/balka-20k1x12000-gost-27772-s255-tm","destination":"/catalog/balka/balka-kolonnaya/balka-kolonnaya#variant-local-11123500","permanent":true},
      {"source":"/catalog/balka/balka-30k2x12000-gost-27772-s255-tm","destination":"/catalog/balka/balka-kolonnaya/balka-kolonnaya#variant-local-122249","permanent":true},
      {"source":"/catalog/balka/balka-40s2x12000-gost-27772-s255-tm","destination":"/catalog/balka/balka-shirokopolochnaya/balka-shirokopolochnaya#variant-local-118168","permanent":true},
      {"source":"/catalog/balka/balka-20s2x12000-gost-35087-27772-s255-tm","destination":"/catalog/balka/balka-shirokopolochnaya/balka-shirokopolochnaya#variant-local-73573","permanent":true},
      {source: "/catalog/balka/balka-20b1x12000-gost-27772-s255-tm", destination: "/catalog/balka/balka-normalnaya/balka-normalnaya#variant-local-122248", permanent: true},
      {source: "/catalog/balka/balka", destination: "/catalog/balka", permanent: true},
      {source: "/catalog/balka/balka/balka", destination: "/catalog/balka", permanent: true},
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1440, 1920, 2048, 3840],
    imageSizes: [32, 48, 64, 96, 128, 256, 320, 384, 480],
    localPatterns: [
      {pathname: "/images/hero/**"},
      {pathname: "/images/catalog/**"},
      {pathname: "/**", search: ""},
    ],
  },
};

export default nextConfig;
