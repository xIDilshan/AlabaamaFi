import { createConfig, http } from "wagmi";
import { injected, coinbaseWallet, walletConnect } from "wagmi/connectors";
import { arc } from "viem/chains";

/* ====================================================================
   WALLETCONNECT PROJECT ID
   Create a free project at https://dashboard.reown.com , copy its
   Project ID and paste it between the quotes on the line below.
   (While it is empty, the WalletConnect option is hidden.)
   ==================================================================== */
const WALLETCONNECT_PROJECT_ID = "";

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

    // WalletConnect with its QR code window (showQrModal)
    ...(WALLETCONNECT_PROJECT_ID
      ? [
          walletConnect({
            projectId: WALLETCONNECT_PROJECT_ID,
            showQrModal: true,
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
