const withPWA = require('next-pwa')({
  dest: 'public',
  register: false, // Disable automatic registration
  skipWaiting: true,
  disable: process.env.DISABLE_PWA === 'true',
  customWorkerDir: 'worker',
  fallbacks: {
    document: '/offline.html',
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // API configuration
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL 
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`
          : 'http://localhost:8000/api/:path*',
      },
    ];
  },
  
  // Image optimization
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: 'DarManager',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
};

module.exports = withPWA(nextConfig);
