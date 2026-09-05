import { createConfig, http } from "wagmi";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";
import { defineChain } from "viem";

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arcscan",
      url: "https://testnet.arcscan.app",
    },
  },
});

export const config = createConfig({
  chains: [arcTestnet],
  connectors: [
    injected(),
    walletConnect({
      projectId: "7446a3643b847491e6e35af95995715e",
    }),
    coinbaseWallet({
      appName: "AlabaamaFi",
    }),
  ],
  transports: {
    [arcTestnet.id]: http(),
  },
});
