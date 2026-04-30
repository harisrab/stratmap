import type { NextConfig } from "next";
import os from "node:os";

function getAllowedDevOrigins() {
  const hosts = new Set(["localhost", "127.0.0.1"]);

  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4") {
        hosts.add(entry.address);
      }
    }
  }

  return [...hosts];
}

const nextConfig: NextConfig = {
  allowedDevOrigins: getAllowedDevOrigins(),
  devIndicators: false,
  transpilePackages: ["mapbox-gl"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
