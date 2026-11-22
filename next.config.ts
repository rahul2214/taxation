import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  compress: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    // Private app areas: their layouts are client components and can't export metadata, so
    // without this they render the homepage's title with "index, follow". The header keeps
    // them out of search results (robots.txt lets crawlers fetch them so they can see it).
    const noIndex = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];
    return [
      { source: '/admin', headers: noIndex },
      { source: '/admin/:path*', headers: noIndex },
      { source: '/dashboard', headers: noIndex },
      { source: '/dashboard/:path*', headers: noIndex },
      { source: '/auth/:path*', headers: noIndex },
      {
        // Cache images and fonts
        source: '/:path*.(svg|jpg|jpeg|png|webp|ico|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        // Ensure upload and dynamic API endpoints are not cached by intermediate proxies
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

