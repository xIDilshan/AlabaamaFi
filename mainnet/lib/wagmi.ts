import { createConfig, http } from "wagmi";
import { injected, coinbaseWallet, walletConnect } from "wagmi/connectors";
import { arc } from "viem/chains";

/* ---------- WalletConnect ---------- */
const WALLETCONNECT_PROJECT_ID = "6672b2a513af880372a1ca90167637f2";

const IS_MOBILE = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);

/* ---------- wagmi config ---------- */
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

    ...(WALLETCONNECT_PROJECT_ID
      ? [
          walletConnect({
            projectId: WALLETCONNECT_PROJECT_ID,
            showQrModal: IS_MOBILE,
            metadata: {
              name: "AlabaamaFi",
              description: "One place to move, manage and explore assets on Arc Network.",
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
