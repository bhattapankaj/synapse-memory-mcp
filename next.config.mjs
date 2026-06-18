/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "better-sqlite3",
    "sqlite-vec",
    "@huggingface/transformers",
  ],
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
