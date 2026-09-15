"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
} from "wagmi";
import { formatUnits } from "viem";

import Header from "@/components/Header";
import { createCircleViemAdapter } from "@/lib/circle";
import { AppKit } from "@circle-fin/app-kit";

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

const USDC_ADDRESS =
  "0x3600000000000000000000000000000000000000" as const;

const EURC_ADDRESS =
  "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a" as const;

const erc20BalanceAbi = [
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
        name: "balance",
        type: "uint256",
      },
    ],
  },
] as const;

export default function SwapPage() {
  const { address, isConnected } = useAccount();

  const {
    data: usdcBalance,
    refetch: refetchUsdcBalance,
  } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20BalanceAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
    },
  });

  const {
    data: eurcBalance,
    refetch: refetchEurcBalance,
  } = useReadContract({
    address: EURC_ADDRESS,
    abi: erc20BalanceAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
    },
  });

  const [tokenIn, setTokenIn] =
    useState<Token>("USDC");

  const [tokenOut, setTokenOut] =
    useState<Token>("EURC");

  const [amountIn, setAmountIn] =
    useState("");

  const [estimatedOutput, setEstimatedOutput] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  const [isSwapping, setIsSwapping] =
    useState(false);

  const [error, setError] =
    useState("");

  const [swapResult, setSwapResult] =
    useState<unknown>(null);

  const formattedUsdcBalance =
    usdcBalance !== undefined
      ? formatUnits(usdcBalance, 6)
      : "0";

  const formattedEurcBalance =
    eurcBalance !== undefined
      ? formatUnits(eurcBalance, 6)
      : "0";

  const inputBalance =
    tokenIn === "USDC"
      ? formattedUsdcBalance
      : formattedEurcBalance;

  const inputBalanceNumber =
    Number(inputBalance);

  const displayBalance =
    Number(inputBalance).toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }
    );

  useEffect(() => {
    if (
      !isConnected ||
      !address ||
      !amountIn ||
      Number(amountIn) <= 0
    ) {
      setEstimatedOutput("");
      setError("");
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setEstimatedOutput("");
      setError("");

      try {
        const adapter =
          await createCircleViemAdapter();

        if (cancelled) return;

        const kit = new AppKit();

        const estimate = await kit.estimateSwap({
          from: {
            adapter,
            chain: "Arc_Testnet",
          },
          tokenIn,
          tokenOut,
          amountIn,
          config: {
            slippageBps: 50,
          },
        });

        if (!cancelled) {
          setEstimatedOutput(
            estimate.estimatedOutput.amount
          );
        }
      } catch (err) {
        if (!cancelled) {
          console.error(
            "Swap quote error:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to get a swap quote."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    amountIn,
    tokenIn,
    tokenOut,
    address,
    isConnected,
  ]);

  const handleAmountChange = (
    value: string
  ) => {
    setAmountIn(value);
    setEstimatedOutput("");
    setError("");
    setSwapResult(null);
  };

  const handleMax = () => {
    if (inputBalanceNumber <= 0) {
      return;
    }

    setAmountIn(inputBalance);
    setEstimatedOutput("");
    setError("");
    setSwapResult(null);
  };

  const handleSwitchTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn("");
    setEstimatedOutput("");
    setError("");
    setSwapResult(null);
  };

  const handleSwap = async () => {
    if (
      !isConnected ||
      !address ||
      !amountIn ||
      Number(amountIn) <= 0 ||
      Number(amountIn) > inputBalanceNumber
    ) {
      return;
    }

    setIsSwapping(true);
    setError("");
    setSwapResult(null);

    try {
      const adapter =
        await createCircleViemAdapter();

      const kit = new AppKit();

      const result = await kit.swap({
        from: {
          adapter,
          chain: "Arc_Testnet",
        },
        tokenIn,
        tokenOut,
        amountIn,
        config: {
          slippageBps: 50,
          allowanceStrategy: "approve",
        },
      });

      console.log(
        "Circle swap result:",
        result
      );

      setSwapResult(result);

      await Promise.all([
        refetchUsdcBalance(),
        refetchEurcBalance(),
      ]);
    } catch (err) {
      console.error(
        "Swap execution error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Swap failed. Please try again."
      );
    } finally {
      setIsSwapping(false);
    }
  };

  const inputToken = tokens[tokenIn];
  const outputToken = tokens[tokenOut];

  const swapData =
    typeof swapResult === "object" &&
    swapResult !== null
      ? (swapResult as {
          txHash?: string;
          explorerUrl?: string;
          amountOut?: string;
        })
      : null;

  const swapCompleted =
    Boolean(swapData?.txHash);

  const insufficientBalance =
    Boolean(amountIn) &&
    Number(amountIn) > inputBalanceNumber;

  return (
    <main className="min-h-screen bg-[#030405] text-white">
      <Header />

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
            <div className="rounded-2xl border border-white/[0.07] bg-[#020202] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-white/35">
                  You pay
                </p>

                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-white/25">
                    Balance
                  </p>

                  <p className="text-xs font-bold text-white/45">
                    {isConnected
                      ? displayBalance
                      : "—"}
                  </p>

                  <button
                    type="button"
                    onClick={handleMax}
                    disabled={
                      !isConnected ||
                      inputBalanceNumber <= 0
                    }
                    className="text-[10px] font-black text-white/45 transition hover:text-white disabled:cursor-not-allowed disabled:text-white/15"
                  >
                    MAX
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  placeholder="0.00"
                  value={amountIn}
                  onChange={(event) =>
                    handleAmountChange(
                      event.target.value
                    )
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

            <div className="rounded-2xl border border-white/[0.07] bg-[#020202] p-4 sm:p-5">
              <p className="text-xs font-bold text-white/35">
                You receive
              </p>

              <div className="mt-3 flex items-center gap-3">
                <span className="min-w-0 flex-1 truncate text-3xl font-black text-white/70">
                  {isLoading
                    ? "..."
                    : estimatedOutput ||
                      (amountIn ? "—" : "0.00")}
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

            <div className="mt-5 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-white/25">
                  Estimated output
                </span>

                <span className="truncate text-right text-xs font-bold text-white/40">
                  {isLoading
                    ? "Getting quote..."
                    : estimatedOutput
                    ? `${estimatedOutput} ${outputToken.symbol}`
                    : error
                    ? "Quote unavailable"
                    : amountIn
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

            {insufficientBalance && (
              <div className="mt-4 rounded-2xl border border-red-400/10 bg-red-400/[0.04] p-3">
                <p className="text-center text-xs font-semibold leading-5 text-red-300/70">
                  Insufficient {inputToken.symbol} balance.
                </p>
              </div>
            )}

            {error && !insufficientBalance && (
              <div className="mt-4 rounded-2xl border border-red-400/10 bg-red-400/[0.04] p-3">
                <p className="text-center text-xs font-semibold leading-5 text-red-300/70">
                  {error}
                </p>
              </div>
            )}

            {swapCompleted &&
              swapData?.txHash && (
                <div className="mt-4 rounded-2xl border border-green-400/10 bg-green-400/[0.04] p-4">
                  <p className="text-center text-sm font-bold text-green-300/90">
                    Swap completed successfully.
                  </p>

                  <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/20 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-white/30">
                        Transaction
                      </span>

                      <span className="min-w-0 truncate text-right font-mono text-xs font-semibold text-white/60">
                        {swapData.txHash.slice(0, 8)}
                        ...
                        {swapData.txHash.slice(-8)}
                      </span>
                    </div>
                  </div>

                  <a
                    href={
                      swapData.explorerUrl ||
                      `https://testnet.arcscan.app/tx/${swapData.txHash}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex min-h-11 w-full items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/80 transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white"
                  >
                    View on Arcscan
                    <span className="ml-2 text-white/40">
                      ↗
                    </span>
                  </a>
                </div>
              )}

            <button
              type="button"
              onClick={handleSwap}
              disabled={
                !isConnected ||
                !amountIn ||
                Number(amountIn) <= 0 ||
                Number(amountIn) > inputBalanceNumber ||
                isLoading ||
                isSwapping ||
                !estimatedOutput
              }
              className={`mt-5 min-h-13 w-full rounded-full py-3.5 text-sm font-black tracking-tight transition-all duration-200 ${
                !isConnected ||
                !amountIn ||
                Number(amountIn) <= 0 ||
                Number(amountIn) > inputBalanceNumber ||
                isLoading ||
                isSwapping ||
                !estimatedOutput
                  ? "cursor-not-allowed border border-white/[0.05] bg-[#111318] text-white/20"
                  : "border border-black/[0.08] bg-white text-black shadow-[0_2px_6px_rgba(0,0,0,0.06),0_10px_28px_rgba(0,0,0,0.14)] hover:-translate-y-0.5 hover:bg-[#fafafa] active:translate-y-0"
              }`}
            >
              {isSwapping
                ? "Confirming Swap"
                : !isConnected
                ? "Connect Wallet"
                : !amountIn
                ? "Enter Amount"
                : insufficientBalance
                ? "Insufficient Balance"
                : isLoading
                ? "Getting Quote"
                : !estimatedOutput
                ? "Waiting for Quote"
                : swapCompleted
                ? "Swap Completed"
                : "Swap"}
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
