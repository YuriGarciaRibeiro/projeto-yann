import type { NextConfig } from "next";

const backendPublicUrl = new URL(process.env.BACKEND_PUBLIC_URL ?? "http://localhost:8000");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.3.40"],
  images: {
    remotePatterns: [
      {
        hostname: backendPublicUrl.hostname,
        pathname: "/**",
        port: backendPublicUrl.port,
        protocol: backendPublicUrl.protocol.replace(":", "") as "http" | "https",
      },
    ],
  },
};

export default nextConfig;
