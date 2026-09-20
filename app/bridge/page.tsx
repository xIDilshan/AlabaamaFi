"use client";

import { useEffect, useMemo, useState } from "react";
import { Manrope } from "next/font/google";
import { BridgeKit } from "@circle-fin/bridge-kit";
import {
  createViemAdapterFromProvider,
  type CreateViemAdapterFromProviderParams,
} from "@circle-fin/adapter-viem-v2";
import { NetworkIcon } from "@web3icons/react/dynamic";

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

type BridgeNetwork = {
  id: string;
  name: string;
  shortName: string;
  chainId: number;
  description: string;
  provider: "circle";
  available: boolean;
};

const bridgeKit = new BridgeKit();

function FallbackNetworkMark({
  network,
}: {
  network?: BridgeNetwork | null;
}) {
  const label =
    network?.shortName?.slice(0, 2).toUpperCase() || "?";

  return (
    <div
      className="flex h-full w-full items-center justify-center rounded-full bg-white/[0.06] text-[10px] font-bold tracking-tight text-white/45"
      aria-label={`${network?.name ?? "Network"} logo`}
    >
      {label}
    </div>
  );
}

function NetworkLogo({
  network,
  size = "normal",
}: {
  network: BridgeNetwork | null;
  size?: "small" | "normal";
}) {
  const dimensions =
    size === "small" ? "h-8 w-8" : "h-10 w-10";

  if (!network) {
    return (
      <div
        className={`${dimensions} flex shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.035]`}
      >
        <span className="text-sm text-white/25">
          ?
        </span>
      </div>
    );
  }

  const networkMap: Record<number, string> = {
    // Current networks
    5042002: "arc",
    11155111: "ethereum",
    43113: "avalanche",
    11155420: "optimism",
    421614: "arbitrum-one",
    84532: "base",
    80002: "polygon",
    59141: "linea",
    1301: "unichain",

    // Additional networks
    4801: "world",
    1328: "sei",
    51: "xdc-network",
    763373: "ink",

    // Testnet networks
    812242: "codex",
    998: "hyper-evm",
    98867: "plume",
    14601: "sonic",

    // Other networks
    338: "cronos",
    1439: "injective",
    10143: "monad",
    9746: "plasma",
    1952: "x-layer",
  };

  const iconNetwork =
    networkMap[network.chainId];

  return (
    <div
      className={`${dimensions} flex shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.045] p-1.5`}
    >
      {iconNetwork ? (
        <NetworkIcon
          name={iconNetwork}
          size={28}
          variant="branded"
          aria-label={`${network.name} logo`}
          fallback={
            <FallbackNetworkMark
              network={network}
            />
          }
        />
      ) : (
        <FallbackNetworkMark
          network={network}
        />
      )}
    </div>
  );
}

function ChevronDown() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 text-white/35"
      aria-hidden="true"
    >
      <path
        d="m5 7.5 5 5 5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="m5.5 10.5 3 3 6-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M10 3.5 17 16H3L10 3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      <path
        d="M10 7.5v4M10 13.8v.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LoaderIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 animate-spin"
      aria-hidden="true"
    >
      <circle
        cx="10"
        cy="10"
        r="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="22 22"
        strokeLinecap="round"
      />
    </svg>
  );
}

function formatBalance(
  value: string | null
) {
  if (value === null) {
    return "—";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return number.toLocaleString(
    undefined,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }
  );
}

