import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: "501mb",
    serverActions: {
      bodySizeLimit: "501mb",
    },
  },
};

export default nextConfig;
