/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
        pathname: "**",
      },
    ],
    unoptimized: false,
    domains: ['via.placeholder.com', 'placehold.co', 'dummyimage.com'],
  },
};

export default nextConfig;
