"use client";

/*
  LI.FI Widget for the Robinhood Chain routes.
  Save as: components/LifiWidget.tsx
  Install: npm install @lifi/widget @lifi/widget-provider-ethereum @tanstack/react-query
  (wagmi and @wagmi/core are already in your project, so they are not listed again.)
  It is loaded only in the browser by app/bridge/robinhood/page.tsx.
*/

import { useMemo } from "react";
import { LiFiWidget } from "@lifi/widget";
import type { WidgetConfig } from "@lifi/widget";
import { EthereumProvider } from "@lifi/widget-provider-ethereum";

export const ROBINHOOD_CHAIN_ID = 4663;
export const ARC_CHAIN_ID = 5042;

/** "to" = anything to Robinhood Chain, "from" = Robinhood Chain to anything. Arc is just one of the networks on the other side. */
export type RobinhoodMode = "to" | "from";

export default function LifiWidget({ mode }: { mode: RobinhoodMode }) {
  const config = useMemo(
    () =>
      ({
        // the name LI.FI sees for your app (you can register it with LI.FI to see your own stats)
        integrator: "AlabaamaFi",
        providers: [EthereumProvider()],
        variant: "compact",
        appearance: "dark",
        // starting pair: Arc <-> Robinhood Chain. The user can pick any other network on the open side.
        fromChain: mode === "to" ? ARC_CHAIN_ID : ROBINHOOD_CHAIN_ID,
        toChain: mode === "to" ? ROBINHOOD_CHAIN_ID : ARC_CHAIN_ID,
        // Robinhood Chain is locked on one side, every other network LI.FI supports is open on the other side
        chains: mode === "to" ? { to: { allow: [ROBINHOOD_CHAIN_ID] } } : { from: { allow: [ROBINHOOD_CHAIN_ID] } },
        hiddenUI: ["appearance", "language"],
        // The widget connects wallets itself, with its own list of LI.FI chains (so switching to Robinhood Chain just works).
        // Without this it would reuse your site's wagmi config, which only knows the chains you listed there.
        walletConfig: {
          forceInternalWalletManagement: true,
        },
        theme: {
          palette: {
            primary: { main: "#1978f5" },
            secondary: { main: "#39c4ff" },
            background: { default: "#050a16", paper: "#0a1226" },
            text: { primary: "#ffffff", secondary: "#94a3b8" },
          },
          shape: { borderRadius: 18, borderRadiusSecondary: 999 },
          typography: { fontFamily: "Inter, system-ui, sans-serif" },
          container: {
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "32px",
            boxShadow: "0 30px 100px rgba(0,0,0,0.4)",
          },
        },
      }) as unknown as WidgetConfig,
    [mode]
  );

  return <LiFiWidget integrator="AlabaamaFi" config={config} />;
}
