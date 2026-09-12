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

function shortenAddress(address: string) {
  if (!address) return "";

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
    token?.symbol ??
    token?.tokenSymbol ??
    token?.token?.symbol ??
    token?.asset?.symbol ??
    token?.name ??
    "";

  const upperSymbol =
    String(rawSymbol).toUpperCase();

  if (
    upperSymbol === "EUROC" ||
    upperSymbol === "EURC"
  ) {
    return "EURC";
  }

  if (
    upperSymbol === "CIRBTC" ||
    upperSymbol === "CIR-BTC"
  ) {
    return "cirBTC";
  }

  return String(rawSymbol);
}

function getTokenName(
  token: any,
  symbol: string
): string {
  return String(
    token?.name ??
      token?.tokenName ??
      token?.token?.name ??
      token?.asset?.name ??
      symbol
  );
}

function getTokenAddress(
  token: any
): string {
  return String(
    token?.address ??
      token?.tokenAddress ??
      token?.contractAddress ??
      token?.token?.address ??
      token?.asset?.address ??
      ""
  );
}

function getTokenAmount(
  token: any
): string {
  const rawAmount =
    token?.amount ??
    token?.balance ??
    token?.value ??
    token?.quantity ??
    token?.token?.amount ??
    token?.asset?.amount ??
    "0";

  if (
    typeof rawAmount === "object" &&
    rawAmount !== null
  ) {
    const formatted =
      rawAmount.formatted ??
      rawAmount.amount ??
      rawAmount.value ??
      rawAmount.balance ??
      rawAmount.raw;

    if (
      formatted !== undefined &&
      formatted !== null
    ) {
      return String(formatted);
    }

    return "0";
  }

  return String(rawAmount);
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

  if (typeof value === "object") {
    const nested =
      value.usd ??
      value.usdValue ??
      value.usd_value ??
      value.formatted ??
      value.value ??
      value.amount ??
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

function getTokenUsdValue(
  token: any
): number | null {
  const directValue =
    token?.usdValue ??
    token?.usd_value ??
    token?.valueUsd ??
    token?.value_usd ??
    token?.usd ??
    token?.priceUsd;

  const directUsd =
    getUsdValue(directValue);

  if (directUsd !== null) {
    return directUsd;
  }

  const amountCandidates = [
    token?.amount,
    token?.balance,
    token?.value,
    token?.quantity,
    token?.token?.amount,
    token?.asset?.amount,
  ];

  for (const candidate of amountCandidates) {
    if (
      candidate &&
      typeof candidate === "object"
    ) {
      const usd =
        getUsdValue(candidate.usd);

      if (usd !== null) {
        return usd;
      }
    }
  }

  return null;
}

function formatTokenAmount(
  amount: string
): string {
  const number = Number(amount);

  if (!Number.isFinite(number)) {
    return "0.00";
  }

  return number.toLocaleString(
    undefined,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}

export default function ActivityPage() {
  const {
    address,
    isConnected,
  } = useAccount();

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
    useState("");

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

  const handleCopyHash = async (
    hash: string
  ) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(hash);

      window.setTimeout(() => {
        setCopiedHash("");
      }, 1500);
    } catch {
      setCopiedHash("");
    }
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

      setActivityTransactions(transactions);

      let tokenHoldings: TokenHolding[] = [];

      /*
       * Get token holdings from Arcscan.
       *
       * Arcscan can return tokens in slightly
       * different shapes, so the parser below
       * checks the supported fields and nested
       * token/asset objects.
       */
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
              : Array.isArray(data?.data)
              ? data.data
              : [];

          tokenHoldings =
            rawTokens
              .map((token: any) => {
                const symbol =
                  getTokenSymbol(token);

                const address =
                  getTokenAddress(token);

                const amount =
                  getTokenAmount(token);

                const usdValue =
                  getTokenUsdValue(token);

                return {
                  address,
                  symbol,
                  name:
                    getTokenName(
                      token,
                      symbol
                    ),
                  amount,
                  logo:
                    getTokenLogo(
                      symbol,
                      token?.logo ??
                        token?.logoUrl ??
                        token?.image ??
                        token?.token?.logo ??
                        token?.asset?.logo ??
                        null
                    ),
                  usdValue,
                };
              })
              .filter(
                (token: TokenHolding) =>
                  token.symbol
                    .trim()
                    .length > 0 &&
                  token.symbol
                    .toUpperCase() !==
                    "USDC"
              );
        }
      } catch (tokenError) {
        console.error(
          "Token API error:",
          tokenError
        );

        tokenHoldings = [];
      }

      /*
       * Get USDC directly from Arc RPC.
       *
       * This makes sure USDC is displayed even
       * when Arcscan does not include it in the
       * token endpoint response.
       */
      try {
        const paddedAddress =
          walletAddress
            .slice(2)
            .padStart(64, "0");

        const response =
          await fetch(
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

        if (response.ok) {
          const rpcResult =
            await response.json();

          if (rpcResult?.result) {
            const rawBalance =
              BigInt(
                rpcResult.result
              );

            const usdcAmount =
              Number(rawBalance) /
              1_000_000;

            tokenHoldings.unshift({
              address:
                USDC_ADDRESS,
              symbol: "USDC",
              name: "USD Coin",
              amount:
                String(usdcAmount),
              logo:
                "/tokens/usdc.svg",
              usdValue:
                usdcAmount,
            });
          }
        }
      } catch (rpcError) {
        console.error(
          "USDC RPC error:",
          rpcError
        );
      }

      /*
       * Keep the supported tokens in the
       * requested order:
       *
       * USDC → EURC → cirBTC
       */
      const supportedSymbols = [
        "USDC",
        "EURC",
        "CIRBTC",
      ];

      const normalizedTokens =
        tokenHoldings
          .filter((token) => {
            const symbol =
              token.symbol.toUpperCase();

            return (
              supportedSymbols.includes(
                symbol
              )
            );
          })
          .sort((a, b) => {
            const aIndex =
              supportedSymbols.indexOf(
                a.symbol.toUpperCase()
              );

            const bIndex =
              supportedSymbols.indexOf(
                b.symbol.toUpperCase()
              );

            return aIndex - bIndex;
          });

      /*
       * Remove duplicate token entries.
       */
      const uniqueTokens: TokenHolding[] =
        [];

      const seenSymbols =
        new Set<string>();

      for (const token of normalizedTokens) {
        const symbol =
          token.symbol.toUpperCase();

        if (seenSymbols.has(symbol)) {
          continue;
        }

        seenSymbols.add(symbol);
        uniqueTokens.push(token);
      }

      setActivityTokens(
        uniqueTokens
      );

      const totalValue =
        uniqueTokens.reduce(
          (total, token) => {
            if (
              token.usdValue !== null &&
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

      if (uniqueTokens.length > 0) {
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
      `}</style>

      <Header />

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
                    <h3 className="font-black">
                      Token Holdings
                    </h3>

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

                  <div className="space-y-3 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
                    {activityTokens.map(
                      (token) => (
                        <div
                          key={`${token.address}-${token.symbol}`}
                          className="min-w-0 rounded-2xl border border-white/[0.07] bg-[#060709] p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
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

                            <p className="shrink-0 text-right text-sm font-black text-white/75">
                              {formatTokenAmount(
                                token.amount
                              )}{" "}
                              {
                                token.symbol
                              }
                            </p>
                          </div>

                          <div className="mt-4 border-t border-white/[0.06] pt-3">
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

              {/* TRANSACTION SUMMARY */}

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
                <h3 className="font-black">
                  Recent Transactions
                </h3>

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

                            <div className="mt-1 flex items-start gap-2">
                              <p className="min-w-0 break-all text-xs font-medium leading-5 text-white/25">
                                {tx.hash}
                              </p>

                              <button
                                onClick={() =>
                                  handleCopyHash(
                                    tx.hash
                                  )
                                }
                                className="shrink-0 text-xs font-bold text-white/30 transition hover:text-white"
                                title="Copy transaction hash"
                                aria-label="Copy transaction hash"
                              >
                                {copiedHash ===
                                tx.hash
                                  ? "Copied"
                                  : "Copy"}
                              </button>
                            </div>
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
                              {tx.from
                                ? shortenAddress(
                                    tx.from
                                  )
                                : "Unavailable"}
                            </p>
                          </div>

                          <div className="min-w-0">
                            <p className="font-bold text-white/25">
                              To
                            </p>

                            <p className="mt-1 break-all font-semibold text-white/55">
                              {tx.to
                                ? shortenAddress(
                                    tx.to
                                  )
                                : "Unavailable"}
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
                  }
                )}
              </div>
            </div>
          )}

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
