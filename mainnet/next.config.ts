import type { NextConfig } from "next";

const SITE_HOST = "alabaamafi.xyz";
const APP_HOST = "app.alabaamafi.xyz";
const DOCS_HOST = "docs.alabaamafi.xyz";
const APP_PAGES = ["send", "swap", "bridge", "activity", "faq"];

const onHost = (value: string) => [{ type: "host" as const, value }];

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", has: onHost(DOCS_HOST), destination: "/docs-site" },
        { source: "/docs-site", has: onHost(APP_HOST), destination: "/page-not-found" },
        { source: "/docs-site", has: onHost(SITE_HOST), destination: "/page-not-found" },
      ],
    };
  },

  async redirects() {
    return [
      { source: "/docs-site", has: onHost(DOCS_HOST), destination: "/", permanent: false },

      ...APP_PAGES.flatMap((page) => [
        { source: `/${page}`, has: onHost(SITE_HOST), destination: `https://${APP_HOST}/${page}`, permanent: false },
        { source: `/${page}`, has: onHost(DOCS_HOST), destination: `https://${APP_HOST}/${page}`, permanent: false },
      ]),

      { source: "/", has: onHost(APP_HOST), destination: `https://${SITE_HOST}`, permanent: false },
    ];
  },
};

export default nextConfig;
