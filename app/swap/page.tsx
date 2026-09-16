"use client";

import { useEffect, useMemo, useState } from "react";
import { Manrope } from "next/font/google";
import { useAccount, useReadContract, useWalletClient } from "wagmi";
import {
  createPublicClient,
  defineChain,
  formatUnits,
  http,
  maxUint256,
  parseUnits,
  type Address,
} from "viem";

import Header from "@/components/Header";

const manrope = Manrope({
  subsets: ["latin"],
  weight: "600",
});

type Token = "USDC" | "EURC";
type SlippageMode = "auto" | "custom";
type SwapStage = "idle" | "approving" | "confirming";

const ARC_TESTNET_CHAIN_ID = 5042002;

const arcTestnet = defineChain({
  id: ARC_TESTNET_CHAIN_ID,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arcscan",
      url: "https://testnet.arcscan.app",
    },
  },
});

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http("https://rpc.testnet.arc.network"),
});

type SwapWalletClient = {
  writeContract: (parameters: {
    address: Address;
    abi: readonly unknown[];
    functionName: string;
    args: readonly unknown[];
    gas?: bigint;
  }) => Promise<`0x${string}`>;
};

const tokens: Record<
  Token,
  {
    symbol: string;
    name: string;
    logo: string;
    address: Address;
  }
> = {
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    logo: "/tokens/usdc.svg",
    address:
      "0x3600000000000000000000000000000000000000",
  },
  EURC: {
    symbol: "EURC",
    name: "Euro Coin",
    logo: "/tokens/eurc.svg",
    address:
      "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
  },
};

/*
 * Arc Testnet Uniswap V2 Router02.
 *
 * This is a third-party testnet deployment,
 * not Circle infrastructure.
 */
const SWAP_ROUTER =
  "0xe27d5d256b370604f1ff060fb489c6a8e3f8a6d9" as Address;

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

