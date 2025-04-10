/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack: (config) => {
    // Removing `self: false` – not ideal and not needed here
    return config;
  },

  // NOTE: Set these via your Render dashboard instead (Env vars section)
  env: {
    NEXT_PUBLIC_CLERK_FRONTEND_API: process.env.NEXT_PUBLIC_CLERK_FRONTEND_API,
    CLERK_API_KEY: process.env.CLERK_API_KEY,
  },
};

export default nextConfig;
