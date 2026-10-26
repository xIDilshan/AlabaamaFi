import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Wallet activity",
  description:
    "Search any wallet on Arc to see its portfolio, token balances and full transaction activity.",
};

export default function ActivityLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
