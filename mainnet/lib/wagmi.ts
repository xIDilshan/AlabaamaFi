import { createConfig, http } from "wagmi";
import { injected, coinbaseWallet } from "wagmi/connectors";
import { arc } from "viem/chains";

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
  ],

  transports: {
    [arcMainnet.id]: http("https://rpc.mainnet.arc.io"),
  },

  ssr: true,
});
