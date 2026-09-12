"use client";

import { useState } from "react";
import {
  useAccount,
  useSwitchChain,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { isAddress, parseUnits } from "viem";
import { arcTestnet } from "@/lib/wagmi";

const USDC_ADDRESS =
  "0x3600000000000000000000000000000000000000";

const USDC_ABI = [
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
        name: "",
        type: "uint256",
      },
    ],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "to",
        type: "address",
      },
      {
        name: "value",
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

const silverGlassButton =
  "border border-black/[0.08] bg-white text-black shadow-[0_2px_6px_rgba(0,0,0,0.06),0_10px_28px_rgba(0,0,0,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#fafafa] hover:shadow-[0_4px_10px_rgba(0,0,0,0.08),0_14px_34px_rgba(0,0,0,0.18)] active:translate-y-0";

const unavailableButton =
  "border border-white/[0.05] bg-[#111318] text-white/20 shadow-none cursor-not-allowed";

function getFriendlyErrorMessage(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("user rejected") ||
    lowerMessage.includes("user denied")
  ) {
    return "Transaction was rejected. Please try again.";
  }

  if (
    lowerMessage.includes("insufficient funds") ||
    lowerMessage.includes("insufficient balance")
  ) {
    return "Insufficient USDC balance.";
  }

  if (
    lowerMessage.includes("invalid address") ||
    lowerMessage.includes("invalid recipient")
  ) {
    return "Please enter a valid wallet address.";
  }

  if (
    lowerMessage.includes("network") ||
    lowerMessage.includes("chain")
  ) {
    return "Network connection failed. Please try again.";
  }

  if (
    lowerMessage.includes("execution reverted") ||
    lowerMessage.includes("reverted")
  ) {
    return "Transaction could not be completed. Please try again.";
  }

  return "Something went wrong. Please try again.";
}

export default function SendPage() {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const {
    address,
    isConnected,
    chainId,
  } = useAccount();

  const { switchChain } = useSwitchChain();

  const {
    data: usdcBalance,
    isLoading: isBalanceLoading,
  } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: arcTestnet.id,
  });

  const {
    writeContract,
    data: hash,
    isPending: isSending,
    error: sendError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const formattedBalance = usdcBalance
    ? (Number(usdcBalance) / 1_000_000).toFixed(2)
    : "0.00";

  const handleSend = () => {
    setError("");

    if (!isConnected || !address) {
      setError("Please connect your wallet first.");
      return;
    }

    if (chainId !== arcTestnet.id) {
      setError("Please switch to Arc Testnet.");
      return;
    }

    if (!isAddress(recipient)) {
      setError("Please enter a valid wallet address.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid USDC amount.");
      return;
    }

    try {
      const value = parseUnits(amount, 6);

      writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "transfer",
        args: [recipient, value],
        chainId: arcTestnet.id,
      });
    } catch {
      setError(
        "Unable to send USDC. Please try again."
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#030405] text-white">
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-md">

          <div className="mb-6 sm:mb-8">
            <p className="text-sm font-semibold text-white/35">
              AlabaamaFi
            </p>

            <h1 className="mt-1 text-3xl font-black sm:text-4xl">
              Send USDC
            </h1>

            <p className="mt-2 text-sm font-medium leading-6 text-white/35">
              Send USDC to another wallet on Arc Testnet.
            </p>
          </div>

          <div className="rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#0a0f16] via-[#06080b] to-[#030303] p-4 shadow-2xl shadow-black/60 sm:p-6">

            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="font-black">
                Transfer
              </h2>

              <span className="shrink-0 rounded-full border border-white/[0.07] bg-[#080a0d] px-3 py-1 text-xs font-bold text-white/45">
                Testnet
              </span>
            </div>

            <label className="mb-2 block text-sm font-bold text-white/50">
              Recipient
            </label>

            <input
              type="text"
              placeholder="0x..."
              value={recipient}
              onChange={(e) =>
                setRecipient(e.target.value)
              }
              className="mb-5 min-h-13 w-full rounded-2xl border border-white/[0.07] bg-[#020202] px-4 py-3 text-sm font-medium outline-none transition placeholder:text-white/15 focus:border-[#2b6cff]/25 focus:ring-2 focus:ring-[#163a72]/30"
            />

            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label className="text-sm font-bold text-white/50">
                Amount
              </label>

              <span className="text-xs font-semibold text-white/25">
                Balance:{" "}
                {isBalanceLoading
                  ? "Loading..."
                  : `${formattedBalance} USDC`}
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.000001"
                placeholder="0.00"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value)
                }
                className="min-h-13 w-full rounded-2xl border border-white/[0.07] bg-[#020202] px-4 py-3 pr-20 text-lg font-bold outline-none transition placeholder:text-white/15 focus:border-[#2b6cff]/25 focus:ring-2 focus:ring-[#163a72]/30"
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-white/45">
                USDC
              </span>
            </div>

            <button
              onClick={handleSend}
              disabled={
                !isConnected ||
                isSending ||
                isConfirming
              }
              className={`mt-6 min-h-13 w-full rounded-full px-5 py-4 text-sm font-black tracking-tight ${
                !isConnected
                  ? unavailableButton
                  : silverGlassButton
              } ${
                isConnected
                  ? "disabled:cursor-not-allowed disabled:opacity-60"
                  : ""
              }`}
            >
              {!isConnected
                ? "Connect Wallet"
                : isSending
                ? "Confirm in Wallet"
                : isConfirming
                ? "Confirming Transaction"
                : "Send"}
            </button>

            {isConnected &&
              chainId !== arcTestnet.id && (
                <button
                  onClick={() =>
                    switchChain({
                      chainId: arcTestnet.id,
                    })
                  }
                  className="mt-3 min-h-13 w-full rounded-full border border-white/[0.09] bg-white/[0.045] py-3.5 text-sm font-black tracking-tight text-white backdrop-blur-xl transition-all hover:border-white/[0.17] hover:bg-white/[0.08] active:scale-[0.99]"
                >
                  Switch to Arc Testnet
                </button>
              )}

            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
                <p className="break-words text-sm font-semibold leading-5 text-red-400">
                  {error}
                </p>
              </div>
            )}

            {sendError && (
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
                <p className="break-words text-sm font-semibold leading-5 text-red-400">
                  {getFriendlyErrorMessage(
                    sendError.message
                  )}
                </p>
              </div>
            )}

            {isConfirmed && hash && (
              <div className="mt-4 rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
                <p className="text-sm font-bold text-green-400">
                  Transaction confirmed ✓
                </p>

                <a
                  href={`https://testnet.arcscan.app/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block break-words text-sm font-bold text-white/50 underline transition hover:text-white"
                >
                  View Transaction on ArcScan
                </a>
              </div>
            )}

          </div>
        </div>
      </section>
    </main>
  );
}
