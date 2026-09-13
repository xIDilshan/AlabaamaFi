"use client";

import { useEffect, useState } from "react";
import { Manrope } from "next/font/google";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { isAddress } from "viem";

import Header from "@/components/Header";

type Section =
  | "home"
  | "send"
  | "swap"
  | "bridge"
  | "activity"
  | "faucet";

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
] as const;

type TokenHolding = {
  address: string;
  symbol: string;
  name: string;
  amount: string;
  logo: string | null;
  usdValue: number | null;
  decimals?: number;
};

function shortenAddress(
  address: string,
  start = 6,
  end = 4
) {
  if (!address) {
    return "—";
  }

  if (
    address.length <=
    start + end + 3
  ) {
    return address;
  }

  return `${address.slice(
    0,
    start
  )}...${address.slice(-end)}`;
}

function getTokenLogo(
  symbol: string,
  apiLogo: string | null
): string | null {
  const upperSymbol =
    symbol.toUpperCase();

  if (upperSymbol === "USDC") {
    return "/tokens/usdc.svg";
  }

  if (
    upperSymbol === "EURC" ||
    upperSymbol === "EUROC"
  ) {
    return "/tokens/eurc.svg";
  }

  if (
    upperSymbol === "CIRBTC" ||
    upperSymbol === "CIR-BTC"
  ) {
    return "/tokens/cirbtc.svg";
  }

  return apiLogo;
}

function getTokenSymbol(
  token: any
): string {
  const rawSymbol =
    token.symbol ??
    token.tokenSymbol ??
    token.token_symbol ??
    token.asset?.symbol ??
    token.token?.symbol ??
    token.metadata?.symbol ??
    "";

  const upper =
    String(rawSymbol).toUpperCase();

  if (
    upper === "EUROC" ||
    upper === "EURC"
  ) {
    return "EURC";
  }

  if (
    upper === "CIRBTC" ||
    upper === "CIR-BTC"
  ) {
    return "cirBTC";
  }

  if (upper === "USDC") {
    return "USDC";
  }

  return String(rawSymbol);
}

function getTokenName(
  token: any,
  symbol: string
): string {
  if (symbol === "USDC") {
    return "USD Coin";
  }

  if (symbol === "EURC") {
    return "Euro Coin";
  }

  if (symbol === "cirBTC") {
    return "Circle Bitcoin";
  }

  const apiName =
    token.name ??
    token.tokenName ??
    token.token_name ??
    token.asset?.name ??
    token.token?.name ??
    token.metadata?.name ??
    "";

  return String(apiName || symbol);
}

function getTokenDecimals(
  token: any,
  symbol: string
): number {
  const possibleDecimals = [
    token.decimals,
    token.tokenDecimals,
    token.token_decimals,
    token.decimal,
    token.token?.decimals,
    token.asset?.decimals,
    token.metadata?.decimals,
  ];

  for (
    const value of possibleDecimals
  ) {
    const decimals = Number(value);

    if (
      Number.isFinite(decimals) &&
      decimals >= 0 &&
      decimals <= 36
    ) {
      return decimals;
    }
  }

  const upperSymbol =
    symbol.toUpperCase();

  if (
    upperSymbol === "USDC" ||
    upperSymbol === "EURC" ||
    upperSymbol === "EUROC"
  ) {
    return 6;
  }

  if (upperSymbol === "CIRBTC") {
    return 8;
  }

  return 18;
}

