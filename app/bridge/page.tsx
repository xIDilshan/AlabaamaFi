"use client";

import { useMemo, useState } from "react";
import { Manrope } from "next/font/google";
import { AppKit } from "@circle-fin/app-kit";
import {
  createViemAdapterFromProvider,
  type CreateViemAdapterFromProviderParams,
} from "@circle-fin/adapter-viem-v2";
import { useAccount } from "wagmi";

import Header from "@/components/Header";

const manrope = Manrope({
  subsets: ["latin"],
  weight: "600",
});

type BrowserWalletProvider =
  CreateViemAdapterFromProviderParams["provider"];

type BridgeChain = {
  id: string;
  name: string;
  shortName: string;
  chainId: number;
  logo: string;
  description: string;
};

const ARC_TESTNET: BridgeChain = {
  id: "Arc_Testnet",
  name: "Arc Testnet",
  shortName: "Arc",
  chainId: 5042002,
  logo: "/tokens/usdc.svg",
  description: "USDC-native Arc network",
};

const ETHEREUM_SEPOLIA: BridgeChain = {
  id: "Ethereum_Sepolia",
  name: "Ethereum Sepolia",
  shortName: "Ethereum",
  chainId: 11155111,
  logo: "/tokens/usdc.svg",
  description: "Ethereum Sepolia testnet",
};

const BRIDGE_CHAINS = [
  ARC_TESTNET,
  ETHEREUM_SEPOLIA,
];

const bridgeKit = new AppKit();