export default function BridgePage() {
  const { isConnected, connector, address } =
    useAccount();

  const currentChainId = useChainId();

  const { switchChainAsync } =
    useSwitchChain();

  const [circleChains, setCircleChains] =
    useState<BridgeNetwork[]>([]);

  const [sourceChain, setSourceChain] =
    useState<BridgeNetwork | null>(null);

  const [destinationChain, setDestinationChain] =
    useState<BridgeNetwork | null>(null);

  const [amount, setAmount] =
    useState("");

  const [isLoadingChains, setIsLoadingChains] =
    useState(true);

  const [isBridging, setIsBridging] =
    useState(false);

  const [status, setStatus] =
    useState("");

  const [error, setError] =
    useState("");

  const [sourceBalance, setSourceBalance] =
    useState<string | null>(null);

  const [destinationBalance, setDestinationBalance] =
    useState<string | null>(null);

  const [showSourceChains, setShowSourceChains] =
    useState(false);

  const [showDestinationChains, setShowDestinationChains] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    const loadChains = async () => {
      try {
        const supportedChains =
          await bridgeKit.getSupportedChains();

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
            .filter(
              (chain) =>
                ![
                  "Edge Testnet",
                  "Pharos Atlantic",
                  "Morph Hoodi",
                ].includes(chain.name)
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
              description: "",
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
              chain.id === "Arc_Testnet"
          ) ?? null;

        const firstDestination =
          networks.find(
            (chain) =>
              chain.id !== "Arc_Testnet"
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

  useEffect(() => {
    if (!isConnected || !address) {
      setSourceBalance(null);
      setDestinationBalance(null);
      return;
    }

    setSourceBalance(null);
    setDestinationBalance(null);
  }, [
    address,
    isConnected,
    sourceChain?.chainId,
    destinationChain?.chainId,
  ]);

  const sameChain =
    sourceChain !== null &&
    destinationChain !== null &&
    sourceChain.id ===
      destinationChain.id;

  const numericAmount =
    Number(amount);

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

  const amountDisplay =
    useMemo(() => {
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

  const estimatedReceive =
    numericAmount > 0 &&
    Number.isFinite(numericAmount)
      ? amountDisplay
      : "0.00";

  const handleSwapChains = () => {
    if (
      !sourceChain ||
      !destinationChain
    ) {
      return;
    }

    setSourceChain(
      destinationChain
    );

    setDestinationChain(
      sourceChain
    );

    setError("");
    setStatus("");
  };

  const handleSourceSelect = (
    network: BridgeNetwork
  ) => {
    setSourceChain(network);
    setShowSourceChains(false);
    setError("");
    setStatus("");
  };

  const handleDestinationSelect = (
    network: BridgeNetwork
  ) => {
    setDestinationChain(network);
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
      !Number.isFinite(
        numericAmount
      ) ||
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
          `Switching to ${sourceChain.shortName}...`
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
            chain:
              sourceChain.id as Parameters<
                BridgeKit["bridge"]
              >[0]["from"]["chain"],
          },
          to: {
            adapter,
            chain:
              destinationChain.id as Parameters<
                BridgeKit["bridge"]
              >[0]["to"]["chain"],
          },
          amount:
            amount.trim(),
          token: "USDC",
        });

      if (
        result.state === "success"
      ) {
        setStatus(
          "Bridge completed successfully."
        );

        setAmount("");
        return;
      }

      if (
        result.state === "error"
      ) {
        setStatus(
          "Continuing the bridge..."
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

    if (
      !/^\d*\.?\d*$/.test(value)
    ) {
      return;
    }

    setAmount(value);
    setError("");
    setStatus("");
  };

  const renderNetworkOption = (
    network: BridgeNetwork,
    onSelect: (
      network: BridgeNetwork
    ) => void
  ) => {
    return (
      <button
        key={network.id}
        type="button"
        onClick={() =>
          onSelect(network)
        }
        className="group flex min-h-[64px] w-full items-center gap-3 rounded-2xl px-3 text-left transition hover:bg-white/[0.055] active:bg-white/[0.07]"
      >
        <NetworkLogo
          network={network}
          size="small"
        />

        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-white">
            {network.name}
          </div>

          <div className="mt-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

            <span className="text-[11px] text-white/35">
              Available
            </span>
          </div>
        </div>
      </button>
    );
  };

  return (
    <main className="min-h-screen bg-[#030405] text-white">
      <Header />

      <div className="mx-auto flex max-w-5xl justify-center px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8">
        <section className="w-full max-w-[520px]">
          <div className="mb-7 text-center sm:mb-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Bridge
            </h1>

            <p className="mt-2 text-sm text-white/40 sm:text-base">
              Move USDC across supported networks.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/[0.07] bg-[#08090a] p-3 shadow-2xl shadow-black/20 sm:p-4">
            <div className="rounded-[22px] bg-white/[0.025] p-3.5 sm:p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-white/40">
                  From
                </span>

                <span className="text-[11px] text-white/30">
                  Balance:{" "}
                  {formatBalance(
                    sourceBalance
                  )}{" "}
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
                  className="flex min-h-[68px] w-full items-center justify-between rounded-[18px] border border-white/[0.07] bg-white/[0.035] px-3.5 transition hover:border-white/[0.12] hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <NetworkLogo
                      network={sourceChain}
                    />

                    <div className="min-w-0 text-left">
                      <span className="block truncate text-sm font-semibold text-white">
                        {isLoadingChains
                          ? "Loading networks..."
                          : sourceChain?.name ??
                            "Select network"}
                      </span>
                    </div>
                  </div>

                  <ChevronDown />
                </button>

                {showSourceChains && (
                  <div className="absolute left-0 right-0 top-[74px] z-30 max-h-[390px] overflow-y-auto rounded-[20px] border border-white/[0.09] bg-[#0b0c0d] p-1.5 shadow-2xl shadow-black/50">
                    <div className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25">
                      Source network
                    </div>

                    {circleChains.map(
                      (network) =>
                        renderNetworkOption(
                          network,
                          handleSourceSelect
                        )
                    )}
                  </div>
                )}
              </div>

              <div className="mt-3 rounded-[18px] border border-white/[0.06] bg-black/20 px-4 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
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
                      className="w-full min-w-0 bg-transparent text-[32px] font-black tracking-tight text-white outline-none placeholder:text-white/[0.12] sm:text-[38px]"
                    />
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <img
                      src="/tokens/usdc.svg"
                      alt="USDC"
                      className="h-7 w-7"
                    />

                    <span className="text-sm font-semibold">
                      USDC
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex h-11 items-center justify-center">
              <button
                type="button"
                onClick={handleSwapChains}
                disabled={
                  isBridging ||
                  !sourceChain ||
                  !destinationChain
                }
                aria-label="Switch bridge networks"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] bg-[#111213] text-white/55 shadow-xl shadow-black/30 transition hover:border-white/[0.18] hover:bg-[#171819] hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg
                  viewBox="0 0 20 20"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    d="M6 4v10M3.5 11.5 6 14l2.5-2.5M14 16V6M11.5 8.5 14 6l2.5 2.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div className="rounded-[22px] bg-white/[0.025] p-3.5 sm:p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-white/40">
                  To
                </span>

                <span className="text-[11px] text-white/30">
                  Balance:{" "}
                  {formatBalance(
                    destinationBalance
                  )}{" "}
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
                  className="flex min-h-[68px] w-full items-center justify-between rounded-[18px] border border-white/[0.07] bg-white/[0.035] px-3.5 transition hover:border-white/[0.12] hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <NetworkLogo
                      network={
                        destinationChain
                      }
                    />

                    <div className="min-w-0 text-left">
                      <span className="block truncate text-sm font-semibold text-white">
                        {isLoadingChains
                          ? "Loading networks..."
                          : destinationChain?.name ??
                            "Select network"}
                      </span>
                    </div>
                  </div>

                  <ChevronDown />
                </button>

                {showDestinationChains && (
                  <div className="absolute left-0 right-0 top-[74px] z-30 max-h-[390px] overflow-y-auto rounded-[20px] border border-white/[0.09] bg-[#0b0c0d] p-1.5 shadow-2xl shadow-black/50">
                    <div className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25">
                      Destination network
                    </div>

                    {circleChains.map(
                      (network) =>
                        renderNetworkOption(
                          network,
                          handleDestinationSelect
                        )
                    )}
                  </div>
                )}
              </div>

              {amount &&
                numericAmount > 0 && (
                  <div className="mt-3 rounded-[18px] border border-white/[0.06] bg-black/20 px-4 py-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/35">
                        You receive
                      </span>

                      <span className="text-sm font-semibold text-white">
                        {estimatedReceive}{" "}
                        USDC
                      </span>
                    </div>
                  </div>
                )}
            </div>

            {amount &&
              numericAmount > 0 &&
              sourceChain &&
              destinationChain &&
              !sameChain && (
                <div className="mt-3 border-t border-white/[0.06] pt-3">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-1 sm:grid-cols-4">
                    <div>
                      <div className="text-[10px] text-white/25">
                        Network fee
                      </div>
                      <div className="mt-1 text-xs font-medium text-white/65">
                        Calculated at confirmation
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-white/25">
                        Estimated time
                      </div>
                      <div className="mt-1 text-xs font-medium text-white/65">
                        Route dependent
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-white/25">
                        Price impact
                      </div>
                      <div className="mt-1 text-xs font-medium text-white/65">
                        0.00%
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-white/25">
                        Slippage
                      </div>
                      <div className="mt-1 text-xs font-medium text-white/65">
                        0.00%
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {sameChain && (
              <div className="mt-3 flex items-center gap-2.5 rounded-2xl border border-amber-400/10 bg-amber-400/[0.035] px-3.5 py-3 text-xs text-amber-200/60">
                <AlertIcon />

                <span>
                  Select two different networks.
                </span>
              </div>
            )}

            {error && (
              <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-red-400/10 bg-red-400/[0.045] px-3.5 py-3 text-xs leading-5 text-red-300/85">
                <span className="mt-0.5 shrink-0">
                  <AlertIcon />
                </span>

                <span className="break-words">
                  {error}
                </span>
              </div>
            )}

            {status && !error && (
              <div
                aria-live="polite"
                className="mt-3 flex items-center gap-2.5 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3 text-xs text-white/55"
              >
                {status ===
                "Bridge completed successfully." ? (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
                    <CheckIcon />
                  </span>
                ) : isBridging ? (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center text-white/45">
                    <LoaderIcon />
                  </span>
                ) : (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/35" />
                )}

                <span className="min-w-0 break-words">
                  {status}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleBridge}
              disabled={!canBridge}
              className={`${manrope.className} mt-3.5 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[17px] bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-white/25 sm:mt-4`}
            >
              {isBridging && (
                <LoaderIcon />
              )}

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
          </div>
        </section>
      </div>
    </main>
  );
}
