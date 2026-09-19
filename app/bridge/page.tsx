"use client";

import { useEffect, useMemo, useState } from "react";
import { Manrope } from "next/font/google";
import { BridgeKit } from "@circle-fin/bridge-kit";
import {
  createViemAdapterFromProvider,
  type CreateViemAdapterFromProviderParams,
} from "@circle-fin/adapter-viem-v2";
import {
  NetworkArbitrumOne,
  NetworkAvalanche,
  NetworkBase,
  NetworkEthereum,
  NetworkOptimism,
  NetworkPolygon,
  NetworkLinea,
} from "@web3icons/react";
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

const ROBINHOOD_CHAIN_TESTNET: FutureNetwork = {
  id: "Robinhood_Chain_Testnet",
  name: "Robinhood Chain Testnet",
  shortName: "Robinhood",
  chainId: 46630,
  description: "Partner bridge integration",
  provider: "partner",
  available: false,
};

function FallbackNetworkMark({
  network,
}: {
  network?: BridgeNetwork | FutureNetwork | null;
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
  network: BridgeNetwork | FutureNetwork | null;
  size?: "small" | "normal";
}) {
  const dimensions =
    size === "small"
      ? "h-8 w-8"
      : "h-10 w-10";

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

  const id = network.id.toLowerCase();
  const name = network.name.toLowerCase();
  const chainId = network.chainId;

  /*
   * Map testnet chain IDs to their parent network icon.
   * Web3 Icons provides the branded logo for each parent network.
   */
  const networkIcon =
    (() => {
      switch (chainId) {
        case 5042002:
          return "arc";

        case 11155111:
          return "ethereum";

        case 43113:
          return "avalanche";

        case 11155420:
          return "optimism";

        case 421614:
          return "arbitrum";

        case 84532:
          return "base";

        case 80002:
          return "polygon";

        case 59141:
          return "linea";

        case 1301:
          return "unichain";

        case 5115:
          return "codex";

        case 57054:
          return "sonic";

        case 4801:
          return "world-chain";

        case 1328:
          return "sei";

        case 51:
          return "xdc-network";

        case 999:
          return "hyper-evm";

        case 763373:
          return "ink";

        case 161221135:
          return "plume";

        default:
          /*
           * Try BridgeKit's own network identifiers/names
           * for any future supported networks.
           */
          return id || name;
      }
    })();

  return (
    <div
      className={`${dimensions} flex shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.045] p-1.5`}
    >
      <NetworkIcon
        network={networkIcon}
        size={28}
        variant="branded"
        fallback={<FallbackNetworkMark network={network} />}
        aria-label={network.name}
      />
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

function ArrowDown() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M10 4v11M6 11l4 4 4-4"
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
                chain.chain === "Arc_Testnet"
                  ? "USDC-native Arc network"
                  : "Circle CCTP network",
              provider: "circle" as const,
              available: true,
            }))
            .sort((a, b) => {
              if (a.id === "Arc_Testnet") {
                return -1;
              }

              if (b.id === "Arc_Testnet") {
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

  const sameChain =
    sourceChain !== null &&
    destinationChain !== null &&
    sourceChain.id === destinationChain.id;

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
    network:
      | BridgeNetwork
      | FutureNetwork
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
    network:
      | BridgeNetwork
      | FutureNetwork
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
    network:
      | BridgeNetwork
      | FutureNetwork,
    onSelect: (
      network:
        | BridgeNetwork
        | FutureNetwork
    ) => void
  ) => {
    return (
      <button
        key={network.id}
        type="button"
        onClick={() =>
          onSelect(network)
        }
        className="group flex min-h-[68px] w-full items-center gap-3 rounded-xl px-3 text-left transition hover:bg-white/[0.055] active:bg-white/[0.07]"
      >
        <NetworkLogo
          network={network}
          size="small"
        />

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[13px] font-semibold text-white">
              {network.name}
            </span>

            {!network.available && (
              <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.025] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/30">
                Soon
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                network.available
                  ? "bg-emerald-400"
                  : "bg-white/20"
              }`}
            />

            <span className="truncate text-[11px] text-white/35">
              {network.available
                ? "Circle CCTP · Testnet"
                : network.description}
            </span>
          </div>
        </div>

        {network.available && (
          <span className="shrink-0 text-[10px] font-medium text-white/20 transition group-hover:text-white/40">
            Select
          </span>
        )}
      </button>
    );
  };

  return (
    <main className="min-h-screen bg-[#030405] text-white">
      <Header />

      <div className="mx-auto flex max-w-5xl justify-center px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8">
        <section className="w-full max-w-[540px]">
          <div className="mb-6 text-center sm:mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                Circle CCTP · Testnet
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Bridge
            </h1>

            <p className="mx-auto mt-2 max-w-[400px] text-sm leading-6 text-white/40 sm:text-base">
              Move native USDC across supported
              testnet networks.
            </p>
          </div>

          <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.025] p-2.5 shadow-2xl shadow-black/20 sm:p-3">
            <div className="rounded-[25px] border border-white/[0.07] bg-[#08090a] p-3.5 sm:p-4">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30">
                  From
                </span>

                <span className="flex items-center gap-1.5 text-[11px] text-white/30">
                  <img
                    src="/tokens/usdc.svg"
                    alt=""
                    className="h-4 w-4"
                  />
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
                  className="flex min-h-[72px] w-full items-center justify-between rounded-[20px] border border-white/[0.07] bg-white/[0.035] px-3.5 transition hover:border-white/[0.11] hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <NetworkLogo
                      network={sourceChain}
                    />

                    <div className="min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-white sm:text-[15px]">
                          {isLoadingChains
                            ? "Loading networks..."
                            : sourceChain?.name ??
                              "Select network"}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                        <span className="truncate text-[11px] text-white/35">
                          {sourceChain
                            ? "Circle CCTP · Testnet"
                            : "Choose source network"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <ChevronDown />
                </button>

                {showSourceChains && (
                  <div className="absolute left-0 right-0 top-[78px] z-30 max-h-[390px] overflow-y-auto rounded-[20px] border border-white/[0.09] bg-[#0b0c0d] p-1.5 shadow-2xl shadow-black/50">
                    <div className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25">
                      Select source network
                    </div>

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
                )}
              </div>

              <div className="mt-4 rounded-[20px] border border-white/[0.06] bg-black/10 px-4 py-3.5 sm:py-4">
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor="bridge-amount"
                      className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25"
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
                      className="w-full min-w-0 bg-transparent text-[34px] font-black tracking-tight text-white outline-none placeholder:text-white/[0.12] sm:text-[40px]"
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
            </div>

            <div className="relative z-10 flex h-12 items-center justify-center">
              <button
                type="button"
                onClick={handleSwapChains}
                disabled={
                  isBridging ||
                  !sourceChain ||
                  !destinationChain
                }
                aria-label="Switch bridge networks"
                className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.1] bg-[#111213] text-white/55 shadow-xl shadow-black/30 transition hover:border-white/[0.18] hover:bg-[#171819] hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg
                  viewBox="0 0 20 20"
                  className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180"
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

            <div className="rounded-[25px] border border-white/[0.07] bg-[#08090a] p-3.5 sm:p-4">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30">
                  To
                </span>

                <span className="flex items-center gap-1.5 text-[11px] text-white/30">
                  <img
                    src="/tokens/usdc.svg"
                    alt=""
                    className="h-4 w-4"
                  />
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
                  className="flex min-h-[72px] w-full items-center justify-between rounded-[20px] border border-white/[0.07] bg-white/[0.035] px-3.5 transition hover:border-white/[0.11] hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <NetworkLogo
                      network={destinationChain}
                    />

                    <div className="min-w-0 text-left">
                      <div className="truncate text-sm font-semibold text-white sm:text-[15px]">
                        {isLoadingChains
                          ? "Loading networks..."
                          : destinationChain?.name ??
                            "Select network"}
                      </div>

                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                        <span className="truncate text-[11px] text-white/35">
                          {destinationChain
                            ? "Circle CCTP · Testnet"
                            : "Choose destination network"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <ChevronDown />
                </button>

                {showDestinationChains && (
                  <div className="absolute left-0 right-0 top-[78px] z-30 max-h-[390px] overflow-y-auto rounded-[20px] border border-white/[0.09] bg-[#0b0c0d] p-1.5 shadow-2xl shadow-black/50">
                    <div className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25">
                      Select destination network
                    </div>

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
                )}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/[0.05] bg-white/[0.02] px-3.5 py-3">
                <span className="text-[11px] text-white/30">
                  You send
                </span>

                <span className="text-sm font-semibold text-white/65">
                  {amountDisplay} USDC
                </span>
              </div>
            </div>

            {sameChain && (
              <div className="mt-3 flex items-center gap-2.5 rounded-2xl border border-amber-400/10 bg-amber-400/[0.035] px-3.5 py-3 text-xs text-amber-200/60">
                <AlertIcon />

                <span>
                  Select two different networks
                  to bridge.
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
              className={`${manrope.className} mt-3.5 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[18px] bg-white px-5 text-sm font-semibold tracking-normal text-black transition hover:bg-white/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-white/25 sm:mt-4`}
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

            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-2 text-[10px] text-white/25">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
                Circle CCTP
              </span>

              <span className="h-3 w-px bg-white/[0.08]" />

              <span>Native USDC</span>

              <span className="h-3 w-px bg-white/[0.08]" />

              <span>Testnet</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:mt-5 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-3.5 text-center">
              <div className="mb-1.5 flex items-center justify-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.05] text-white/45">
                  <CheckIcon />
                </span>

                <div className="text-xs font-semibold text-white/70">
                  Native USDC
                </div>
              </div>

              <div className="text-[10px] leading-4 text-white/25">
                CCTP burn & mint
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-3.5 text-center">
              <div className="mb-1.5 flex items-center justify-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.05] text-white/45">
                  <ArrowDown />
                </span>

                <div className="text-xs font-semibold text-white/70">
                  Multi-chain
                </div>
              </div>

              <div className="text-[10px] leading-4 text-white/25">
                Dynamic network list
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-3.5 text-center">
              <div className="mb-1.5 flex items-center justify-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.05] text-white/45">
                  <svg
                    viewBox="0 0 20 20"
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 10h12M11 5l5 5-5 5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>

                <div className="text-xs font-semibold text-white/70">
                  More routes
                </div>
              </div>

              <div className="text-[10px] leading-4 text-white/25">
                Partner bridges next
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
