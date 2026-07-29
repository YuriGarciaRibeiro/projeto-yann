import type { NextConfig } from "next";

const backendPublicUrl = new URL(process.env.BACKEND_PUBLIC_URL ?? "http://localhost:8000");
const mediaPublicUrl = new URL(
  process.env.BACKEND_S3_PUBLIC_BASE_URL
    ?? process.env.S3_PUBLIC_BASE_URL
    ?? "http://localhost:9000/architecture-portfolio",
);

function remotePatternFromUrl(url: URL) {
  return {
    hostname: url.hostname,
    pathname: `${url.pathname.replace(/\/+$/, "") || ""}/**`,
    port: url.port,
    protocol: url.protocol.replace(":", "") as "http" | "https",
  };
}

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.3.40"],
  images: {
    remotePatterns: [
      remotePatternFromUrl(backendPublicUrl),
      remotePatternFromUrl(mediaPublicUrl),
    ],
  },
};

export default nextConfig;
