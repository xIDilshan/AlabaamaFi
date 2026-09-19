"use client";

import { useEffect, useMemo, useState } from "react";
import { Manrope } from "next/font/google";
import { BridgeKit } from "@circle-fin/bridge-kit";
import {
  createViemAdapterFromProvider,
  type CreateViemAdapterFromProviderParams,
} from "@circle-fin/adapter-viem-v2";
import {
  useAccount,
  useChainId,
  useSwitchChain,
} from "wagmi";

import Header from "@/components/Header";

const manrope = Manrope({
  subsets: ["latin"],
  weight: "600",
});

type BrowserWalletProvider =
  CreateViemAdapterFromProviderParams["provider"];

type CircleChain = ReturnType<
  BridgeKit["getSupportedChains"]
>[number];

type BridgeNetwork = {
  id: string;
  name: string;
  shortName: string;
  chainId: number;
  description: string;
  provider: "circle";
  available: boolean;
};

type FutureNetwork = {
  id: string;
  name: string;
  shortName: string;
  chainId: number;
  description: string;
  provider: "partner";
  available: boolean;
};

const bridgeKit = new BridgeKit();

const ROBINHOOD_CHAIN: FutureNetwork = {
  id: "Robinhood_Chain",
  name: "Robinhood Chain",
  shortName: "Robinhood",
  chainId: 4663,
  description: "Robinhood Chain",
  provider: "partner",
  available: false,
};

const ROBINHOOD_CHAIN_TESTNET: FutureNetwork = {
  id: "Robinhood_Chain_Testnet",
  name: "Robinhood Chain Testnet",
  shortName: "Robinhood",
  chainId: 46630,
  description: "Robinhood Chain testnet",
  provider: "partner",
  available: false,
};

