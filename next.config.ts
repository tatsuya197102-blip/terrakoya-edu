import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  staticPageGenerationTimeout: 1000,
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;