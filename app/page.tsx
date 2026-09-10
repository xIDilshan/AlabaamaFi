"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { isAddress, parseUnits } from "viem";
import { arcTestnet } from "@/lib/wagmi";
import {
  getWalletTransactions,
  type WalletTransaction,
} from "@/lib/arcscan";

const USDC_ADDRESS =
  "0x3600000000000000000000000000000000000000";

const USDC_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [
      {
        name: "account",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "to",
        type: "address",
      },
      {
        name: "value",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
  },
] as const;

/* User-friendly error messages */

function getFriendlyErrorMessage(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("user rejected") ||
    lowerMessage.includes("user denied") ||
    lowerMessage.includes("connection request reset")
  ) {
    return "Wallet connection rejected. Please try again.";
  }

  if (
    lowerMessage.includes("provider not found") ||
    lowerMessage.includes("provider")
  ) {
    return "Wallet connection failed. Please make sure your wallet is installed and try again.";
  }

  if (
    lowerMessage.includes("insufficient funds") ||
    lowerMessage.includes("insufficient balance")
  ) {
    return "Insufficient USDC balance.";
  }

  if (
    lowerMessage.includes("invalid address") ||
    lowerMessage.includes("invalid recipient")
  ) {
    return "Please enter a valid wallet address.";
  }

  if (
    lowerMessage.includes("user rejected the request") ||
    lowerMessage.includes("transaction rejected")
  ) {
    return "Transaction was rejected. Please try again.";
  }

  if (
    lowerMessage.includes("network") ||
    lowerMessage.includes("chain")
  ) {
    return "Network connection failed. Please try again.";
  }

  if (
    lowerMessage.includes("execution reverted") ||
    lowerMessage.includes("reverted")
  ) {
    return "Transaction could not be completed. Please try again.";
  }

  return "Something went wrong. Please try again.";
}

type Section =
  | "home"
  | "send"
  | "swap"
  | "bridge"
  | "activity"
  | "faucet";

type TokenHolding = {
  address: string;
  symbol: string;
  name: string;
  amount: string;
  logo: string | null;
  usdValue: number | null;
};

/* Token helpers */

function getTokenLogo(
  symbol: string,
  apiLogo: string | null
): string | null {
  const upperSymbol = symbol.toUpperCase();

  if (upperSymbol === "USDC") {
    return "/tokens/usdc.svg";
  }

  if (
    upperSymbol === "EURC" ||
    upperSymbol === "EUROC"
  ) {
    return "/tokens/eurc.svg";
  }

  if (upperSymbol === "CIRBTC") {
    return "/tokens/cirbtc.svg";
  }

  return apiLogo;
}

function getUsdValue(value: any): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "object") {
    const nested =
      value.formatted ??
      value.value ??
      value.amount ??
      value.raw ??
      null;

    if (
      nested !== null &&
      nested !== undefined &&
      Number.isFinite(Number(nested))
    ) {
      return Number(nested);
    }

    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : null;
}

