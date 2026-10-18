import { createConfig, http } from "wami";
import { injected, coinbaseWallet, walletConnect } from "wagmi/connectors";
import { arc } from "viem/chains";

/* ====================================================================
   WALLETCONNECT PROJECT ID
   Create a free project at https://dashboard.reown.com , copy its
   Project ID and paste it between the quotes on the line below.
   (While it is empty, the WalletConnect option is hidden.)
   ==================================================================== */
const WALLETCONNECT_PROJECT_ID = "6672b2a513af880372a1ca90167637f2";

export const arcMainnet = arc;

export const config = createConfig({
  chains: [arcMainnet],

  connectors: [
    injected({
      shimDisconnect: true,
    }),

    coinbaseWallet({
      appName: "AlabaamaFi",
    }),

    // WalletConnect (the QR code is drawn by components/WalletModal.tsx)
    ...(WALLETCONNECT_PROJECT_ID
      ? [
          walletConnect({
            projectId: WALLETCONNECT_PROJECT_ID,
            showQrModal: false, // our own QR card (WalletModal) shows the code
            metadata: {
              name: "AlabaamaFi",
              description: "A simple interface for Arc",
              url: "https://app.alabaamafi.xyz",
              icons: ["https://app.alabaamafi.xyz/alabaamafi-logo.png"],
            },
          }),
        ]
      : []),
  ],

  transports: {
    [arcMainnet.id]: http("https://rpc.mainnet.arc.io"),
  },

  ssr: true,
});