function formatTokenAmount(
  value: any,
  decimals = 18
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "0";
  }

  if (
    typeof value === "object"
  ) {
    if (
      value.formatted !== undefined &&
      value.formatted !== null
    ) {
      return String(value.formatted);
    }

    if (
      value.display !== undefined &&
      value.display !== null
    ) {
      return String(value.display);
    }

    if (
      value.amount !== undefined &&
      value.amount !== null
    ) {
      return formatTokenAmount(
        value.amount,
        Number(
          value.decimals ?? decimals
        )
      );
    }

    if (
      value.raw !== undefined &&
      value.raw !== null
    ) {
      return formatTokenAmount(
        value.raw,
        Number(
          value.decimals ?? decimals
        )
      );
    }

    if (
      value.value !== undefined &&
      value.value !== null
    ) {
      return formatTokenAmount(
        value.value,
        Number(
          value.decimals ?? decimals
        )
      );
    }
  }

  const stringValue =
    String(value).trim();

  if (!stringValue) {
    return "0";
  }

  if (
    stringValue.includes(".")
  ) {
    return stringValue;
  }

  try {
    const raw =
      BigInt(stringValue);

    if (decimals === 0) {
      return raw.toString();
    }

    const zero = BigInt(0);

    const negative =
      raw < zero;

    const absolute =
      negative ? -raw : raw;

    const divisor =
      BigInt(10) **
      BigInt(decimals);

    const whole =
      absolute / divisor;

    const fraction =
      absolute % divisor;

    if (fraction === zero) {
      return `${negative ? "-" : ""}${whole}`;
    }

    const fractionString =
      fraction
        .toString()
        .padStart(
          decimals,
          "0"
        )
        .replace(
          /0+$/,
          ""
        );

    return `${negative ? "-" : ""}${whole}.${fractionString}`;
  } catch {
    return stringValue;
  }
}

/*
 * Find the Money object belonging to the
 * actual token holding.
 *
 * Arcscan may nest the Money object at
 * different levels depending on the response.
 */
function getHoldingMoney(
  token: any
): any | null {
  const visited =
    new Set<any>();

  function search(
    value: any,
    depth = 0
  ): any | null {
    if (
      value === null ||
      value === undefined ||
      depth > 8 ||
      typeof value !== "object"
    ) {
      return null;
    }

    if (visited.has(value)) {
      return null;
    }

    visited.add(value);

    const hasAmount =
      value.raw !== undefined ||
      value.formatted !== undefined ||
      value.amount !== undefined ||
      value.balance !== undefined ||
      value.quantity !== undefined;

    const hasUsd =
      value.usd !== undefined &&
      value.usd !== null;

    if (
      hasAmount &&
      hasUsd
    ) {
      return value;
    }

    const priorityKeys = [
      "amount",
      "balance",
      "tokenAmount",
      "token_amount",
      "holding",
      "token",
      "asset",
      "value",
      "money",
    ];

    for (
      const key of priorityKeys
    ) {
      const child =
        value[key];

      if (
        child !== null &&
        child !== undefined &&
        typeof child === "object"
      ) {
        const result =
          search(
            child,
            depth + 1
          );

        if (result) {
          return result;
        }
      }
    }

    for (
      const [key, child] of Object.entries(
        value
      )
    ) {
      if (
        priorityKeys.includes(key)
      ) {
        continue;
      }

      if (
        child !== null &&
        typeof child === "object"
      ) {
        const result =
          search(
            child,
            depth + 1
          );

        if (result) {
          return result;
        }
      }
    }

    return null;
  }

  return search(token);
}

function getTokenAmount(
  token: any,
  decimals: number
): string {
  const candidates = [
    token.amount,
    token.balance,
    token.tokenAmount,
    token.token_amount,
    token.asset?.amount,
    token.asset?.balance,
    token.token?.amount,
    token.token?.balance,
    token.value,
    token.quantity,
    token.rawBalance,
    token.raw_balance,
    token.asset?.value,
    token.token?.value,
  ];

  for (
    const candidate of candidates
  ) {
    if (
      candidate === null ||
      candidate === undefined
    ) {
      continue;
    }

    if (
      typeof candidate ===
      "object"
    ) {
      if (
        candidate.formatted !==
          undefined &&
        candidate.formatted !==
          null
      ) {
        return String(
          candidate.formatted
        );
      }

      const nested =
        candidate.amount ??
        candidate.balance ??
        candidate.raw ??
        candidate.value;

      if (
        nested !== null &&
        nested !== undefined
      ) {
        return formatTokenAmount(
          nested,
          Number(
            candidate.decimals ??
              decimals
          )
        );
      }
    }

    return formatTokenAmount(
      candidate,
      decimals
    );
  }

  return "0";
}

