import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Send",
  description:
    "Send USDC to any wallet address on Arc Mainnet. Fees are paid in USDC and transfers are final in under a second.",
};

export default function SendLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
