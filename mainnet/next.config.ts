import type { NextConfig } from "next";

const APP_HOST = "app.alabaamafi.xyz";
const DOCS_HOST = "docs.alabaamafi.xyz";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", has: [{ type: "host", value: DOCS_HOST }], destination: "/docs-site" },
        { source: "/docs-site", has: [{ type: "host", value: APP_HOST }], destination: "/page-not-found" },
      ],
    };
  },

  async redirects() {
    return [
      { source: "/docs-site", has: [{ type: "host", value: DOCS_HOST }], destination: "/", permanent: false },
      {
        source: "/:page(send|swap|bridge|activity|faq)",
        has: [{ type: "host", value: DOCS_HOST }],
        destination: `https://${APP_HOST}/:page`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
