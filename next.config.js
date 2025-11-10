/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'socialos.orincore.com']
    },
    // Add compatibility flags for Next.js 16
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  images: {
    // Use remotePatterns instead of domains (deprecated in Next.js 16)
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Suppress hydration warnings caused by browser extensions
  reactStrictMode: true,
  // swcMinify is now default in Next.js 16, removed deprecated option
  
  // Empty turbopack config to silence webpack migration warning
  // Turbopack is default in Next.js 16
  turbopack: {},
  
  // Add output configuration for better compatibility
  output: 'standalone',
}

module.exports = nextConfig
