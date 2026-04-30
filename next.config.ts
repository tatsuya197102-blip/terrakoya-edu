import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  staticPageGenerationTimeout: 1000,
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;