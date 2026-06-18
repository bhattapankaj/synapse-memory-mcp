/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "better-sqlite3",
    "sqlite-vec",
    "@huggingface/transformers",
  ],
  // sqlite-vec loads its native binary via a runtime-computed dynamic import,
  // which the bundler cannot trace. Force the platform packages into the
  // serverless function output so the .so is present at runtime (e.g. Vercel).
  outputFileTracingIncludes: {
    "/**": [
      "./node_modules/sqlite-vec-linux-x64/**",
      "./node_modules/sqlite-vec-linux-arm64/**",
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
