/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "xnrlzezteajvrhlq.public.blob.vercel-storage.com",
      },
    ],
  },
}

module.exports = nextConfig
