import type { Metadata } from "next";
import Providers from "@/lib/providers";
import "./globals.css";

const SITE = "https://alabaamafi.xyz";
const TITLE = "AlabaamaFi | Your orbit for DeFi on Arc";
const DESCRIPTION =
  "One place to move, manage and explore assets on Arc Network. Swap, bridge and send tokens, and track any wallet's portfolio and activity.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: TITLE,
    template: "%s | AlabaamaFi",
  },
  description: DESCRIPTION,
  applicationName: "AlabaamaFi",
  openGraph: {
    type: "website",
    siteName: "AlabaamaFi",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@AlabaamaFi_xyz",
    creator: "@AlabaamaFi_xyz",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
