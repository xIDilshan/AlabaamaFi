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

    const walletAddress =
      activityAddress.trim();

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

      setActivityTransactions(
        transactions
      );

      let tokenHoldings: TokenHolding[] =
        [];

      try {
        const response = await fetch(
          `https://api-testnet.arc-scan.org/v1/address/${walletAddress}/tokens`
        );

        if (response.ok) {
          const data =
            await response.json();

          const rawTokens =
            Array.isArray(data)
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
                String(
                  rawSymbol
                ).toUpperCase();

              let symbol =
                String(rawSymbol);

              if (
                upperSymbol ===
                "EUROC"
              ) {
                symbol = "EURC";
              }

              if (
                upperSymbol ===
                "CIRBTC"
              ) {
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
                  String(tokenAddress),

                symbol,

                name:
                  token.name ??
                  token.tokenName ??
                  symbol,

                amount:
                  String(amount),

                logo:
                  getTokenLogo(
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

      /*
       * Direct USDC balance check.
       *
       * Arcscan may not always return USDC,
       * so we check the USDC contract directly.
       */

      try {
        const paddedAddress =
          walletAddress
            .slice(2)
            .padStart(64, "0");

        const data = await fetch(
          "https://rpc.testnet.arc.network",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
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
          const rpcResult =
            await data.json();

          if (rpcResult?.result) {
            const rawBalance =
              BigInt(
                rpcResult.result
              );

            const usdcAmount =
              Number(rawBalance) /
              1_000_000;

            if (usdcAmount > 0) {
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
              });
            }
          }
        }
      } catch {
        // Keep Arcscan token results
        // if direct RPC fails.
      }

      setActivityTokens(
        tokenHoldings
      );

      const totalValue =
        tokenHoldings.reduce(
          (total, token) => {
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
        tokenHoldings.length > 0
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

      {/* HEADER */}

      <Header
        onMenuClick={() => {
          window.dispatchEvent(
            new Event(
              "open-wallet-modal"
            )
          );
        }}
      />

      {/* CONTENT */}

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
              className={`mt-4 min-h-13 w-full rounded-full px-5 py-4 text-sm font-black tracking-tight ${
                !isConnected
                  ? "border border-white/[0.05] bg-[#111318] text-white/35 transition hover:bg-[#151820]"
                  : "border border-black/[0.08] bg-white text-black shadow-[0_2px_6px_rgba(0,0,0,0.06),0_10px_28px_rgba(0,0,0,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#fafafa] hover:shadow-[0_4px_10px_rgba(0,0,0,0.08),0_14px_34px_rgba(0,0,0,0.18)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
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

          {/* RESULTS */}

          {(activityTokens.length > 0 ||
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
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="font-black">
                      Token Holdings
                    </h2>

                    <span className="shrink-0 text-xs font-bold text-white/25">
                      {
                        activityTokens.length
                      }{" "}
                      token
                      {activityTokens.length !==
                      1
                        ? "s"
                        : ""}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {activityTokens.map(
                      (token) => (
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

              {/* TRANSACTION COUNT */}

              {activityTransactions.length >
                0 && (
                <div className="mt-7 rounded-2xl border border-white/[0.07] bg-[#060709] p-5 sm:mt-8">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-white/25">
                        Transactions
                      </p>

                      <p className="mt-2 text-2xl font-black">
                        {
                          activityTransactions.length
                        }
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

          {/* RECENT TRANSACTIONS */}

          {activityTransactions.length >
            0 && (
            <div className="mt-7 sm:mt-8">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-black">
                  Recent Transactions
                </h2>

                <span className="shrink-0 text-xs font-bold text-white/25">
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
                        className="rounded-2xl border border-white/[0.07] bg-[#060709] p-4 transition hover:bg-[#0a0d12] sm:p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-black">
                              Transaction
                            </p>

                            <p className="mt-1 break-all text-xs font-medium leading-5 text-white/25">
                              {
                                tx.hash
                              }
                            </p>
                          </div>
                        </div>

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

                        <div className="mt-4 grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
                          <div className="min-w-0">
                            <p className="font-bold text-white/25">
                              From
                            </p>

                            <p className="mt-1 break-all font-semibold text-white/55">
                              {
                                tx.from
                              }
                            </p>
                          </div>

                          <div className="min-w-0">
                            <p className="font-bold text-white/25">
                              To
                            </p>

                            <p className="mt-1 break-all font-semibold text-white/55">
                              {
                                tx.to
                              }
                            </p>
                          </div>

                          <div>
                            <p className="font-bold text-white/25">
                              Value
                            </p>

                            <p className="mt-1 break-words font-black text-white/65">
                              {
                                tx.value
                              }
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
                              {
                                tx.status
                              }
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
