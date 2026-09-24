import { createConfig, http } from "wagmi";
import {
  coinbaseWallet,
  injected,
  walletConnect,
} from "wagmi/connectors";
import { defineChain } from "viem";
import { arc } from "viem/chains";
import { isMainnet } from "./environment";

export const arcMainnet = arc;

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
      http: ["https://rpc.testnet.arc.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arcscan",
      url: "https://explorer.testnet.arc.io",
    },
  },
});

export const ethereumSepolia = defineChain({
  id: 11155111,
  name: "Ethereum Sepolia",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://ethereum-sepolia-rpc.publicnode.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Etherscan",
      url: "https://sepolia.etherscan.io",
    },
  },
});

export const avalancheFuji = defineChain({
  id: 43113,
  name: "Avalanche",
  nativeCurrency: {
    name: "AVAX",
    symbol: "AVAX",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://api.avax-test.network/ext/bc/C/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "SnowTrace",
      url: "https://testnet.snowtrace.io",
    },
  },
});

export const optimismSepolia = defineChain({
  id: 11155420,
  name: "OP Sepolia",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://sepolia.optimism.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "Optimism Explorer",
      url: "https://sepolia-optimism.etherscan.io",
    },
  },
});

export const arbitrumSepolia = defineChain({
  id: 421614,
  name: "Arbitrum Sepolia",
  nativeCurrency: {
    name: "Arbitrum Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://sepolia-rollup.arbitrum.io/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arbiscan",
      url: "https://sepolia.arbiscan.io",
    },
  },
});

export const baseSepolia = defineChain({
  id: 84532,
  name: "Base Sepolia",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://sepolia.base.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "BaseScan",
      url: "https://sepolia.basescan.org",
    },
  },
});

export const polygonAmoy = defineChain({
  id: 80002,
  name: "Polygon Amoy",
  nativeCurrency: {
    name: "POL",
    symbol: "POL",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc-amoy.polygon.technology"],
    },
  },
  blockExplorers: {
    default: {
      name: "PolygonScan",
      url: "https://amoy.polygonscan.com",
    },
  },
});

export const lineaSepolia = defineChain({
  id: 59141,
  name: "Linea Sepolia",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.sepolia.linea.build"],
    },
  },
  blockExplorers: {
    default: {
      name: "LineaScan",
      url: "https://sepolia.lineascan.build",
    },
  },
});

export const unichainSepolia = defineChain({
  id: 1301,
  name: "Unichain Sepolia",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://sepolia.unichain.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Uniscan",
      url: "https://sepolia.uniscan.xyz",
    },
  },
});

export const codexTestnet = defineChain({
  id: 5115,
  name: "Codex Testnet",
  nativeCurrency: {
    name: "Codex",
    symbol: "CDX",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.codex.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "CodexScan",
      url: "https://testnet.codexscan.io",
    },
  },
});

export const sonicTestnet = defineChain({
  id: 57054,
  name: "Sonic Testnet",
  nativeCurrency: {
    name: "Sonic",
    symbol: "S",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.soniclabs.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "SonicScan",
      url: "https://testnet.sonicscan.org",
    },
  },
});

export const worldChainSepolia = defineChain({
  id: 4801,
  name: "World Chain Sepolia",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://worldchain-sepolia.g.alchemy.com/public"],
    },
  },
  blockExplorers: {
    default: {
      name: "Worldscan",
      url: "https://sepolia.worldscan.org",
    },
  },
});

export const seiTestnet = defineChain({
  id: 1328,
  name: "Sei Testnet",
  nativeCurrency: {
    name: "Sei",
    symbol: "SEI",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://evm-rpc-testnet.sei-apis.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "SeiScan",
      url: "https://testnet.seiscan.io",
    },
  },
});

export const xdcApothem = defineChain({
  id: 51,
  name: "XDC Apothem",
  nativeCurrency: {
    name: "XDC",
    symbol: "XDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://erpc.apothem.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "XDCScan",
      url: "https://apothem.xdcscan.io",
    },
  },
});

export const hyperEvmTestnet = defineChain({
  id: 999,
  name: "HyperEVM Testnet",
  nativeCurrency: {
    name: "HYPE",
    symbol: "HYPE",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://api.testnet.hyperevm.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "HyperEVM Explorer",
      url: "https://testnet.explorer.hyperevm.com",
    },
  },
});

export const inkTestnet = defineChain({
  id: 763373,
  name: "Ink Testnet",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc-gel-sepolia.inkonchain.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Ink Explorer",
      url: "https://sepolia.explorer.inkonchain.com",
    },
  },
});

export const plumeTestnet = defineChain({
  id: 161221135,
  name: "Plume Testnet",
  nativeCurrency: {
    name: "Plume",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.plumenetwork.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Plume Testnet Explorer",
      url: "https://testnet.explorer.plumenetwork.xyz",
    },
  },
});

const activeArcChain = isMainnet ? arcMainnet : arcTestnet;

export const config = createConfig({
  chains: [
  activeArcChain,
  ethereumSepolia,
    avalancheFuji,
    optimismSepolia,
    arbitrumSepolia,
    baseSepolia,
    polygonAmoy,
    lineaSepolia,
    unichainSepolia,
    codexTestnet,
    sonicTestnet,
    worldChainSepolia,
    seiTestnet,
    xdcApothem,
    hyperEvmTestnet,
    inkTestnet,
    plumeTestnet,
  ],

  connectors: [
    injected({
      shimDisconnect: true,
    }),

    walletConnect({
      projectId: "7446a3643b847491e6e35af95995715e",
      showQrModal: true,
    }),

    coinbaseWallet({
      appName: "AlabaamaFi",
    }),
  ],

  transports: {
    [arcMainnet.id]: http("https://rpc.mainnet.arc.io"),
    [arcTestnet.id]: http("https://rpc.testnet.arc.io"),

    [ethereumSepolia.id]: http(
      "https://ethereum-sepolia-rpc.publicnode.com"
    ),

    [avalancheFuji.id]: http(
      "https://api.avax-test.network/ext/bc/C/rpc"
    ),

    [optimismSepolia.id]: http(
      "https://sepolia.optimism.io"
    ),

    [arbitrumSepolia.id]: http(
      "https://sepolia-rollup.arbitrum.io/rpc"
    ),

    [baseSepolia.id]: http(
      "https://sepolia.base.org"
    ),

    [polygonAmoy.id]: http(
      "https://rpc-amoy.polygon.technology"
    ),

    [lineaSepolia.id]: http(
      "https://rpc.sepolia.linea.build"
    ),

    [unichainSepolia.id]: http(
      "https://sepolia.unichain.org"
    ),

    [codexTestnet.id]: http(
      "https://rpc.testnet.codex.io"
    ),

    [sonicTestnet.id]: http(
      "https://rpc.testnet.soniclabs.com"
    ),

    [worldChainSepolia.id]: http(
      "https://worldchain-sepolia.g.alchemy.com/public"
    ),

    [seiTestnet.id]: http(
      "https://evm-rpc-testnet.sei-apis.com"
    ),

    [xdcApothem.id]: http(
      "https://erpc.apothem.network"
    ),

    [hyperEvmTestnet.id]: http(
      "https://api.testnet.hyperevm.com"
    ),

    [inkTestnet.id]: http(
      "https://rpc-gel-sepolia.inkonchain.com"
    ),

    [plumeTestnet.id]: http(
      "https://testnet-rpc.plumenetwork.xyz"
    ),
  },
});
