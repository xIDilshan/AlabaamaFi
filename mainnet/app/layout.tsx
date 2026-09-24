import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AlabaamaFi",
  description:
    "One place to move, manage, and explore assets on Arc Network.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
