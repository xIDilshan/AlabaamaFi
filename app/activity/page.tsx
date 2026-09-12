"use client";

import { useEffect, useState } from "react";
import { Manrope } from "next/font/google";
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

  if (
    upperSymbol === "USDC"
  ) {
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
    String(
      rawSymbol
    ).toUpperCase();

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

  if (
    upper === "USDC"
  ) {
    return "USDC";
  }

  return String(
    rawSymbol
  );
}

function getTokenName(
  token: any,
  symbol: string
): string {
  if (
    symbol === "USDC"
  ) {
    return "USD Coin";
  }

  if (
    symbol === "EURC"
  ) {
    return "Euro Coin";
  }

  if (
    symbol === "cirBTC"
  ) {
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

  return String(
    apiName || symbol
  );
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
    const decimals =
      Number(value);

    if (
      Number.isFinite(
        decimals
      ) &&
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

  if (
    upperSymbol === "CIRBTC"
  ) {
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
      value.formatted !==
        undefined &&
      value.formatted !== null
    ) {
      return String(
        value.formatted
      );
    }

    if (
      value.display !==
        undefined &&
      value.display !== null
    ) {
      return String(
        value.display
      );
    }

    if (
      value.amount !==
        undefined &&
      value.amount !== null
    ) {
      return formatTokenAmount(
        value.amount,
        Number(
          value.decimals ??
            decimals
        )
      );
    }

    if (
      value.raw !==
        undefined &&
      value.raw !== null
    ) {
      return formatTokenAmount(
        value.raw,
        Number(
          value.decimals ??
            decimals
        )
      );
    }

    if (
      value.value !==
        undefined &&
      value.value !== null
    ) {
      return formatTokenAmount(
        value.value,
        Number(
          value.decimals ??
            decimals
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

    if (
      decimals === 0
    ) {
      return raw.toString();
    }

    const zero =
      BigInt(0);

    const negative =
      raw < zero;

    const absolute =
      negative
        ? -raw
        : raw;

    const divisor =
      BigInt(10) **
      BigInt(decimals);

    const whole =
      absolute / divisor;

    const fraction =
      absolute % divisor;

    if (
      fraction === zero
    ) {
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

function getTokenAmount(
  token: any,
  decimals: number
): string {
  const candidates = [
    token.amount,
    token.balance,
    token.value,
    token.quantity,
    token.tokenAmount,
    token.token_amount,
    token.rawBalance,
    token.raw_balance,
    token.asset?.amount,
    token.asset?.balance,
    token.asset?.value,
    token.token?.amount,
    token.token?.balance,
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
        candidate.formatted !== null
      ) {
        return String(
          candidate.formatted
        );
      }

      const nested =
        candidate.amount ??
        candidate.balance ??
        candidate.value ??
        candidate.raw;

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
 * Read a USD value only when it is clearly
 * attached to the token holding / Money object.
 *
 * Arcscan documents Money values as:
 *
 * raw
 * decimals
 * formatted
 * usd
 * symbol
 *
 * Therefore:
 *
 * amount.usd / balance.usd / value.usd
 *
 * are treated as the USD value of that
 * holding amount.
 *
 * We deliberately DO NOT read:
 *
 * token.price.usd
 *
 * because that can be a unit price rather
 * than the total value of the user's holding.
 */
function getTokenUsdValue(
  token: any
): number | null {
  const moneyCandidates = [
    token.amount,
    token.balance,
    token.value,
    token.quantity,
    token.tokenAmount,
    token.token_amount,
    token.asset?.amount,
    token.asset?.balance,
    token.asset?.value,
    token.token?.amount,
    token.token?.balance,
    token.token?.value,
  ];

  for (
    const candidate of moneyCandidates
  ) {
    if (
      !candidate ||
      typeof candidate !==
        "object"
    ) {
      continue;
    }

    const usd =
      candidate.usd;

    if (
      usd === null ||
      usd === undefined
    ) {
      continue;
    }

    const numericUsd =
      Number(usd);

    if (
      Number.isFinite(
        numericUsd
      )
    ) {
      return numericUsd;
    }
  }

  /*
   * Some responses can expose an explicit
   * holding USD field directly on the token.
   */
  const directCandidates = [
    token.usdValue,
    token.usd_value,
    token.valueUsd,
    token.value_usd,
  ];

  for (
    const candidate of directCandidates
  ) {
    if (
      candidate === null ||
      candidate === undefined
    ) {
      continue;
    }

    const numericUsd =
      Number(candidate);

    if (
      Number.isFinite(
        numericUsd
      )
    ) {
      return numericUsd;
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

  const handleCopyHash =
    async (
      hash: string
    ) => {
      try {
        await navigator.clipboard.writeText(
          hash
        );

        setCopiedHash(
          hash
        );

        setTimeout(() => {
          setCopiedHash(
            null
          );
        }, 1800);
      } catch (
        error
      ) {
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

      setActivityLoading(
        true
      );

      try {
        const transactions =
          await getWalletTransactions(
            walletAddress
          );

        setActivityTransactions(
          transactions
        );

        let tokenHoldings: TokenHolding[] =
          [];

        /*
         * Arcscan token balances.
         */
        try {
          const response =
            await fetch(
              `https://api-testnet.arc-scan.org/v1/address/${walletAddress}/tokens`
            );

          if (
            response.ok
          ) {
            const data =
              await response.json();

            const rawTokens =
              Array.isArray(
                data
              )
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

                    const usdValue =
                      getTokenUsdValue(
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
        } catch (
          error
        ) {
          console.error(
            "Token balance error:",
            error
          );

          tokenHoldings =
            [];
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
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify(
                  {
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
                  }
                ),
              }
            );

          if (
            response.ok
          ) {
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
                ) /
                1_000_000;

              if (
                usdcAmount > 0
              ) {
                tokenHoldings.unshift(
                  {
                    address:
                      USDC_ADDRESS,

                    symbol:
                      "USDC",

                    name:
                      "USD Coin",

                    amount:
                      String(
                        usdcAmount
                      ),

                    logo:
                      "/tokens/usdc.svg",

                    usdValue:
                      usdcAmount,

                    decimals: 6,
                  }
                );
              }
            }
          }
        } catch (
          error
        ) {
          console.error(
            "USDC balance error:",
            error
          );
        }

        setActivityTokens(
          tokenHoldings
        );

        /*
         * Portfolio:
         * Add all available TOTAL USD
         * holding values.
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
      } catch (
        error
      ) {
        console.error(
          error
        );

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
        onMenuClick={() => {
          window.dispatchEvent(
            new Event(
              "open-wallet-modal"
            )
          );
        }}
      />

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

                  <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                    {activityTokens.map(
                      (
                        token
                      ) => (
                        <div
                          key={`${token.address}-${token.symbol}`}
                          className="rounded-2xl border border-white/[0.07] bg-[#060709] p-4"
                        >
                          {/* ROW 1: COIN + USD */}

                          <div className="flex min-w-0 items-center justify-between gap-4">
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

                            <div className="shrink-0 text-right">
                              <p className="font-black">
                                {token.usdValue !==
                                null
                                  ? `$${token.usdValue.toFixed(
                                      2
                                    )}`
                                  : "—"}
                              </p>

                              <p className="mt-1 text-xs font-semibold text-white/25">
                                USD Value
                              </p>
                            </div>
                          </div>

                          {/* ROW 2: BALANCE */}

                          <div className="mt-4 border-t border-white/[0.06] pt-3">
                            <p className="text-xs font-bold text-white/25">
                              Balance
                            </p>

                            <p className="mt-1 break-all text-sm font-black text-white/75">
                              {Number(
                                token.amount
                              ).toLocaleString(
                                undefined,
                                {
                                  maximumFractionDigits:
                                    8,
                                }
                              )}{" "}
                              <span className="text-white/40">
                                {
                                  token.symbol
                                }
                              </span>
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

              <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
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
                                10,
                                8
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
                                tx.from
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
                                tx.to
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