export default function Home() {
  const [showWallets, setShowWallets] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeSection, setActiveSection] =
    useState<Section>("home");

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  /* Activity state */

  const [activityAddress, setActivityAddress] =
    useState("");

  const [activityTransactions, setActivityTransactions] =
    useState<WalletTransaction[]>([]);

  const [activityLoading, setActivityLoading] =
    useState(false);

  const [activityError, setActivityError] =
    useState("");

  const [activityTokens, setActivityTokens] =
    useState<TokenHolding[]>([]);

  const [portfolioValue, setPortfolioValue] =
    useState<number | null>(null);

  const {
    address,
    isConnected,
    chainId,
  } = useAccount();

  const {
    connectors,
    connect,
    isPending,
    error: connectError,
  } = useConnect();

  const { disconnect } = useDisconnect();

  const { switchChain } = useSwitchChain();

  const {
    data: usdcBalance,
    isLoading: isBalanceLoading,
  } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: arcTestnet.id,
  });

  const {
    writeContract,
    data: hash,
    isPending: isSending,
    error: sendError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  const formattedBalance = usdcBalance
    ? (Number(usdcBalance) / 1_000_000).toFixed(2)
    : "0.00";

  /*
   * Keep Activity address synced with
   * the connected wallet.
   */

  useEffect(() => {
    if (isConnected && address) {
      setActivityAddress(address);
    } else {
      setActivityAddress("");
      setActivityTransactions([]);
      setActivityTokens([]);
      setPortfolioValue(null);
      setActivityError("");
    }
  }, [isConnected, address]);

  /*
   * Wallet detection
   */

  const walletConnectConnector = useMemo(() => {
    return connectors.find((connector) => {
      const name = connector.name.toLowerCase();
      const id = connector.id.toLowerCase();

      return (
        name.includes("walletconnect") ||
        id.includes("walletconnect")
      );
    });
  }, [connectors]);

  const coinbaseConnector = useMemo(() => {
    return connectors.find((connector) => {
      const name = connector.name.toLowerCase();
      const id = connector.id.toLowerCase();

      return (
        name.includes("coinbase") ||
        name.includes("base") ||
        id.includes("coinbase")
      );
    });
  }, [connectors]);

  const metaMaskConnector = useMemo(() => {
    return connectors.find((connector) => {
      const name = connector.name.toLowerCase();
      const id = connector.id.toLowerCase();

      return (
        name.includes("metamask") ||
        id.includes("metamask") ||
        id === "io.metamask"
      );
    });
  }, [connectors]);

  /*
   * Detect other browser wallets dynamically
   * through EIP-6963.
   */

  const detectedBrowserWallets = useMemo(() => {
    const excludedIds = new Set(
      [
        walletConnectConnector?.id,
        coinbaseConnector?.id,
        metaMaskConnector?.id,
      ].filter(Boolean)
    );

    return connectors.filter((connector) => {
      if (excludedIds.has(connector.id)) {
        return false;
      }

      const name = connector.name.toLowerCase();
      const id = connector.id.toLowerCase();

      if (
        id === "injected" ||
        name === "injected" ||
        name === "browser wallet"
      ) {
        return false;
      }

      return (
        name.includes("wallet") ||
        name.includes("brave") ||
        name.includes("rabby") ||
        name.includes("okx") ||
        name.includes("metamask") ||
        id.includes(".")
      );
    });
  }, [
    connectors,
    walletConnectConnector,
    coinbaseConnector,
    metaMaskConnector,
  ]);

  const browserConnector = useMemo(() => {
    return connectors.find((connector) => {
      const name = connector.name.toLowerCase();
      const id = connector.id.toLowerCase();

      return (
        id === "injected" ||
        name === "injected" ||
        name === "browser wallet"
      );
    });
  }, [connectors]);

  /*
   * MetaMask mobile detection
   */

  const isMobileDevice = () => {
    if (typeof window === "undefined") {
      return false;
    }

    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(
      navigator.userAgent
    );
  };

  const openMetaMaskMobile = () => {
    if (typeof window === "undefined") {
      return;
    }

    const currentUrl =
      window.location.host +
      window.location.pathname +
      window.location.search;

    const metamaskUrl =
      `https://metamask.app.link/dapp/${currentUrl}`;

    window.location.href = metamaskUrl;
  };

  const openMetaMaskInstall = () => {
    window.open(
      "https://metamask.io/download/",
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleMetaMaskClick = () => {
    setError("");

    if (isMobileDevice()) {
      openMetaMaskMobile();
      return;
    }

    if (metaMaskConnector) {
      handleConnect(metaMaskConnector);
      return;
    }

    openMetaMaskInstall();
  };

  const handleConnect = (
    connector: (typeof connectors)[number]
  ) => {
    setError("");

    connect(
      { connector },
      {
        onSuccess: () => {
          setShowWallets(false);
        },
      }
    );
  };

  const handleWalletButton = () => {
    if (isConnected) {
      disconnect();
      setRecipient("");
      setAmount("");
      setError("");
      setActivityAddress("");
      setActivityTransactions([]);
      setActivityTokens([]);
      setPortfolioValue(null);
      setActivityError("");
    } else {
      setError("");
      setShowWallets(true);
    }
  };

  /*
   * Navigation
   */

  const handleNavigation = (section: Section) => {
    setActiveSection(section);
    setShowMenu(false);
    setError("");
  };

  const menuItems: {
    id: Section;
    label: string;
    icon: string;
  }[] = [
    {
      id: "home",
      label: "Home",
      icon: "⌂",
    },
    {
      id: "send",
      label: "Send",
      icon: "↗",
    },
    {
      id: "swap",
      label: "Swap",
      icon: "⇄",
    },
    {
      id: "bridge",
      label: "Bridge",
      icon: "⇅",
    },
    {
      id: "activity",
      label: "Activity",
      icon: "◷",
    },
    {
      id: "faucet",
      label: "Faucet",
      icon: "◌",
    },
  ];

  /*
   * Wallet Activity
   */

  const handleCheckActivity = async () => {
    setActivityError("");
    setActivityTransactions([]);
    setActivityTokens([]);
    setPortfolioValue(null);

    if (!isConnected || !address) {
      setActivityError(
        "Please connect your wallet first."
      );
      return;
    }

    const walletAddress = address;

    if (!isAddress(walletAddress)) {
      setActivityError(
        "Invalid connected wallet address."
      );
      return;
    }

    setActivityLoading(true);

    try {
      /*
       * Get transaction history.
       */

      const transactions =
        await getWalletTransactions(walletAddress);

      setActivityTransactions(transactions);

      /*
       * Get token balances from Arcscan.
       */

      let apiTokens: TokenHolding[] = [];

      try {
        const tokensResponse = await fetch(
          `https://api-testnet.arc-scan.org/v1/address/${walletAddress}/tokens`
        );

        if (tokensResponse.ok) {
          const tokenData =
            await tokensResponse.json();

          const tokenItems = Array.isArray(tokenData)
            ? tokenData
            : tokenData.items ||
              tokenData.tokens ||
              tokenData.data ||
              [];

          apiTokens = tokenItems
            .map((token: any) => {
              const money =
                token.balance ||
                token.amount ||
                token.money ||
                {};

              const formatted =
                typeof money === "object"
                  ? money?.formatted
                  : null;

              const raw =
                typeof money === "object"
                  ? money?.raw
                  : money;

              const decimals = Number(
                money?.decimals ??
                  token.decimals ??
                  token.token?.decimals ??
                  18
              );

              const symbol =
                token.symbol ||
                token.token_symbol ||
                token.token?.symbol ||
                money?.symbol ||
                "";

              const name =
                token.name ||
                token.token_name ||
                token.token?.name ||
                symbol;

              const tokenAddress =
                token.address ||
                token.token_address ||
                token.token?.address ||
                "";

              const usd =
                money?.usd ??
                token.usd ??
                token.usd_value ??
                token.value_usd ??
                token.value?.usd ??
                null;

              let tokenAmount = "0";

              if (
                formatted !== null &&
                formatted !== undefined
              ) {
                tokenAmount = String(formatted);
              } else if (
                raw !== null &&
                raw !== undefined
              ) {
                try {
                  tokenAmount = (
                    Number(raw) /
                    10 ** decimals
                  ).toString();
                } catch {
                  tokenAmount = String(raw);
                }
              }

              const logo =
                token.logo ||
                token.logo_url ||
                token.token?.logo ||
                null;

              const upperSymbol =
                String(symbol).toUpperCase();

              let displaySymbol =
                String(symbol);

              if (upperSymbol === "EUROC") {
                displaySymbol = "EURC";
              } else if (
                upperSymbol === "CIRBTC"
              ) {
                displaySymbol = "cirBTC";
              }

              return {
                address: tokenAddress,
                symbol: displaySymbol,
                name: String(name),
                amount: tokenAmount,
                logo: getTokenLogo(
                  String(symbol),
                  logo
                ),
                usdValue: getUsdValue(usd),
              };
            })
            .filter(
              (token: TokenHolding) =>
                token.symbol &&
                Number(token.amount) > 0
            );
        }
      } catch {
        /*
         * Token API failure should not prevent
         * transaction history from loading.
         */
      }

      /*
       * Get USDC balance directly from Arc RPC.
       *
       * This guarantees USDC appears even when
       * Arcscan token API does not return it.
       */

      let usdcAmount = 0;

      try {
        const response = await fetch(
          arcTestnet.rpcUrls.default.http[0],
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "eth_call",
              params: [
                {
                  to: USDC_ADDRESS,
                  data:
                    "0x70a08231000000000000000000000000" +
                    walletAddress.slice(2),
                },
                "latest",
              ],
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();

          if (data.result) {
            usdcAmount =
              Number(BigInt(data.result)) /
              1_000_000;
          }
        }
      } catch {
        usdcAmount = 0;
      }

      /*
       * Remove USDC returned by Arcscan.
       * We use the direct RPC balance instead.
       */

      const nonUsdcTokens = apiTokens.filter(
        (token) =>
          token.symbol.toUpperCase() !== "USDC"
      );

      const usdcToken: TokenHolding = {
        address: USDC_ADDRESS,
        symbol: "USDC",
        name: "USD Coin",
        amount: usdcAmount.toFixed(6),
        logo: "/tokens/usdc.svg",
        usdValue: usdcAmount,
      };

      /*
       * USDC first.
       */

      const holdings = [
        usdcToken,
        ...nonUsdcTokens,
      ];

      setActivityTokens(holdings);

      /*
       * Calculate total portfolio value.
       */

      let totalPortfolio = 0;
      let hasPortfolioValue = false;

      for (const token of holdings) {
        if (
          token.usdValue !== null &&
          Number.isFinite(token.usdValue)
        ) {
          totalPortfolio += token.usdValue;
          hasPortfolioValue = true;
        }
      }

      if (hasPortfolioValue) {
        setPortfolioValue(totalPortfolio);
      } else {
        setPortfolioValue(null);
      }
    } catch {
      setActivityError(
        "Unable to load wallet activity. Please try again."
      );
    } finally {
      setActivityLoading(false);
    }
  };

  /*
   * Send USDC
   */

  const handleSend = () => {
    setError("");

    if (!isConnected || !address) {
      setError("Please connect your wallet first.");
      return;
    }

    if (chainId !== arcTestnet.id) {
      setError("Please switch to Arc Testnet.");
      return;
    }

    if (!isAddress(recipient)) {
      setError(
        "Please enter a valid wallet address."
      );
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError(
        "Please enter a valid USDC amount."
      );
      return;
    }

    try {
      const value = parseUnits(amount, 6);

      writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "transfer",
        args: [recipient, value],
        chainId: arcTestnet.id,
      });
    } catch {
      setError(
        "Unable to send USDC. Please try again."
      );
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#030712] text-white">
      {/* Top Header */}

      <header className="border-b border-blue-900/30 bg-[#050b1a]/90 backdrop-blur-xl">
        <div className="mx-auto grid min-h-[72px] max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6 lg:px-8">
          {/* Left: Menu + Testnet */}

          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowMenu(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-900/40 bg-blue-950/40 text-lg text-white/70 transition duration-200 hover:border-blue-700/50 hover:bg-blue-900/40 hover:text-white active:scale-95"
              aria-label="Open menu"
            >
              ☰
            </button>

            <div className="flex min-w-0 items-center gap-2 rounded-xl border border-blue-900/40 bg-blue-950/30 px-2.5 py-2 sm:px-3">
              <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-green-500" />

              <span className="text-[11px] font-medium text-white/70 sm:text-xs">
                Testnet
              </span>
            </div>
          </div>

          {/* Logo */}

          <div className="min-w-0 text-center">
            <h1 className="truncate text-sm font-bold sm:text-base lg:text-xl">
              AlabaamaFi
            </h1>

            <p className="mt-0.5 text-[9px] text-blue-200/40 sm:text-[10px] lg:text-xs">
              Powered by Arc
            </p>
          </div>

          {/* Wallet */}

          <div className="flex min-w-0 items-center justify-end gap-2">
            <button
              onClick={handleWalletButton}
              className="max-w-[135px] truncate rounded-xl border border-blue-300/10 bg-white px-3 py-2.5 text-xs font-semibold text-black shadow-lg shadow-blue-950/20 transition duration-200 hover:bg-blue-50 active:scale-[0.98] sm:max-w-none sm:px-4 lg:px-5 lg:text-sm"
            >
              {isConnected
                ? shortAddress
                : "Connect Wallet"}
            </button>
          </div>
        </div>
      </header>

      {/* Menu Overlay */}

      {showMenu && (
        <div className="fixed inset-0 z-40">
          {/* Background */}

          <button
            onClick={() => setShowMenu(false)}
            className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm"
            aria-label="Close menu"
          />

          {/* Sidebar */}

          <aside className="relative z-50 flex min-h-screen w-[min(18rem,88vw)] flex-col border-r border-blue-900/30 bg-[#050b1a] p-4 shadow-2xl shadow-blue-950/30 sm:p-5">
            {/* Sidebar Header */}

            <div className="mb-8 flex items-center justify-between sm:mb-10">
              <div>
                <h2 className="text-xl font-bold">
                  AlabaamaFi
                </h2>

                <p className="mt-1 text-xs text-blue-200/40">
                  Powered by Arc
                </p>
              </div>

              <button
                onClick={() => setShowMenu(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-lg text-white/50 transition duration-200 hover:bg-blue-900/30 hover:text-white active:scale-95"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* Navigation */}

            <nav className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    handleNavigation(item.id)
                  }
                  className={`flex min-h-12 w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left transition duration-200 active:scale-[0.99] ${
                    activeSection === item.id
                      ? "bg-white text-black shadow-lg shadow-blue-950/20"
                      : "text-white/60 hover:bg-blue-900/25 hover:text-white"
                  }`}
                >
                  <span className="w-6 shrink-0 text-center text-lg">
                    {item.icon}
                  </span>

                  <span className="text-sm font-medium">
                    {item.label}
                  </span>
                </button>
              ))}
            </nav>

            {/* Sidebar Wallet */}

            <div className="mt-auto pt-8">
              <button
                onClick={handleWalletButton}
                className="w-full rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-black shadow-lg shadow-blue-950/20 transition duration-200 hover:bg-blue-50 active:scale-[0.99]"
              >
                {isConnected
                  ? shortAddress
                  : "Connect Wallet"}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}

      <div className="min-w-0">
        {/* Home */}

        {activeSection === "home" && (
          <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-10 lg:py-16">
            {/* Hero */}

            <div className="relative overflow-hidden rounded-3xl border border-blue-900/30 bg-gradient-to-br from-[#08142c] via-[#061024] to-[#030712] p-6 shadow-2xl shadow-blue-950/30 sm:p-10 lg:p-14 xl:p-16">
              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-600/[0.08] blur-3xl sm:h-80 sm:w-80" />

              <div className="pointer-events-none absolute -bottom-32 -left-20 h-56 w-56 rounded-full bg-blue-900/[0.12] blur-3xl" />

              <div className="relative max-w-4xl">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200/35 sm:mb-5 sm:text-sm">
                  Arc Network
                </p>

                <h2 className="text-[2.75rem] font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl">
                  Simple.
                  <br />

                  <span className="text-blue-100/35">
                    On-chain.
                  </span>
                </h2>

                <p className="mt-6 max-w-2xl text-sm leading-6 text-blue-100/50 sm:mt-7 sm:text-lg sm:leading-8">
                  AlabaamaFi is a simple DeFi
                  experience for sending, exploring
                  and managing assets on Arc Network.
                </p>

                {/* Professional Hero Buttons */}

                <div className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row">
                  <button
                    onClick={() =>
                      handleNavigation("send")
                    }
                    className="group relative flex min-h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-black shadow-xl shadow-blue-950/30 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-2xl hover:shadow-blue-900/30 active:translate-y-0 sm:w-auto"
                  >
                    <span>Send USDC</span>
                  </button>

                  <button
                    onClick={() =>
                      handleNavigation("activity")
                    }
                    className="group flex min-h-12 w-full items-center justify-center rounded-xl border border-blue-800/40 bg-blue-950/30 px-6 py-3.5 text-sm font-semibold text-white/80 shadow-lg shadow-blue-950/10 transition duration-200 hover:-translate-y-0.5 hover:border-blue-600/50 hover:bg-blue-900/30 hover:text-white active:translate-y-0 sm:w-auto"
                  >
                    <span>Explore Activity</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}

            <div className="mt-10 sm:mt-12">
              <div className="mb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200/35">
                    Quick Actions
                  </p>

                  <p className="mt-1.5 text-sm text-blue-100/35">
                    Access AlabaamaFi features
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* Send */}

                <button
                  onClick={() =>
                    handleNavigation("send")
                  }
                  className="group relative min-w-0 overflow-hidden rounded-2xl border border-blue-900/30 bg-gradient-to-br from-blue-950/45 to-[#061024] p-5 text-left shadow-lg shadow-blue-950/10 transition duration-200 hover:-translate-y-1 hover:border-blue-700/50 hover:bg-blue-900/35 hover:shadow-xl hover:shadow-blue-950/25 active:translate-y-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-800/40 bg-blue-900/25 text-xl text-blue-100/80 transition group-hover:border-blue-600/50 group-hover:bg-blue-800/30">
                      ↗
                    </div>
                  </div>

                  <h4 className="mt-5 font-semibold">
                    Send
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-blue-100/40">
                    Send USDC to another wallet.
                  </p>
                </button>

                {/* Swap */}

                <button
                  onClick={() =>
                    handleNavigation("swap")
                  }
                  className="group relative min-w-0 overflow-hidden rounded-2xl border border-blue-900/30 bg-gradient-to-br from-blue-950/45 to-[#061024] p-5 text-left shadow-lg shadow-blue-950/10 transition duration-200 hover:-translate-y-1 hover:border-blue-700/50 hover:bg-blue-900/35 hover:shadow-xl hover:shadow-blue-950/25 active:translate-y-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-800/40 bg-blue-900/25 text-xl text-blue-100/80 transition group-hover:border-blue-600/50 group-hover:bg-blue-800/30">
                      ⇄
                    </div>
                  </div>

                  <h4 className="mt-5 font-semibold">
                    Swap
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-blue-100/40">
                    Swap supported assets on Arc.
                  </p>
                </button>

                {/* Bridge */}

                <button
                  onClick={() =>
                    handleNavigation("bridge")
                  }
                  className="group relative min-w-0 overflow-hidden rounded-2xl border border-blue-900/30 bg-gradient-to-br from-blue-950/45 to-[#061024] p-5 text-left shadow-lg shadow-blue-950/10 transition duration-200 hover:-translate-y-1 hover:border-blue-700/50 hover:bg-blue-900/35 hover:shadow-xl hover:shadow-blue-950/25 active:translate-y-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-800/40 bg-blue-900/25 text-xl text-blue-100/80 transition group-hover:border-blue-600/50 group-hover:bg-blue-800/30">
                      ⇅
                    </div>
                  </div>

                  <h4 className="mt-5 font-semibold">
                    Bridge
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-blue-100/40">
                    Move assets across networks.
                  </p>
                </button>

                {/* Activity */}

                <button
                  onClick={() =>
                    handleNavigation("activity")
                  }
                  className="group relative min-w-0 overflow-hidden rounded-2xl border border-blue-900/30 bg-gradient-to-br from-blue-950/45 to-[#061024] p-5 text-left shadow-lg shadow-blue-950/10 transition duration-200 hover:-translate-y-1 hover:border-blue-700/50 hover:bg-blue-900/35 hover:shadow-xl hover:shadow-blue-950/25 active:translate-y-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-800/40 bg-blue-900/25 text-xl text-blue-100/80 transition group-hover:border-blue-600/50 group-hover:bg-blue-800/30">
                      ◷
                    </div>
                  </div>

                  <h4 className="mt-5 font-semibold">
                    Activity
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-blue-100/40">
                    Explore wallet activity and assets.
                  </p>
                </button>
              </div>
            </div>

            {/* Supported Assets */}

            <div className="mt-8 rounded-2xl border border-blue-900/30 bg-gradient-to-r from-blue-950/35 to-[#061024] p-5 shadow-lg shadow-blue-950/15 sm:mt-10 sm:p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-widest text-blue-200/35">
                    Supported Assets
                  </p>

                  <h3 className="mt-1 text-xl font-semibold">
                    Built for Arc
                  </h3>

                  <p className="mt-2 max-w-lg text-sm leading-6 text-blue-100/40">
                    Explore assets available on Arc
                    Testnet through AlabaamaFi.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <div className="flex items-center gap-2 rounded-xl border border-blue-900/40 bg-[#030a18]/70 px-3 py-2">
                    <img
                      src="/tokens/usdc.svg"
                      alt="USDC"
                      className="h-7 w-7 rounded-full object-contain"
                    />

                    <span className="text-sm font-medium">
                      USDC
                    </span>
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-blue-900/40 bg-[#030a18]/70 px-3 py-2">
                    <img
                      src="/tokens/eurc.svg"
                      alt="EURC"
                      className="h-7 w-7 rounded-full object-contain"
                    />

                    <span className="text-sm font-medium">
                      EURC
                    </span>
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-blue-900/40 bg-[#030a18]/70 px-3 py-2">
                    <div className="flex h-7 w-7 items-center justify-center">
                      <img
                        src="/tokens/cirbtc.svg"
                        alt="cirBTC"
                        className="h-7 w-7 rounded-full object-contain"
                        style={{
                          transform: "scale(0.75)",
                        }}
                      />
                    </div>

                    <span className="text-sm font-medium">
                      cirBTC
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Testnet Notice */}

            <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-blue-900/30 bg-blue-950/20 p-5 shadow-lg shadow-blue-950/10 sm:mt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  You are using Arc Testnet
                </p>

                <p className="mt-1 text-xs leading-5 text-blue-100/30">
                  Use testnet assets only. Nothing here
                  represents real mainnet funds.
                </p>
              </div>

              <button
                onClick={() =>
                  handleNavigation("faucet")
                }
                className="group flex w-full shrink-0 items-center justify-center rounded-xl border border-blue-800/40 bg-blue-900/20 px-4 py-2.5 text-xs font-semibold text-white/70 shadow-sm transition duration-200 hover:border-blue-600/50 hover:bg-blue-800/30 hover:text-white active:scale-[0.99] sm:w-auto"
              >
                <span>Get Testnet Tokens</span>
              </button>
            </div>
          </section>
        )}

        {/* Send */}

        {activeSection === "send" && (
          <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-20">
            <div className="mx-auto max-w-md">
              <div className="mb-6 sm:mb-8">
                <p className="text-sm text-blue-200/40">
                  AlabaamaFi
                </p>

                <h2 className="mt-1 text-3xl font-bold sm:text-4xl">
                  Send USDC
                </h2>

                <p className="mt-2 text-sm leading-6 text-blue-100/40">
                  Send USDC to another wallet on Arc
                  Testnet.
                </p>
              </div>

              <div className="rounded-3xl border border-blue-900/30 bg-gradient-to-br from-blue-950/35 to-[#061024] p-4 shadow-2xl shadow-blue-950/20 sm:p-6">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <h3 className="font-semibold">
                    Transfer
                  </h3>

                  <span className="shrink-0 rounded-full border border-blue-800/30 bg-blue-900/25 px-3 py-1 text-xs text-blue-100/50">
                    Testnet
                  </span>
                </div>

                {/* Recipient */}

                <label className="mb-2 block text-sm text-blue-100/50">
                  Recipient
                </label>

                <input
                  type="text"
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) =>
                    setRecipient(e.target.value)
                  }
                  className="mb-5 min-h-12 w-full rounded-xl border border-blue-900/40 bg-[#020817] px-4 py-3 text-sm outline-none transition placeholder:text-blue-100/20 focus:border-blue-600/50 focus:ring-2 focus:ring-blue-900/30"
                />

                {/* Amount */}

                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <label className="text-sm text-blue-100/50">
                    Amount
                  </label>

                  <span className="text-xs text-blue-100/30">
                    Balance:{" "}
                    {isBalanceLoading
                      ? "Loading..."
                      : `${formattedBalance} USDC`}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.000001"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value)
                    }
                    className="min-h-12 w-full rounded-xl border border-blue-900/40 bg-[#020817] px-4 py-3 pr-20 text-lg outline-none transition placeholder:text-blue-100/20 focus:border-blue-600/50 focus:ring-2 focus:ring-blue-900/30"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-blue-100/50">
                    USDC
                  </span>
                </div>

                {/* Send */}

                <button
                  onClick={handleSend}
                  disabled={
                    !isConnected ||
                    isSending ||
                    isConfirming
                  }
                  className="mt-6 min-h-12 w-full rounded-xl bg-white py-3.5 font-semibold text-black shadow-lg shadow-blue-950/20 transition duration-200 hover:bg-blue-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-blue-950/40 disabled:text-blue-100/30"
                >
                  {!isConnected
                    ? "Connect Wallet First"
                    : isSending
                    ? "Confirm in Wallet..."
                    : isConfirming
                    ? "Confirming..."
                    : "Send USDC"}
                </button>

                {/* Network */}

                {isConnected &&
                  chainId !== arcTestnet.id && (
                    <button
                      onClick={() =>
                        switchChain({
                          chainId: arcTestnet.id,
                        })
                      }
                      className="mt-3 min-h-12 w-full rounded-xl border border-blue-800/40 bg-blue-950/20 py-3 text-sm font-semibold text-white transition hover:border-blue-600/50 hover:bg-blue-900/30 active:scale-[0.99]"
                    >
                      Switch to Arc Testnet
                    </button>
                  )}

                {/* Error */}

                {error && (
                  <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                    <p className="break-words text-sm leading-5 text-red-400">
                      {error}
                    </p>
                  </div>
                )}

                {/* Transaction Error */}

                {sendError && (
                  <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                    <p className="break-words text-sm leading-5 text-red-400">
                      {getFriendlyErrorMessage(
                        sendError.message
                      )}
                    </p>
                  </div>
                )}

                {/* Success */}

                {isConfirmed && hash && (
                  <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                    <p className="text-sm font-medium text-green-400">
                      Transaction confirmed ✓
                    </p>

                    <a
                      href={`https://testnet.arcscan.app/tx/${hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block break-words text-sm text-blue-100/60 underline transition hover:text-white"
                    >
                      View on Arc Explorer
                    </a>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Swap */}

        {activeSection === "swap" && (
          <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16 lg:px-10 lg:py-24">
            <div className="mx-auto max-w-md">
              <p className="text-sm text-blue-200/40">
                AlabaamaFi
              </p>

              <h2 className="mt-1 text-3xl font-bold sm:text-4xl">
                Token Swap
              </h2>

              <p className="mt-2 text-sm leading-6 text-blue-100/40">
                Swap supported assets on Arc Testnet.
              </p>

              <div className="mt-7 rounded-3xl border border-blue-900/30 bg-gradient-to-br from-blue-950/35 to-[#061024] p-4 shadow-2xl shadow-blue-950/20 sm:mt-8 sm:p-6">
                <div className="mb-6 rounded-2xl border border-blue-900/40 bg-[#020817] p-4 sm:p-5">
                  <p className="text-xs text-blue-100/40">
                    You pay
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-2xl font-semibold">
                      0.00
                    </span>

                    <span className="shrink-0 rounded-full border border-blue-800/30 bg-blue-900/25 px-4 py-2 text-sm font-semibold">
                      USDC
                    </span>
                  </div>
                </div>

                <div className="mx-auto -my-3 flex h-8 w-8 items-center justify-center rounded-full border border-blue-800/40 bg-[#050b1a] text-blue-100/50">
                  ↓
                </div>

                <div className="mb-6 rounded-2xl border border-blue-900/40 bg-[#020817] p-4 sm:p-5">
                  <p className="text-xs text-blue-100/40">
                    You receive
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-2xl font-semibold">
                      0.00
                    </span>

                    <span className="shrink-0 rounded-full border border-blue-800/30 bg-blue-900/25 px-4 py-2 text-sm font-semibold">
                      Token
                    </span>
                  </div>
                </div>

                <button
                  disabled
                  className="min-h-12 w-full rounded-xl border border-blue-900/30 bg-blue-950/30 py-3.5 font-semibold text-blue-100/30"
                >
                  Swap coming soon
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Bridge */}

        {activeSection === "bridge" && (
          <section className="mx-auto max-w-5xl px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-10 lg:py-24">
            <div className="mx-auto max-w-md">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-900/40 bg-blue-950/30 text-3xl text-blue-100/70 shadow-lg shadow-blue-950/20">
                ⇅
              </div>

              <h2 className="mt-5 text-3xl font-bold sm:text-4xl">
                Bridge
              </h2>

              <p className="mt-4 leading-7 text-blue-100/40">
                Bridge support will be added after we
                integrate a verified Arc-compatible
                bridge.
              </p>

              <div className="mt-8 rounded-2xl border border-blue-900/30 bg-blue-950/20 p-5 text-sm text-blue-100/40">
                Coming soon
              </div>
            </div>
          </section>
        )}

        {/* Activity */}

        {activeSection === "activity" && (
          <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-20">
            <div className="mx-auto max-w-2xl">
              <p className="text-sm text-blue-200/40">
                AlabaamaFi
              </p>

              <h2 className="mt-1 text-3xl font-bold sm:text-4xl">
                Wallet Activity
              </h2>

              <p className="mt-3 text-sm leading-6 text-blue-100/40">
                Connect your wallet to view its token
                holdings and recent transactions.
              </p>

              <div className="mt-7 rounded-3xl border border-blue-900/30 bg-gradient-to-br from-blue-950/35 to-[#061024] p-4 shadow-2xl shadow-blue-950/20 sm:mt-8 sm:p-6">
                {/* Connected Wallet Address */}

                <div>
                  <label className="mb-2 block text-sm text-blue-100/50">
                    Wallet Address
                  </label>

                  <input
                    type="text"
                    placeholder="Connect wallet first"
                    value={activityAddress}
                    readOnly
                    disabled={!isConnected}
                    className="min-h-12 w-full cursor-not-allowed rounded-xl border border-blue-900/40 bg-[#020817] px-4 py-3 text-sm text-blue-100/70 outline-none placeholder:text-blue-100/20 disabled:text-blue-100/30"
                  />
                </div>

                {/* Activity Button */}

                <button
                  onClick={() => {
                    if (!isConnected) {
                      setError("");
                      setShowWallets(true);
                      return;
                    }

                    handleCheckActivity();
                  }}
                  disabled={
                    isConnected && activityLoading
                  }
                  className="mt-4 min-h-12 w-full rounded-xl bg-white py-3.5 font-semibold text-black shadow-lg shadow-blue-950/20 transition duration-200 hover:bg-blue-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-blue-950/40 disabled:text-blue-100/30"
                >
                  {activityLoading
                    ? "Checking..."
                    : isConnected
                    ? "Check Activity"
                    : "Connect Wallet"}
                </button>

                {activityError && (
                  <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                    <p className="break-words text-sm leading-5 text-red-400">
                      {activityError}
                    </p>
                  </div>
                )}
              </div>

              {/* Portfolio */}

              {(activityTokens.length > 0 ||
                activityTransactions.length > 0) && (
                <div className="mt-7 sm:mt-8">
                  <div className="rounded-2xl border border-blue-900/30 bg-blue-950/20 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs text-blue-100/30">
                          Portfolio
                        </p>

                        <p className="mt-2 text-3xl font-semibold">
                          {portfolioValue !== null
                            ? `$${portfolioValue.toFixed(2)}`
                            : "Value unavailable"}
                        </p>
                      </div>

                      <div className="w-fit rounded-xl border border-blue-800/30 bg-blue-900/25 px-3 py-2 text-xs text-blue-100/50">
                        Arc Testnet
                      </div>
                    </div>
                  </div>

                  {/* Token Holdings */}

                  {activityTokens.length > 0 && (
                    <div className="mt-7 sm:mt-8">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="font-semibold">
                          Token Holdings
                        </h3>

                        <span className="shrink-0 text-xs text-blue-100/30">
                          {activityTokens.length} token
                          {activityTokens.length !== 1
                            ? "s"
                            : ""}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {activityTokens.map((token) => (
                          <div
                            key={`${token.address}-${token.symbol}`}
                            className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-blue-900/30 bg-blue-950/20 p-4"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              {token.logo ? (
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                                  <img
                                    src={token.logo}
                                    alt={`${token.symbol} logo`}
                                    className="h-10 w-10 rounded-full object-contain"
                                    style={
                                      token.symbol.toUpperCase() ===
                                      "CIRBTC"
                                        ? {
                                            transform:
                                              "scale(0.75)",
                                          }
                                        : undefined
                                    }
                                  />
                                </div>
                              ) : (
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-900/30 text-sm font-semibold">
                                  {token.symbol
                                    .slice(0, 1)
                                    .toUpperCase()}
                                </div>
                              )}

                              <div className="min-w-0">
                                <p className="font-medium">
                                  {token.symbol}
                                </p>

                                <p className="mt-1 truncate text-xs text-blue-100/30">
                                  {token.name}
                                </p>
                              </div>
                            </div>

                            {/* Amount + USD */}

                            <div className="ml-2 shrink-0 text-right sm:ml-4">
                              <p className="font-semibold">
                                {Number(
                                  token.amount
                                ).toLocaleString(
                                  undefined,
                                  {
                                    maximumFractionDigits:
                                      6,
                                  }
                                )}
                              </p>

                              <p className="mt-1 text-xs text-blue-100/30">
                                {token.usdValue !== null
                                  ? `$${token.usdValue.toFixed(2)}`
                                  : "USD value unavailable"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transaction Count */}

                  {activityTransactions.length > 0 && (
                    <div className="mt-7 rounded-2xl border border-blue-900/30 bg-blue-950/20 p-5 sm:mt-8">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs text-blue-100/30">
                            Transactions
                          </p>

                          <p className="mt-2 text-2xl font-semibold">
                            {activityTransactions.length}
                          </p>
                        </div>

                        <span className="text-right text-xs text-blue-100/30">
                          Recent activity
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Transactions */}

              {activityTransactions.length > 0 && (
                <div className="mt-7 sm:mt-8">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="font-semibold">
                      Recent Transactions
                    </h3>

                    <span className="shrink-0 text-xs text-blue-100/30">
                      {activityTransactions.length} found
                    </span>
                  </div>

                  <div className="space-y-3">
                    {activityTransactions.map((tx) => {
                      const transactionDate = tx.timestamp
                        ? new Date(tx.timestamp)
                        : null;

                      const formattedDate =
                        transactionDate &&
                        !Number.isNaN(
                          transactionDate.getTime()
                        )
                          ? transactionDate.toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )
                          : "Date unavailable";

                      const formattedTime =
                        transactionDate &&
                        !Number.isNaN(
                          transactionDate.getTime()
                        )
                          ? transactionDate.toLocaleTimeString(
                              undefined,
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: false,
                              }
                            )
                          : "Time unavailable";

                      return (
                        <div
                          key={tx.hash}
                          className="rounded-2xl border border-blue-900/30 bg-blue-950/20 p-4 transition hover:bg-blue-900/25 sm:p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-sm font-medium">
                                Transaction
                              </p>

                              <p className="mt-1 break-all text-xs leading-5 text-blue-100/30">
                                {tx.hash}
                              </p>
                            </div>
                          </div>

                          {/* Date & Time */}

                          <div className="mt-4 rounded-xl border border-blue-900/20 bg-[#020817]/50 px-3 py-2.5">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-xs text-blue-100/30">
                                Date
                              </span>

                              <span className="text-right text-xs text-blue-100/60">
                                {formattedDate}
                              </span>
                            </div>

                            <div className="mt-1.5 flex items-center justify-between gap-4">
                              <span className="text-xs text-blue-100/30">
                                Time
                              </span>

                              <span className="text-right text-xs text-blue-100/60">
                                {formattedTime ||
                                  "Time unavailable"}
                              </span>
                            </div>
                          </div>

                          {/* Transaction Details */}

                          <div className="mt-4 grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
                            <div className="min-w-0">
                              <p className="text-blue-100/30">
                                From
                              </p>

                              <p className="mt-1 break-all text-blue-100/60">
                                {tx.from}
                              </p>
                            </div>

                            <div className="min-w-0">
                              <p className="text-blue-100/30">
                                To
                              </p>

                              <p className="mt-1 break-all text-blue-100/60">
                                {tx.to}
                              </p>
                            </div>

                            <div>
                              <p className="text-blue-100/30">
                                Value
                              </p>

                              <p className="mt-1 break-words font-medium text-blue-100/70">
                                {tx.value}
                                {tx.tokenSymbol
                                  ? ` ${tx.tokenSymbol}`
                                  : ""}
                              </p>
                            </div>

                            <div>
                              <p className="text-blue-100/30">
                                Status
                              </p>

                              <p className="mt-1 text-green-400">
                                {tx.status}
                              </p>
                            </div>
                          </div>

                          {/* ArcScan */}

                          <div className="mt-4 border-t border-blue-900/30 pt-3">
                            <a
                              href={`https://testnet.arcscan.app/tx/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-blue-100/40 transition hover:text-white"
                            >
                              View on ArcScan
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!activityLoading &&
                isConnected &&
                activityAddress &&
                activityTransactions.length === 0 &&
                activityTokens.length === 0 &&
                !activityError && (
                  <div className="mt-8 rounded-2xl border border-blue-900/30 bg-blue-950/20 p-6 text-center">
                    <p className="text-sm leading-6 text-blue-100/40">
                      No transactions or token holdings
                      found for this wallet.
                    </p>
                  </div>
                )}
            </div>
          </section>
        )}

        {/* Faucet */}

        {activeSection === "faucet" && (
          <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-24">
            <div className="mx-auto max-w-md text-center">
              {/* Balanced Faucet Icon */}

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-900/40 bg-blue-950/30 shadow-lg shadow-blue-950/20">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-800/40 bg-blue-900/25 text-2xl leading-none text-blue-100/70">
                  ◌
                </span>
              </div>

              <h2 className="mt-6 text-3xl font-bold sm:text-4xl">
                Get Testnet Tokens
              </h2>

              <p className="mt-4 text-sm leading-7 text-blue-100/40 sm:text-base">
                Get testnet tokens from the official
                Circle faucet and use them to test
                AlabaamaFi on Arc Testnet.
              </p>

              <a
                href="https://faucet.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 block min-h-12 w-full rounded-xl bg-white py-3.5 font-semibold text-black shadow-lg shadow-blue-950/20 transition duration-200 hover:bg-blue-50 active:scale-[0.99]"
              >
                Get Testnet Tokens
              </a>

              <p className="mt-4 text-xs leading-5 text-blue-100/30">
                Opens the official Circle faucet in a new
                tab.
              </p>
            </div>
          </section>
        )}

        {/* Footer */}

        <footer className="border-t border-blue-900/30 px-4 py-8 text-center sm:px-6">
          <p className="text-xs text-blue-100/30 sm:text-sm">
            AlabaamaFi • Built on Arc Network
          </p>
        </footer>
      </div>

      {/* Wallet Modal */}

      {showWallets && !isConnected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#020617]/80 px-3 py-4 backdrop-blur-sm sm:px-6 sm:py-8">
          <div className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-sm overflow-y-auto rounded-3xl border border-blue-900/40 bg-[#050b1a] p-4 shadow-2xl shadow-blue-950/40 sm:max-h-[90vh] sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4 sm:mb-6">
              <div className="min-w-0">
                <h3 className="text-xl font-semibold">
                  Connect Wallet
                </h3>

                <p className="mt-1 text-sm text-blue-100/40">
                  Choose a wallet to continue
                </p>
              </div>

              <button
                onClick={() =>
                  setShowWallets(false)
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-blue-100/50 transition hover:bg-blue-900/30 hover:text-white active:scale-95"
                aria-label="Close wallet modal"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Browser Wallet */}

              {browserConnector && (
                <button
                  onClick={() =>
                    handleConnect(browserConnector)
                  }
                  disabled={isPending}
                  className="flex min-h-[72px] w-full items-center justify-between gap-3 rounded-xl border border-blue-900/40 bg-blue-950/25 px-4 py-3.5 text-left transition duration-200 hover:border-blue-700/50 hover:bg-blue-900/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative shrink-0">
                      <img
                        src="/wallets/browser.svg"
                        alt=""
                        className="h-8 w-8 rounded-lg object-contain"
                      />

                      {detectedBrowserWallets.length >
                        0 && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 translate-x-1/4 translate-y-1/4 rounded-full border-2 border-[#050b1a] bg-green-500" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="font-medium">
                        Browser Wallet
                      </p>

                      <p className="mt-1 text-xs leading-5 text-blue-100/30">
                        MetaMask and other browser wallets
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 text-sm text-blue-100/30">
                    •
                  </span>
                </button>
              )}

              {/* Detected Browser Wallets */}

              {detectedBrowserWallets.map(
                (connector) => {
                  const name =
                    connector.name.toLowerCase();

                  let displayName =
                    connector.name;

                  let logo =
                    connector.icon || null;

                  if (name.includes("brave")) {
                    displayName = "Brave Wallet";
                    logo = "/wallets/brave.svg";
                  } else if (
                    name.includes("rabby")
                  ) {
                    displayName = "Rabby";
                    logo = "/wallets/rabby.svg";
                  } else if (
                    name.includes("okx") ||
                    name.includes("okex")
                  ) {
                    displayName = "OKX Wallet";
                    logo = "/wallets/okx.svg";
                  }

                  return (
                    <button
                      key={connector.uid}
                      onClick={() =>
                        handleConnect(connector)
                      }
                      disabled={isPending}
                      className="flex min-h-[72px] w-full items-center justify-between gap-3 rounded-xl border border-blue-900/40 bg-blue-950/25 px-4 py-3.5 text-left transition duration-200 hover:border-blue-700/50 hover:bg-blue-900/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative shrink-0">
                          {logo ? (
                            <img
                              src={logo}
                              alt=""
                              className="h-8 w-8 rounded-lg object-contain"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900/30 text-sm">
                              ◇
                            </div>
                          )}

                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 translate-x-1/4 translate-y-1/4 rounded-full border-2 border-[#050b1a] bg-green-500" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {displayName}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-blue-100/30">
                            Available in your browser
                          </p>
                        </div>
                      </div>

                      <span className="shrink-0 text-sm text-blue-100/30">
                        •
                      </span>
                    </button>
                  );
                }
              )}

              {/* WalletConnect */}

              {walletConnectConnector && (
                <button
                  onClick={() =>
                    handleConnect(
                      walletConnectConnector
                    )
                  }
                  disabled={isPending}
                  className="flex min-h-[72px] w-full items-center justify-between gap-3 rounded-xl border border-blue-900/40 bg-blue-950/25 px-4 py-3.5 text-left transition duration-200 hover:border-blue-700/50 hover:bg-blue-900/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src="/wallets/walletconnect.svg"
                      alt=""
                      className="h-8 w-8 shrink-0 rounded-lg object-contain"
                    />

                    <div className="min-w-0">
                      <p className="font-medium">
                        WalletConnect
                      </p>

                      <p className="mt-1 text-xs leading-5 text-blue-100/30">
                        Scan with a mobile wallet
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 text-sm text-blue-100/30">
                    •
                  </span>
                </button>
              )}

              {/* MetaMask */}

              <button
                onClick={handleMetaMaskClick}
                disabled={isPending}
                className="flex min-h-[72px] w-full items-center justify-between gap-3 rounded-xl border border-blue-900/40 bg-blue-950/25 px-4 py-3.5 text-left transition duration-200 hover:border-blue-700/50 hover:bg-blue-900/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src="/wallets/metamask.svg"
                      alt=""
                      className="h-8 w-8 rounded-lg object-contain"
                    />

                    {metaMaskConnector && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 translate-x-1/4 translate-y-1/4 rounded-full border-2 border-[#050b1a] bg-green-500" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-medium">
                      MetaMask
                    </p>

                    <p className="mt-1 text-xs leading-5 text-blue-100/30">
                      {isMobileDevice()
                        ? "Open in MetaMask"
                        : metaMaskConnector
                        ? "Available in your browser"
                        : "Install MetaMask"}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 text-sm text-blue-100/30">
                  •
                </span>
              </button>

              {/* Coinbase Wallet */}

              {coinbaseConnector && (
                <button
                  onClick={() =>
                    handleConnect(
                      coinbaseConnector
                    )
                  }
                  disabled={isPending}
                  className="flex min-h-[72px] w-full items-center justify-between gap-3 rounded-xl border border-blue-900/40 bg-blue-950/25 px-4 py-3.5 text-left transition duration-200 hover:border-blue-700/50 hover:bg-blue-900/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src="/wallets/base.svg"
                      alt=""
                      className="h-8 w-8 shrink-0 rounded-lg object-contain"
                    />

                    <div className="min-w-0">
                      <p className="font-medium">
                        Coinbase Wallet
                      </p>

                      <p className="mt-1 text-xs leading-5 text-blue-100/30">
                        Connect with Coinbase Wallet
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 text-sm text-blue-100/30">
                    •
                  </span>
                </button>
              )}
            </div>

            {/* Connection Error */}

            {connectError && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                <p className="break-words text-sm leading-5 text-red-400">
                  {getFriendlyErrorMessage(
                    connectError.message
                  )}
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                <p className="break-words text-sm leading-5 text-red-400">
                  {error}
                </p>
              </div>
            )}

            <p className="mt-5 text-center text-xs leading-5 text-blue-100/30">
              WalletConnect supports many mobile and desktop
              wallets.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
