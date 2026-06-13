/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["unpdf"],
  },
  async redirects() {
    return [
      { source: "/analyze", destination: "/app/analyze", permanent: true },
      { source: "/workspaces", destination: "/app/workspaces", permanent: true },
      { source: "/workspaces/:id", destination: "/app/workspaces/:id", permanent: true },
      { source: "/answer", destination: "/app/answer", permanent: true },
      { source: "/bulk", destination: "/app/bulk", permanent: true },
    ];
  },
};

export default nextConfig;
