import type {NextConfig} from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    localPatterns: [
      {pathname: "/images/hero/**"},
      {pathname: "/images/catalog/**"},
      {pathname: "/**", search: ""},
    ],
  },
};

export default nextConfig;
