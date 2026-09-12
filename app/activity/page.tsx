"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { isAddress } from "viem";

import Header from "@/components/Header";
import {
  getWalletTransactions,
  type WalletTransaction,
} from "@/lib/arcscan";

const USDC_ADDRESS =
  "0x3600000000000000000000000000000000000000";

type TokenHolding = {
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  logo: string;
};

function getTokenLogo(symbol: string) {
  const normalized = symbol.toUpperCase();

  if (normalized === "USDC") {
    return "/tokens/usdc.svg";
  }

  if (normalized === "EURC" || normalized === "EUROC") {
    return "/tokens/eurc.svg";
  }

  if (normalized === "CIRBTC") {
    return "/tokens/cirbtc.svg";
  }

  return "";
}

function getUsdValue(token: any) {
  const value =
    token?.value_usd ??
    token?.usd_value ??
    token?.price_usd ??
    token?.fiat_value ??
    0;

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatUsd(value: number) {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatBalance(value: number) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 6,
  });
}

export default function ActivityPage() {
  const { address, isConnected } = useAccount();

  const [walletInput, setWalletInput] = useState("");
  const [checkedAddress, setCheckedAddress] = useState("");

  const [transactions, setTransactions] = useState<WalletTransaction[]>(
    []
  );

  const [tokens, setTokens] = useState<TokenHolding[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searched, setSearched] = useState(false);

  const handleUseConnectedWallet = () => {
    if (!address) return;

    setWalletInput(address);
  };

  const handleCheckWallet = async () => {
    const targetAddress = walletInput.trim();

    setError("");
    setSearched(false);
    setTransactions([]);
    setTokens([]);

    if (!targetAddress) {
      setError("Please enter a wallet address.");
      return;
    }

    if (!isAddress(targetAddress)) {
      setError("Please enter a valid wallet address.");
      return;
    }

    setLoading(true);

    try {
      setCheckedAddress(targetAddress);

      /*
       * ---------------------------------------------------------
       * TRANSACTIONS
       * ---------------------------------------------------------
       */

      const walletTransactions =
        await getWalletTransactions(targetAddress);

      setTransactions(walletTransactions);

      /*
       * ---------------------------------------------------------
       * TOKEN HOLDINGS
       * ---------------------------------------------------------
       */

      const tokenResponse = await fetch(
        `https://api-testnet.arc-scan.org/v1/address/${targetAddress}/tokens`
      );

      let apiTokens: any[] = [];

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();

        if (Array.isArray(tokenData)) {
          apiTokens = tokenData;
        } else if (Array.isArray(tokenData?.items)) {
          apiTokens = tokenData.items;
        } else if (Array.isArray(tokenData?.tokens)) {
          apiTokens = tokenData.tokens;
        }
      }

      /*
       * Normalize Arcscan token names.
       */

      const normalizedTokens = apiTokens
        .map((token) => {
          const rawSymbol =
            token?.token?.symbol ??
            token?.symbol ??
            "";

          let symbol = String(rawSymbol);

          if (symbol.toUpperCase() === "EUROC") {
            symbol = "EURC";
          }

          if (symbol.toUpperCase() === "CIRBTC") {
            symbol = "cirBTC";
          }

          const rawBalance =
            token?.value ??
            token?.balance ??
            token?.token?.balance ??
            0;

          const decimals =
            Number(
              token?.token?.decimals ??
                token?.decimals ??
                6
            ) || 6;

          let balance = Number(rawBalance);

          /*
           * If the API gives the raw integer token amount,
           * convert it using the token decimals.
           */
          if (
            Number.isFinite(balance) &&
            Number.isInteger(balance) &&
            String(rawBalance).length > 6
          ) {
            balance = balance / 10 ** decimals;
          }

          return {
            symbol,
            name:
              token?.token?.name ??
              token?.name ??
              symbol,
            balance: Number.isFinite(balance)
              ? balance
              : 0,
            usdValue: getUsdValue(token),
            logo:
              token?.token?.icon_url ??
              token?.icon_url ??
              getTokenLogo(symbol),
          };
        })
        .filter(
          (token) =>
            token.symbol &&
            token.balance > 0
        );

      /*
       * ---------------------------------------------------------
       * DIRECT USDC BALANCE
       * ---------------------------------------------------------
       *
       * Arcscan may not always return USDC correctly,
       * so we check the USDC contract directly.
       */

      try {
        const selector = "0x70a08231";

        const paddedAddress =
          targetAddress
            .replace("0x", "")
            .padStart(64, "0");

        const data = `${selector}${paddedAddress}`;

        const rpcResponse = await fetch(
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
                  data,
                },
                "latest",
              ],
            }),
          }
        );

        const rpcData = await rpcResponse.json();

        if (rpcData?.result) {
          const rawBalance = BigInt(rpcData.result);

          const usdcBalance =
            Number(rawBalance) / 1_000_000;

          if (usdcBalance > 0) {
            const existingUsdcIndex =
              normalizedTokens.findIndex(
                (token) =>
                  token.symbol.toUpperCase() === "USDC"
              );

            if (existingUsdcIndex >= 0) {
              normalizedTokens.splice(
                existingUsdcIndex,
                1
              );
            }

            normalizedTokens.unshift({
              symbol: "USDC",
              name: "USD Coin",
              balance: usdcBalance,
              usdValue: usdcBalance,
              logo: "/tokens/usdc.svg",
            });
          }
        }
      } catch {
        // Keep the other token results if direct USDC lookup fails.
      }

      /*
       * ---------------------------------------------------------
       * PORTFOLIO VALUE
       * ---------------------------------------------------------
       */

      const finalTokens = normalizedTokens.map(
        (token) => {
          if (
            token.symbol.toUpperCase() === "USDC"
          ) {
            return {
              ...token,
              usdValue: token.balance,
            };
          }

          return token;
        }
      );

      setTokens(finalTokens);
      setSearched(true);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load wallet activity. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const totalPortfolioValue = tokens.reduce(
    (total, token) =>
      total + (Number(token.usdValue) || 0),
    0
  );

  return (
    <main className="min-h-screen bg-[#030405] text-white">
      <Header
        onMenuClick={() => {
          window.dispatchEvent(
            new CustomEvent("open-wallet-modal")
          );
        }}
      />

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        {/* PAGE HEADER */}

        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/30">
            Arc Testnet
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Wallet Activity
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45 sm:text-base">
            Check token balances and recent on-chain
            activity for any Arc Testnet wallet.
          </p>
        </div>

        {/* SEARCH BOX */}

        <div className="mt-8 rounded-3xl border border-white/[0.07] bg-[#080a0d] p-4 shadow-2xl shadow-black/20 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="min-w-0 flex-1">
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-white/30">
                Wallet address
              </label>

              <input
                value={walletInput}
                onChange={(event) =>
                  setWalletInput(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleCheckWallet();
                  }
                }}
                placeholder="0x..."
                className="h-12 w-full rounded-2xl border border-white/[0.08] bg-[#030405] px-4 font-mono text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/20"
              />
            </div>

            <div className="flex items-end gap-2">
              {isConnected && address && (
                <button
                  type="button"
                  onClick={handleUseConnectedWallet}
                  className="h-12 rounded-2xl border border-white/[0.08] px-4 text-xs font-bold text-white/60 transition hover:border-white/15 hover:text-white"
                >
                  My Wallet
                </button>
              )}

              <button
                type="button"
                onClick={handleCheckWallet}
                disabled={loading}
                className="h-12 min-w-[130px] rounded-2xl bg-white px-5 text-sm font-black text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Checking..." : "Check Wallet"}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-400/10 bg-red-400/[0.05] px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>

        {/* RESULTS */}

        {searched && !loading && (
          <div className="mt-8 space-y-6">
            {/* WALLET INFO */}

            <div className="rounded-3xl border border-white/[0.07] bg-[#080a0d] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/25">
                    Wallet
                  </p>

                  <p className="mt-2 break-all font-mono text-sm text-white/75">
                    {checkedAddress}
                  </p>
                </div>

                <a
                  href={`https://testnet.arcscan.app/address/${checkedAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-white/45 transition hover:text-white"
                >
                  View on Arcscan ↗
                </a>
              </div>
            </div>

            {/* OVERVIEW */}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/[0.07] bg-[#080a0d] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/25">
                  Portfolio Value
                </p>

                <p className="mt-3 text-2xl font-black tracking-tight">
                  {formatUsd(totalPortfolioValue)}
                </p>
              </div>

              <div className="rounded-3xl border border-white/[0.07] bg-[#080a0d] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/25">
                  Transactions
                </p>

                <p className="mt-3 text-2xl font-black tracking-tight">
                  {transactions.length}
                </p>
              </div>
            </div>

            {/* TOKEN HOLDINGS */}

            <div className="rounded-3xl border border-white/[0.07] bg-[#080a0d] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/25">
                    Assets
                  </p>

                  <h2 className="mt-1 text-lg font-black">
                    Token Holdings
                  </h2>
                </div>

                <span className="text-xs font-semibold text-white/25">
                  {tokens.length} assets
                </span>
              </div>

              {tokens.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-white/[0.05] bg-black/20 px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-white/40">
                    No token holdings found.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-2">
                  {tokens.map((token, index) => (
                    <div
                      key={`${token.symbol}-${index}`}
                      className="flex items-center justify-between rounded-2xl border border-white/[0.05] bg-black/20 px-4 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                          {token.logo ? (
                            <img
                              src={token.logo}
                              alt={token.symbol}
                              className="h-10 w-10 object-contain"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-xs font-black text-white/40">
                              {token.symbol
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">
                            {token.symbol}
                          </p>

                          <p className="truncate text-xs text-white/25">
                            {token.name}
                          </p>
                        </div>
                      </div>

                      <div className="ml-4 text-right">
                        <p className="text-sm font-bold">
                          {formatBalance(token.balance)}
                        </p>

                        <p className="mt-1 text-xs text-white/25">
                          {formatUsd(token.usdValue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TRANSACTIONS */}

            <div className="rounded-3xl border border-white/[0.07] bg-[#080a0d] p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/25">
                  On-chain activity
                </p>

                <h2 className="mt-1 text-lg font-black">
                  Recent Transactions
                </h2>
              </div>

              {transactions.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-white/[0.05] bg-black/20 px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-white/40">
                    No transactions found.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-2">
                  {transactions.map(
                    (transaction, index) => {
                      const hash =
                        transaction.hash ??
                        transaction.tx_hash ??
                        "";

                      return (
                        <a
                          key={`${hash}-${index}`}
                          href={
                            hash
                              ? `https://testnet.arcscan.app/tx/${hash}`
                              : "#"
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-2xl border border-white/[0.05] bg-black/20 px-4 py-4 transition hover:border-white/[0.1] hover:bg-white/[0.02]"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white/80">
                                {transaction.method ??
                                  transaction.type ??
                                  "Transaction"}
                              </p>

                              <p className="mt-1 truncate font-mono text-xs text-white/25">
                                {hash
                                  ? shortenAddress(hash)
                                  : "Transaction"}
                              </p>
                            </div>

                            <span className="shrink-0 text-xs font-bold text-white/35">
                              View ↗
                            </span>
                          </div>
                        </a>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* EMPTY STATE */}

        {!searched && !loading && (
          <div className="mt-8 rounded-3xl border border-dashed border-white/[0.08] bg-[#080a0d]/50 px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.02]">
              <span className="text-xl">⌕</span>
            </div>

            <h2 className="mt-5 text-lg font-black">
              Check any Arc wallet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/35">
              Enter a wallet address above to view its
              token holdings and recent Arc Testnet
              activity.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
