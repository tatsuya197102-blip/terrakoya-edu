import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'standalone',
  // firebase-admin はネイティブ依存とgrpcを含むため、Next のサーバーバンドルに
  // 取り込ませず Node の require に任せる。これを付けないと API ルートで
  // import が解決できず、上限チェックが無効化される(2026-08-05)。
  serverExternalPackages: ['firebase-admin', 'google-auth-library'],
};

export default nextConfig;
