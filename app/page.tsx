"use client";

import { useEffect, useState } from "react";
import { Manrope } from "next/font/google";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { isAddress } from "viem";

import Header from "@/components/Header";
import {
  getWalletTransactions,
  type WalletTransaction,
} from "@/lib/arcscan";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["600"],
});

const USDC_ADDRESS =
  "0x3600000000000000000000000000000000000000";

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
  const router = useRouter();

  const [showMenu, setShowMenu] = useState(false);
  const [activeSection, setActiveSection] =
    useState<Section>("home");

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
  } = useAccount();

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

  const handleNavigation = (section: Section) => {
    const routes: Record<Section, string> = {
      home: "/",
      send: "/send",
      swap: "/swap",
      bridge: "/bridge",
      activity: "/activity",
      faucet: "/faucet",
    };

    setShowMenu(false);

    if (section === "home") {
      setActiveSection("home");
    }

    router.push(routes[section]);
  };

  const handleWalletButton = () => {
    if (isConnected) {
      return;
    }

    window.dispatchEvent(
      new Event("open-wallet-modal")
    );
  };

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

    const walletAddress = activityAddress.trim();

    if (!isAddress(walletAddress)) {
      setActivityError(
        "Please enter a valid wallet address."
      );
      return;
    }

    setActivityLoading(true);

    try {
      const transactions =
        await getWalletTransactions(
          walletAddress
        );

      setActivityTransactions(transactions);

      let tokenHoldings: TokenHolding[] = [];

      try {
        const response = await fetch(
          `https://api-testnet.arc-scan.org/v1/address/${walletAddress}/tokens`
        );

        if (response.ok) {
          const data = await response.json();

          const rawTokens = Array.isArray(data)
            ? data
            : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.tokens)
            ? data.tokens
            : [];

          tokenHoldings = rawTokens
            .map((token: any) => {
              const rawSymbol =
                token.symbol ??
                token.tokenSymbol ??
                token.name ??
                "";

              const upperSymbol =
                String(rawSymbol).toUpperCase();

              let symbol = String(rawSymbol);

              if (upperSymbol === "EUROC") {
                symbol = "EURC";
              }

              if (upperSymbol === "CIRBTC") {
                symbol = "cirBTC";
              }

              const tokenAddress =
                token.address ??
                token.tokenAddress ??
                token.contractAddress ??
                "";

              const amount =
                token.amount ??
                token.balance ??
                token.value ??
                token.quantity ??
                "0";

              const usdValue = getUsdValue(
                token.usdValue ??
                  token.usd_value ??
                  token.valueUsd ??
                  token.usd ??
                  token.priceUsd
              );

              return {
                address: String(tokenAddress),
                symbol,
                name:
                  token.name ??
                  token.tokenName ??
                  symbol,
                amount: String(amount),
                logo: getTokenLogo(
                  symbol,
                  token.logo ??
                    token.logoUrl ??
                    token.image ??
                    null
                ),
                usdValue,
              };
            })
            .filter(
              (token: TokenHolding) =>
                token.symbol.toUpperCase() !==
                "USDC"
            );
        }
      } catch {
        tokenHoldings = [];
      }

      try {
        const paddedAddress =
          walletAddress.slice(2).padStart(64, "0");

        const data = await fetch(
          "https://rpc.testnet.arc.network",
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
                    paddedAddress,
                },
                "latest",
              ],
            }),
          }
        );

        if (data.ok) {
          const rpcResult = await data.json();

          if (rpcResult?.result) {
            const rawBalance = BigInt(
              rpcResult.result
            );

            const usdcAmount =
              Number(rawBalance) / 1_000_000;

            if (usdcAmount > 0) {
              tokenHoldings.unshift({
                address: USDC_ADDRESS,
                symbol: "USDC",
                name: "USD Coin",
                amount: String(usdcAmount),
                logo: "/tokens/usdc.svg",
                usdValue: usdcAmount,
              });
            }
          }
        }
      } catch {
        // Keep Arcscan token results if direct RPC fails.
      }

      setActivityTokens(tokenHoldings);

      const totalValue = tokenHoldings.reduce(
        (total, token) => {
          if (token.usdValue !== null) {
            return total + token.usdValue;
          }

          return total;
        },
        0
      );

      if (tokenHoldings.length > 0) {
        setPortfolioValue(totalValue);
      }
    } catch (err) {
      console.error(err);

      setActivityError(
        "Unable to load wallet activity. Please try again."
      );
    } finally {
      setActivityLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#030405] text-white">
      <style jsx global>{`
        button {
          font-family: ${manrope.style.fontFamily} !important;
          font-weight: 600 !important;
          letter-spacing: normal !important;
        }

        .quick-access-button {
          font-family: ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif !important;
          font-weight: 700 !important;
          letter-spacing: normal !important;
        }
      `}</style>

      {/* HEADER */}

      <Header
        onMenuClick={() => setShowMenu(true)}
      />

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
                      ? "border border-black/[0.08] bg-white text-black shadow-[0_2px_6px_rgba(0,0,0,0.06),0_10px_28px_rgba(0,0,0,0.14)]"
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
                className="w-full rounded-full border border-white/[0.22] bg-gradient-to-br from-white/[0.14] via-white/[0.08] to-white/[0.035] px-4 py-3.5 text-sm !font-black tracking-tight text-white shadow-[0_8px_30px_rgba(255,255,255,0.05),0_10px_35px_rgba(0,0,0,0.32)] backdrop-blur-2xl transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.34] hover:from-white/[0.18] hover:via-white/[0.11] hover:to-white/[0.055] hover:shadow-[0_10px_35px_rgba(255,255,255,0.08),0_18px_45px_rgba(0,0,0,0.42)] active:translate-y-0"
              >
                {isConnected && address
                  ? `${address.slice(0, 6)}...${address.slice(-4)}`
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
                      className="min-h-13 w-full rounded-2xl border border-black/[0.08] bg-white px-7 py-4 text-base !font-bold tracking-normal text-black shadow-[0_2px_6px_rgba(0,0,0,0.06),0_10px_28px_rgba(0,0,0,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#fafafa] hover:shadow-[0_4px_10px_rgba(0,0,0,0.08),0_14px_34px_rgba(0,0,0,0.18)] active:translate-y-0 sm:w-auto"
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
                    className="quick-access-button group min-w-0 rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#0a0f16] via-[#07090c] to-[#030303] p-6 text-center shadow-lg shadow-black/40 transition-all duration-200 hover:-translate-y-1 hover:border-[#2b6cff]/20 hover:shadow-xl hover:shadow-black/50 active:translate-y-0"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-[#080a0d] text-xl font-bold text-white/65 transition-all group-hover:border-[#2b6cff]/20 group-hover:bg-[#0b1017] group-hover:text-white">
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
                    className="mt-7 min-h-12 rounded-2xl border border-black/[0.08] bg-white px-7 py-3.5 text-sm !font-bold tracking-tight text-black shadow-[0_2px_6px_rgba(0,0,0,0.06),0_10px_28px_rgba(0,0,0,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#fafafa] hover:shadow-[0_4px_10px_rgba(0,0,0,0.08),0_14px_34px_rgba(0,0,0,0.18)] active:translate-y-0"
                  >
                    Get Faucet
                  </button>
                </div>
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
                      ? "cursor-not-allowed border border-white/[0.05] bg-[#111318] text-white/20 shadow-none"
                      : "border border-black/[0.08] bg-white text-black shadow-[0_2px_6px_rgba(0,0,0,0.06),0_10px_28px_rgba(0,0,0,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#fafafa] hover:shadow-[0_4px_10px_rgba(0,0,0,0.08),0_14px_34px_rgba(0,0,0,0.18)] active:translate-y-0"
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
                className="mt-8 block min-h-13 w-full rounded-full border border-black/[0.08] bg-white py-4 text-sm !font-bold tracking-normal text-black shadow-[0_2px_6px_rgba(0,0,0,0.06),0_10px_28px_rgba(0,0,0,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#fafafa] hover:shadow-[0_4px_10px_rgba(0,0,0,0.08),0_14px_34px_rgba(0,0,0,0.18)] active:translate-y-0"
                style={{
                  fontFamily: manrope.style.fontFamily,
                }}
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

      {/* FOOTER */}

      <footer className="border-t border-white/[0.06] bg-[#030405]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-7 text-center sm:py-8">
          {/* Arc Logo */}
          <div
            className="flex h-9 w-9 items-center justify-center text-white/75"
            aria-label="Arc"
          >
            <svg
              viewBox="0 0 32 32"
              className="h-8 w-8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16 4.5L27.5 27.5H21.8L18.9 21.3H13.1L10.2 27.5H4.5L16 4.5Z"
                fill="currentColor"
              />
              <path
                d="M14.9 17.1H17.1L16 14.7L14.9 17.1Z"
                fill="#030405"
              />
            </svg>
          </div>

          <p className="mt-2 text-sm font-black tracking-tight text-white/80">
            AlabaamaFi
          </p>

          <p className="mt-0.5 text-[11px] font-semibold text-white/25">
            Built on Arc
          </p>
        </div>
      </footer>
    </main>
  );
}