export default function BridgePage() {
  const { isConnected, connector } = useAccount();
  const currentChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const [circleChains, setCircleChains] =
    useState<BridgeNetwork[]>([]);

  const [sourceChain, setSourceChain] =
    useState<BridgeNetwork | null>(null);

  const [destinationChain, setDestinationChain] =
    useState<BridgeNetwork | null>(null);

  const [amount, setAmount] = useState("");

  const [isLoadingChains, setIsLoadingChains] =
    useState(true);

  const [isBridging, setIsBridging] =
    useState(false);

  const [status, setStatus] = useState("");

  const [error, setError] = useState("");

  const [showSourceChains, setShowSourceChains] =
    useState(false);

  const [showDestinationChains, setShowDestinationChains] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    const loadChains = () => {
      try {
        const supportedChains =
          bridgeKit.getSupportedChains();

        const testnetChains =
          supportedChains.filter(
            (chain) => chain.isTestnet
          );

        const networks: BridgeNetwork[] =
          testnetChains
            .filter(
              (chain) =>
                chain.type === "evm"
            )
            .map((chain) => ({
              id: chain.chain,
              name: chain.name,
              shortName:
                chain.name
                  .replace(" Testnet", "")
                  .replace(" Sepolia", "")
                  .replace(" Fuji", "")
                  .replace(" Amoy", ""),
              chainId: chain.chainId,
              description:
                chain.chain ===
                "Arc_Testnet"
                  ? "USDC-native Arc network"
                  : "Circle CCTP network",
              provider: "circle" as const,
              available: true,
            }))
            .sort((a, b) => {
              if (
                a.id === "Arc_Testnet"
              ) {
                return -1;
              }

              if (
                b.id === "Arc_Testnet"
              ) {
                return 1;
              }

              return a.name.localeCompare(
                b.name
              );
            });

        if (!mounted) {
          return;
        }

        setCircleChains(networks);

        const arc =
          networks.find(
            (chain) =>
              chain.id ===
              "Arc_Testnet"
          ) ?? null;

        const firstDestination =
          networks.find(
            (chain) =>
              chain.id !==
              "Arc_Testnet"
          ) ?? null;

        setSourceChain(arc);
        setDestinationChain(
          firstDestination
        );
      } catch (loadError) {
        console.error(
          "Unable to load Circle bridge chains:",
          loadError
        );

        if (mounted) {
          setError(
            "Unable to load supported bridge networks."
          );
        }
      } finally {
        if (mounted) {
          setIsLoadingChains(false);
        }
      }
    };

    loadChains();

    return () => {
      mounted = false;
    };
  }, []);

  const allNetworks = useMemo(
    () => [
      ...circleChains,
      ROBINHOOD_CHAIN_TESTNET,
    ],
    [circleChains]
  );

  const sameChain =
    sourceChain !== null &&
    destinationChain !== null &&
    sourceChain.id ===
      destinationChain.id;

  const numericAmount = Number(amount);

  const canBridge =
    isConnected &&
    !isBridging &&
    !isLoadingChains &&
    sourceChain !== null &&
    destinationChain !== null &&
    !sameChain &&
    sourceChain.available &&
    destinationChain.available &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0;

  const amountDisplay = useMemo(() => {
    if (!amount) {
      return "0.00";
    }

    const value = Number(amount);

    if (!Number.isFinite(value)) {
      return "0.00";
    }

    return value.toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }
    );
  }, [amount]);

  const handleSwapChains = () => {
    if (
      !sourceChain ||
      !destinationChain
    ) {
      return;
    }

    setSourceChain(destinationChain);
    setDestinationChain(sourceChain);

    setError("");
    setStatus("");
  };

  const handleSourceSelect = (
    network: BridgeNetwork | FutureNetwork
  ) => {
    if (!network.available) {
      setError(
        `${network.name} is coming in a future bridge integration.`
      );
      return;
    }

    setSourceChain(
      network as BridgeNetwork
    );

    setShowSourceChains(false);
    setError("");
    setStatus("");
  };

  const handleDestinationSelect = (
    network: BridgeNetwork | FutureNetwork
  ) => {
    if (!network.available) {
      setError(
        `${network.name} is not available through Circle CCTP yet.`
      );
      return;
    }

    setDestinationChain(
      network as BridgeNetwork
    );

    setShowDestinationChains(false);
    setError("");
    setStatus("");
  };

  const handleBridge = async () => {
    setError("");
    setStatus("");

    if (!isConnected) {
      setError(
        "Connect your wallet first."
      );
      return;
    }

    if (!connector) {
      setError(
        "Wallet connection is not ready."
      );
      return;
    }

    if (
      !sourceChain ||
      !destinationChain
    ) {
      setError(
        "Select both networks."
      );
      return;
    }

    if (sameChain) {
      setError(
        "Choose two different networks."
      );
      return;
    }

    if (
      !sourceChain.available ||
      !destinationChain.available
    ) {
      setError(
        "This bridge route is not available yet."
      );
      return;
    }

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError(
        "Enter a valid USDC amount."
      );
      return;
    }

    try {
      setIsBridging(true);

      if (
        currentChainId !==
        sourceChain.chainId
      ) {
        setStatus(
          `Switching wallet to ${sourceChain.name}...`
        );

        await switchChainAsync({
          chainId:
            sourceChain.chainId,
        });
      }

      setStatus(
        `Preparing ${sourceChain.shortName} → ${destinationChain.shortName}...`
      );

      const provider =
        (await connector.getProvider()) as BrowserWalletProvider;

      if (!provider) {
        throw new Error(
          "Unable to access your wallet provider."
        );
      }

      const adapter =
        await createViemAdapterFromProvider({
          provider,
        });

      setStatus(
        "Confirm the bridge transaction in your wallet..."
      );

      const result =
        await bridgeKit.bridge({
          from: {
            adapter,
            chain: sourceChain.id as Parameters<
              BridgeKit["bridge"]
            >[0]["from"]["chain"],
          },
          to: {
            adapter,
            chain: destinationChain.id as Parameters<
              BridgeKit["bridge"]
            >[0]["to"]["chain"],
          },
          amount: amount.trim(),
          token: "USDC",
        });

      if (result.state === "success") {
        setStatus(
          "Bridge completed successfully."
        );
        setAmount("");
        return;
      }

      if (result.state === "error") {
        setStatus(
          "The bridge needs to continue from the failed step..."
        );

        const retryResult =
          await bridgeKit.retry(
            result,
            {
              from: adapter,
              to: adapter,
            }
          );

        if (
          retryResult.state ===
          "success"
        ) {
          setStatus(
            "Bridge completed successfully."
          );
          setAmount("");
          return;
        }

        throw new Error(
          "The bridge could not be completed. Please try again."
        );
      }

      setStatus(
        "Bridge is still processing."
      );
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
      setStatus("");
      return;
    }

    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    setAmount(value);
    setError("");
    setStatus("");
  };

  const renderNetworkOption = (
    network: BridgeNetwork | FutureNetwork,
    onSelect: (
      network:
        | BridgeNetwork
        | FutureNetwork
    ) => void
  ) => {
    const initials =
      network.shortName
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 2)
        .toUpperCase();

    return (
      <button
        key={network.id}
        type="button"
        onClick={() =>
          onSelect(network)
        }
        className="group flex min-h-[64px] w-full items-center gap-3 rounded-[16px] px-3 text-left transition hover:bg-white/[0.055] active:bg-white/[0.07]"
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
            network.available
              ? "border-white/[0.09] bg-white/[0.045] text-white/75"
              : "border-white/[0.06] bg-white/[0.025] text-white/25"
          }`}
        >
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={`truncate text-sm font-semibold ${
                network.available
                  ? "text-white"
                  : "text-white/40"
              }`}
            >
              {network.name}
            </span>

            {!network.available && (
              <span className="shrink-0 rounded-full border border-white/[0.07] bg-white/[0.02] px-2 py-0.5 text-[9px] font-semibold tracking-wide text-white/30">
                SOON
              </span>
            )}
          </div>

          <div className="mt-0.5 truncate text-[11px] text-white/30">
            {network.description}
          </div>
        </div>

        {network.provider ===
          "circle" && (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/80" />
        )}
      </button>
    );
  };

  const renderSelectedNetwork = (
    network: BridgeNetwork | null,
    loadingText: string,
    fallbackText: string
  ) => {
    if (!network) {
      return (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.035] text-xs font-bold text-white/25">
            --
          </div>

          <div className="min-w-0 text-left">
            <div className="truncate text-sm font-semibold text-white/45">
              {isLoadingChains
                ? loadingText
                : fallbackText}
            </div>

            <div className="mt-0.5 truncate text-[11px] text-white/25">
              Select a network
            </div>
          </div>
        </div>
      );
    }

    const initials =
      network.shortName
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 2)
        .toUpperCase();

    return (
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.045] text-[10px] font-bold text-white/80">
          {initials}

          {network.provider ===
            "circle" && (
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#08090a] bg-emerald-400" />
          )}
        </div>

        <div className="min-w-0 text-left">
          <div className="truncate text-sm font-semibold text-white">
            {network.name}
          </div>

          <div className="mt-0.5 truncate text-[11px] text-white/30">
            {network.description}
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#030405] text-white">
      <Header />

      <div className="mx-auto flex max-w-5xl justify-center px-4 pb-20 pt-9 sm:px-6 sm:pt-12 lg:px-8">
        <section className="w-full max-w-[540px]">
          <div className="mb-7 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
              Arc Testnet
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Bridge
            </h1>

            <p className="mx-auto mt-2 max-w-[420px] text-sm leading-6 text-white/40 sm:text-base">
              Move native USDC across supported
              testnet networks.
            </p>
          </div>

          <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.025] p-2.5 shadow-2xl shadow-black/20 sm:p-3">
            <div className="rounded-[25px] border border-white/[0.065] bg-[#08090a] p-3 sm:p-4">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/30">
                  From
                </span>

                <span className="rounded-full border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-[10px] font-semibold text-white/30">
                  USDC
                </span>
              </div>

              <div className="relative">
                <button
                  type="button"
                  disabled={
                    isLoadingChains ||
                    isBridging
                  }
                  onClick={() => {
                    setShowSourceChains(
                      !showSourceChains
                    );
                    setShowDestinationChains(
                      false
                    );
                  }}
                  className="flex min-h-[68px] w-full items-center justify-between rounded-[18px] border border-white/[0.065] bg-white/[0.025] px-3.5 transition hover:border-white/[0.1] hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
                >
                  {renderSelectedNetwork(
                    sourceChain,
                    "Loading networks...",
                    "Select network"
                  )}

                  <span
                    className={`ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.025] text-sm text-white/35 transition ${
                      showSourceChains
                        ? "rotate-180 bg-white/[0.05] text-white/60"
                        : ""
                    }`}
                  >
                    ↓
                  </span>
                </button>

                {showSourceChains && (
                  <div className="absolute left-0 right-0 top-[76px] z-30 overflow-hidden rounded-[20px] border border-white/[0.09] bg-[#0b0c0d] p-1.5 shadow-2xl shadow-black/40">
                    <div className="px-3 pb-2 pt-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/25">
                        Supported testnets
                      </span>
                    </div>

                    <div className="max-h-[350px] overflow-y-auto">
                      {circleChains.map(
                        (network) =>
                          renderNetworkOption(
                            network,
                            handleSourceSelect
                          )
                      )}

                      {renderNetworkOption(
                        ROBINHOOD_CHAIN_TESTNET,
                        handleSourceSelect
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 rounded-[18px] border border-white/[0.065] bg-white/[0.018] px-4 py-3.5">
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor="bridge-amount"
                      className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25"
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
                      className="w-full min-w-0 bg-transparent text-3xl font-black tracking-tight text-white outline-none placeholder:text-white/[0.12] sm:text-4xl"
                    />
                  </div>

                  <div className="mb-1 flex shrink-0 items-center gap-2">
                    <img
                      src="/tokens/usdc.svg"
                      alt="USDC"
                      className="h-7 w-7"
                    />

                    <span className="text-sm font-semibold text-white/80">
                      USDC
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 -my-3 flex justify-center">
              <button
                type="button"
                onClick={handleSwapChains}
                disabled={
                  isBridging ||
                  !sourceChain ||
                  !destinationChain
                }
                aria-label="Switch bridge networks"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.1] bg-[#111213] text-lg text-white/55 shadow-xl shadow-black/30 transition hover:border-white/[0.18] hover:bg-[#171819] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                ⇅
              </button>
            </div>

            <div className="rounded-[25px] border border-white/[0.065] bg-[#08090a] p-3 sm:p-4">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/30">
                  To
                </span>

                <span className="rounded-full border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-[10px] font-semibold text-white/30">
                  USDC
                </span>
              </div>

              <div className="relative">
                <button
                  type="button"
                  disabled={
                    isLoadingChains ||
                    isBridging
                  }
                  onClick={() => {
                    setShowDestinationChains(
                      !showDestinationChains
                    );
                    setShowSourceChains(
                      false
                    );
                  }}
                  className="flex min-h-[68px] w-full items-center justify-between rounded-[18px] border border-white/[0.065] bg-white/[0.025] px-3.5 transition hover:border-white/[0.1] hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
                >
                  {renderSelectedNetwork(
                    destinationChain,
                    "Loading networks...",
                    "Select network"
                  )}

                  <span
                    className={`ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.025] text-sm text-white/35 transition ${
                      showDestinationChains
                        ? "rotate-180 bg-white/[0.05] text-white/60"
                        : ""
                    }`}
                  >
                    ↓
                  </span>
                </button>

                {showDestinationChains && (
                  <div className="absolute left-0 right-0 top-[76px] z-30 overflow-hidden rounded-[20px] border border-white/[0.09] bg-[#0b0c0d] p-1.5 shadow-2xl shadow-black/40">
                    <div className="px-3 pb-2 pt-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/25">
                        Supported testnets
                      </span>
                    </div>

                    <div className="max-h-[350px] overflow-y-auto">
                      {circleChains.map(
                        (network) =>
                          renderNetworkOption(
                            network,
                            handleDestinationSelect
                          )
                      )}

                      {renderNetworkOption(
                        ROBINHOOD_CHAIN_TESTNET,
                        handleDestinationSelect
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between rounded-[16px] border border-white/[0.05] bg-white/[0.015] px-3.5 py-3">
                <span className="text-[11px] text-white/30">
                  You send
                </span>

                <span className="text-sm font-semibold text-white/65">
                  {amountDisplay} USDC
                </span>
              </div>
            </div>

            {sameChain && (
              <div className="mt-3 flex items-center gap-3 rounded-[18px] border border-amber-300/[0.08] bg-amber-300/[0.025] px-4 py-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-300/[0.08] bg-amber-300/[0.04] text-xs text-amber-200/60">
                  !
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white/65">
                    Same network selected
                  </div>

                  <div className="mt-0.5 text-[11px] text-white/30">
                    Choose two different networks
                    to bridge.
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-3 flex items-start gap-3 rounded-[18px] border border-red-400/[0.1] bg-red-400/[0.04] px-4 py-3.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-red-400/[0.1] bg-red-400/[0.04] text-xs text-red-300/80">
                  !
                </div>

                <div className="min-w-0 pt-0.5 text-sm leading-5 text-red-300/80">
                  {error}
                </div>
              </div>
            )}

            {status && !error && (
              <div
                aria-live="polite"
                className="mt-3 flex items-center gap-3 rounded-[18px] border border-white/[0.07] bg-white/[0.025] px-4 py-3.5"
              >
                <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-400/80" />

                <span className="min-w-0 text-sm leading-5 text-white/55">
                  {status}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleBridge}
              disabled={!canBridge}
              className={`${manrope.className} mt-3 flex min-h-[56px] w-full items-center justify-center rounded-[18px] bg-white px-5 text-sm font-semibold tracking-normal text-black transition hover:bg-white/90 active:bg-white/80 disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-white/25`}
            >
              {!isConnected
                ? "Connect Wallet"
                : isLoadingChains
                ? "Loading Networks..."
                : isBridging
                ? "Bridging..."
                : sameChain
                ? "Choose Different Networks"
                : !amount ||
                  numericAmount <= 0
                ? "Enter Amount"
                : "Bridge USDC"}
            </button>

            <div className="mt-3 flex items-center justify-center gap-2 py-1 text-[10px] font-medium text-white/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/65" />
              Powered by Circle CCTP
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-[18px] border border-white/[0.055] bg-white/[0.018] px-2 py-3.5 text-center">
              <div className="text-[11px] font-semibold text-white/60 sm:text-xs">
                Native USDC
              </div>

              <div className="mt-1 text-[9px] leading-4 text-white/20 sm:text-[10px]">
                Burn & mint
              </div>
            </div>

            <div className="rounded-[18px] border border-white/[0.055] bg-white/[0.018] px-2 py-3.5 text-center">
              <div className="text-[11px] font-semibold text-white/60 sm:text-xs">
                Multi-chain
              </div>

              <div className="mt-1 text-[9px] leading-4 text-white/20 sm:text-[10px]">
                Testnet routes
              </div>
            </div>

            <div className="rounded-[18px] border border-white/[0.055] bg-white/[0.018] px-2 py-3.5 text-center">
              <div className="text-[11px] font-semibold text-white/60 sm:text-xs">
                More routes
              </div>

              <div className="mt-1 text-[9px] leading-4 text-white/20 sm:text-[10px]">
                Partner bridges
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-[10px] leading-5 text-white/15">
            Testnet only. Destination networks may
            require their native testnet gas token.
          </div>
        </section>
      </div>
    </main>
  );
}
