import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // the Arena live preview serves the page from a *.e2b.app host — allow its
  // cross-origin access to dev-only resources (HMR websockets, stack frames)
  allowedDevOrigins: ["*.e2b.app", "e2b.app", "localhost", "127.0.0.1"],
  // native/heavy packages used only on the server — keep them out of
  // TurboPack/Edge bundling so they load from node_modules at runtime
  // (PGlite resolves its WASM from a real filesystem path; node-llama-cpp
  // loads native .node addons and shared libraries).
  serverExternalPackages: [
    "node-llama-cpp",
    "@node-llama-cpp/linux-x64",
    "@node-llama-cpp/linux-x64-vulkan",
    "@node-llama-cpp/linux-x64-cuda",
    "@node-llama-cpp/linux-x64-cuda-ext",
    "@electric-sql/pglite",
  ],
};

export default nextConfig;
