import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Swap",
  description:
    "Swap USDC, EURC and cirBTC on Arc Mainnet. See the rate, the minimum you receive and the network fee before you confirm.",
};

export default function SwapLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
