import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/api/blob",
      },
      { pathname: "/**" },
    ],
  },
};

export default nextConfig;