export default function BridgePage() {
  const { isConnected, connector } = useAccount();

  const [sourceChain, setSourceChain] =
    useState<BridgeChain>(ARC_TESTNET);

  const [destinationChain, setDestinationChain] =
    useState<BridgeChain>(ETHEREUM_SEPOLIA);

  const [amount, setAmount] = useState("");

  const [isBridging, setIsBridging] =
    useState(false);

  const [status, setStatus] = useState("");

  const [error, setError] = useState("");

  const [showSourceChains, setShowSourceChains] =
    useState(false);

  const [showDestinationChains, setShowDestinationChains] =
    useState(false);

  const sameChain =
    sourceChain.id === destinationChain.id;

  const canBridge =
    isConnected &&
    !isBridging &&
    !sameChain &&
    Number(amount) > 0;

  const amountDisplay = useMemo(() => {
    if (!amount) {
      return "0.00";
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) {
      return "0.00";
    }

    return numericAmount.toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }
    );
  }, [amount]);

  const handleSwapChains = () => {
    const previousSource = sourceChain;

    setSourceChain(destinationChain);
    setDestinationChain(previousSource);

    setStatus("");
    setError("");
  };

  const handleBridge = async () => {
    setError("");
    setStatus("");

    if (!isConnected) {
      setError("Connect your wallet first.");
      return;
    }

    if (!connector) {
      setError("Wallet connection is not ready.");
      return;
    }

    if (sameChain) {
      setError(
        "Choose two different networks."
      );
      return;
    }

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError("Enter a valid USDC amount.");
      return;
    }

    try {
      setIsBridging(true);
      setStatus("Preparing bridge...");

      const provider =
        (await connector.getProvider()) as BrowserWalletProvider;

      if (!provider) {
        throw new Error(
          "Unable to access your wallet provider."
        );
      }

      setStatus(
        `Preparing ${sourceChain.shortName} → ${destinationChain.shortName}...`
      );

      const adapter =
        await createViemAdapterFromProvider({
          provider,
        });

      setStatus("Confirm the transaction in your wallet...");

      let result = await bridgeKit.bridge({
        from: {
          adapter,
          chain: sourceChain.id,
        },
        to: {
          adapter,
          chain: destinationChain.id,
        },
        amount: amount.trim(),
      });

      if (result.state === "error") {
        setStatus(
          "The bridge needs to continue from the previous step..."
        );

        result = await bridgeKit.retryBridge(
          result,
          {
            from: adapter,
            to: adapter,
          }
        );
      }

      if (result.state === "success") {
        setStatus(
          "Bridge completed successfully."
        );
        setAmount("");
      } else {
        setStatus(
          "Bridge process finished with an incomplete step."
        );
        setError(
          "The bridge did not complete fully. Please check the transaction status and try again if needed."
        );
      }
    } catch (bridgeError) {
      console.error(
        "Bridge error:",
        bridgeError
      );

      const message =
        bridgeError instanceof Error
          ? bridgeError.message
          : "Unable to complete the bridge.";

      setError(message);
      setStatus("");
    } finally {
      setIsBridging(false);
    }
  };

  const handleAmountChange = (
    value: string
  ) => {
    if (value === "") {
      setAmount("");
      setError("");
      return;
    }

    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    setAmount(value);
    setError("");
    setStatus("");
  };

  return (
    <main className="min-h-screen bg-[#030405] text-white">
      <Header />

      <div className="mx-auto flex max-w-5xl justify-center px-4 pb-20 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <section className="w-full max-w-[520px]">
          <div className="mb-7 text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Bridge
            </h1>

            <p className="mt-2 text-sm text-white/45 sm:text-base">
              Move USDC across networks with Arc.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-4 shadow-2xl shadow-black/20 sm:p-5">
            <div className="rounded-[22px] border border-white/[0.07] bg-[#08090a] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-white/40">
                  From
                </span>

                <span className="text-xs text-white/35">
                  USDC
                </span>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowSourceChains(
                      !showSourceChains
                    );
                    setShowDestinationChains(false);
                  }}
                  className="flex min-h-[58px] w-full items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 transition hover:bg-white/[0.055]"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={sourceChain.logo}
                      alt=""
                      className="h-9 w-9"
                    />

                    <div className="text-left">
                      <div className="text-sm font-semibold text-white">
                        {sourceChain.name}
                      </div>

                      <div className="mt-0.5 text-xs text-white/35">
                        {sourceChain.description}
                      </div>
                    </div>
                  </div>

                  <span className="text-white/40">
                    ▾
                  </span>
                </button>

                {showSourceChains && (
                  <div className="absolute left-0 right-0 top-[66px] z-30 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0b0c0d] p-1.5 shadow-2xl">
                    {BRIDGE_CHAINS.map(
                      (chain) => (
                        <button
                          key={chain.id}
                          type="button"
                          onClick={() => {
                            setSourceChain(
                              chain
                            );
                            setShowSourceChains(
                              false
                            );
                            setError("");
                            setStatus("");
                          }}
                          className="flex min-h-[58px] w-full items-center gap-3 rounded-xl px-3 text-left transition hover:bg-white/[0.05]"
                        >
                          <img
                            src={chain.logo}
                            alt=""
                            className="h-8 w-8"
                          />

                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-white">
                              {chain.name}
                            </div>

                            <div className="text-xs text-white/35">
                              {chain.description}
                            </div>
                          </div>
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-end justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor="bridge-amount"
                    className="sr-only"
                  >
                    Amount
                  </label>

                  <input
                    id="bridge-amount"
                    inputMode="decimal"
                    autoComplete="off"
                    value={amount}
                    onChange={(event) =>
                      handleAmountChange(
                        event.target.value
                      )
                    }
                    placeholder="0.00"
                    disabled={isBridging}
                    className="w-full min-w-0 bg-transparent text-3xl font-black tracking-tight text-white outline-none placeholder:text-white/15 sm:text-4xl"
                  />
                </div>

                <div className="flex shrink-0 items-center gap-2 pb-1">
                  <img
                    src="/tokens/usdc.svg"
                    alt="USDC"
                    className="h-7 w-7"
                  />

                  <span className="text-sm font-semibold text-white">
                    USDC
                  </span>
                </div>
              </div>
            </div>

            <div className="relative z-10 -my-2 flex justify-center">
              <button
                type="button"
                onClick={handleSwapChains}
                disabled={isBridging}
                aria-label="Switch bridge networks"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.1] bg-[#101112] text-lg text-white/65 shadow-lg transition hover:border-white/[0.18] hover:bg-[#151617] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                ⇅
              </button>
            </div>

            <div className="rounded-[22px] border border-white/[0.07] bg-[#08090a] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-white/40">
                  To
                </span>

                <span className="text-xs text-white/35">
                  USDC
                </span>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowDestinationChains(
                      !showDestinationChains
                    );
                    setShowSourceChains(false);
                  }}
                  className="flex min-h-[58px] w-full items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 transition hover:bg-white/[0.055]"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        destinationChain.logo
                      }
                      alt=""
                      className="h-9 w-9"
                    />

                    <div className="text-left">
                      <div className="text-sm font-semibold text-white">
                        {
                          destinationChain.name
                        }
                      </div>

                      <div className="mt-0.5 text-xs text-white/35">
                        {
                          destinationChain.description
                        }
                      </div>
                    </div>
                  </div>

                  <span className="text-white/40">
                    ▾
                  </span>
                </button>

                {showDestinationChains && (
                  <div className="absolute left-0 right-0 top-[66px] z-30 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0b0c0d] p-1.5 shadow-2xl">
                    {BRIDGE_CHAINS.map(
                      (chain) => (
                        <button
                          key={chain.id}
                          type="button"
                          onClick={() => {
                            setDestinationChain(
                              chain
                            );
                            setShowDestinationChains(
                              false
                            );
                            setError("");
                            setStatus("");
                          }}
                          className="flex min-h-[58px] w-full items-center gap-3 rounded-xl px-3 text-left transition hover:bg-white/[0.05]"
                        >
                          <img
                            src={chain.logo}
                            alt=""
                            className="h-8 w-8"
                          />

                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-white">
                              {chain.name}
                            </div>

                            <div className="text-xs text-white/35">
                              {chain.description}
                            </div>
                          </div>
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-white/35">
                  You send
                </span>

                <span className="text-sm font-semibold text-white/65">
                  {amountDisplay} USDC
                </span>
              </div>
            </div>

            {sameChain && (
              <div className="mt-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-center text-xs text-white/45">
                Select two different networks
                to bridge.
              </div>
            )}

            {error && (
              <div className="mt-3 rounded-2xl border border-red-400/10 bg-red-400/[0.05] px-4 py-3 text-sm leading-5 text-red-300/85">
                {error}
              </div>
            )}

            {status && !error && (
              <div
                aria-live="polite"
                className="mt-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-center text-sm text-white/55"
              >
                {status}
              </div>
            )}

            <button
              type="button"
              onClick={handleBridge}
              disabled={!canBridge}
              className={`${manrope.className} mt-4 flex min-h-[54px] w-full items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold tracking-normal text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-white/25`}
            >
              {!isConnected
                ? "Connect Wallet"
                : isBridging
                ? "Bridging..."
                : sameChain
                ? "Choose Different Networks"
                : !amount ||
                  Number(amount) <= 0
                ? "Enter Amount"
                : "Bridge USDC"}
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-white/25">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
              Powered by Circle CCTP
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-2 py-3">
              <div className="text-xs font-semibold text-white/70">
                Native USDC
              </div>
              <div className="mt-1 text-[10px] text-white/25">
                No wrapped tokens
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-2 py-3">
              <div className="text-xs font-semibold text-white/70">
                CCTP
              </div>
              <div className="mt-1 text-[10px] text-white/25">
                Circle infrastructure
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-2 py-3">
              <div className="text-xs font-semibold text-white/70">
                Cross-chain
              </div>
              <div className="mt-1 text-[10px] text-white/25">
                Arc ↔ Ethereum
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
