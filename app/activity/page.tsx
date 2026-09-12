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
  if (!address) return "—";

  if (address.length <= start + end + 3) {
    return address;
  }

  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

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

/*
 * Convert raw token values into human-readable
 * amounts.
 */function formatTokenAmount(
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

  /*
   * If the API already returned a
   * decimal value, keep it as-is.
   */
  if (
    stringValue.includes(".")
  ) {
    return stringValue;
  }

  /*
   * Raw integer token amount.
   */
  try {
    const raw =
      BigInt(stringValue);

    if (decimals === 0) {
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

function getUsdValue(
  value: any
): number | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    typeof value === "object"
  ) {
    const nested =
      value.formatted ??
      value.value ??
      value.amount ??
      value.raw ??
      null;

    if (
      nested !== null &&
      nested !== undefined &&
      Number.isFinite(
        Number(nested)
      )
    ) {
      return Number(nested);
    }

    return null;
  }

  const numberValue =
    Number(value);

  return Number.isFinite(
    numberValue
  )
    ? numberValue
    : null;
}

function getTokenDecimals(
  token: any,
  symbol: string
): number {
  const apiDecimals =
    Number(
      token.decimals ??
        token.tokenDecimals ??
        token.decimal ??
        token.token?.decimals ??
        token.metadata?.decimals
    );

  if (
    Number.isFinite(apiDecimals) &&
    apiDecimals >= 0 &&
    apiDecimals <= 36
  ) {
    return apiDecimals;
  }

  /*
   * Known Arc testnet tokens.
   */
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

export default function ActivityPage() {
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

  const [copiedHash, setCopiedHash] =
    useState<string | null>(null);

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

  const handleCopyHash = async (
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

        let tokenHoldings: TokenHolding[] =
          [];

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
                : [];

            tokenHoldings =
              rawTokens
                .map(
                  (
                    token: any
                  ) => {
                    const rawSymbol =
                      token.symbol ??
                      token.tokenSymbol ??
                      token.name ??
                      "";

                    const upperSymbol =
                      String(
                        rawSymbol
                      ).toUpperCase();

                    let symbol =
                      String(
                        rawSymbol
                      );

                    if (
                      upperSymbol ===
                      "EUROC"
                    ) {
                      symbol =
                        "EURC";
                    }

                    if (
                      upperSymbol ===
                      "CIRBTC"
                    ) {
                      symbol =
                        "cirBTC";
                    }

                    const decimals =
                      getTokenDecimals(
                        token,
                        symbol
                      );

                    const tokenAddress =
                      token.address ??
                      token.tokenAddress ??
                      token.contractAddress ??
                      token.token?.address ??
                      "";

                    const rawAmount =
                      token.amount ??
                      token.balance ??
                      token.value ??
                      token.quantity ??
                      token.token?.amount ??
                      token.token?.balance ??
                      "0";

                    const amount =
                      formatTokenAmount(
                        rawAmount,
                        decimals
                      );

                    const usdValue =
                      getUsdValue(
                        token.usdValue ??
                          token.usd_value ??
                          token.valueUsd ??
                          token.usd ??
                          token.priceUsd
                      );

                    return {
                      address:
                        String(
                          tokenAddress
                        ),

                      symbol,

                      name:
                        token.name ??
                        token.tokenName ??
                        token.token?.name ??
                        symbol,

                      amount,

                      logo:
                        getTokenLogo(
                          symbol,
                          token.logo ??
                            token.logoUrl ??
                            token.image ??
                            token.token?.logo ??
                            null
                        ),

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
        } catch {
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

          const data =
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

          if (data.ok) {
            const rpcResult =
              await data.json();

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
        } catch {
          // Keep Arcscan token results.
        }

        setActivityTokens(
          tokenHoldings
        );

        const totalValue =
          tokenHoldings.reduce(
            (
              total,
              token
            ) => {
              if (
                token.usdValue !==
                null
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

        if (
          tokenHoldings.length >
          0
        ) {
          setPortfolioValue(
            totalValue
          );
        }
      } catch (err) {
        console.error(err);

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

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm font-semibold text-white/35">
            AlabaamaFi
          </p>

          <h1 className="mt-1 text-3xl font-black sm:text-4xl">
            Wallet Activity
          </h1>

          <p className="mt-3 text-sm font-medium leading-6 text-white/35">
            Connect your wallet to view its token
            holdings and recent transactions.
          </p>

          {/* CHECKER */}

          <div className="mt-7 rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#0a0f16] via-[#06080b] to-[#030303] p-4 shadow-2xl shadow-black/60 sm:mt-8 sm:p-6">
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

            <button
              onClick={() => {
                if (!isConnected) {
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
                  {activityError}
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

              <div className="rounded-2xl border border-white/[0.07] bg-[#060709] p-5">
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

                  <div className="space-y-3">
                    {activityTokens.map(
                      (
                        token
                      ) => (
                        <div
                          key={`${token.address}-${token.symbol}`}
                          className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-[#060709] p-4"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {token.logo ? (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                                <img
                                  src={
                                    token.logo
                                  }
                                  alt={`${token.symbol} logo`}
                                  className="h-10 w-10 rounded-full object-contain"
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
                              {Number(
                                token.amount
                              ).toLocaleString(
                                undefined,
                                {
                                  maximumFractionDigits:
                                    8,
                                }
                              )}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-white/25">
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

          {/* TRANSACTIONS */}

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

              <div className="space-y-3">
                {activityTransactions.map(
                  (tx) => {
                    const transactionDate =
                      tx.timestamp
                        ? new Date(
                            tx.timestamp
                          )
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
                        key={tx.hash}
                        className="rounded-2xl border border-white/[0.07] bg-[#060709] p-4 sm:p-5"
                      >
                        {/* HASH */}

                        <div className="min-w-0">
                          <p className="text-sm font-black">
                            Transaction
                          </p>

                          <div className="mt-1 flex min-w-0 items-center gap-2">
                            <p className="min-w-0 truncate text-xs font-medium text-white/25">
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
                              className="shrink-0 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[10px] font-bold text-white/40 transition hover:bg-white/[0.07] hover:text-white/70"
                            >
                              {copiedHash ===
                              tx.hash
                                ? "Copied"
                                : "Copy"}
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
                              title={tx.from}
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
                              title={tx.to}
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
                              className="text-sm"
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
                  holdings found for this wallet.
                </p>
              </div>
            )}
        </div>
      </section>
    </main>
  );
}
