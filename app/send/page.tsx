"use client";

import { useState } from "react";
import { Manrope } from "next/font/google";
import Header from "@/components/Header";
import {
  useAccount,
  useSwitchChain,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { isAddress, parseUnits } from "viem";
import { arcTestnet } from "@/lib/wagmi";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["600"],
});

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

type Section =
  | "home"
  | "send"
  | "swap"
  | "bridge"
  | "activity"
  | "faucet";

const connectGlassButton =
  "border border-white/[0.22] bg-gradient-to-br from-white/[0.14] via-white/[0.08] to-white/[0.035] text-white shadow-[0_8px_30px_rgba(255,255,255,0.05),0_10px_35px_rgba(0,0,0,0.32)] backdrop-blur-2xl transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.34] hover:from-white/[0.18] hover:via-white/[0.11] hover:to-white/[0.055] hover:shadow-[0_10px_35px_rgba(255,255,255,0.08),0_18px_45px_rgba(0,0,0,0.42)] active:translate-y-0";

const silverGlassButton =
  "border border-black/[0.08] bg-white text-black shadow-[0_2px_6px_rgba(0,0,0,0.06),0_10px_28px_rgba(0,0,0,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#fafafa] hover:shadow-[0_4px_10px_rgba(0,0,0,0.08),0_14px_34px_rgba(0,0,0,0.18)] active:translate-y-0";

const unavailableButton =
  "border border-white/[0.05] bg-[#111318] text-white/20 shadow-none cursor-not-allowed";

function getFriendlyErrorMessage(message: string): string {
  const lowerMessage = message.toLowerCase();

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

  if (lowerMessage.includes("transaction rejected")) {
    return "Transaction was rejected. Please try again.";
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
  const [showMenu, setShowMenu] = useState(false);

  const [activeSection, setActiveSection] =
    useState<Section>("send");

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

  const handleNavigation = (section: Section) => {
    const routes: Record<Section, string> = {
      home: "/",
      send: "/send",
      swap: "/swap",
      bridge: "/bridge",
      activity: "/activity",
      faucet: "/faucet",
    };

    setShowMenu(false);
    setError("");
    setActiveSection(section);

    window.location.href = routes[section];
  };

  const menuItems: {
    id: Section;
    label: string;
    icon: string;
  }[] = [
    {
      id: "home",
      label: "Home",
      icon: "⌂",
    },
    {
      id: "send",
      label: "Send",
      icon: "↗",
    },
    {
      id: "swap",
      label: "Swap",
      icon: "⇄",
    },
    {
      id: "bridge",
      label: "Bridge",
      icon: "⇅",
    },
    {
      id: "activity",
      label: "Activity",
      icon: "◷",
    },
    {
      id: "faucet",
      label: "Faucet",
      icon: "◌",
    },
  ];

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
      <style jsx global>{`
        button {
          font-family: ${manrope.style.fontFamily} !important;
          font-weight: 600 !important;
          letter-spacing: normal !important;
        }
      `}</style>

      <Header
        onMenuClick={() => setShowMenu(true)}
      />

      {/* SEND CONTENT */}

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-12">

          {/* LEFT SIDE */}

          <div className="lg:pr-8">
            <p className="text-sm font-semibold text-white/35">
              AlabaamaFi
            </p>

            <h1 className="mt-1 text-3xl font-black sm:text-4xl lg:text-5xl">
              Send USDC
            </h1>

            <p className="mt-2 max-w-md text-sm font-medium leading-6 text-white/35 sm:text-base lg:mt-4 lg:leading-7">
              Send USDC to another wallet on Arc Testnet.
            </p>

            {/* DESKTOP BALANCE CARD */}

            <div className="mt-8 hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#0a0f16] via-[#06080b] to-[#030303] p-6 shadow-2xl shadow-black/40 lg:block">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-white/25">
                    Available Balance
                  </p>

                  <p className="mt-2 text-3xl font-black">
                    {isBalanceLoading
                      ? "Loading..."
                      : `${formattedBalance} USDC`}
                  </p>
                </div>

                <span className="shrink-0 rounded-full border border-white/[0.07] bg-[#080a0d] px-3 py-1 text-xs font-bold text-white/45">
                  Arc Testnet
                </span>
              </div>

              <div className="mt-6 border-t border-white/[0.06] pt-5">
                <p className="text-xs font-semibold leading-5 text-white/25">
                  USDC transfers are processed directly on Arc Testnet.
                </p>
              </div>
            </div>
          </div>

          {/* TRANSFER CARD */}

          <div className="mx-auto w-full max-w-md lg:max-w-none">
            <div className="rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#0a0f16] via-[#06080b] to-[#030303] p-4 shadow-2xl shadow-black/60 sm:p-6 lg:p-8">

              <div className="mb-6 flex items-center justify-between gap-3 lg:mb-8">
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
                onChange={(event) =>
                  setRecipient(event.target.value)
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
                  onChange={(event) =>
                    setAmount(event.target.value)
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
                className={`mt-6 min-h-13 w-full rounded-full px-5 py-4 text-sm font-semibold tracking-normal ${
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
                    className="mt-3 min-h-13 w-full rounded-full border border-white/[0.09] bg-white/[0.045] py-3.5 text-sm font-semibold tracking-normal text-white backdrop-blur-xl transition-all hover:border-white/[0.17] hover:bg-white/[0.08] active:scale-[0.99]"
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
        </div>
      </section>

      {/* MOBILE MENU */}

      {showMenu && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            onClick={() => setShowMenu(false)}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            aria-label="Close menu"
          />

          <aside className="relative z-50 flex min-h-screen w-[min(18rem,88vw)] flex-col border-r border-white/[0.06] bg-[#040506] p-4 shadow-2xl shadow-black/80 sm:p-5">

            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  AlabaamaFi
                </h2>

                <p className="mt-1 text-xs font-semibold text-white/30">
                  Powered by Arc
                </p>
              </div>

              <button
                onClick={() => setShowMenu(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white/50 transition hover:bg-white/[0.04] hover:text-white active:scale-95"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <nav className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    handleNavigation(item.id)
                  }
                  className={`flex min-h-12 w-full items-center gap-4 rounded-full px-4 py-3.5 text-left transition-all duration-200 active:scale-[0.99] ${
                    activeSection === item.id
                      ? silverGlassButton
                      : "text-white/60 hover:bg-[#0a0d12] hover:text-white"
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center text-lg font-bold leading-none">
                    {item.icon}
                  </span>

                  <span className="text-sm font-bold">
                    {item.label}
                  </span>
                </button>
              ))}
            </nav>

            <div className="mt-auto pt-8">
              <button
                onClick={() => {
                  setShowMenu(false);

                  window.dispatchEvent(
                    new Event("open-wallet-modal")
                  );
                }}
                className={`w-full rounded-full px-4 py-3.5 text-sm font-semibold tracking-normal active:scale-[0.99] ${connectGlassButton}`}
              >
                {isConnected
                  ? `${address?.slice(
                      0,
                      6
                    )}...${address?.slice(-4)}`
                  : "Connect Wallet"}
              </button>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
