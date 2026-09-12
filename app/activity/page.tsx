"use client";

import { useEffect, useState } from "react";
import { Manrope } from "next/font/google";
import { useAccount } from "wagmi";
import { isAddress } from "viem";

import Header from "@/components/Header";
import {
  getWalletTransactions,
  WalletTransaction,
} from "@/lib/arcscan";

const manrope = Manrope({
  subsets: ["latin"],
});

const USDC_ADDRESS =
  "0x3600000000000000000000000000000000000000";

type TokenHolding = {
  symbol: string;
  name: string;
  balance: string;
  usdValue: number | null;
  logo: string;
  decimals: number;
};

function shortenAddress(address: string) {
  if (!address) return "";

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getTokenLogo(symbol: string) {
  const normalized =
    symbol.toUpperCase();

  if (normalized === "USDC") {
    return "/tokens/usdc.svg";
  }

  if (
    normalized === "EURC" ||
    normalized === "EUROC"
  ) {
    return "/tokens/eurc.svg";
  }

  if (
    normalized === "CIRBTC" ||
    normalized === "CIR.BTC"
  ) {
    return "/tokens/cirbtc.svg";
  }

  return "/tokens/usdc.svg";
}

function getTokenSymbol(token: any) {
  const symbol =
    token?.symbol ||
    token?.token_symbol ||
    token?.tokenSymbol ||
    token?.token?.symbol ||
    token?.asset?.symbol ||
    token?.amount?.symbol ||
    "";

  const normalized =
    String(symbol).toUpperCase();

  if (normalized === "EUROC") {
    return "EURC";
  }

  if (
    normalized === "CIR.BTC" ||
    normalized === "CIRBTC"
  ) {
    return "cirBTC";
  }

  if (normalized === "USDC") {
    return "USDC";
  }

  if (normalized === "EURC") {
    return "EURC";
  }

  return String(symbol);
}

function getTokenName(
  symbol: string,
  token: any
) {
  const apiName =
    token?.name ||
    token?.token_name ||
    token?.tokenName ||
    token?.token?.name ||
    token?.asset?.name ||
    "";

  if (apiName) {
    return String(apiName);
  }

  if (symbol === "USDC") {
    return "USD Coin";
  }

  if (symbol === "EURC") {
    return "Euro Coin";
  }

  if (symbol === "cirBTC") {
    return "Circle Bitcoin";
  }

  return symbol;
}

function getTokenDecimals(
  token: any,
  symbol: string
) {
  const possibleDecimals = [
    token?.decimals,
    token?.token_decimals,
    token?.tokenDecimals,
    token?.token?.decimals,
    token?.asset?.decimals,
    token?.amount?.decimals,
    token?.balance?.decimals,
  ];

  for (const value of possibleDecimals) {
    const decimals = Number(value);

    if (
      Number.isFinite(decimals) &&
      decimals >= 0
    ) {
      return decimals;
    }
  }

  if (
    symbol === "USDC" ||
    symbol === "EURC"
  ) {
    return 6;
  }

  if (symbol === "cirBTC") {
    return 8;
  }

  return 18;
}

function formatTokenAmount(
  value: any,
  decimals: number
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "0";
  }

  /*
   * Already formatted amount.
   */
  if (
    typeof value === "object" &&
    value.formatted !== undefined &&
    value.formatted !== null
  ) {
    const formatted =
      Number(value.formatted);

    if (Number.isFinite(formatted)) {
      return formatted.toLocaleString(
        "en-US",
        {
          maximumFractionDigits: 8,
        }
      );
    }
  }

  /*
   * Raw amount object.
   */
  if (
    typeof value === "object"
  ) {
    if (
      value.amount !== undefined &&
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
      value.raw !== undefined &&
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
      value.value !== undefined &&
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
    String(value);

  /*
   * Integer/raw blockchain amount.
   */
  if (
    /^\d+$/.test(stringValue) &&
    decimals > 0
  ) {
    try {
      const raw =
        BigInt(stringValue);

      const divisor =
        BigInt(10) **
        BigInt(decimals);

      const whole =
        raw / divisor;

      const fraction =
        raw % divisor;

      if (
        fraction === BigInt(0)
      ) {
        return Number(
          whole
        ).toLocaleString(
          "en-US"
        );
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

      return `${Number(
        whole
      ).toLocaleString(
        "en-US"
      )}.${fractionString}`;
    } catch {
      // Continue with normal number parsing.
    }
  }

  const numeric =
    Number(value);

  if (
    !Number.isFinite(numeric)
  ) {
    return "0";
  }

  return numeric.toLocaleString(
    "en-US",
    {
      maximumFractionDigits: 8,
    }
  );
}

function getTokenAmount(
  token: any
) {
  const candidates = [
    token?.balance,
    token?.amount,
    token?.quantity,
    token?.token_balance,
    token?.tokenBalance,
    token?.value,
    token?.raw_balance,
    token?.rawBalance,
    token?.token?.balance,
    token?.token?.amount,
    token?.asset?.balance,
    token?.asset?.amount,
  ];

  for (const candidate of candidates) {
    if (
      candidate !== null &&
      candidate !== undefined
    ) {
      return candidate;
    }
  }

  return 0;
}

function getTokenUsdValue(
  token: any
): number | null {
  const candidates = [
    token?.usd,
    token?.usd_value,
    token?.usdValue,
    token?.value_usd,
    token?.valueUsd,
    token?.price_usd,
    token?.priceUsd,

    token?.amount?.usd,
    token?.amount?.usd_value,
    token?.amount?.usdValue,
    token?.amount?.value_usd,
    token?.amount?.valueUsd,

    token?.balance?.usd,
    token?.balance?.usd_value,
    token?.balance?.usdValue,
    token?.balance?.value_usd,
    token?.balance?.valueUsd,

    token?.token?.usd,
    token?.token?.usd_value,
    token?.token?.usdValue,

    token?.asset?.usd,
    token?.asset?.usd_value,
    token?.asset?.usdValue,
  ];

  for (const value of candidates) {
    if (
      value !== null &&
      value !== undefined &&
      value !== ""
    ) {
      const numeric =
        Number(value);

      if (
        Number.isFinite(numeric) &&
        numeric >= 0
      ) {
        return numeric;
      }
    }
  }

  return null;
}

function getApiLogo(
  token: any,
  symbol: string
) {
  const apiLogo =
    token?.logo ||
    token?.logo_url ||
    token?.logoUrl ||
    token?.icon ||
    token?.icon_url ||
    token?.iconUrl ||
    token?.token?.logo ||
    token?.token?.logo_url ||
    token?.asset?.logo ||
    "";

  /*
   * Always prefer our local logos for
   * the three supported tokens.
   */
  if (
    symbol === "USDC" ||
    symbol === "EURC" ||
    symbol === "cirBTC"
  ) {
    return getTokenLogo(symbol);
  }

  return (
    apiLogo ||
    getTokenLogo(symbol)
  );
}

export default function ActivityPage() {
  const {
    address,
    isConnected,
  } = useAccount();

  const [activityAddress, setActivityAddress] =
    useState("");

  const [
    activityTransactions,
    setActivityTransactions,
  ] = useState<WalletTransaction[]>(
    []
  );

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
  ] = useState<TokenHolding[]>(
    []
  );

  const [
    portfolioValue,
    setPortfolioValue,
  ] = useState(0);

  const [
    copiedHash,
    setCopiedHash,
  ] = useState("");

  useEffect(() => {
    if (address) {
      setActivityAddress(address);
    }
  }, [address]);

  const handleCopyHash = async (
    hash: string
  ) => {
    try {
      await navigator.clipboard.writeText(
        hash
      );

      setCopiedHash(hash);

      window.setTimeout(() => {
        setCopiedHash("");
      }, 1800);
    } catch {
      setCopiedHash("");
    }
  };

  const handleCheckActivity =
    async () => {
      setActivityError("");

      if (!isConnected || !address) {
        setActivityError(
          "Please connect your wallet first."
        );
        return;
      }

      if (
        !activityAddress ||
        !isAddress(activityAddress)
      ) {
        setActivityError(
          "Please enter a valid wallet address."
        );
        return;
      }

      try {
        setActivityLoading(true);

        const walletAddress =
          activityAddress;

        /*
         * Fetch wallet transactions.
         */
        const transactions =
          await getWalletTransactions(
            walletAddress
          );

        setActivityTransactions(
          transactions
        );

        /*
         * Fetch token holdings.
         */
        const response =
          await fetch(
            `https://api-testnet.arc-scan.org/v1/address/${walletAddress}/tokens`
          );

        if (!response.ok) {
          throw new Error(
            `Token API error: ${response.status}`
          );
        }

        const data =
          await response.json();

        const rawTokens =
          Array.isArray(data)
            ? data
            : data.items ||
              data.tokens ||
              data.data ||
              [];

        const normalizedTokens: TokenHolding[] =
          [];

        for (
          const token of rawTokens
        ) {
          const symbol =
            getTokenSymbol(token);

          if (!symbol) {
            continue;
          }

          /*
           * Ignore unknown zero-value tokens.
           */
          const decimals =
            getTokenDecimals(
              token,
              symbol
            );

          const rawAmount =
            getTokenAmount(token);

          const balance =
            formatTokenAmount(
              rawAmount,
              decimals
            );

          const numericBalance =
            Number(
              String(balance).replace(
                /,/g,
                ""
              )
            );

          if (
            !Number.isFinite(
              numericBalance
            ) ||
            numericBalance <= 0
          ) {
            continue;
          }

          const usdValue =
            getTokenUsdValue(
              token
            );

          normalizedTokens.push({
            symbol,
            name:
              getTokenName(
                symbol,
                token
              ),
            balance,
            usdValue,
            logo:
              getApiLogo(
                token,
                symbol
              ),
            decimals,
          });
        }

        /*
         * Make sure USDC is always checked
         * directly from the Arc RPC.
         *
         * This prevents Arcscan from omitting
         * a USDC balance.
         */
        try {
          const balanceOfSelector =
            "70a08231";

          const paddedAddress =
            walletAddress
              .toLowerCase()
              .replace(
                "0x",
                ""
              )
              .padStart(
                64,
                "0"
              );

          const rpcResponse =
            await fetch(
              "https://rpc.testnet.arc.network",
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  jsonrpc:
                    "2.0",
                  id: 1,
                  method:
                    "eth_call",
                  params: [
                    {
                      to: USDC_ADDRESS,
                      data:
                        `0x${balanceOfSelector}${paddedAddress}`,
                    },
                    "latest",
                  ],
                }),
              }
            );

          const rpcData =
            await rpcResponse.json();

          const rawUsdc =
            rpcData?.result;

          if (
            rawUsdc &&
            rawUsdc !== "0x"
          ) {
            const usdcRaw =
              BigInt(
                rawUsdc
              );

            const usdcAmount =
              Number(
                usdcRaw
              ) / 1000000;

            const existingUsdc =
              normalizedTokens.find(
                (token) =>
                  token.symbol ===
                  "USDC"
              );

            if (
              existingUsdc
            ) {
              existingUsdc.balance =
                usdcAmount.toLocaleString(
                  "en-US",
                  {
                    maximumFractionDigits:
                      6,
                  }
                );
            } else if (
              usdcAmount > 0
            ) {
              /*
               * USDC price is approximately
               * represented by its USD amount
               * when the API does not provide
               * a separate price.
               */
              normalizedTokens.push({
                symbol:
                  "USDC",
                name:
                  "USD Coin",
                balance:
                  usdcAmount.toLocaleString(
                    "en-US",
                    {
                      maximumFractionDigits:
                        6,
                    }
                  ),
                usdValue:
                  usdcAmount,
                logo:
                  "/tokens/usdc.svg",
                decimals:
                  6,
              });
            }
          }
        } catch {
          /*
           * Keep API token results if direct
           * RPC balance lookup fails.
           */
        }

        /*
         * Sort the main three tokens first.
         */
        const tokenOrder = [
          "USDC",
          "EURC",
          "cirBTC",
        ];

        normalizedTokens.sort(
          (a, b) => {
            const aIndex =
              tokenOrder.indexOf(
                a.symbol
              );

            const bIndex =
              tokenOrder.indexOf(
                b.symbol
              );

            if (
              aIndex === -1 &&
              bIndex === -1
            ) {
              return 0;
            }

            if (
              aIndex === -1
            ) {
              return 1;
            }

            if (
              bIndex === -1
            ) {
              return -1;
            }

            return (
              aIndex - bIndex
            );
          }
        );

        setActivityTokens(
          normalizedTokens
        );

        const totalPortfolio =
          normalizedTokens.reduce(
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

        setPortfolioValue(
          totalPortfolio
        );
      } catch (error) {
        console.error(
          error
        );

        setActivityError(
          error instanceof Error
            ? error.message
            : "Unable to load wallet activity."
        );

        setActivityTransactions(
          []
        );

        setActivityTokens(
          []
        );

        setPortfolioValue(
          0
        );
      } finally {
        setActivityLoading(
          false
        );
      }
    };

  return (
    <main
      className={`${manrope.className} min-h-screen bg-[#030405] text-white`}
    >
      <Header
        onMenuClick={() => {}}
      />

      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Wallet Activity
          </h1>

          <p className="mt-2 text-sm text-white/40">
            Check wallet balances and recent
            activity on Arc Testnet.
          </p>
        </div>

        {/* WALLET CHECKER */}

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 sm:p-5">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/35">
            Wallet Address
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={activityAddress}
              onChange={(event) =>
                setActivityAddress(
                  event.target.value
                )
              }
              placeholder="0x..."
              className="min-w-0 flex-1 rounded-xl border border-white/[0.07] bg-[#080a0c] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/20"
            />

            <button
              type="button"
              onClick={
                handleCheckActivity
              }
              disabled={
                activityLoading
              }
              className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {activityLoading
                ? "Checking..."
                : "Check Wallet Activity"}
            </button>
          </div>

          {activityError && (
            <p className="mt-3 text-sm text-red-400">
              {activityError}
            </p>
          )}
        </div>

        {/* PORTFOLIO */}

        <div className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-white/35">
            Portfolio
          </p>

          <p className="mt-2 text-3xl font-black tracking-tight text-white">
            $
            {portfolioValue.toLocaleString(
              "en-US",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}
          </p>
        </div>

        {/* TOKEN HOLDINGS */}

        <div className="mt-6">
          <div className="mb-3">
            <h2 className="text-lg font-black text-white">
              Token Holdings
            </h2>
          </div>

          {activityTokens.length ===
          0 ? (
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 text-center">
              <p className="text-sm text-white/30">
                No token holdings found.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activityTokens.map(
                (token) => (
                  <div
                    key={`${token.symbol}-${token.name}`}
                    className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
                  >
                    <div className="flex items-center gap-3">
                      {/* EXACT SAME LOGO SIZE */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                        <img
                          src={token.logo}
                          alt={
                            token.symbol
                          }
                          className="block h-10 w-10 object-contain"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">
                          {
                            token.symbol
                          }
                        </p>

                        <p className="truncate text-xs text-white/35">
                          {
                            token.name
                          }
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs text-white/30">
                          Balance
                        </p>

                        <p className="mt-1 text-sm font-bold text-white">
                          {
                            token.balance
                          }{" "}
                          {
                            token.symbol
                          }
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-white/30">
                          USD Value
                        </p>

                        <p className="mt-1 text-sm font-bold text-white">
                          {token.usdValue !==
                          null
                            ? `$${token.usdValue.toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits:
                                    2,
                                  maximumFractionDigits:
                                    2,
                                }
                              )}`
                            : "Unavailable"}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* RECENT TRANSACTIONS */}

        <div className="mt-8">
          <div className="mb-3">
            <h2 className="text-lg font-black text-white">
              Recent Transactions
            </h2>
          </div>

          {activityTransactions.length ===
          0 ? (
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 text-center">
              <p className="text-sm text-white/30">
                No transactions found.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activityTransactions.map(
                (tx) => (
                  <div
                    key={
                      tx.hash
                    }
                    className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
                  >
                    {/* HASH */}

                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-white/30">
                          Transaction
                        </p>

                        <div className="mt-1 flex min-w-0 items-center gap-2">
                          <span className="truncate font-mono text-sm text-white/70">
                            {shortenAddress(
                              tx.hash
                            )}
                          </span>

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

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                          tx.status
                            .toLowerCase()
                            .includes(
                              "success"
                            )
                            ? "bg-green-500/10 text-green-400"
                            : "bg-white/[0.05] text-white/40"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>

                    {/* DETAILS */}

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-[11px] text-white/25">
                          Date / Time
                        </p>

                        <p className="mt-1 text-xs text-white/60">
                          {tx.timestamp
                            ? new Date(
                                tx.timestamp
                              ).toLocaleString()
                            : "Unavailable"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-white/25">
                          From
                        </p>

                        <p className="mt-1 font-mono text-xs text-white/60">
                          {shortenAddress(
                            tx.from
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-white/25">
                          To
                        </p>

                        <p className="mt-1 font-mono text-xs text-white/60">
                          {shortenAddress(
                            tx.to
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-white/25">
                          Value
                        </p>

                        <p className="mt-1 text-xs font-bold text-white/70">
                          {tx.value ||
                            "0"}{" "}
                          {tx.tokenSymbol ||
                            "USDC"}
                        </p>
                      </div>
                    </div>

                    {/* EXPLORER */}

                    {tx.hash && (
                      <div className="mt-4 border-t border-white/[0.05] pt-3">
                        <a
                          href={`https://testnet.arcscan.app/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-white/40 transition hover:text-white/70"
                        >
                          View on ArcScan ↗
                        </a>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
