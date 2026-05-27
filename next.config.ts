import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    VITE_SUI_PACKAGE_ID: process.env.VITE_SUI_PACKAGE_ID || '',
    VITE_SAFWAH_ESCROW_ID: process.env.VITE_SAFWAH_ESCROW_ID || '',
    VITE_MERCHANT_REGISTRY_ID: process.env.VITE_MERCHANT_REGISTRY_ID || '',
    VITE_USDC_MOCK_ADMIN_ID: process.env.VITE_USDC_MOCK_ADMIN_ID || '',
    VITE_WALRUS_PUBLISHER_URL: process.env.VITE_WALRUS_PUBLISHER_URL || '',
    VITE_WALRUS_AGGREGATOR_URL: process.env.VITE_WALRUS_AGGREGATOR_URL || '',
    VITE_ENOKI_PUBLIC_KEY: process.env.VITE_ENOKI_PUBLIC_KEY || '',
    VITE_GOOGLE_CLIENT_ID: process.env.VITE_GOOGLE_CLIENT_ID || '',
    VITE_SUI_NETWORK: process.env.VITE_SUI_NETWORK || '',
    VITE_BACKEND_URL: process.env.VITE_BACKEND_URL || '',
    VITE_SAFWAH_ADMIN_ID: process.env.VITE_SAFWAH_ADMIN_ID || '',
    VITE_SAFWAH_TREASURY_ID: process.env.VITE_SAFWAH_TREASURY_ID || '',
  }
};

export default nextConfig;
