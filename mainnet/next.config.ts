import type { NextConfig } from "next";

const SITE_HOST = "alabaamafi.xyz";
const APP_HOST = "app.alabaamafi.xyz";
const DOCS_HOST = "docs.alabaamafi.xyz";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", has: [{ type: "host", value: DOCS_HOST }], destination: "/docs-site" },
        { source: "/docs-site", has: [{ type: "host", value: APP_HOST }], destination: "/page-not-found" },
        { source: "/docs-site", has: [{ type: "host", value: SITE_HOST }], destination: "/page-not-found" },
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
      {
        source: "/:page(send|swap|bridge|activity|faq)",
        has: [{ type: "host", value: SITE_HOST }],
        destination: `https://${APP_HOST}/:page`,
        permanent: false,
      },
      { source: "/", has: [{ type: "host", value: APP_HOST }], destination: `https://${SITE_HOST}`, permanent: false },
    ];
  },
};

export default nextConfig;