/*
 * Get the TOTAL USD value belonging to
 * the actual token holding.
 *
 * Arcscan returns token amounts as Money
 * objects. A Money object can contain:
 *
 * raw
 * decimals
 * formatted
 * usd
 * symbol
 *
 * Used for tokens other than cirBTC.
 */
function getTokenUsdValue(
  token: any
): number | null {
  const visited =
    new Set<any>();

  function parseUsd(
    value: any
  ): number | null {
    if (
      value === null ||
      value === undefined
    ) {
      return null;
    }

    if (
      typeof value === "number" ||
      typeof value === "string"
    ) {
      const numeric =
        Number(value);

      return Number.isFinite(
        numeric
      )
        ? numeric
        : null;
    }

    if (
      typeof value !== "object"
    ) {
      return null;
    }

    if (
      value.formatted !==
        undefined &&
      value.formatted !== null
    ) {
      const formatted =
        Number(
          value.formatted
        );

      if (
        Number.isFinite(
          formatted
        )
      ) {
        return formatted;
      }
    }

    if (
      value.value !== undefined &&
      value.value !== null
    ) {
      const numeric =
        Number(
          value.value
        );

      if (
        Number.isFinite(
          numeric
        )
      ) {
        return numeric;
      }
    }

    if (
      value.amount !== undefined &&
      value.amount !== null
    ) {
      const numeric =
        Number(
          value.amount
        );

      if (
        Number.isFinite(
          numeric
        )
      ) {
        return numeric;
      }
    }

    if (
      value.raw !== undefined &&
      value.raw !== null &&
      value.decimals !== undefined
    ) {
      try {
        const raw =
          Number(
            value.raw
          );

        const decimals =
          Number(
            value.decimals
          );

        if (
          Number.isFinite(raw) &&
          Number.isFinite(decimals)
        ) {
          return (
            raw /
            10 ** decimals
          );
        }
      } catch {
        return null;
      }
    }

    return null;
  }

  function search(
    value: any,
    depth = 0
  ): number | null {
    if (
      value === null ||
      value === undefined ||
      typeof value !== "object" ||
      depth > 8
    ) {
      return null;
    }

    if (
      visited.has(value)
    ) {
      return null;
    }

    visited.add(value);

    if (
      value.usd !== undefined &&
      value.usd !== null
    ) {
      const usd =
        parseUsd(
          value.usd
        );

      if (
        usd !== null
      ) {
        return usd;
      }
    }

    const priorityKeys = [
      "amount",
      "balance",
      "tokenAmount",
      "token_amount",
      "holding",
      "token",
      "asset",
      "value",
      "money",
    ];

    for (
      const key of priorityKeys
    ) {
      if (
        value[key] === null ||
        value[key] === undefined
      ) {
        continue;
      }

      const result =
        search(
          value[key],
          depth + 1
        );

      if (
        result !== null
      ) {
        return result;
      }
    }

    for (
      const [key, child] of Object.entries(
        value
      )
    ) {
      if (
        priorityKeys.includes(
          key
        )
      ) {
        continue;
      }

      if (
        child !== null &&
        typeof child === "object"
      ) {
        const result =
          search(
            child,
            depth + 1
          );

        if (
          result !== null
        ) {
          return result;
        }
      }
    }

    return null;
  }

  const tokenUsd =
    search(token);

  if (
    tokenUsd !== null
  ) {
    return tokenUsd;
  }

  const directUsdCandidates = [
    token.usd,
    token.usdValue,
    token.usd_value,
    token.valueUsd,
    token.value_usd,
  ];

  for (
    const candidate of directUsdCandidates
  ) {
    const usd =
      parseUsd(
        candidate
      );

    if (
      usd !== null
    ) {
      return usd;
    }
  }

  return null;
}

function getApiLogo(
  token: any
): string | null {
  return (
    token.logo ??
    token.logoUrl ??
    token.logo_url ??
    token.image ??
    token.imageUrl ??
    token.image_url ??
    token.icon ??
    token.iconUrl ??
    token.asset?.logo ??
    token.asset?.logoUrl ??
    token.token?.logo ??
    token.token?.logoUrl ??
    null
  );
}

