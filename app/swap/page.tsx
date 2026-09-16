"use client";

import { useEffect, useMemo, useState } from "react";
import { Manrope } from "next/font/google";
import {
  useAccount,
  useReadContract,
  useWalletClient,
} from "wagmi";
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
type SwapStage =
  | "idle"
  | "approving"
  | "confirming";

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
  transport: http(
    "https://rpc.testnet.arc.network"
  ),
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
    rawWalletClient as
      | SwapWalletClient
      | undefined;

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

  const [customSlippage, setCustomSlippage] =
    useState(0.5);

  const [customSlippageInput, setCustomSlippageInput] =
    useState("0.5");

  const [showSettings, setShowSettings] =
    useState(false);

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

    if (mode === "custom") {
      setCustomSlippageInput(
        String(customSlippage)
      );
    }
  };

  const handleCustomSlippageInput = (
    value: string
  ) => {
    setCustomSlippageInput(value);

    if (value === "") {
      return;
    }

    const numericValue = Number(value);

    if (
      Number.isFinite(numericValue) &&
      numericValue > 0 &&
      numericValue <= 50
    ) {
      setCustomSlippage(numericValue);
      setSlippageMode("custom");
      setEstimatedOutput("");
      setError("");
    }
  };

  const handleCustomSlippage = (
    value: number
  ) => {
    setCustomSlippage(value);
    setCustomSlippageInput(
      String(value)
    );
    setSlippageMode("custom");
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

  const amountTextClass =
    "min-w-0 flex-1 truncate text-[36px] font-black leading-none tracking-tight text-white";

  const amountTextStyle = {
    fontFamily: "inherit",
    fontSize: "36px",
    fontWeight: 900,
    lineHeight: "1",
  };

  return (
    <main className="min-h-screen bg-[#030405] text-white">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-2xl">

          {/* PAGE TITLE */}
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

          {/* MAIN SWAP CARD */}
          <div className="relative rounded-[28px] border border-white/[0.07] bg-gradient-to-br from-[#0b1017] via-[#06080b] to-[#030303] p-4 shadow-2xl shadow-black/60 sm:p-6 lg:p-7">

            {/* HEADER */}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-bold text-white/80">
                Swap
              </h2>

              <button
                type="button"
                onClick={() =>
                  setShowSettings(true)
                }
                aria-label="Swap settings"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.025] text-white/40 transition-all duration-150 hover:border-white/[0.15] hover:bg-white/[0.07] hover:text-white active:scale-95"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 7H14"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                  <path
                    d="M18 7H20"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10 7C10 8.10457 9.10443 9 8 9C6.89543 9 6 8.10457 6 7C6 5.89543 6.89543 5 8 5C9.10443 5 10 5 10 7Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M4 17H8"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 17H20"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                  <path
                    d="M14 17C14 18.1046 13.1046 19 12 19C10.8954 19 10 18.1046 10 17C10 15.8954 10.1046 15 12 15C13.1046 15 14 15 14 17Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                </svg>
              </button>
            </div>

            <div className="grid gap-3">

              {/* YOU PAY */}
              <div className="mx-auto w-[92%] rounded-2xl border border-white/[0.07] bg-[#020202] p-3 sm:w-full sm:p-5">

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold text-white/35">
                    You pay
                  </p>

                  <div className="flex items-center gap-2">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
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

                {/* MOBILE-COMPACT AMOUNT */}
                <div className="mt-1 flex h-[50px] items-center gap-2 sm:mt-3 sm:h-auto sm:min-h-[60px] sm:gap-3">

                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0.00"
                    value={amountIn}
                    onChange={(event) => {
                      const value =
                        event.target.value;

                      if (
                        /^\d*\.?\d*$/.test(
                          value
                        )
                      ) {
                        handleAmountChange(
                          value
                        );
                      }
                    }}
                    className={`${amountTextClass} border-0 bg-transparent p-0 outline-none placeholder:text-white/15`}
                    style={amountTextStyle}
                  />

                  <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/[0.07] bg-[#080a0d] px-1.5 py-1 sm:gap-2 sm:px-3 sm:py-2">

                    <img
                      src={inputToken.logo}
                      alt={inputToken.symbol}
                      className="h-7 w-7 rounded-full object-contain sm:h-10 sm:w-10"
                    />

                    <span className="text-sm font-black">
                      {inputToken.symbol}
                    </span>

                  </div>
                </div>

                <div className="mt-1 flex items-center justify-between gap-3 sm:mt-2">

                  <p className="text-xs font-medium text-white/20">
                    {inputToken.name}
                  </p>

                  <div className="flex items-center gap-1.5">

                    <button
                      type="button"
                      onClick={() =>
                        handlePercentage(
                          0.5
                        )
                      }
                      disabled={
                        !isConnected ||
                        inputBalanceNumber <=
                          0
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
                        inputBalanceNumber <=
                          0
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
                  onClick={
                    handleSwitchTokens
                  }
                  aria-label="Switch tokens"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-[#080a0d] text-sm font-semibold text-white/55 shadow-xl transition hover:border-white/[0.16] hover:bg-[#0c1016] hover:text-white"
                >
                  ↓
                </button>
              </div>

              {/* YOU RECEIVE */}
              <div className="mx-auto w-[92%] rounded-2xl border border-white/[0.07] bg-[#020202] p-3 sm:w-full sm:p-5">

                <p className="text-xs font-bold text-white/35">
                  You receive
                </p>

                {/* MOBILE-COMPACT AMOUNT */}
                <div className="mt-1 flex h-[50px] items-center gap-2 sm:mt-3 sm:h-auto sm:min-h-[60px] sm:gap-3">

                  <span
                    className={
                      amountTextClass
                    }
                    style={amountTextStyle}
                  >
                    {isLoading
                      ? "..."
                      : estimatedOutput ||
                        (amountIn
                          ? "—"
                          : "0.00")}
                  </span>

                  <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/[0.07] bg-[#080a0d] px-1.5 py-1 sm:gap-2 sm:px-3 sm:py-2">

                    <img
                      src={outputToken.logo}
                      alt={outputToken.symbol}
                      className="h-7 w-7 rounded-full object-contain sm:h-10 sm:w-10"
                    />

                    <span className="text-sm font-black">
                      {outputToken.symbol}
                    </span>

                  </div>
                </div>

                <p className="mt-1 text-xs font-medium text-white/20 sm:mt-2">
                  {outputToken.name}
                </p>
              </div>
            </div>

            {/* ESTIMATED OUTPUT */}
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
            </div>

            {/* SETTINGS POPUP */}
            {showSettings && (
              <>
                <button
                  type="button"
                  aria-label="Close settings"
                  onClick={() =>
                    setShowSettings(false)
                  }
                  className="fixed inset-0 z-40 cursor-default bg-black/20 backdrop-blur-[1px]"
                />

                <div
                  className="absolute right-4 top-[68px] z-50 w-[calc(100%-32px)] max-w-[340px] sm:right-6 sm:w-[340px] lg:right-7"
                  style={{
                    fontFamily:
                      manrope.style
                        .fontFamily,
                    fontWeight: 600,
                  }}
                >
                  <div className="rounded-2xl border border-white/[0.08] bg-[#080a0d] p-4 shadow-2xl shadow-black/70">

                    {/* POPUP HEADER */}
                    <div className="flex items-center justify-between">

                      <div>
                        <p className="text-sm font-semibold text-white/80">
                          Swap settings
                        </p>

                        <p className="mt-1 text-[10px] font-semibold text-white/25">
                          Configure your swap tolerance
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setShowSettings(
                            false
                          )
                        }
                        aria-label="Close settings"
                        className="flex h-7 w-7 items-center justify-center rounded-full text-white/30 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M6 6L18 18M18 6L6 18"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>

                    </div>

                    {/* SLIPPAGE */}
                    <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">

                      <div className="flex items-center justify-between">

                        <div>
                          <p className="text-xs font-semibold text-white/65">
                            Slippage tolerance
                          </p>

                          <p className="mt-1 text-[10px] font-semibold text-white/25">
                            Maximum price movement accepted
                          </p>
                        </div>

                        <span className="text-xs font-semibold text-white/55">
                          {formattedSlippage}%
                        </span>

                      </div>

                      {/* AUTO / CUSTOM */}
                      <div className="mt-3 grid grid-cols-2 gap-1.5">

                        <button
                          type="button"
                          onClick={() =>
                            handleSlippageMode(
                              "auto"
                            )
                          }
                          className={`h-8 rounded-lg border text-[10px] font-semibold transition ${
                            slippageMode ===
                            "auto"
                              ? "border-white/[0.14] bg-white/[0.08] text-white"
                              : "border-white/[0.06] bg-white/[0.025] text-white/35 hover:bg-white/[0.05] hover:text-white/60"
                          }`}
                        >
                          Auto · 0.5%
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSlippageMode(
                              "custom"
                            )
                          }
                          className={`h-8 rounded-lg border text-[10px] font-semibold transition ${
                            slippageMode ===
                            "custom"
                              ? "border-white/[0.14] bg-white/[0.08] text-white"
                              : "border-white/[0.06] bg-white/[0.025] text-white/35 hover:bg-white/[0.05] hover:text-white/60"
                          }`}
                        >
                          Custom
                        </button>

                      </div>

                      {/* CUSTOM INPUT */}
                      {slippageMode ===
                        "custom" && (
                        <>
                          <div className="relative mt-3">

                            <input
                              type="text"
                              inputMode="decimal"
                              value={
                                customSlippageInput
                              }
                              onChange={(
                                event
                              ) =>
                                handleCustomSlippageInput(
                                  event
                                    .target
                                    .value
                                )
                              }
                              placeholder="0.5"
                              className="h-10 w-full rounded-lg border border-white/[0.07] bg-[#030405] px-3 pr-8 text-xs font-semibold text-white outline-none placeholder:text-white/15 focus:border-white/[0.16]"
                            />

                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-white/35">
                              %
                            </span>

                          </div>

                          <div className="mt-2 flex flex-wrap gap-1.5">

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
                                  className={`h-7 rounded-lg border px-2.5 text-[10px] font-semibold transition ${
                                    customSlippage ===
                                    value
                                      ? "border-white/[0.14] bg-white/[0.08] text-white"
                                      : "border-white/[0.06] bg-white/[0.025] text-white/35 hover:bg-white/[0.05] hover:text-white/60"
                                  }`}
                                >
                                  {value}%
                                </button>
                              )
                            )}

                          </div>
                        </>
                      )}

                    </div>

                    {/* DONE */}
                    <button
                      type="button"
                      onClick={() =>
                        setShowSettings(false)
                      }
                      className="mt-3 h-9 w-full rounded-lg border border-white/[0.07] bg-white/[0.04] text-xs font-semibold text-white/60 transition hover:border-white/[0.12] hover:bg-white/[0.07] hover:text-white"
                    >
                      Done
                    </button>

                  </div>
                </div>
              </>
            )}

            {/* ERRORS */}
            {insufficientBalance && (
              <div className="mt-4 rounded-2xl border border-red-400/10 bg-red-400/[0.04] p-3">
                <p className="text-center text-xs font-semibold leading-5 text-red-300/70">
                  Insufficient{" "}
                  {inputToken.symbol} balance.
                </p>
              </div>
            )}

            {error &&
              !insufficientBalance && (
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
                    onClick={
                      handleNewSwap
                    }
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
                chainId !==
                  ARC_TESTNET_CHAIN_ID
              }
              style={{
                fontFamily:
                  manrope.style.fontFamily,
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
                chainId !==
                  ARC_TESTNET_CHAIN_ID
                  ? "cursor-not-allowed border border-white/[0.05] bg-[#111318] text-white/20"
                  : "border border-black/[0.08] bg-white text-black shadow-[0_2px_6px_rgba(0,0,0,0.06),0_10px_28px_rgba(0,0,0,0.14)] hover:-translate-y-0.5 hover:bg-[#fafafa] active:translate-y-0"
              }`}
            >
              {isSwapping
                ? swapStage ===
                  "approving"
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