const routerAbi = [
  {
    type: "function",
    name: "getAmountsOut",
    stateMutability: "view",
    inputs: [
      {
        name: "amountIn",
        type: "uint256",
      },
      {
        name: "path",
        type: "address[]",
      },
    ],
    outputs: [
      {
        name: "amounts",
        type: "uint256[]",
      },
    ],
  },
  {
    type: "function",
    name: "swapExactTokensForTokens",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "amountIn",
        type: "uint256",
      },
      {
        name: "amountOutMin",
        type: "uint256",
      },
      {
        name: "path",
        type: "address[]",
      },
      {
        name: "to",
        type: "address",
      },
      {
        name: "deadline",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "amounts",
        type: "uint256[]",
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
  const { address, isConnected, chainId } =
    useAccount();

  const { data: rawWalletClient } =
    useWalletClient({
      chainId: ARC_TESTNET_CHAIN_ID,
    });

  const walletClient =
    rawWalletClient as SwapWalletClient | undefined;

  const {
    data: usdcBalance,
    refetch: refetchUsdcBalance,
  } = useReadContract({
    address: tokens.USDC.address,
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
    address: tokens.EURC.address,
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
    useState<SwapStage>("idle");

  const [error, setError] =
    useState("");

  const [swapResult, setSwapResult] =
    useState<unknown>(null);

  const [slippageMode, setSlippageMode] =
    useState<SlippageMode>("auto");

  const [showSettings, setShowSettings] =
  useState(false);

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
      tokenIn === tokenOut ||
      chainId !== ARC_TESTNET_CHAIN_ID
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
        const amountInUnits =
          parseUnits(amountIn, 6);

        const amounts =
          await publicClient.readContract({
            address: SWAP_ROUTER,
            abi: routerAbi,
            functionName: "getAmountsOut",
            args: [
              amountInUnits,
              [
                inputToken.address,
                outputToken.address,
              ],
            ],
          });

        const outputAmount = amounts[1];

        if (cancelled) return;

        setEstimatedOutput(
          formatUnits(outputAmount, 6)
        );
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
    chainId,
    insufficientBalance,
    inputToken.address,
    outputToken.address,
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
      !walletClient ||
      chainId !== ARC_TESTNET_CHAIN_ID ||
      !amountIn ||
      Number(amountIn) <= 0 ||
      Number(amountIn) > inputBalanceNumber ||
      !estimatedOutput
    ) {
      return;
    }

    setIsSwapping(true);
    setSwapStage("idle");
    setError("");
    setSwapResult(null);

    try {
      const amountInUnits =
        parseUnits(amountIn, 6);

      const currentAllowance =
        await publicClient.readContract({
          address: inputToken.address,
          abi: erc20AllowanceAbi,
          functionName: "allowance",
          args: [
            address,
            SWAP_ROUTER,
          ],
        });

      if (currentAllowance < amountInUnits) {
        setSwapStage("approving");

        const approvalHash =
          await walletClient.writeContract({
            address: inputToken.address,
            abi: erc20ApproveAbi,
            functionName: "approve",
            args: [
              SWAP_ROUTER,
              maxUint256,
            ],
            gas: BigInt(100000),
          });

        const approvalReceipt =
          await publicClient.waitForTransactionReceipt(
            {
              hash: approvalHash,
            }
          );

        if (
          approvalReceipt.status ===
          "reverted"
        ) {
          throw new Error(
            `${inputToken.symbol} approval transaction reverted.`
          );
        }
      }

      const amounts =
        await publicClient.readContract({
          address: SWAP_ROUTER,
          abi: routerAbi,
          functionName: "getAmountsOut",
          args: [
            amountInUnits,
            [
              inputToken.address,
              outputToken.address,
            ],
          ],
        });

      const quotedOutput =
        amounts[1];

      const amountOutMin =
        (quotedOutput *
          BigInt(10000 - slippageBps)) /
        BigInt(10000);

      setSwapStage("confirming");

      const deadline =
        BigInt(
          Math.floor(
            Date.now() / 1000
          ) +
            60 * 10
        );

      const swapHash =
        await walletClient.writeContract({
          address: SWAP_ROUTER,
          abi: routerAbi,
          functionName:
            "swapExactTokensForTokens",
          args: [
            amountInUnits,
            amountOutMin,
            [
              inputToken.address,
              outputToken.address,
            ],
            address,
            deadline,
          ],
          gas: BigInt(250000),
        });

      const swapReceipt =
        await publicClient.waitForTransactionReceipt(
          {
            hash: swapHash,
          }
        );

      if (
        swapReceipt.status ===
        "reverted"
      ) {
        throw new Error(
          "Swap transaction reverted."
        );
      }

      console.log(
        "Direct Arc swap transaction:",
        swapHash
      );

      setSwapResult({
        txHash: swapHash,
        explorerUrl: `https://testnet.arcscan.app/tx/${swapHash}`,
      });

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
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-white/35"
      >
        <path
          d="M4 6.5C4 5.39543 4.89543 4.5 6 4.5H19C20.1046 4.5 21 5.39543 21 6.5V17.5C21 18.6046 20.1046 19.5 19 19.5H6C4.89543 19.5 4 18.6046 4 17.5V6.5Z"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M16 13H21"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <circle
          cx="16"
          cy="13"
          r="1"
          fill="currentColor"
        />
      </svg>

      <span className="text-xs font-bold text-white/45">
        {isConnected
          ? displayBalance
          : "—"}
      </span>
    </div>
  </div>

  <div className="mt-3 flex min-h-[60px] items-center gap-3">
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
        className="h-10 w-10 rounded-full object-contain"
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
    style={{
  fontSize: "11px",
  lineHeight: "13px",
  fontWeight: 600,
}}
    className="flex h-7 min-w-[44px] items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.04] text-white/75 transition-all duration-150 hover:border-white/[0.18] hover:bg-white/[0.08] hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:border-white/[0.05] disabled:bg-white/[0.02] disabled:text-white/15"
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
    style={{
  fontSize: "11px",
  lineHeight: "13px",
  fontWeight: 600,
}}
    className="flex h-7 min-w-[44px] items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.04] text-white/75 transition-all duration-150 hover:border-white/[0.18] hover:bg-white/[0.08] hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:border-white/[0.05] disabled:bg-white/[0.02] disabled:text-white/15"
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

                <div className="mt-3 flex min-h-[60px] items-center gap-3">
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
                      className="h-10 w-10 rounded-full object-contain"
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

    <div className="flex items-center gap-2">
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

      <button
        type="button"
        onClick={() =>
          setShowSettings(!showSettings)
        }
        aria-label="Swap settings"
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-150 ${
          showSettings
            ? "border-white/[0.16] bg-white/[0.08] text-white"
            : "border-white/[0.07] bg-white/[0.025] text-white/40 hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white"
        }`}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5Z"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M19.4 15C19.55 14.67 19.67 14.33 19.75 13.97L21.05 12.96C21.3 12.77 21.3 12.4 21.05 12.21L19.75 11.2C19.67 10.84 19.55 10.5 19.4 10.17L19.7 8.58C19.76 8.28 19.53 8 19.23 7.93L17.65 7.61C17.42 7.32 17.16 7.06 16.87 6.83L16.55 5.25C16.48 4.95 16.2 4.72 15.9 4.78L14.31 5.08C13.98 4.93 13.64 4.81 13.28 4.73L12.27 3.43C12.08 3.18 11.71 3.18 11.52 3.43L10.51 4.73C10.15 4.81 9.81 4.93 9.48 5.08L7.89 4.78C7.59 4.72 7.31 4.95 7.24 5.25L6.92 6.83C6.63 7.06 6.37 7.32 6.14 7.61L4.56 7.93C4.26 8 4.03 8.28 4.09 8.58L4.39 10.17C4.24 10.5 4.12 10.84 4.04 11.2L2.74 12.21C2.49 12.4 2.49 12.77 2.74 12.96L4.04 13.97C4.12 14.33 4.24 14.67 4.39 15L4.09 16.59C4.03 16.89 4.26 17.17 4.56 17.24L6.14 17.56C6.37 17.85 6.63 18.11 6.92 18.34L7.24 19.92C7.31 20.22 7.59 20.45 7.89 20.39L9.48 20.09C9.81 20.24 10.15 20.36 10.51 20.44L11.52 21.74C11.71 21.99 12.08 21.99 12.27 21.74L13.28 20.44C13.64 20.36 13.98 20.24 14.31 20.09L15.9 20.39C16.2 20.45 16.48 20.22 16.55 19.92L16.87 18.34C17.16 18.11 17.42 17.85 17.65 17.56L19.23 17.24C19.53 17.17 19.76 16.89 19.7 16.59L19.4 15Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  </div>

  {showSettings && (
    <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/20 p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-white/50">
            Slippage tolerance
          </p>

          <p className="mt-1 text-[10px] font-medium text-white/20">
            Maximum price movement accepted
          </p>
        </div>

        <span className="text-xs font-bold text-white/50">
          {formattedSlippage}%
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
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

      {slippageMode === "custom" && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {customSlippageOptions.map(
            (value) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  handleCustomSlippage(value)
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
    </div>
  )}
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
                swapCompleted ||
                chainId !== ARC_TESTNET_CHAIN_ID
              }
              style={{
                fontFamily: manrope.style.fontFamily,
                fontWeight: 600,
              }}
              className={`mt-5 min-h-13 w-full rounded-full py-3.5 text-sm tracking-tight transition-all duration-200 ${
                !isConnected ||
                !amountIn ||
                Number(amountIn) <= 0 ||
                insufficientBalance ||
                isLoading ||
                isSwapping ||
                !estimatedOutput ||
                swapCompleted ||
                chainId !== ARC_TESTNET_CHAIN_ID
                  ? "cursor-not-allowed border border-white/[0.05] bg-[#111318] text-white/20"
                  : "border border-black/[0.08] bg-white text-black shadow-[0_2px_6px_rgba(0,0,0,0.06),0_10px_28px_rgba(0,0,0,0.14)] hover:-translate-y-0.5 hover:bg-[#fafafa] active:translate-y-0"
              }`}
            >
              {isSwapping
                ? swapStage === "approving"
                  ? "Approve in Wallet"
                  : "Confirming Swap"
                : !isConnected
                ? "Connect Wallet"
                : chainId !==
                  ARC_TESTNET_CHAIN_ID
                ? "Switch to Arc Testnet"
                : !amountIn
                ? "Enter Amount"
                : insufficientBalance
                ? "Insufficient Balance"
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