export default function ActivityPage() {
  const router = useRouter();

  const [
    showMenu,
    setShowMenu,
  ] = useState(false);

  const [
    activityAddress,
    setActivityAddress,
  ] = useState("");

  const [
    activityTransactions,
    setActivityTransactions,
  ] = useState<
    WalletTransaction[]
  >([]);

  const [
    activityLoading,
    setActivityLoading,
  ] = useState(false);

  const [
    activityError,
    setActivityError,
  ] = useState("");

  const [
    activityTokens,
    setActivityTokens,
  ] = useState<
    TokenHolding[]
  >([]);

  const [
    portfolioValue,
    setPortfolioValue,
  ] = useState<
    number | null
  >(null);

  const [
    copiedHash,
    setCopiedHash,
  ] = useState<
    string | null
  >(null);

  const {
    address,
    isConnected,
  } = useAccount();

  useEffect(() => {
    if (
      isConnected &&
      address
    ) {
      setActivityAddress(
        address
      );
    } else {
      setActivityAddress("");
      setActivityTransactions([]);
      setActivityTokens([]);
      setPortfolioValue(null);
      setActivityError("");
    }
  }, [
    isConnected,
    address,
  ]);

  const handleNavigation = (
    section: (typeof menuItems)[number]["id"]
  ) => {
    const routes = {
      home: "/",
      send: "/send",
      swap: "/swap",
      bridge: "/bridge",
      activity: "/activity",
      faucet: "/faucet",
    };

    setShowMenu(false);

    router.push(routes[section]);
  };

  const handleCopyHash =
    async (
      hash: string
    ) => {
      try {
        await navigator.clipboard.writeText(
          hash
        );

        setCopiedHash(hash);

        setTimeout(() => {
          setCopiedHash(null);
        }, 1800);
      } catch (error) {
        console.error(
          "Failed to copy transaction hash:",
          error
        );
      }
    };

  const handleCheckActivity =
    async () => {
      setActivityError("");
      setActivityTransactions([]);
      setActivityTokens([]);
      setPortfolioValue(null);

      if (
        !isConnected ||
        !address
      ) {
        setActivityError(
          "Please connect your wallet first."
        );
        return;
      }

      const walletAddress =
        activityAddress.trim();

      if (
        !isAddress(
          walletAddress
        )
      ) {
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

        setActivityTransactions(
          transactions
        );

        /*
         * Get the current BTC/USD spot price.
         *
         * cirBTC is valued using:
         *
         * cirBTC balance × live BTC price
         *
         * We intentionally do not use
         * Arcscan's USD value for cirBTC.
         */
        let currentBtcPrice:
          number | null = null;

        try {
          const btcResponse =
            await fetch(
              "https://api.coinbase.com/v2/prices/BTC-USD/spot",
              {
                cache: "no-store",
              }
            );

          if (
            btcResponse.ok
          ) {
            const btcData =
              await btcResponse.json();

            const price =
              Number(
                btcData?.data?.amount
              );

            if (
              Number.isFinite(
                price
              ) &&
              price > 0
            ) {
              currentBtcPrice =
                price;
            }
          }
        } catch (error) {
          console.error(
            "BTC price error:",
            error
          );

          currentBtcPrice = null;
        }

        let tokenHoldings:
          TokenHolding[] = [];

        /*
         * Arcscan token balances.
         */
        try {
          const response =
            await fetch(
              `https://api-testnet.arc-scan.org/v1/address/${walletAddress}/tokens`
            );

          if (response.ok) {
            const data =
              await response.json();

            const rawTokens =
              Array.isArray(data)
                ? data
                : Array.isArray(
                    data?.items
                  )
                ? data.items
                : Array.isArray(
                    data?.tokens
                  )
                ? data.tokens
                : Array.isArray(
                    data?.data
                  )
                ? data.data
                : [];

            tokenHoldings =
              rawTokens
                .map(
                  (
                    token: any
                  ) => {
                    const symbol =
                      getTokenSymbol(
                        token
                      );

                    const decimals =
                      getTokenDecimals(
                        token,
                        symbol
                      );

                    const tokenAddress =
                      token.address ??
                      token.tokenAddress ??
                      token.token_address ??
                      token.contractAddress ??
                      token.contract_address ??
                      token.asset?.address ??
                      token.token?.address ??
                      "";

                    const amount =
                      getTokenAmount(
                        token,
                        decimals
                      );

                    const isCirBTC =
                      symbol.toUpperCase() ===
                      "CIRBTC";

                    const usdValue =
                      isCirBTC
                        ? currentBtcPrice !==
                          null
                          ? Number(
                              amount
                            ) *
                            currentBtcPrice
                          : null
                        : getTokenUsdValue(
                            token
                          );

                    const logo =
                      getTokenLogo(
                        symbol,
                        getApiLogo(
                          token
                        )
                      );

                    return {
                      address:
                        String(
                          tokenAddress
                        ),
                      symbol,
                      name:
                        getTokenName(
                          token,
                          symbol
                        ),
                      amount,
                      logo,
                      usdValue,
                      decimals,
                    };
                  }
                )
                .filter(
                  (
                    token: TokenHolding
                  ) =>
                    token.symbol.toUpperCase() !==
                    "USDC"
                );
          }
        } catch (error) {
          console.error(
            "Token balance error:",
            error
          );

          tokenHoldings = [];
        }

        /*
         * Direct USDC balance.
         */
        try {
          const paddedAddress =
            walletAddress
              .slice(2)
              .padStart(
                64,
                "0"
              );

          const response =
            await fetch(
              "https://rpc.testnet.arc.network",
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body:
                  JSON.stringify({
                    jsonrpc:
                      "2.0",
                    id: 1,
                    method:
                      "eth_call",
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

          if (response.ok) {
            const rpcResult =
              await response.json();

            if (
              rpcResult?.result
            ) {
              const rawBalance =
                BigInt(
                  rpcResult.result
                );

              const usdcAmount =
                Number(
                  rawBalance
                ) / 1_000_000;

              if (
                usdcAmount > 0
              ) {
                tokenHoldings.unshift({
                  address:
                    USDC_ADDRESS,
                  symbol: "USDC",
                  name: "USD Coin",
                  amount:
                    String(
                      usdcAmount
                    ),
                  logo:
                    "/tokens/usdc.svg",
                  usdValue:
                    usdcAmount,
                  decimals: 6,
                });
              }
            }
          }
        } catch (error) {
          console.error(
            "USDC balance error:",
            error
          );
        }

        /*
         * Keep the three main coins in order:
         *
         * USDC → EURC → cirBTC
         */
        const tokenOrder: Record<
          string,
          number
        > = {
          USDC: 0,
          EURC: 1,
          CIRBTC: 2,
        };

        tokenHoldings.sort(
          (a, b) => {
            const aOrder =
              tokenOrder[
                a.symbol.toUpperCase()
              ] ?? 99;

            const bOrder =
              tokenOrder[
                b.symbol.toUpperCase()
              ] ?? 99;

            return (
              aOrder - bOrder
            );
          }
        );

        setActivityTokens(
          tokenHoldings
        );

        /*
         * Portfolio value.
         */
        const totalValue =
          tokenHoldings.reduce(
            (
              total,
              token
            ) => {
              if (
                token.usdValue !==
                  null &&
                Number.isFinite(
                  token.usdValue
                )
              ) {
                return (
                  total +
                  token.usdValue
                );
              }

              return total;
            },
            0
          );

        const hasUsdValue =
          tokenHoldings.some(
            (
              token
            ) =>
              token.usdValue !==
                null &&
              Number.isFinite(
                token.usdValue
              )
          );

        if (
          hasUsdValue
        ) {
          setPortfolioValue(
            totalValue
          );
        }
      } catch (error) {
        console.error(error);

        setActivityError(
          "Unable to load wallet activity. Please try again."
        );
      } finally {
        setActivityLoading(
          false
        );
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
      `}</style>

      <Header
        onMenuClick={() =>
          setShowMenu(true)
        }
      />

      {/* MOBILE MENU */}

      {showMenu && (
        <div className="fixed inset-0 z-40">
          <button
            onClick={() =>
              setShowMenu(false)
            }
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
                onClick={() =>
                  setShowMenu(false)
                }
                className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white/50 transition hover:bg-white/[0.04] hover:text-white active:scale-95"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <nav className="space-y-2">
              {menuItems.map(
                (item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      handleNavigation(
                        item.id
                      )
                    }
                    className={`flex min-h-12 w-full items-center gap-4 rounded-full px-4 py-3.5 text-left transition-all duration-200 active:scale-[0.99] ${
                      item.id ===
                      "activity"
                        ? "border border-black/[0.08] bg-white text-black shadow-[0_2px_6px_rgba(0,0,0,0.06),0_10px_28px_rgba(0,0,0,0.14)]"
                        : "text-white/60 hover:bg-[#0a0d12] hover:text-white"
                    }`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center text-lg font-bold leading-none">
                      {item.icon}
                    </span>

                    <span className="text-sm font-bold">
                      {
                        item.label
                      }
                    </span>
                  </button>
                )
              )}
            </nav>

            <div className="mt-auto pt-8">
              <button
                onClick={() => {
                  setShowMenu(
                    false
                  );

                  window.dispatchEvent(
                    new Event(
                      "open-wallet-modal"
                    )
                  );
                }}
                className="w-full rounded-full border border-white/[0.22] bg-gradient-to-br from-white/[0.14] via-white/[0.08] to-white/[0.035] px-4 py-3.5 text-sm !font-black tracking-tight text-white shadow-[0_8px_30px_rgba(255,255,255,0.05),0_10px_35px_rgba(0,0,0,0.32)] backdrop-blur-2xl transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.34] hover:from-white/[0.18] hover:via-white/[0.11] hover:to-white/[0.055] hover:shadow-[0_10px_35px_rgba(255,255,255,0.08),0_18px_45px_rgba(0,0,0,0.42)] active:translate-y-0"
              >
                {isConnected &&
                address
                  ? `${address.slice(
                      0,
                      6
                    )}...${address.slice(
                      -4
                    )}`
                  : "Connect Wallet"}
              </button>
            </div>
          </aside>
        </div>
      )}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold text-white/35">
            AlabaamaFi
          </p>

          <h1 className="mt-1 text-3xl font-black sm:text-4xl">
            Wallet Activity
          </h1>

          <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/35">
            Connect your wallet to view its token
            holdings and recent transactions.
          </p>

          {/* CHECKER */}

          <div className="mt-7 rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#0a0f16] via-[#06080b] to-[#030303] p-4 shadow-2xl shadow-black/60 sm:mt-8 sm:p-6 lg:p-7">
            <label className="mb-2 block text-sm font-bold text-white/50">
              Wallet Address
            </label>

            <input
              type="text"
              placeholder="Connect wallet first"
              value={
                activityAddress
              }
              readOnly
              disabled={
                !isConnected
              }
              className="min-h-13 w-full cursor-not-allowed rounded-2xl border border-white/[0.07] bg-[#020202] px-4 py-3 text-sm font-semibold text-white/65 outline-none placeholder:text-white/15 disabled:text-white/20"
            />

            <button
              onClick={() => {
                if (
                  !isConnected
                ) {
                  window.dispatchEvent(
                    new Event(
                      "open-wallet-modal"
                    )
                  );
                  return;
                }

                handleCheckActivity();
              }}
              disabled={
                isConnected &&
                activityLoading
              }
              className={`mt-4 min-h-13 w-full rounded-full px-5 py-4 text-sm font-black ${
                !isConnected
                  ? "border border-white/[0.05] bg-[#111318] text-white/35 transition hover:bg-[#151820]"
                  : "border border-black/[0.08] bg-white text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#fafafa] disabled:cursor-not-allowed disabled:opacity-60"
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
                <p className="text-sm font-semibold leading-5 text-red-400">
                  {
                    activityError
                  }
                </p>
              </div>
            )}
          </div>

          {/* RESULTS */}

          {(activityTokens.length >
            0 ||
            activityTransactions.length >
              0) && (
            <div className="mt-7 sm:mt-8">
              {/* PORTFOLIO */}

              <div className="rounded-2xl border border-white/[0.07] bg-[#060709] p-5 lg:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold text-white/25">
                      Portfolio
                    </p>

                    <p className="mt-2 text-3xl font-black">
                      {portfolioValue !==
                      null
                        ? `$${portfolioValue.toFixed(
                            2
                          )}`
                        : "Value unavailable"}
                    </p>
                  </div>

                  <div className="w-fit rounded-xl border border-white/[0.07] bg-[#080a0d] px-3 py-2 text-xs font-bold text-white/40">
                    Arc Testnet
                  </div>
                </div>
              </div>

              {/* TOKEN HOLDINGS */}

              {activityTokens.length >
                0 && (
                <div className="mt-7 sm:mt-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-black">
                      Token Holdings
                    </h2>

                    <span className="text-xs font-bold text-white/25">
                      {
                        activityTokens.length
                      }{" "}
                      tokens
                    </span>
                  </div>

                  <div className="space-y-3 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
                    {activityTokens.map(
                      (
                        token
                      ) => (
                        <div
                          key={`${token.address}-${token.symbol}`}
                          className="rounded-2xl border border-white/[0.07] bg-[#060709] p-4"
                        >
                          {/* COIN + BALANCE */}

                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              {token.logo ? (
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                                  <img
                                    src={
                                      token.logo
                                    }
                                    alt={`${token.symbol} logo`}
                                    className={
                                      token.symbol ===
                                      "cirBTC"
                                        ? "h-7 w-7 rounded-full object-contain"
                                        : "h-10 w-10 rounded-full object-contain"
                                    }
                                  />
                                </div>
                              ) : (
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0b1017] text-sm font-bold">
                                  {token.symbol
                                    .slice(
                                      0,
                                      1
                                    )
                                    .toUpperCase()}
                                </div>
                              )}

                              <div className="min-w-0">
                                <p className="font-black">
                                  {
                                    token.symbol
                                  }
                                </p>

                                <p className="mt-1 truncate text-xs font-medium text-white/25">
                                  {
                                    token.name
                                  }
                                </p>
                              </div>
                            </div>

                            {/* BALANCE */}

                            <p className="shrink-0 text-right text-sm font-black text-white/75">
                              {Number(
                                token.amount
                              ).toLocaleString(
                                undefined,
                                token.symbol ===
                                  "cirBTC"
                                  ? {
                                      minimumFractionDigits:
                                        5,
                                      maximumFractionDigits:
                                        5,
                                    }
                                  : {
                                      minimumFractionDigits:
                                        2,
                                      maximumFractionDigits:
                                        2,
                                    }
                              )}{" "}
                              <span className="text-white/40">
                                {
                                  token.symbol
                                }
                              </span>
                            </p>
                          </div>

                          {/* USD VALUE */}

                          <div className="mt-5 border-t border-white/[0.06] pt-4">
                            <p className="text-sm font-black text-white">
                              {token.usdValue !==
                              null
                                ? `$${token.usdValue.toFixed(
                                    2
                                  )}`
                                : "USD value unavailable"}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RECENT TRANSACTIONS */}

          {activityTransactions.length >
            0 && (
            <div className="mt-7 sm:mt-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-black">
                  Recent Transactions
                </h2>

                <span className="text-xs font-bold text-white/25">
                  {
                    activityTransactions.length
                  }{" "}
                  found
                </span>
              </div>

              {/* DESKTOP: ONE COLUMN */}

              <div className="space-y-3">
                {activityTransactions.map(
                  (
                    tx
                  ) => {
                    const transactionDate =
                      tx.timestamp
                        ? new Date(
                            tx.timestamp
                          )
                        : null;

                    const validDate =
                      transactionDate &&
                      !Number.isNaN(
                        transactionDate.getTime()
                      );

                    const formattedDate =
                      validDate
                        ? transactionDate!.toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )
                        : "Date unavailable";

                    const formattedTime =
                      validDate
                        ? transactionDate!.toLocaleTimeString(
                            undefined,
                            {
                              hour: "2-digit",
                              minute:
                                "2-digit",
                              second:
                                "2-digit",
                              hour12: false,
                            }
                          )
                        : "Time unavailable";

                    return (
                      <div
                        key={
                          tx.hash
                        }
                        className="rounded-2xl border border-white/[0.07] bg-[#060709] p-4 sm:p-5"
                      >
                        {/* HASH */}

                        <div className="min-w-0">
                          <p className="text-sm font-black">
                            Transaction
                          </p>

                          <div className="mt-1 flex min-w-0 items-center gap-2">
                            <p className="min-w-0 truncate font-mono text-xs font-medium text-white/25">
                              {shortenAddress(
                                tx.hash,
                                18,
                                12
                              )}
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                handleCopyHash(
                                  tx.hash
                                )
                              }
                              title={
                                copiedHash ===
                                tx.hash
                                  ? "Copied"
                                  : "Copy transaction hash"
                              }
                              aria-label={
                                copiedHash ===
                                tx.hash
                                  ? "Transaction hash copied"
                                  : "Copy transaction hash"
                              }
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/40 transition hover:bg-white/[0.07] hover:text-white/70"
                            >
                              {copiedHash ===
                              tx.hash ? (
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M20 6 9 17l-5-5" />
                                </svg>
                              ) : (
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <rect
                                    width="13"
                                    height="13"
                                    x="9"
                                    y="9"
                                    rx="2"
                                  />
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* DATE / TIME */}

                        <div className="mt-4 rounded-xl border border-white/[0.05] bg-[#020202] px-3 py-2.5">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-xs font-bold text-white/25">
                              Date
                            </span>

                            <span className="text-right text-xs font-semibold text-white/55">
                              {
                                formattedDate
                              }
                            </span>
                          </div>

                          <div className="mt-1.5 flex items-center justify-between gap-4">
                            <span className="text-xs font-bold text-white/25">
                              Time
                            </span>

                            <span className="text-right text-xs font-semibold text-white/55">
                              {
                                formattedTime
                              }
                            </span>
                          </div>
                        </div>

                        {/* FROM / TO */}

                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white/25">
                              From
                            </p>

                            <p
                              title={
                                tx.from
                              }
                              className="mt-1 truncate font-mono text-xs font-semibold text-white/55"
                            >
                              {shortenAddress(
                                tx.from,
                                14,
                                10
                              )}
                            </p>
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white/25">
                              To
                            </p>

                            <p
                              title={
                                tx.to
                              }
                              className="mt-1 truncate font-mono text-xs font-semibold text-white/55"
                            >
                              {shortenAddress(
                                tx.to,
                                14,
                                10
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-bold text-white/25">
                              Value
                            </p>

                            <p className="mt-1 break-words text-sm font-black text-white/65">
                              {
                                tx.value
                              }
                              {tx.tokenSymbol
                                ? ` ${tx.tokenSymbol}`
                                : ""}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-bold text-white/25">
                              Status
                            </p>

                            <p className="mt-1 text-sm font-black text-green-400">
                              {
                                tx.status
                              }
                            </p>
                          </div>
                        </div>

                        {/* ARCSCAN */}

                        <div className="mt-4 border-t border-white/[0.06] pt-3">
                          <a
                            href={`https://testnet.arcscan.app/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-black text-white/40 transition hover:text-white"
                          >
                            View on ArcScan
                            <span
                              aria-hidden="true"
                              className="text-base"
                            >
                              ↗
                            </span>
                          </a>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* EMPTY */}

          {!activityLoading &&
            isConnected &&
            activityAddress &&
            activityTransactions.length ===
              0 &&
            activityTokens.length ===
              0 &&
            !activityError && (
              <div className="mt-8 rounded-2xl border border-white/[0.07] bg-[#060709] p-6 text-center">
                <p className="text-sm font-medium leading-6 text-white/35">
                  No transactions or token
                  holdings found for this
                  wallet.
                </p>
              </div>
            )}
        </div>
      </section>
    </main>
  );
}
