import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Bridge",
  description:
    "Bridge USDC between Arc and other networks with Circle's CCTP. See the fees and the time before you confirm.",
};

export default function BridgeLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
