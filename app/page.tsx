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

  if (lowerMessage.includes("transaction rejected")) {
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

/* CLEAR FROSTED GLASS - CONNECT WALLET */

const connectGlassButton =
  "border border-white/[0.22] bg-gradient-to-br from-white/[0.14] via-white/[0.08] to-white/[0.035] text-white shadow-[0_8px_30px_rgba(255,255,255,0.05),0_10px_35px_rgba(0,0,0,0.32)] backdrop-blur-2xl transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.34] hover:from-white/[0.18] hover:via-white/[0.11] hover:to-white/[0.055] hover:shadow-[0_10px_35px_rgba(255,255,255,0.08),0_18px_45px_rgba(0,0,0,0.42)] active:translate-y-0";

/* CLEAN PROFESSIONAL WHITE BUTTON */

const silverGlassButton =
  "border border-black/[0.08] bg-white text-black shadow-[0_2px_6px_rgba(0,0,0,0.06),0_10px_28px_rgba(0,0,0,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#fafafa] hover:shadow-[0_4px_10px_rgba(0,0,0,0.08),0_14px_34px_rgba(0,0,0,0.18)] active:translate-y-0";

/* DISCONNECTED / UNAVAILABLE BUTTON */

const unavailableButton =
  "border border-white/[0.05] bg-[#111318] text-white/20 shadow-none cursor-not-allowed";

export default function Home() {
  const [showWallets, setShowWallets] =
    useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeSection, setActiveSection] =
    useState<Section>("home");

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

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
      const transactions =
        await getWalletTransactions(walletAddress);

      setActivityTransactions(transactions);

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
      } catch {}

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
  "0x70a08231" +
  walletAddress.slice(2).padStart(64, "0"),
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

      const nonUsdcTokens =
        apiTokens.filter(
          (token) =>
            token.symbol.toUpperCase() !==
            "USDC"
        );

      const usdcToken: TokenHolding = {
        address: USDC_ADDRESS,
        symbol: "USDC",
        name: "USD Coin",
        amount: usdcAmount.toFixed(6),
        logo: "/tokens/usdc.svg",
        usdValue: usdcAmount,
      };

      const holdings = [
        usdcToken,
        ...nonUsdcTokens,
      ];

      setActivityTokens(holdings);

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
    <main className="min-h-screen bg-[#030405] text-white">
      {/* HEADER */}

      <header className="border-b border-white/[0.06] bg-[#040506]/95 backdrop-blur-xl">
        <div className="mx-auto grid min-h-[72px] max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowMenu(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-[#060709] text-lg font-bold text-white/70 transition-all duration-200 hover:border-white/[0.14] hover:bg-[#0a0d12] hover:text-white active:scale-95"
              aria-label="Open menu"
            >
              ☰
            </button>

            <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-white/[0.07] bg-[#060709] px-3 py-2">
              <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-green-500" />

              <span className="text-[11px] font-bold text-white/70 sm:text-xs">
                Testnet
              </span>
            </div>
          </div>

          <div className="min-w-0 text-center">
            <h1 className="truncate text-sm font-bold sm:text-base lg:text-xl">
              AlabaamaFi
            </h1>

            <p className="mt-0.5 text-[9px] font-semibold text-white/30 sm:text-[10px] lg:text-xs">
              Powered by Arc
            </p>
          </div>

          <div className="flex min-w-0 items-center justify-end">
            <button
              onClick={handleWalletButton}
              className={`max-w-[155px] truncate rounded-full px-3.5 py-2.5 text-xs !font-black tracking-tight sm:max-w-none sm:px-5 sm:py-3 lg:text-sm ${connectGlassButton}`}
            >
              {isConnected
                ? shortAddress
                : "Connect Wallet"}
            </button>
          </div>
        </div>
      </header>

      {/* MENU */}

      {showMenu && (
        <div className="fixed inset-0 z-40">
          <button
            onClick={() => setShowMenu(false)}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            aria-label="Close menu"
          />

          <aside className="relative z-50 flex min-h-screen w-[min(18rem,88vw)] flex-col border-r border-white/[0.06] bg-[#040506] p-4 shadow-2xl shadow-black/80 sm:p-5">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  AlabaamaFi
                </h2>

                <p className="mt-1 text-xs font-semibold text-white/30">
                  Powered by Arc
                </p>
              </div>

              <button
                onClick={() => setShowMenu(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white/50 transition hover:bg-white/[0.04] hover:text-white active:scale-95"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <nav className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    handleNavigation(item.id)
                  }
                  className={`flex min-h-12 w-full items-center gap-4 rounded-full px-4 py-3.5 text-left transition-all duration-200 active:scale-[0.99] ${
                    activeSection === item.id
                      ? `${silverGlassButton}`
                      : "text-white/60 hover:bg-[#0a0d12] hover:text-white"
                  }`}
                >
                  <span className="w-6 shrink-0 text-center text-lg font-bold">
                    {item.icon}
                  </span>

                  <span className="text-sm font-bold">
                    {item.label}
                  </span>
                </button>
              ))}
            </nav>

            <div className="mt-auto pt-8">
              <button
                onClick={handleWalletButton}
                className={`w-full rounded-full px-4 py-3.5 text-sm !font-black tracking-tight active:scale-[0.99] ${connectGlassButton}`}
              >
                {isConnected
                  ? shortAddress
                  : "Connect Wallet"}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* CONTENT */}

      <div className="min-w-0">
        {/* HOME */}

        {activeSection === "home" && (
          <section>
            {/* HERO */}

            <div className="relative overflow-hidden border-b border-white/[0.06] bg-[#030507]">
              <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[#14376a]/[0.09] blur-[120px]" />

              <div className="pointer-events-none absolute left-1/2 top-[45%] h-40 w-80 -translate-x-1/2 rounded-full bg-white/[0.015] blur-3xl" />

              <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-16 text-center sm:px-6 sm:pb-24 sm:pt-24 lg:px-10 lg:pb-28 lg:pt-28">
                <div className="mx-auto max-w-5xl">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/30 sm:text-sm">
                    A simple interface for Arc
                  </p>

                  <h2 className="mx-auto mt-7 max-w-4xl text-center text-[3.7rem] font-black leading-[0.88] tracking-[-0.055em] sm:text-7xl lg:text-[7.5rem]">
                    Simple.
                    <br />
                    <span className="text-white/30">
                      On-chain.
                    </span>
                  </h2>

                  <p className="mx-auto mt-8 max-w-2xl text-sm font-medium leading-7 text-white/45 sm:mt-9 sm:text-lg sm:leading-8">
                    Explore, send and manage digital
                    assets on Arc through a clean,
                    simple and user-focused DeFi
                    experience.
                  </p>

                  <div className="mt-9 flex flex-col justify-center gap-3 sm:mt-10 sm:flex-row">
                    <button
                      onClick={() =>
                        handleNavigation("send")
                      }
                      className={`min-h-13 w-full rounded-2xl px-7 py-4 text-base !font-bold tracking-normal sm:w-auto ${silverGlassButton}`}
                    >
                      Send Assets
                    </button>

                    <button
                      onClick={() =>
                        handleNavigation("activity")
                      }
                      className="min-h-13 w-full rounded-2xl border border-white/[0.10] bg-white/[0.045] px-7 py-4 text-sm font-black tracking-tight text-white/80 shadow-lg shadow-black/20 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.18] hover:bg-white/[0.08] hover:text-white active:translate-y-0 sm:w-auto"
                    >
                      Check Wallet Activity
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* QUICK ACTIONS */}

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
              <div className="mb-6 text-center sm:mb-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/25">
                  Explore AlabaamaFi
                </p>

                <h3 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  Everything in one place
                </h3>

                <p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-6 text-white/30">
                  Simple tools for interacting with
                  assets and activity on Arc Testnet.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    id: "send" as Section,
                    icon: "↗",
                    title: "Send USDC",
                    text: "Send USDC to another wallet.",
                  },
                  {
                    id: "swap" as Section,
                    icon: "⇄",
                    title: "Swap Tokens",
                    text: "Swap supported assets on Arc.",
                  },
                  {
                    id: "bridge" as Section,
                    icon: "⇅",
                    title: "Bridge USDC",
                    text: "Move assets across networks.",
                  },
                  {
                    id: "activity" as Section,
                    icon: "◷",
                    title: "Wallet Activity",
                    text: "Explore wallet activity and assets.",
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      handleNavigation(item.id)
                    }
                    className="group min-w-0 rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#0a0f16] via-[#07090c] to-[#030303] p-6 text-left shadow-lg shadow-black/40 transition-all duration-200 hover:-translate-y-1 hover:border-[#2b6cff]/20 hover:shadow-xl hover:shadow-black/50 active:translate-y-0"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-[#080a0d] text-xl font-bold text-white/65 transition-all group-hover:border-[#2b6cff]/20 group-hover:bg-[#0b1017] group-hover:text-white">
                      {item.icon}
                    </div>

                    <h4 className="mt-6 font-black tracking-tight">
                      {item.title}
                    </h4>

                    <p className="mt-2 text-sm font-medium leading-6 text-white/30">
                      {item.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* SILVER DIVIDER */}

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </div>

            {/* SUPPORTED ASSETS */}

            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
              <div className="p-0">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/25">
                      Supported Assets
                    </p>

                    <h3 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                      Explore assets on Arc
                    </h3>

                    <p className="mt-3 max-w-xl text-sm font-medium leading-7 text-white/30">
                      AlabaamaFi currently displays
                      <br className="sm:hidden" />{" "}
                      USDC, EURC and cirBTC balances
                      <br />
                      <span className="text-white/45">
                        Available on Arc Network
                      </span>
                    </p>
                  </div>

                  <div className="grid w-full grid-cols-3 gap-4 lg:w-auto lg:min-w-[460px]">
                    <div className="flex min-w-0 items-center gap-2 p-1 sm:gap-3">
                      <img
                        src="/tokens/usdc.svg"
                        alt="USDC"
                        className="h-9 w-9 shrink-0 rounded-full object-contain"
                      />

                      <div className="min-w-0">
                        <p className="truncate font-black">
                          USDC
                        </p>

                        <p className="mt-0.5 hidden text-xs font-medium text-white/25 sm:block">
                          USD Coin
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-center gap-2 p-1 sm:gap-3">
                      <img
                        src="/tokens/eurc.svg"
                        alt="EURC"
                        className="h-9 w-9 shrink-0 rounded-full object-contain"
                      />

                      <div className="min-w-0">
                        <p className="truncate font-black">
                          EURC
                        </p>

                        <p className="mt-0.5 hidden text-xs font-medium text-white/25 sm:block">
                          Euro Coin
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-center gap-2 p-1 sm:gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                        <img
                          src="/tokens/cirbtc.svg"
                          alt="cirBTC"
                          className="h-9 w-9 rounded-full object-contain"
                          style={{
                            transform: "scale(0.75)",
                          }}
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-black">
                          cirBTC
                        </p>

                        <p className="mt-0.5 hidden text-xs font-medium text-white/25 sm:block">
                          Bitcoin
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ARC NETWORK */}

            <div className="border-y border-white/[0.06] bg-[#030405]">
              <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
                <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/25">
                    Arc Network
                  </p>

                  <h3 className="mx-auto mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                    Simple interfaces.
                    <br />
                    Powerful infrastructure.
                  </h3>

                  <p className="mx-auto mt-5 max-w-2xl text-sm font-medium leading-7 text-white/35 sm:text-base">
                    AlabaamaFi keeps the user experience
                    simple while connecting directly to
                    Arc Testnet infrastructure.
                  </p>
                </div>

                <div className="mx-auto mt-10 grid max-w-5xl gap-3 sm:grid-cols-3">
                  <div className="rounded-3xl border border-white/[0.07] bg-[#07090c] p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-[#0a0d12] text-lg font-black">
                      01
                    </div>

                    <h4 className="mt-5 font-black">
                      Connect
                    </h4>

                    <p className="mt-2 text-sm font-medium leading-6 text-white/30">
                      Connect your preferred EVM
                      wallet.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/[0.07] bg-[#07090c] p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-[#0a0d12] text-lg font-black">
                      02
                    </div>

                    <h4 className="mt-5 font-black">
                      Explore
                    </h4>

                    <p className="mt-2 text-sm font-medium leading-6 text-white/30">
                      Check balances and on-chain
                      activity.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/[0.07] bg-[#07090c] p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-[#0a0d12] text-lg font-black">
                      03
                    </div>

                    <h4 className="mt-5 font-black">
                      Transact
                    </h4>

                    <p className="mt-2 text-sm font-medium leading-6 text-white/30">
                      Send assets directly on Arc.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ARC ECOSYSTEM */}

            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
              <div className="rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#0a0f16] via-[#06080b] to-[#030303] p-6 shadow-xl shadow-black/40 sm:p-8 lg:p-10">
                <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/25">
                      Arc Ecosystem
                    </p>

                    <h3 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                      Stay connected to Arc
                    </h3>

                    <p className="mt-3 max-w-xl text-sm font-medium leading-7 text-white/30">
                      Explore Arc and connect with the
                      community.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-5">
                    <a
                      href="https://www.arc.network/"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Arc Network"
                      title="Arc Network"
                      className="flex items-center justify-center text-white/60 transition-all duration-200 hover:-translate-y-0.5 hover:text-white active:translate-y-0"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-6 w-6"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />

                        <path
                          d="M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </a>

                    <a
                      href="https://x.com/arc"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Arc on X"
                      title="Arc on X"
                      className="flex items-center justify-center text-white/60 transition-all duration-200 hover:-translate-y-0.5 hover:text-white active:translate-y-0"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817-5.962 6.817H1.684l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
                      </svg>
                    </a>

                    <a
                      href="https://discord.com/invite/buildoncircle"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Arc Discord"
                      title="Arc Discord"
                      className="flex items-center justify-center text-white/60 transition-all duration-200 hover:-translate-y-0.5 hover:text-white active:translate-y-0"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-6 w-6"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.444.864-.608 1.249-1.845-.276-3.68-.276-5.486 0-.164-.394-.405-.874-.617-1.249a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.678 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.868 19.868 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028c.461-.63.872-1.295 1.226-1.994a.076.076 0 0 0-.041-.105 13.17 13.17 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.927 1.794 8.18 1.794 12.061 0a.074.074 0 0 1 .078.01c.12.099.246.197.373.291a.077.077 0 0 1-.006.128c-.598.353-1.22.65-1.873.892a.077.077 0 0 0-.041.106c.36.698.771 1.364 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.548-13.66a.061.061 0 0 0-.033-.027ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.175 1.095 2.157 2.418 0 1.334-.956 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.175 1.095 2.157 2.418 0 1.334-.947 2.419-2.157 2.419Z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* TESTNET CTA */}

            <div className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-20 lg:px-10">
              <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-[#06080b] p-7 text-center shadow-2xl shadow-black/50 sm:p-10 lg:p-14">
                <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-96 -translate-x-1/2 rounded-full bg-[#173a70]/[0.08] blur-3xl" />

                <div className="relative">
                  <div className="text-4xl font-medium leading-none text-white/55">
                    ◌
                  </div>

                  <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-white/25">
                    Arc Testnet
                  </p>

                  <h3 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                    Ready to try it?
                  </h3>

                  <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-7 text-white/30">
                    Get testnet tokens and start
                    exploring AlabaamaFi on Arc.
                  </p>

                  <button
                    onClick={() =>
                      handleNavigation("faucet")
                    }
                    className={`mt-7 min-h-12 rounded-2xl px-7 py-3.5 text-sm !font-bold tracking-tight ${silverGlassButton}`}
                  >
                    Get Faucet
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SEND */}

        {activeSection === "send" && (
          <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-20">
            <div className="mx-auto max-w-md">
              <div className="mb-6 sm:mb-8">
                <p className="text-sm font-semibold text-white/35">
                  AlabaamaFi
                </p>

                <h2 className="mt-1 text-3xl font-black sm:text-4xl">
                  Send USDC
                </h2>

                <p className="mt-2 text-sm font-medium leading-6 text-white/35">
                  Send USDC to another wallet on Arc
                  Testnet.
                </p>
              </div>

              <div className="rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#0a0f16] via-[#06080b] to-[#030303] p-4 shadow-2xl shadow-black/60 sm:p-6">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <h3 className="font-black">
                    Transfer
                  </h3>

                  <span className="shrink-0 rounded-full border border-white/[0.07] bg-[#080a0d] px-3 py-1 text-xs font-bold text-white/45">
                    Testnet
                  </span>
                </div>

                <label className="mb-2 block text-sm font-bold text-white/50">
                  Recipient
                </label>

                <input
                  type="text"
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) =>
                    setRecipient(e.target.value)
                  }
                  className="mb-5 min-h-13 w-full rounded-2xl border border-white/[0.07] bg-[#020202] px-4 py-3 text-sm font-medium outline-none transition placeholder:text-white/15 focus:border-[#2b6cff]/25 focus:ring-2 focus:ring-[#163a72]/30"
                />

                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <label className="text-sm font-bold text-white/50">
                    Amount
                  </label>

                  <span className="text-xs font-semibold text-white/25">
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
                    className="min-h-13 w-full rounded-2xl border border-white/[0.07] bg-[#020202] px-4 py-3 pr-20 text-lg font-bold outline-none transition placeholder:text-white/15 focus:border-[#2b6cff]/25 focus:ring-2 focus:ring-[#163a72]/30"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-white/45">
                    USDC
                  </span>
                </div>

                <button
                  onClick={handleSend}
                  disabled={
                    !isConnected ||
                    isSending ||
                    isConfirming
                  }
                  className={`mt-6 min-h-13 w-full rounded-full px-5 py-4 text-sm font-black tracking-tight ${
                    !isConnected
                      ? unavailableButton
                      : silverGlassButton
                  } ${
                    isConnected
                      ? "disabled:cursor-not-allowed disabled:opacity-60"
                      : ""
                  }`}
                >
                  {!isConnected
                    ? "Connect Wallet"
                    : isSending
                    ? "Confirm in Wallet"
                    : isConfirming
                    ? "Confirming Transaction"
                    : "Send"}
                </button>

                {isConnected &&
                  chainId !== arcTestnet.id && (
                    <button
                      onClick={() =>
                        switchChain({
                          chainId: arcTestnet.id,
                        })
                      }
                      className="mt-3 min-h-13 w-full rounded-full border border-white/[0.09] bg-white/[0.045] py-3.5 text-sm font-black tracking-tight text-white backdrop-blur-xl transition-all hover:border-white/[0.17] hover:bg-white/[0.08] active:scale-[0.99]"
                    >
                      Switch to Arc Testnet
                    </button>
                  )}

                {error && (
                  <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
                    <p className="break-words text-sm font-semibold leading-5 text-red-400">
                      {error}
                    </p>
                  </div>
                )}

                {sendError && (
                  <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
                    <p className="break-words text-sm font-semibold leading-5 text-red-400">
                      {getFriendlyErrorMessage(
                        sendError.message
                      )}
                    </p>
                  </div>
                )}

                {isConfirmed && hash && (
                  <div className="mt-4 rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
                    <p className="text-sm font-bold text-green-400">
                      Transaction confirmed ✓
                    </p>

                    <a
                      href={`https://testnet.arcscan.app/tx/${hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block break-words text-sm font-bold text-white/50 underline transition hover:text-white"
                    >
                      View Transaction on ArcScan
                    </a>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* SWAP */}

        {activeSection === "swap" && (
          <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16 lg:px-10 lg:py-24">
            <div className="mx-auto max-w-md">
              <p className="text-sm font-semibold text-white/35">
                AlabaamaFi
              </p>

              <h2 className="mt-1 text-3xl font-black sm:text-4xl">
                Token Swap
              </h2>

              <p className="mt-2 text-sm font-medium leading-6 text-white/35">
                Swap supported assets on Arc Testnet.
              </p>

              <div className="mt-7 rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#0a0f16] via-[#06080b] to-[#030303] p-4 shadow-2xl shadow-black/60 sm:mt-8 sm:p-6">
                <div className="mb-6 rounded-2xl border border-white/[0.07] bg-[#020202] p-4 sm:p-5">
                  <p className="text-xs font-bold text-white/35">
                    You pay
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-2xl font-black">
                      0.00
                    </span>

                    <span className="shrink-0 rounded-full border border-white/[0.07] bg-[#080a0d] px-4 py-2 text-sm font-black">
                      USDC
                    </span>
                  </div>
                </div>

                <div className="mx-auto -my-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-[#060709] text-sm font-bold text-white/45">
                  ↓
                </div>

                <div className="mb-6 rounded-2xl border border-white/[0.07] bg-[#020202] p-4 sm:p-5">
                  <p className="text-xs font-bold text-white/35">
                    You receive
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-2xl font-black">
                      0.00
                    </span>

                    <span className="shrink-0 rounded-full border border-white/[0.07] bg-[#080a0d] px-4 py-2 text-sm font-black">
                      Token
                    </span>
                  </div>
                </div>

                <button
                  disabled
                  className="min-h-13 w-full rounded-full border border-white/[0.07] bg-[#080a0d] py-3.5 text-sm font-black tracking-tight text-white/20"
                >
                  Swap Coming Soon
                </button>
              </div>
            </div>
          </section>
        )}

        {/* BRIDGE */}

        {activeSection === "bridge" && (
          <section className="mx-auto max-w-5xl px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-10 lg:py-24">
            <div className="mx-auto max-w-md">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/[0.07] bg-[#080d14] text-3xl font-bold text-white/60 shadow-lg shadow-black/50">
                ⇅
              </div>

              <h2 className="mt-5 text-3xl font-black sm:text-4xl">
                Bridge
              </h2>

              <p className="mt-4 font-medium leading-7 text-white/35">
                Bridge support will be added after we
                integrate a verified Arc-compatible
                bridge.
              </p>

              <div className="mt-8 rounded-2xl border border-white/[0.07] bg-[#060709] p-5 text-sm font-black text-white/35">
                Coming Soon
              </div>
            </div>
          </section>
        )}

        {/* ACTIVITY */}

        {activeSection === "activity" && (
          <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-20">
            <div className="mx-auto max-w-2xl">
              <p className="text-sm font-semibold text-white/35">
                AlabaamaFi
              </p>

              <h2 className="mt-1 text-3xl font-black sm:text-4xl">
                Wallet Activity
              </h2>

              <p className="mt-3 text-sm font-medium leading-6 text-white/35">
                Connect your wallet to view its token
                holdings and recent transactions.
              </p>

              <div className="mt-7 rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#0a0f16] via-[#06080b] to-[#030303] p-4 shadow-2xl shadow-black/60 sm:mt-8 sm:p-6">
                <div>
                  <label className="mb-2 block text-sm font-bold text-white/50">
                    Wallet Address
                  </label>

                  <input
                    type="text"
                    placeholder="Connect wallet first"
                    value={activityAddress}
                    readOnly
                    disabled={!isConnected}
                    className="min-h-13 w-full cursor-not-allowed rounded-2xl border border-white/[0.07] bg-[#020202] px-4 py-3 text-sm font-semibold text-white/65 outline-none placeholder:text-white/15 disabled:text-white/20"
                  />
                </div>

                <button
                  onClick={() => {
                    if (!isConnected) {
                      return;
                    }

                    handleCheckActivity();
                  }}
                  disabled={
                    !isConnected ||
                    activityLoading
                  }
                  className={`mt-4 min-h-13 w-full rounded-full px-5 py-4 text-sm font-black tracking-tight ${
                    !isConnected
                      ? unavailableButton
                      : silverGlassButton
                  } ${
                    isConnected
                      ? "disabled:cursor-not-allowed disabled:opacity-60"
                      : ""
                  }`}
                >
                  {activityLoading
                    ? "Checking Wallet Activity"
                    : isConnected
                    ? "Check Wallet Activity"
                    : "Connect Wallet"}
                </button>

                {activityError && (
                  <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
                    <p className="break-words text-sm font-semibold leading-5 text-red-400">
                      {activityError}
                    </p>
                  </div>
                )}
              </div>

              {(activityTokens.length > 0 ||
                activityTransactions.length > 0) && (
                <div className="mt-7 sm:mt-8">
                  <div className="rounded-2xl border border-white/[0.07] bg-[#060709] p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-bold text-white/25">
                          Portfolio
                        </p>

                        <p className="mt-2 text-3xl font-black">
                          {portfolioValue !== null
                            ? `$${portfolioValue.toFixed(2)}`
                            : "Value unavailable"}
                        </p>
                      </div>

                      <div className="w-fit rounded-xl border border-white/[0.07] bg-[#080a0d] px-3 py-2 text-xs font-bold text-white/40">
                        Arc Testnet
                      </div>
                    </div>
                  </div>

                  {activityTokens.length > 0 && (
                    <div className="mt-7 sm:mt-8">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="font-black">
                          Token Holdings
                        </h3>

                        <span className="shrink-0 text-xs font-bold text-white/25">
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
                            className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-[#060709] p-4"
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
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0b1017] text-sm font-bold">
                                  {token.symbol
                                    .slice(0, 1)
                                    .toUpperCase()}
                                </div>
                              )}

                              <div className="min-w-0">
                                <p className="font-black">
                                  {token.symbol}
                                </p>

                                <p className="mt-1 truncate text-xs font-medium text-white/25">
                                  {token.name}
                                </p>
                              </div>
                            </div>

                            <div className="ml-2 shrink-0 text-right sm:ml-4">
                              <p className="font-black">
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

                              <p className="mt-1 text-xs font-semibold text-white/25">
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

                  {activityTransactions.length > 0 && (
                    <div className="mt-7 rounded-2xl border border-white/[0.07] bg-[#060709] p-5 sm:mt-8">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-white/25">
                            Transactions
                          </p>

                          <p className="mt-2 text-2xl font-black">
                            {activityTransactions.length}
                          </p>
                        </div>

                        <span className="text-right text-xs font-semibold text-white/25">
                          Recent activity
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activityTransactions.length > 0 && (
                <div className="mt-7 sm:mt-8">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="font-black">
                      Recent Transactions
                    </h3>

                    <span className="shrink-0 text-xs font-bold text-white/25">
                      {activityTransactions.length} found
                    </span>
                  </div>

                  <div className="space-y-3">
                    {activityTransactions.map((tx) => {
                      const transactionDate =
                        tx.timestamp
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
                          className="rounded-2xl border border-white/[0.07] bg-[#060709] p-4 transition hover:bg-[#0a0d12] sm:p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-sm font-black">
                                Transaction
                              </p>

                              <p className="mt-1 break-all text-xs font-medium leading-5 text-white/25">
                                {tx.hash}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 rounded-xl border border-white/[0.05] bg-[#020202] px-3 py-2.5">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-xs font-bold text-white/25">
                                Date
                              </span>

                              <span className="text-right text-xs font-semibold text-white/55">
                                {formattedDate}
                              </span>
                            </div>

                            <div className="mt-1.5 flex items-center justify-between gap-4">
                              <span className="text-xs font-bold text-white/25">
                                Time
                              </span>

                              <span className="text-right text-xs font-semibold text-white/55">
                                {formattedTime}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
                            <div className="min-w-0">
                              <p className="font-bold text-white/25">
                                From
                              </p>

                              <p className="mt-1 break-all font-semibold text-white/55">
                                {tx.from}
                              </p>
                            </div>

                            <div className="min-w-0">
                              <p className="font-bold text-white/25">
                                To
                              </p>

                              <p className="mt-1 break-all font-semibold text-white/55">
                                {tx.to}
                              </p>
                            </div>

                            <div>
                              <p className="font-bold text-white/25">
                                Value
                              </p>

                              <p className="mt-1 break-words font-black text-white/65">
                                {tx.value}
                                {tx.tokenSymbol
                                  ? ` ${tx.tokenSymbol}`
                                  : ""}
                              </p>
                            </div>

                            <div>
                              <p className="font-bold text-white/25">
                                Status
                              </p>

                              <p className="mt-1 font-black text-green-400">
                                {tx.status}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 border-t border-white/[0.06] pt-3">
                            <a
                              href={`https://testnet.arcscan.app/tx/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-black text-white/40 transition hover:text-white"
                            >
                              View Transaction on ArcScan
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
                  <div className="mt-8 rounded-2xl border border-white/[0.07] bg-[#060709] p-6 text-center">
                    <p className="text-sm font-medium leading-6 text-white/35">
                      No transactions or token holdings
                      found for this wallet.
                    </p>
                  </div>
                )}
            </div>
          </section>
        )}

        {/* FAUCET */}

        {activeSection === "faucet" && (
          <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-24">
            <div className="mx-auto max-w-md text-center">
              <div className="text-4xl font-medium leading-none text-white/55">
                ◌
              </div>

              <h2 className="mt-6 text-3xl font-black sm:text-4xl">
                Faucet
              </h2>

              <p className="mt-4 text-sm font-medium leading-7 text-white/35 sm:text-base">
                Get testnet tokens from the official
                Circle faucet and use them to test
                AlabaamaFi on Arc Testnet.
              </p>

              <a
                href="https://faucet.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-8 block min-h-13 w-full rounded-full py-4 text-sm font-black tracking-tight ${silverGlassButton}`}
              >
                Get Testnet Tokens
              </a>

              <p className="mt-4 text-xs font-semibold leading-5 text-white/25">
                Opens the official Circle faucet in a
                new tab.
              </p>
            </div>
          </section>
        )}
      </div>

      {/* WALLET MODAL */}

      {showWallets && !isConnected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/90 px-3 py-4 backdrop-blur-sm sm:px-6 sm:py-8">
          <div className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-sm overflow-y-auto rounded-3xl border border-white/[0.07] bg-[#040506] p-4 shadow-2xl shadow-black/80 sm:max-h-[90vh] sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4 sm:mb-6">
              <div className="min-w-0">
                <h3 className="text-xl font-black">
                  Connect Wallet
                </h3>

                <p className="mt-1 text-sm font-medium text-white/35">
                  Choose a wallet to continue
                </p>
              </div>

              <button
                onClick={() =>
                  setShowWallets(false)
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white/45 transition hover:bg-white/[0.04] hover:text-white active:scale-95"
                aria-label="Close wallet modal"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {browserConnector && (
                <button
                  onClick={() =>
                    handleConnect(browserConnector)
                  }
                  disabled={isPending}
                  className="flex min-h-[72px] w-full items-center justify-between gap-3 rounded-full border border-white/[0.07] bg-[#060709] px-4 py-3.5 text-left transition-all duration-200 hover:border-[#2b6cff]/18 hover:bg-[#0a0d12] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
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
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 translate-x-1/4 translate-y-1/4 rounded-full border-2 border-[#040506] bg-green-500" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="font-black">
                        Browser Wallet
                      </p>

                      <p className="mt-1 text-xs font-medium leading-5 text-white/25">
                        MetaMask and other browser wallets
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 text-sm font-bold text-white/25">
                    •
                  </span>
                </button>
              )}

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
                      className="flex min-h-[72px] w-full items-center justify-between gap-3 rounded-full border border-white/[0.07] bg-[#060709] px-4 py-3.5 text-left transition-all duration-200 hover:border-[#2b6cff]/18 hover:bg-[#0a0d12] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
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
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0b1017] text-sm font-bold">
                              ◇
                            </div>
                          )}

                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 translate-x-1/4 translate-y-1/4 rounded-full border-2 border-[#040506] bg-green-500" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-black">
                            {displayName}
                          </p>

                          <p className="mt-1 text-xs font-medium leading-5 text-white/25">
                            Available in your browser
                          </p>
                        </div>
                      </div>

                      <span className="shrink-0 text-sm font-bold text-white/25">
                        •
                      </span>
                    </button>
                  );
                }
              )}

              {walletConnectConnector && (
                <button
                  onClick={() =>
                    handleConnect(
                      walletConnectConnector
                    )
                  }
                  disabled={isPending}
                  className="flex min-h-[72px] w-full items-center justify-between gap-3 rounded-full border border-white/[0.07] bg-[#060709] px-4 py-3.5 text-left transition-all duration-200 hover:border-[#2b6cff]/18 hover:bg-[#0a0d12] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src="/wallets/walletconnect.svg"
                      alt=""
                      className="h-8 w-8 shrink-0 rounded-lg object-contain"
                    />

                    <div className="min-w-0">
                      <p className="font-black">
                        WalletConnect
                      </p>

                      <p className="mt-1 text-xs font-medium leading-5 text-white/25">
                        Scan with a mobile wallet
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 text-sm font-bold text-white/25">
                    •
                  </span>
                </button>
              )}

              <button
                onClick={handleMetaMaskClick}
                disabled={isPending}
                className="flex min-h-[72px] w-full items-center justify-between gap-3 rounded-full border border-white/[0.07] bg-[#060709] px-4 py-3.5 text-left transition-all duration-200 hover:border-[#2b6cff]/18 hover:bg-[#0a0d12] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src="/wallets/metamask.svg"
                      alt=""
                      className="h-8 w-8 rounded-lg object-contain"
                    />

                    {metaMaskConnector && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 translate-x-1/4 translate-y-1/4 rounded-full border-2 border-[#040506] bg-green-500" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-black">
                      MetaMask
                    </p>

                    <p className="mt-1 text-xs font-medium leading-5 text-white/25">
                      {isMobileDevice()
                        ? "Open in MetaMask"
                        : metaMaskConnector
                        ? "Available in your browser"
                        : "Install MetaMask"}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 text-sm font-bold text-white/25">
                  •
                </span>
              </button>

              {coinbaseConnector && (
                <button
                  onClick={() =>
                    handleConnect(
                      coinbaseConnector
                    )
                  }
                  disabled={isPending}
                  className="flex min-h-[72px] w-full items-center justify-between gap-3 rounded-full border border-white/[0.07] bg-[#060709] px-4 py-3.5 text-left transition-all duration-200 hover:border-[#2b6cff]/18 hover:bg-[#0a0d12] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src="/wallets/base.svg"
                      alt=""
                      className="h-8 w-8 shrink-0 rounded-lg object-contain"
                    />

                    <div className="min-w-0">
                      <p className="font-black">
                        Coinbase Wallet
                      </p>

                      <p className="mt-1 text-xs font-medium leading-5 text-white/25">
                        Connect with Coinbase Wallet
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 text-sm font-bold text-white/25">
                    •
                  </span>
                </button>
              )}
            </div>

            {connectError && (
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
                <p className="break-words text-sm font-semibold leading-5 text-red-400">
                  {getFriendlyErrorMessage(
                    connectError.message
                  )}
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
                <p className="break-words text-sm font-semibold leading-5 text-red-400">
                  {error}
                </p>
              </div>
            )}

            <p className="mt-5 text-center text-xs font-medium leading-5 text-white/25">
              WalletConnect supports many mobile and
              desktop wallets.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
