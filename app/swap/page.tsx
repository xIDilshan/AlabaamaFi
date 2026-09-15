"use client";

import { useState } from "react";
import { useAccount } from "wagmi";

import Header from "@/components/Header";

type Token = "USDC" | "EURC";

const tokens: Record<
  Token,
  {
    symbol: string;
    name: string;
    logo: string;
  }
> = {
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    logo: "/tokens/usdc.svg",
  },
  EURC: {
    symbol: "EURC",
    name: "Euro Coin",
    logo: "/tokens/eurc.svg",
  },
};

export default function SwapPage() {
  const { address, isConnected } = useAccount();

  const [tokenIn, setTokenIn] =
    useState<Token>("USDC");

  const [tokenOut, setTokenOut] =
    useState<Token>("EURC");

  const [amountIn, setAmountIn] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  const handleSwitchTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn("");
  };

  const handleSwap = async () => {
    if (!isConnected || !address) {
      return;
    }

    if (!amountIn || Number(amountIn) <= 0) {
      return;
    }

    setIsLoading(true);

    try {
      // Real Circle Swap Kit integration
      // will be added after the UI is confirmed.
      await new Promise((resolve) =>
        setTimeout(resolve, 700)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const inputToken = tokens[tokenIn];
  const outputToken = tokens[tokenOut];

  return (
    <main className="min-h-screen bg-[#030405] text-white">
      {/* HEADER */}

      <Header />

      {/* SWAP */}

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-md">
          <p className="text-sm font-semibold text-white/35">
            AlabaamaFi
          </p>

          <h1 className="mt-1 text-3xl font-black sm:text-4xl">
            Token Swap
          </h1>

          <p className="mt-2 text-sm font-medium leading-6 text-white/35">
            Swap supported assets directly on Arc
            Testnet.
          </p>

          <div className="mt-7 rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#0a0f16] via-[#06080b] to-[#030303] p-4 shadow-2xl shadow-black/60 sm:mt-8 sm:p-6">
            {/* YOU PAY */}

            <div className="rounded-2xl border border-white/[0.07] bg-[#020202] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-white/35">
                  You pay
                </p>

                <p className="text-xs font-semibold text-white/25">
                  Balance unavailable
                </p>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  placeholder="0.00"
                  value={amountIn}
                  onChange={(event) =>
                    setAmountIn(event.target.value)
                  }
                  className="min-w-0 flex-1 bg-transparent text-3xl font-black text-white outline-none placeholder:text-white/15"
                />

                <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/[0.07] bg-[#080a0d] px-3 py-2">
                  <img
                    src={inputToken.logo}
                    alt={inputToken.symbol}
                    className="h-6 w-6 rounded-full object-contain"
                  />

                  <span className="text-sm font-black">
                    {inputToken.symbol}
                  </span>
                </div>
              </div>

              <p className="mt-2 text-xs font-medium text-white/20">
                {inputToken.name}
              </p>
            </div>

            {/* SWITCH */}

            <div className="relative z-10 -my-3 flex justify-center">
              <button
                type="button"
                onClick={handleSwitchTokens}
                aria-label="Switch tokens"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-[#080a0d] text-sm font-black text-white/55 shadow-lg transition-all duration-200 hover:border-white/[0.16] hover:bg-[#0c1016] hover:text-white"
              >
                ↓
              </button>
            </div>

            {/* YOU RECEIVE */}

            <div className="rounded-2xl border border-white/[0.07] bg-[#020202] p-4 sm:p-5">
              <p className="text-xs font-bold text-white/35">
                You receive
              </p>

              <div className="mt-3 flex items-center gap-3">
                <span className="min-w-0 flex-1 truncate text-3xl font-black text-white/70">
                  {amountIn ? "—" : "0.00"}
                </span>

                <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/[0.07] bg-[#080a0d] px-3 py-2">
                  <img
                    src={outputToken.logo}
                    alt={outputToken.symbol}
                    className="h-6 w-6 rounded-full object-contain"
                  />

                  <span className="text-sm font-black">
                    {outputToken.symbol}
                  </span>
                </div>
              </div>

              <p className="mt-2 text-xs font-medium text-white/20">
                {outputToken.name}
              </p>
            </div>

            {/* SWAP DETAILS */}

            <div className="mt-5 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-white/25">
                  Estimated output
                </span>

                <span className="text-xs font-bold text-white/40">
                  {amountIn
                    ? "Waiting for quote"
                    : "Enter amount"}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-white/25">
                  Slippage
                </span>

                <span className="text-xs font-bold text-white/40">
                  0.50%
                </span>
              </div>
            </div>

            {/* SWAP BUTTON */}

            <button
              type="button"
              onClick={handleSwap}
              disabled={
                !isConnected ||
                !amountIn ||
                Number(amountIn) <= 0 ||
                isLoading
              }
              className={`mt-5 min-h-13 w-full rounded-full py-3.5 text-sm font-black tracking-tight transition-all duration-200 ${
                !isConnected ||
                !amountIn ||
                Number(amountIn) <= 0
                  ? "cursor-not-allowed border border-white/[0.05] bg-[#111318] text-white/20"
                  : "border border-black/[0.08] bg-white text-black shadow-[0_2px_6px_rgba(0,0,0,0.06),0_10px_28px_rgba(0,0,0,0.14)] hover:-translate-y-0.5 hover:bg-[#fafafa] active:translate-y-0"
              }`}
            >
              {isLoading
                ? "Preparing Swap"
                : !isConnected
                ? "Connect Wallet"
                : !amountIn
                ? "Enter Amount"
                : "Get Quote"}
            </button>

            {!isConnected && (
              <p className="mt-4 text-center text-xs font-semibold text-white/25">
                Connect your wallet to start
                swapping.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
