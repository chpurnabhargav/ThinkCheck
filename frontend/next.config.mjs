/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true, // Ensures compatibility with Next.js 15
  },
  webpack: (config) => {
    config.resolve.fallback = { self: false }; // Fixes `self is not defined`
    return config;
  },
  env: {
    NEXT_PUBLIC_CLERK_FRONTEND_API: process.env.NEXT_PUBLIC_CLERK_FRONTEND_API || '',
    CLERK_API_KEY: process.env.CLERK_API_KEY || '',
  },
};

export default nextConfig;
