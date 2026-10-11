const nextConfig = {
  output: "standalone",
  async rewrites() {
    const backend = (process.env.BACKEND_INTERNAL_URL || "http://localhost:8081").replace(/\/$/, "");
    return [{source: "/api/:path*", destination: `${backend}/api/:path*`}];
  },
};
export default nextConfig;
