import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env' });

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:4000/api';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  distDir: process.env.NEXT_DIST_DIR || '.next',
  turbopack: {
    root: process.cwd(),
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: apiBaseUrl,
  },
};

export default nextConfig;
