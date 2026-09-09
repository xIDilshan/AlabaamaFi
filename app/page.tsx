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
       * USDC always appears first.
       */

      const holdings = [
        usdcToken,
        ...nonUsdcTokens,
      ];

      setActivityTokens(holdings);

      /*
       * Calculate one combined portfolio value.
       *
       * USDC = $1.
       * Other tokens use their Arcscan USD value.
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
    <main>
      {/* Top Header */}

      <header className="border-b border-white/10">
        <div className="flex items-center justify-between px-5 py-4 lg:px-8">
          {/* Menu Button */}

          <button
            onClick={() => setShowMenu(true)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xl text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Open menu"
          >
            ☰
          </button>

          {/* Logo */}

          <div className="text-center">
            <h1 className="font-bold lg:text-xl">
              AlabaamaFi
            </h1>

            <p className="text-[10px] text-white/40 lg:text-xs">
              Powered by Arc
            </p>
          </div>

          {/* Wallet */}

          <button
            onClick={handleWalletButton}
            className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black transition hover:bg-white/90 lg:px-5 lg:py-2.5 lg:text-sm"
          >
            {isConnected
              ? shortAddress
              : "Connect Wallet"}
          </button>
        </div>
      </header>

      {/* Menu Overlay */}

      {showMenu && (
        <div className="fixed inset-0 z-40">
          {/* Background */}

          <button
            onClick={() => setShowMenu(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close menu"
          />

          {/* Sidebar */}

          <aside className="relative z-50 flex min-h-screen w-72 flex-col border-r border-white/10 bg-zinc-950 p-5 shadow-2xl">
            {/* Sidebar Header */}

            <div className="mb-10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  AlabaamaFi
                </h2>

                <p className="mt-1 text-xs text-white/40">
                  Powered by Arc
                </p>
              </div>

              <button
                onClick={() => setShowMenu(false)}
                className="rounded-xl px-3 py-2 text-lg text-white/50 transition hover:bg-white/10 hover:text-white"
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
                  className={`flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left transition ${
                    activeSection === item.id
                      ? "bg-white text-black"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="w-6 text-center text-lg">
                    {item.icon}
                  </span>

                  <span className="text-sm font-medium">
                    {item.label}
                  </span>
                </button>
              ))}
            </nav>

            {/* Sidebar Wallet */}

            <div className="mt-auto">
              <button
                onClick={handleWalletButton}
                className="w-full rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90"
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
          <section className="mx-auto max-w-5xl px-6 py-16 lg:px-10 lg:py-24">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60">
                Built on Arc Network
              </div>

              <h2 className="text-5xl font-bold tracking-tight sm:text-7xl">
                Simple.
                <br />

                <span className="text-white/40">
                  On-chain.
                </span>
              </h2>

              <p className="mt-6 max-w-xl text-lg leading-8 text-white/50">
                A simple DeFi experience for sending,
                swapping, bridging and exploring assets
                on Arc.
              </p>
            </div>

            {/* Feature Cards */}

            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {menuItems
                .filter((item) => item.id !== "home")
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      handleNavigation(item.id)
                    }
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:bg-white/[0.08]"
                  >
                    <div className="mb-5 text-2xl">
                      {item.icon}
                    </div>

                    <h3 className="font-semibold">
                      {item.label}
                    </h3>

                    <p className="mt-2 text-sm text-white/40">
                      {item.id === "send" &&
                        "Send USDC to another wallet."}

                      {item.id === "swap" &&
                        "Swap tokens on Arc."}

                      {item.id === "bridge" &&
                        "Move assets across networks."}

                      {item.id === "activity" &&
                        "Explore wallet activity."}

                      {item.id === "faucet" &&
                        "Get testnet tokens."}
                    </p>
                  </button>
                ))}
            </div>
          </section>
        )}

        {/* Send */}

        {activeSection === "send" && (
          <section className="mx-auto max-w-5xl px-6 py-12 lg:px-10 lg:py-20">
            <div className="mx-auto max-w-md">
              <div className="mb-8">
                <p className="text-sm text-white/40">
                  AlabaamaFi
                </p>

                <h2 className="mt-1 text-3xl font-bold">
                  Send USDC
                </h2>

                <p className="mt-2 text-sm text-white/40">
                  Send USDC to another wallet on Arc
                  Testnet.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="font-semibold">
                    Transfer
                  </h3>

                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/50">
                    Testnet
                  </span>
                </div>

                {/* Recipient */}

                <label className="mb-2 block text-sm text-white/50">
                  Recipient
                </label>

                <input
                  type="text"
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) =>
                    setRecipient(e.target.value)
                  }
                  className="mb-5 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none transition placeholder:text-white/20 focus:border-white/30"
                />

                {/* Amount */}

                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm text-white/50">
                    Amount
                  </label>

                  <span className="text-xs text-white/30">
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
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 pr-20 text-lg outline-none transition placeholder:text-white/20 focus:border-white/30"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-white/50">
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
                  className="mt-6 w-full rounded-xl bg-white py-3.5 font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
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
                      className="mt-3 w-full rounded-xl border border-white/10 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Switch to Arc Testnet
                    </button>
                  )}

                {/* Error */}

                {error && (
                  <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                    <p className="break-words text-sm text-red-400">
                      {error}
                    </p>
                  </div>
                )}

                {/* Transaction Error */}

                {sendError && (
                  <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                    <p className="break-words text-sm text-red-400">
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
                      className="mt-2 block text-sm text-white/60 underline transition hover:text-white"
                    >
                      View on Arc Explorer →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Swap */}

        {activeSection === "swap" && (
          <section className="mx-auto max-w-5xl px-6 py-16 lg:px-10 lg:py-24">
            <div className="mx-auto max-w-md">
              <p className="text-sm text-white/40">
                AlabaamaFi
              </p>

              <h2 className="mt-1 text-3xl font-bold">
                Token Swap
              </h2>

              <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <div className="mb-6 rounded-2xl border border-white/10 bg-black p-5">
                  <p className="text-xs text-white/40">
                    You pay
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-2xl font-semibold">
                      0.00
                    </span>

                    <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
                      USDC
                    </span>
                  </div>
                </div>

                <div className="mx-auto -my-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-zinc-950 text-white/50">
                  ↓
                </div>

                <div className="mb-6 rounded-2xl border border-white/10 bg-black p-5">
                  <p className="text-xs text-white/40">
                    You receive
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-2xl font-semibold">
                      0.00
                    </span>

                    <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
                      Token
                    </span>
                  </div>
                </div>

                <button
                  disabled
                  className="w-full rounded-xl bg-white/10 py-3.5 font-semibold text-white/30"
                >
                  Swap coming soon
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Bridge */}

        {activeSection === "bridge" && (
          <section className="mx-auto max-w-5xl px-6 py-16 text-center lg:px-10 lg:py-24">
            <div className="mx-auto max-w-md">
              <div className="text-4xl">
                ⇅
              </div>

              <h2 className="mt-5 text-3xl font-bold">
                Bridge
              </h2>

              <p className="mt-4 leading-7 text-white/40">
                Bridge support will be added after we
                integrate a verified Arc-compatible
                bridge.
              </p>

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/40">
                Coming soon
              </div>
            </div>
          </section>
        )}

        {/* Activity */}

        {activeSection === "activity" && (
          <section className="mx-auto max-w-5xl px-6 py-12 lg:px-10 lg:py-20">
            <div className="mx-auto max-w-2xl">
              <p className="text-sm text-white/40">
                AlabaamaFi
              </p>

              <h2 className="mt-1 text-3xl font-bold">
                Wallet Activity
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/40">
                Connect your wallet to view its token
                holdings and recent transactions.
              </p>

              <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                {/* Connected Wallet Address */}

                <div>
                  <label className="mb-2 block text-sm text-white/50">
                    Wallet Address
                  </label>

                  <input
                    type="text"
                    placeholder="Connect wallet first"
                    value={activityAddress}
                    readOnly
                    disabled={!isConnected}
                    className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white/70 outline-none placeholder:text-white/20 disabled:text-white/30"
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
                  className="mt-4 w-full rounded-xl bg-white py-3.5 font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
                >
                  {activityLoading
                    ? "Checking..."
                    : isConnected
                    ? "Check Activity"
                    : "Connect Wallet"}
                </button>

                {activityError && (
                  <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                    <p className="break-words text-sm text-red-400">
                      {activityError}
                    </p>
                  </div>
                )}
              </div>

              {/* Portfolio */}

              {(activityTokens.length > 0 ||
                activityTransactions.length > 0) && (
                <div className="mt-8">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/30">
                          Portfolio
                        </p>

                        <p className="mt-2 text-3xl font-semibold">
                          {portfolioValue !== null
                            ? `$${portfolioValue.toFixed(2)}`
                            : "Value unavailable"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white/10 px-3 py-2 text-xs text-white/50">
                        Arc Testnet
                      </div>
                    </div>
                  </div>

                  {/* Token Holdings */}

                  {activityTokens.length > 0 && (
                    <div className="mt-8">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold">
                          Token Holdings
                        </h3>

                        <span className="text-xs text-white/30">
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
                            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4"
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
                                              "scale(0.45)",
                                          }
                                        : undefined
                                    }
                                  />
                                </div>
                              ) : (
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
                                  {token.symbol
                                    .slice(0, 1)
                                    .toUpperCase()}
                                </div>
                              )}

                              <div className="min-w-0">
                                <p className="font-medium">
                                  {token.symbol}
                                </p>

                                <p className="mt-1 truncate text-xs text-white/30">
                                  {token.name}
                                </p>
                              </div>
                            </div>

                            <p className="ml-4 shrink-0 text-right font-semibold">
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
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transaction Count */}

                  {activityTransactions.length > 0 && (
                    <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-white/30">
                            Transactions
                          </p>

                          <p className="mt-2 text-2xl font-semibold">
                            {activityTransactions.length}
                          </p>
                        </div>

                        <span className="text-xs text-white/30">
                          Recent activity
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Transactions */}

              {activityTransactions.length > 0 && (
                <div className="mt-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold">
                      Recent Transactions
                    </h3>

                    <span className="text-xs text-white/30">
                      {activityTransactions.length} found
                    </span>
                  </div>

                  <div className="space-y-3">
                    {activityTransactions.map((tx) => (
                      <a
                        key={tx.hash}
                        href={`https://testnet.arcscan.app/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.08]"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              Transaction
                            </p>

                            <p className="mt-1 truncate text-xs text-white/30">
                              {tx.hash}
                            </p>
                          </div>

                          <span className="shrink-0 text-sm text-white/40">
                            →
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-white/30">
                              From
                            </p>

                            <p className="mt-1 truncate text-white/60">
                              {tx.from}
                            </p>
                          </div>

                          <div>
                            <p className="text-white/30">
                              To
                            </p>

                            <p className="mt-1 truncate text-white/60">
                              {tx.to}
                            </p>
                          </div>

                          <div>
                            <p className="text-white/30">
                              Value
                            </p>

                            <p className="mt-1 text-white/60">
                              {tx.value}
                            </p>
                          </div>

                          <div>
                            <p className="text-white/30">
                              Status
                            </p>

                            <p className="mt-1 text-green-400">
                              {tx.status}
                            </p>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {!activityLoading &&
                isConnected &&
                activityAddress &&
                activityTransactions.length === 0 &&
                activityTokens.length === 0 &&
                !activityError && (
                  <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
                    <p className="text-sm text-white/40">
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
          <section className="mx-auto max-w-5xl px-6 py-16 lg:px-10 lg:py-24">
            <div className="mx-auto max-w-md text-center">
              <div className="text-5xl">
                ◌
              </div>

              <h2 className="mt-6 text-3xl font-bold">
                Get Testnet Tokens
              </h2>

              <p className="mt-4 leading-7 text-white/40">
                Get testnet tokens from the official Circle
                faucet and use it to test AlabaamaFi on
                Arc Testnet.
              </p>

              <a
                href="https://faucet.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 block w-full rounded-xl bg-white py-3.5 font-semibold text-black transition hover:bg-white/90"
              >
                Get Testnet Tokens ▸
              </a>

              <p className="mt-4 text-xs text-white/30">
                Opens the official Circle faucet in a new
                tab.
              </p>
            </div>
          </section>
        )}

        {/* Footer */}

        <footer className="border-t border-white/10 py-8 text-center">
          <p className="text-sm text-white/30">
            AlabaamaFi • Built on Arc Network
          </p>
        </footer>
      </div>

      {/* Wallet Modal */}

      {showWallets && !isConnected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">
                  Connect Wallet
                </h3>

                <p className="mt-1 text-sm text-white/40">
                  Choose a wallet to continue
                </p>
              </div>

              <button
                onClick={() =>
                  setShowWallets(false)
                }
                className="rounded-lg px-3 py-2 text-white/50 hover:bg-white/10 hover:text-white"
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
                  className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src="/wallets/browser.svg"
                        alt=""
                        className="h-8 w-8 rounded-lg object-contain"
                      />

                      {detectedBrowserWallets.length >
                        0 && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 translate-x-1/4 translate-y-1/4 rounded-full border-2 border-zinc-950 bg-green-500" />
                      )}
                    </div>

                    <div>
                      <p className="font-medium">
                        Browser Wallet
                      </p>

                      <p className="mt-1 text-xs text-white/30">
                        MetaMask and other browser wallets
                      </p>
                    </div>
                  </div>

                  <span className="text-sm text-white/30">
                    →
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
                      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {logo ? (
                            <img
                              src={logo}
                              alt=""
                              className="h-8 w-8 rounded-lg object-contain"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sm">
                              ◇
                            </div>
                          )}

                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 translate-x-1/4 translate-y-1/4 rounded-full border-2 border-zinc-950 bg-green-500" />
                        </div>

                        <div>
                          <p className="font-medium">
                            {displayName}
                          </p>

                          <p className="mt-1 text-xs text-white/30">
                            Available in your browser
                          </p>
                        </div>
                      </div>

                      <span className="text-sm text-white/30">
                        →
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
                  className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src="/wallets/walletconnect.svg"
                      alt=""
                      className="h-8 w-8 rounded-lg object-contain"
                    />

                    <div>
                      <p className="font-medium">
                        WalletConnect
                      </p>

                      <p className="mt-1 text-xs text-white/30">
                        Scan with a mobile wallet
                      </p>
                    </div>
                  </div>

                  <span className="text-sm text-white/30">
                    →
                  </span>
                </button>
              )}

              {/* MetaMask */}

              <button
                onClick={handleMetaMaskClick}
                disabled={isPending}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src="/wallets/metamask.svg"
                      alt=""
                      className="h-8 w-8 rounded-lg object-contain"
                    />

                    {metaMaskConnector && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 translate-x-1/4 translate-y-1/4 rounded-full border-2 border-zinc-950 bg-green-500" />
                    )}
                  </div>

                  <div>
                    <p className="font-medium">
                      MetaMask
                    </p>

                    <p className="mt-1 text-xs text-white/30">
                      {isMobileDevice()
                        ? "Open in MetaMask"
                        : metaMaskConnector
                        ? "Available in your browser"
                        : "Install MetaMask"}
                    </p>
                  </div>
                </div>

                <span className="text-sm text-white/30">
                  →
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
                  className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src="/wallets/base.svg"
                      alt=""
                      className="h-8 w-8 rounded-lg object-contain"
                    />

                    <div>
                      <p className="font-medium">
                        Coinbase Wallet
                      </p>

                      <p className="mt-1 text-xs text-white/30">
                        Connect with Coinbase Wallet
                      </p>
                    </div>
                  </div>

                  <span className="text-sm text-white/30">
                    →
                  </span>
                </button>
              )}
            </div>

            {/* Connection Error */}

            {connectError && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                <p className="break-words text-sm text-red-400">
                  {getFriendlyErrorMessage(
                    connectError.message
                  )}
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                <p className="break-words text-sm text-red-400">
                  {error}
                </p>
              </div>
            )}

            <p className="mt-5 text-center text-xs leading-5 text-white/30">
              WalletConnect supports many mobile and desktop
              wallets.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
