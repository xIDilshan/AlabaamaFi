"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
} from "wagmi";
import {
  formatUnits,
  parseUnits,
  type Address,
} from "viem";

import Header from "@/components/Header";
import { createCircleViemAdapter } from "@/lib/circle";
import { AppKit } from "@circle-fin/app-kit";

type Token = "USDC" | "EURC";
type SlippageMode = "auto" | "custom";

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

const erc20AllowanceAbi = [
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      {
        name: "owner",
        type: "address",
      },
      {
        name: "spender",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "allowance",
        type: "uint256",
      },
    ],
  },
] as const;

const erc20ApproveAbi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "spender",
        type: "address",
      },
      {
        name: "amount",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
  },
] as const;

const AUTO_SLIPPAGE = 0.5;

const customSlippageOptions = [
  0.1,
  0.25,
  0.5,
  1,
  2,
];

export default function SwapPage() {
  const { address, isConnected } = useAccount();

  const { writeContractAsync } = useWriteContract();

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

  const [swapStage, setSwapStage] =
    useState<
      "idle" | "approving" | "confirming"
    >("idle");

  const [error, setError] =
    useState("");

  const [swapResult, setSwapResult] =
    useState<unknown>(null);

  const [slippageMode, setSlippageMode] =
    useState<SlippageMode>("auto");

  const [customSlippage, setCustomSlippage] =
    useState(0.5);

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

  const activeSlippage =
    slippageMode === "auto"
      ? AUTO_SLIPPAGE
      : customSlippage;

  const slippageBps =
    Math.round(activeSlippage * 100);

  const inputToken = tokens[tokenIn];
  const outputToken = tokens[tokenOut];

  const inputTokenAddress =
    tokenIn === "USDC"
      ? USDC_ADDRESS
      : EURC_ADDRESS;

  const insufficientBalance =
    Boolean(amountIn) &&
    Number(amountIn) > inputBalanceNumber;

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

  const formattedSlippage = useMemo(() => {
    return activeSlippage
      .toFixed(
        activeSlippage % 1 === 0 ? 0 : 2
      )
      .replace(/\.00$/, "");
  }, [activeSlippage]);

  useEffect(() => {
    if (
      !isConnected ||
      !address ||
      !amountIn ||
      Number(amountIn) <= 0 ||
      insufficientBalance ||
      tokenIn === tokenOut
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

        const estimate =
          await kit.estimateSwap({
            from: {
              adapter,
              chain: "Arc_Testnet",
            },
            tokenIn,
            tokenOut,
            amountIn,
            config: {
              slippageBps,
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
    slippageBps,
    insufficientBalance,
  ]);

  const handleAmountChange = (
    value: string
  ) => {
    setAmountIn(value);
    setEstimatedOutput("");
    setError("");
    setSwapResult(null);
    setSwapStage("idle");
  };

  const handlePercentage = (
    percentage: number
  ) => {
    if (
      !isConnected ||
      inputBalanceNumber <= 0
    ) {
      return;
    }

    const amount =
      inputBalanceNumber * percentage;

    setAmountIn(
      amount
        .toFixed(6)
        .replace(/\.?0+$/, "")
    );

    setEstimatedOutput("");
    setError("");
    setSwapResult(null);
    setSwapStage("idle");
  };

  const handleMax = () => {
    handlePercentage(1);
  };

  const handleSwitchTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn("");
    setEstimatedOutput("");
    setError("");
    setSwapResult(null);
    setSwapStage("idle");
  };

  const handleSlippageMode = (
    mode: SlippageMode
  ) => {
    setSlippageMode(mode);
    setEstimatedOutput("");
    setError("");
  };

  const handleCustomSlippage = (
    value: number
  ) => {
    setCustomSlippage(value);
    setEstimatedOutput("");
    setError("");
  };

  const handleNewSwap = () => {
    setAmountIn("");
    setEstimatedOutput("");
    setError("");
    setSwapResult(null);
    setSwapStage("idle");
  };

  const handleSwap = async () => {
    if (
      !isConnected ||
      !address ||
      !amountIn ||
      Number(amountIn) <= 0 ||
      Number(amountIn) > inputBalanceNumber ||
      !estimatedOutput
    ) {
      return;
    }

    setIsSwapping(true);
    setSwapStage("confirming");
    setError("");
    setSwapResult(null);

    try {
      const adapter =
        await createCircleViemAdapter();

      const kit = new AppKit();

      const supportedChains =
        kit.getSupportedChains("swap");

      const arcTestnet =
        supportedChains.find(
          (chain) =>
            chain.chain === "Arc_Testnet"
        );

      if (!arcTestnet) {
        throw new Error(
          "Arc Testnet is not available for swaps."
        );
      }

      const spender =
        arcTestnet.kitContracts?.adapter;

      if (!spender) {
        throw new Error(
          "Circle swap adapter contract is not configured for Arc Testnet."
        );
      }

      const amountInUnits = parseUnits(
        amountIn,
        6
      );

      /*
       * Get the public client through the adapter.
       * The Circle chain definition is intentionally
       * cast here because the installed SDK exposes
       * ChainDefinition while getPublicClient expects
       * the underlying viem Chain type.
       */
      const publicClient =
        adapter.getPublicClient({
          chain: arcTestnet as any,
        });

      /*
       * Check the existing allowance before asking
       * the wallet for an approval transaction.
       */
      const allowance =
        await publicClient.readContract({
          address: inputTokenAddress,
          abi: erc20AllowanceAbi,
          functionName: "allowance",
          args: [
            address,
            spender as Address,
          ],
        });

      const allowanceIsEnough =
        allowance >= amountInUnits;

      /*
       * Only approve when the current allowance
       * is smaller than the swap amount.
       */
      if (!allowanceIsEnough) {
        setSwapStage("approving");

        const approvalTx =
          await writeContractAsync({
            address: inputTokenAddress,
            abi: erc20ApproveAbi,
            functionName: "approve",
            args: [
              spender as Address,
              amountInUnits,
            ],
          });

        /*
         * Wait for the approval transaction using
         * the public client. This avoids the ChainDefinition
         * vs EVMChainDefinition type mismatch.
         */
        await publicClient.waitForTransactionReceipt({
          hash: approvalTx,
        });
      }

      /*
       * Approval is complete or was already sufficient.
       * Now execute the actual swap.
       */
      setSwapStage("confirming");

      const result = await kit.swap({
        from: {
          adapter,
          chain: "Arc_Testnet",
        },
        tokenIn,
        tokenOut,
        amountIn,
        config: {
          slippageBps,
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

      setSwapStage("idle");

      setError(
        err instanceof Error
          ? err.message
          : "Swap failed. Please try again."
      );
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#030405] text-white">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center lg:mb-10">
            <p className="text-sm font-semibold text-white/35">
              AlabaamaFi
            </p>

            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Token Swap
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-sm font-medium leading-6 text-white/35">
              Swap supported assets directly on Arc
              Testnet.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/[0.07] bg-gradient-to-br from-[#0b1017] via-[#06080b] to-[#030303] p-4 shadow-2xl shadow-black/60 sm:p-6 lg:p-7">
            <div className="grid gap-3">
              {/* YOU PAY */}
              <div className="rounded-2xl border border-white/[0.07] bg-[#020202] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-bold text-white/35">
                    You pay
                  </p>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white/25">
                      Balance
                    </span>

                    <span className="text-xs font-bold text-white/45">
                      {isConnected
                        ? displayBalance
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex min-h-[72px] items-center gap-3">
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
                    className="min-w-0 flex-1 bg-transparent text-3xl font-black tracking-tight text-white outline-none placeholder:text-white/15 sm:text-4xl"
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

                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-white/20">
                    {inputToken.name}
                  </p>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        handlePercentage(0.5)
                      }
                      disabled={
                        !isConnected ||
                        inputBalanceNumber <= 0
                      }
                      className="rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-[10px] font-semibold text-white/45 transition hover:border-white/[0.15] hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:text-white/15"
                    >
                      50%
                    </button>

                    <button
                      type="button"
                      onClick={handleMax}
                      disabled={
                        !isConnected ||
                        inputBalanceNumber <= 0
                      }
                      className="rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-[10px] font-semibold text-white/45 transition hover:border-white/[0.15] hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:text-white/15"
                    >
                      MAX
                    </button>
                  </div>
                </div>
              </div>

              {/* SWITCH */}
              <div className="relative z-10 -my-6 flex justify-center">
                <button
                  type="button"
                  onClick={handleSwitchTokens}
                  aria-label="Switch tokens"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-[#080a0d] text-sm font-semibold text-white/55 shadow-xl transition hover:border-white/[0.16] hover:bg-[#0c1016] hover:text-white"
                >
                  ↓
                </button>
              </div>

              {/* YOU RECEIVE */}
              <div className="rounded-2xl border border-white/[0.07] bg-[#020202] p-4 sm:p-5">
                <p className="text-xs font-bold text-white/35">
                  You receive
                </p>

                <div className="mt-3 flex min-h-[72px] items-center gap-3">
                  <span className="min-w-0 flex-1 truncate text-3xl font-black tracking-tight text-white/70 sm:text-4xl">
                    {isLoading
                      ? "..."
                      : estimatedOutput ||
                        (amountIn
                          ? "—"
                          : "0.00")}
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
            </div>

            {/* DETAILS */}
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

              {/* SLIPPAGE */}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold text-white/25">
                    Slippage
                  </p>

                  <p className="mt-1 text-[10px] font-medium text-white/15">
                    Maximum price movement accepted
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      handleSlippageMode("auto")
                    }
                    className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold transition ${
                      slippageMode === "auto"
                        ? "border-white/[0.15] bg-white/[0.09] text-white"
                        : "border-white/[0.07] bg-white/[0.025] text-white/35 hover:text-white"
                    }`}
                  >
                    Auto
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSlippageMode("custom")
                    }
                    className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold transition ${
                      slippageMode === "custom"
                        ? "border-white/[0.15] bg-white/[0.09] text-white"
                        : "border-white/[0.07] bg-white/[0.025] text-white/35 hover:text-white"
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {slippageMode === "custom" && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {customSlippageOptions.map(
                    (value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          handleCustomSlippage(
                            value
                          )
                        }
                        className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold transition ${
                          customSlippage === value
                            ? "border-white/[0.15] bg-white/[0.09] text-white"
                            : "border-white/[0.07] bg-white/[0.025] text-white/35 hover:text-white"
                        }`}
                      >
                        {value}%
                      </button>
                    )
                  )}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-white/25">
                  Slippage tolerance
                </span>

                <span className="text-xs font-bold text-white/40">
                  {formattedSlippage}%
                </span>
              </div>
            </div>

            {/* ERRORS */}
            {insufficientBalance && (
              <div className="mt-4 rounded-2xl border border-red-400/10 bg-red-400/[0.04] p-3">
                <p className="text-center text-xs font-semibold leading-5 text-red-300/70">
                  Insufficient {inputToken.symbol}{" "}
                  balance.
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

            {/* SUCCESS */}
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
                        {swapData.txHash.slice(
                          0,
                          8
                        )}
                        ...
                        {swapData.txHash.slice(
                          -8
                        )}
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
                    className="mt-3 flex min-h-11 w-full items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/80 transition hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white"
                  >
                    View on Arcscan
                    <span className="ml-2 text-white/40">
                      ↗
                    </span>
                  </a>

                  <button
                    type="button"
                    onClick={handleNewSwap}
                    className="mt-2 flex min-h-11 w-full items-center justify-center rounded-full border border-white/[0.06] bg-transparent px-4 py-3 text-sm font-semibold text-white/45 transition hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-white"
                  >
                    New Swap
                  </button>
                </div>
              )}

            {/* SWAP BUTTON */}
            <button
              type="button"
              onClick={handleSwap}
              disabled={
                !isConnected ||
                !amountIn ||
                Number(amountIn) <= 0 ||
                insufficientBalance ||
                isLoading ||
                isSwapping ||
                !estimatedOutput ||
                swapCompleted
              }
              className={`mt-5 min-h-13 w-full rounded-full py-3.5 text-sm font-semibold tracking-tight transition-all duration-200 ${
                !isConnected ||
                !amountIn ||
                Number(amountIn) <= 0 ||
                insufficientBalance ||
                isLoading ||
                isSwapping ||
                !estimatedOutput ||
                swapCompleted
                  ? "cursor-not-allowed border border-white/[0.05] bg-[#111318] text-white/20"
                  : "border border-black/[0.08] bg-white text-black shadow-[0_2px_6px_rgba(0,0,0,0.06),0_10px_28px_rgba(0,0,0,0.14)] hover:-translate-y-0.5 hover:bg-[#fafafa] active:translate-y-0"
              }`}
            >
              {isSwapping
                ? swapStage === "approving"
                  ? "Approving"
                  : "Confirming Swap"
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
