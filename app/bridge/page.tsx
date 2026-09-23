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
  createPublicClient,
  formatUnits,
  http,
} from "viem";

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
  rpcUrl: string;
  usdcAddress: string | null;
};

const bridgeKit = new BridgeKit();

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
] as const;

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
    size === "small" ? "h-8 w-8" : "h-11 w-11";

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
    5042002: "arc",
    11155111: "ethereum",
    43113: "avalanche",
    11155420: "optimism",
    421614: "arbitrum-one",
    84532: "base",
    80002: "polygon",
    59141: "linea",
    1301: "unichain",
    4801: "world",
    1328: "sei",
    51: "xdc-network",
    763373: "ink",
    812242: "codex",
    998: "hyper-evm",
    98867: "plume",
    14601: "sonic",
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
          size={30}
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

function WalletIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-3.5 w-3.5"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3.5 6.5V5.2A1.7 1.7 0 0 1 5.2 3.5h9.1a2.2 2.2 0 0 1 2.2 2.2v8.9a1.9 1.9 0 0 1-1.9 1.9H5.2a1.7 1.7 0 0 1-1.7-1.7V6.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 6.5h10.9a2.1 2.1 0 0 1 2.1 2.1v.8h-3.2a1.9 1.9 0 0 1 0-3.8h3.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M13.1 7.5h.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SwapArrowIcon() {
  return (
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

function formatTime(
  value: unknown
): string | null {
  if (
    typeof value !== "number" &&
    typeof value !== "string"
  ) {
    return null;
  }

  const seconds = Number(value);

  if (
    !Number.isFinite(seconds) ||
    seconds <= 0
  ) {
    return null;
  }

  if (seconds < 60) {
    return `~${Math.ceil(seconds)} sec`;
  }

  const minutes = seconds / 60;

  if (minutes < 60) {
    return `~${Math.ceil(minutes)} min`;
  }

  const hours = minutes / 60;

  return `~${hours.toFixed(1)} hr`;
}

function formatFeeValue(
  value: unknown
): string | null {
  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    const text = String(value);

    if (!text) {
      return null;
    }

    return text;
  }

  if (
    value &&
    typeof value === "object"
  ) {
    const record =
      value as Record<
        string,
        unknown
      >;

    const amount =
      record.amount ??
      record.value ??
      record.gasAmount ??
      record.feeAmount;

    const token =
      record.token ??
      record.currency ??
      record.symbol;

    if (
      amount !== undefined &&
      token !== undefined
    ) {
      return `${String(amount)} ${String(token)}`;
    }

    if (
      amount !== undefined
    ) {
      return String(amount);
    }
  }

  return null;
}

function findNestedValue(
  value: unknown,
  keys: string[],
  depth = 0
): unknown {
  if (
    value === null ||
    value === undefined ||
    depth > 5
  ) {
    return undefined;
  }

  if (
    typeof value !== "object"
  ) {
    return undefined;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found =
        findNestedValue(
          item,
          keys,
          depth + 1
        );

      if (
        found !== undefined
      ) {
        return found;
      }
    }

    return undefined;
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  for (const key of keys) {
    if (
      record[key] !== undefined &&
      record[key] !== null
    ) {
      return record[key];
    }
  }

  for (const child of Object.values(
    record
  )) {
    const found =
      findNestedValue(
        child,
        keys,
        depth + 1
      );

    if (
      found !== undefined
    ) {
      return found;
    }
  }

  return undefined;
}

async function getUsdcBalance(
  network: BridgeNetwork,
  address: `0x${string}`
) {
  if (
    !network.rpcUrl ||
    !network.usdcAddress
  ) {
    return null;
  }

  try {
    const chain = {
      id: network.chainId,
      name: network.name,
      nativeCurrency: {
        name: "Native",
        symbol: "NATIVE",
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: [network.rpcUrl],
        },
      },
    };

    const client =
      createPublicClient({
        chain,
        transport: http(
          network.rpcUrl
        ),
      });

    const balance =
      await client.readContract({
        address:
          network.usdcAddress as `0x${string}`,
        abi: USDC_ABI,
        functionName:
          "balanceOf",
        args: [address],
      });

    return formatUnits(
      balance,
      6
    );
  } catch (balanceError) {
    console.error(
      `Unable to load USDC balance on ${network.name}:`,
      balanceError
    );

    return null;
  }
}

export default function BridgePage() {
  const {
    isConnected,
    connector,
    address,
  } = useAccount();

  const currentChainId =
    useChainId();

  const {
    switchChainAsync,
  } = useSwitchChain();

  const [
    circleChains,
    setCircleChains,
  ] = useState<
    BridgeNetwork[]
  >([]);

  const [
    sourceChain,
    setSourceChain,
  ] = useState<
    BridgeNetwork | null
  >(null);

  const [
    destinationChain,
    setDestinationChain,
  ] = useState<
    BridgeNetwork | null
  >(null);

  const [
    amount,
    setAmount,
  ] = useState("");

  const [
    isLoadingChains,
    setIsLoadingChains,
  ] = useState(true);

  const [
    isBridging,
    setIsBridging,
  ] = useState(false);

  const [
    status,
    setStatus,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    sourceBalance,
    setSourceBalance,
  ] = useState<
    string | null
  >(null);

  const [
    destinationBalance,
    setDestinationBalance,
  ] = useState<
    string | null
  >(null);

  const [
    isLoadingBalances,
    setIsLoadingBalances,
  ] = useState(false);

  const [
    bridgeFee,
    setBridgeFee,
  ] = useState<
    string | null
  >(null);

  const [
    estimatedTime,
    setEstimatedTime,
  ] = useState<
    string | null
  >(null);

  const [
    isEstimating,
    setIsEstimating,
  ] = useState(false);

  const [
    showSourceChains,
    setShowSourceChains,
  ] = useState(false);

  const [
    showDestinationChains,
    setShowDestinationChains,
  ] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadChains =
      async () => {
        try {
          const supportedChains =
            await bridgeKit.getSupportedChains();

          const testnetChains =
            supportedChains.filter(
              (chain) =>
                chain.isTestnet
            );

          const networks: BridgeNetwork[] =
            testnetChains
              .filter(
                (chain) =>
                  chain.type ===
                  "evm"
              )
              .filter(
                (chain) =>
                  ![
                    "Edge Testnet",
                    "Pharos Atlantic",
                    "Morph Hoodi",
                  ].includes(
                    chain.name
                  )
              )
              .map((chain) => ({
                id: chain.chain,
                name: chain.name,
                shortName:
                  chain.name
                    .replace(
                      " Testnet",
                      ""
                    )
                    .replace(
                      " Sepolia",
                      ""
                    )
                    .replace(
                      " Fuji",
                      ""
                    )
                    .replace(
                      " Amoy",
                      ""
                    ),
                chainId:
                  chain.chainId,
                description:
                  "",
                provider:
                  "circle" as const,
                available:
                  true,
                rpcUrl:
                  chain.rpcEndpoints?.[0] ??
                  "",
                usdcAddress:
                  chain.usdcAddress ??
                  null,
              }))
              .sort(
                (a, b) => {
                  if (
                    a.id ===
                    "Arc_Testnet"
                  ) {
                    return -1;
                  }

                  if (
                    b.id ===
                    "Arc_Testnet"
                  ) {
                    return 1;
                  }

                  return a.name.localeCompare(
                    b.name
                  );
                }
              );

          if (!mounted) {
            return;
          }

          setCircleChains(
            networks
          );

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
            setIsLoadingChains(
              false
            );
          }
        }
      };

    loadChains();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * Load the wallet's real USDC balance
   * on both selected networks.
   */
  useEffect(() => {
    let mounted = true;

    const loadBalances =
      async () => {
        if (
          !isConnected ||
          !address ||
          !sourceChain ||
          !destinationChain
        ) {
          setSourceBalance(
            null
          );
          setDestinationBalance(
            null
          );
          return;
        }

        setIsLoadingBalances(
          true
        );

        try {
          const [
            source,
            destination,
          ] =
            await Promise.all([
              getUsdcBalance(
                sourceChain,
                address
              ),
              getUsdcBalance(
                destinationChain,
                address
              ),
            ]);

          if (!mounted) {
            return;
          }

          setSourceBalance(
            source
          );

          setDestinationBalance(
            destination
          );
        } finally {
          if (mounted) {
            setIsLoadingBalances(
              false
            );
          }
        }
      };

    loadBalances();

    return () => {
      mounted = false;
    };
  }, [
    address,
    isConnected,
    sourceChain?.chainId,
    destinationChain?.chainId,
  ]);

  /*
   * Get a real Circle bridge estimate.
   *
   * Bridge Kit exposes estimateBridge() for
   * pre-flight bridge cost estimation.
   */
  useEffect(() => {
    let cancelled = false;

    const estimate =
      async () => {
        setBridgeFee(null);
        setEstimatedTime(
          null
        );

        if (
          !isConnected ||
          !connector ||
          !sourceChain ||
          !destinationChain ||
          const sameChainPlaceholder = (
  source: BridgeNetwork | null,
  destination: BridgeNetwork | null
) =>
  !!source &&
  !!destination &&
  source.chainId === destination.chainId; ||
          !amount ||
          Number(amount) <= 0 ||
          !Number.isFinite(
            Number(amount)
          )
        ) {
          return;
        }

        if (
          currentChainId !==
          sourceChain.chainId
        ) {
          return;
        }

        try {
          setIsEstimating(
            true
          );

          const provider =
            (await connector.getProvider()) as BrowserWalletProvider;

          if (!provider) {
            return;
          }

          const adapter =
            await createViemAdapterFromProvider(
              {
                provider,
              }
            );

          const estimateResult =
            await bridgeKit.estimate({
              from: {
                adapter,
                chain:
                  sourceChain.id as Parameters<
                    BridgeKit["estimate"]
                  >[0]["from"]["chain"],
              },
              to: {
                adapter,
                chain:
                  destinationChain.id as Parameters<
                    BridgeKit["estimate"]
                  >[0]["to"]["chain"],
              },
              amount:
                amount.trim(),
              token: "USDC",
            });

          if (cancelled) {
            return;
          }

          const estimate =
            estimateResult as unknown;

          /*
           * Circle's estimate response can evolve
           * between SDK versions, so read the known
           * fee/time fields safely.
           */
          const fees =
            findNestedValue(
              estimate,
              [
                "gasFee",
                "networkFee",
                "totalFee",
                "fee",
                "fees",
              ]
            );

          const time =
            findNestedValue(
              estimate,
              [
                "estimatedTime",
                "estimatedTimeSeconds",
                "timeEstimate",
                "duration",
              ]
            );

          const formattedFee =
            formatFeeValue(
              fees
            );

          const formattedTime =
            formatTime(time);

          setBridgeFee(
            formattedFee
          );

          setEstimatedTime(
            formattedTime
          );
        } catch (estimateError) {
          if (
            !cancelled
          ) {
            console.error(
              "Bridge estimate error:",
              estimateError
            );

            setBridgeFee(
              null
            );

            setEstimatedTime(
              null
            );
          }
        } finally {
          if (!cancelled) {
            setIsEstimating(
              false
            );
          }
        }
      };

    const timer =
      window.setTimeout(
        estimate,
        500
      );

    return () => {
      cancelled = true;
      window.clearTimeout(
        timer
      );
    };
  }, [
    amount,
    connector,
    currentChainId,
    destinationChain,
    isConnected,
    sourceChain,
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
    Number.isFinite(
      numericAmount
    ) &&
    numericAmount > 0;

  const amountDisplay =
    useMemo(() => {
      if (!amount) {
        return "0.00";
      }

      const value =
        Number(amount);

      if (
        !Number.isFinite(
          value
        )
      ) {
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
    Number.isFinite(
      numericAmount
    )
      ? amountDisplay
      : "0.00";

  const handleSwapChains =
    () => {
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

      setBridgeFee(null);
      setEstimatedTime(
        null
      );
      setError("");
      setStatus("");
    };

  const handleSourceSelect =
    (
      network: BridgeNetwork
    ) => {
      setSourceChain(
        network
      );

      setShowSourceChains(
        false
      );

      setBridgeFee(null);
      setEstimatedTime(
        null
      );
      setError("");
      setStatus("");
    };

  const handleDestinationSelect =
    (
      network: BridgeNetwork
    ) => {
      setDestinationChain(
        network
      );

      setShowDestinationChains(
        false
      );

      setBridgeFee(null);
      setEstimatedTime(
        null
      );
      setError("");
      setStatus("");
    };

  const handleBridge =
    async () => {
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
        setIsBridging(
          true
        );

        if (
          currentChainId !==
          sourceChain.chainId
        ) {
          setStatus(
            `Switching to ${sourceChain.shortName}...`
          );

          await switchChainAsync(
            {
              chainId:
                sourceChain.chainId,
            }
          );
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
          await createViemAdapterFromProvider(
            {
              provider,
            }
          );

        setStatus(
          "Confirm the bridge transaction in your wallet..."
        );

        const result =
          await bridgeKit.bridge(
            {
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
            }
          );

        if (
          result.state ===
          "success"
        ) {
          setStatus(
            "Bridge completed successfully."
          );

          setAmount("");

          return;
        }

        if (
          result.state ===
          "error"
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
      } catch (
        bridgeError
      ) {
        console.error(
          "Bridge error:",
          bridgeError
        );

        const message =
          bridgeError instanceof
          Error
            ? bridgeError.message
            : "Unable to complete the bridge.";

        setError(
          message
        );

        setStatus("");
      } finally {
        setIsBridging(
          false
        );
      }
    };

  const handleAmountChange =
    (
      value: string
    ) => {
      if (value === "") {
        setAmount("");
        setBridgeFee(
          null
        );
        setEstimatedTime(
          null
        );
        setError("");
        setStatus("");
        return;
      }

      if (
        !/^\d*\.?\d*$/.test(
          value
        )
      ) {
        return;
      }

      setAmount(value);
      setBridgeFee(
        null
      );
      setEstimatedTime(
        null
      );
      setError("");
      setStatus("");
    };

  const renderNetworkOption =
    (
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
            onSelect(
              network
            )
          }
          className="group flex min-h-[64px] w-full items-center gap-3 rounded-2xl px-3 text-left transition hover:bg-white/[0.055] active:bg-white/[0.07]"
        >
          <NetworkLogo
            network={
              network
            }
            size="small"
          />

          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-white">
              {
                network.name
              }
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

      <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8 lg:pt-14">
        <section className="mx-auto w-full max-w-6xl">
          <div className="mb-8 text-center sm:mb-10">
            <div
              className="mb-3 flex justify-center"
              aria-hidden="true"
            >
              <span className="text-4xl font-semibold tracking-[-0.08em] text-white/80 sm:text-5xl">
                ⇅
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Bridge
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/40 sm:text-base">
              Move USDC across supported networks.
            </p>
          </div>

          <div className="mx-auto w-full max-w-6xl rounded-[30px] border border-white/[0.07] bg-gradient-to-br from-[#0b1017] via-[#06080b] to-[#030303] p-3 shadow-2xl shadow-black/20 sm:p-4 lg:p-5">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_auto_1fr] xl:items-stretch xl:gap-4">

              {/* SEND */}

              <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-white/35">
                    Send
                  </span>

                  <span className="flex items-center gap-1.5 text-[11px] text-white/30">
                    <WalletIcon />

                    <span>
                      {isLoadingBalances
                        ? "Loading..."
                        : formatBalance(
                            sourceBalance
                          )}{" "}
                      USDC
                    </span>
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
                    className="flex min-h-[60px] w-full items-center justify-between rounded-[20px] border border-white/[0.07] bg-[#080a0d] px-4 transition hover:border-white/[0.14] hover:bg-[#0c1016] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <NetworkLogo
                        network={
                          sourceChain
                        }
                      />

                      <div className="min-w-0 text-left">
                        <span className="block truncate text-sm font-semibold text-white sm:text-[15px]">
                          {isLoadingChains
                            ? "Loading networks..."
                            : sourceChain?.name ??
                              "Select network"}
                        </span>

                        <span className="mt-1 block text-[11px] text-white/30">
                          Source network
                        </span>
                      </div>
                    </div>

                    <ChevronDown />
                  </button>

                  {showSourceChains && (
                    <div className="absolute left-0 right-0 top-[66px] z-40 max-h-[390px] overflow-y-auto rounded-[20px] border border-white/[0.09] bg-[#080a0d] p-1.5 shadow-2xl shadow-black/50">
                      <div className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25">
                        Source network
                      </div>

                      {circleChains.map(
                        (
                          network
                        ) =>
                          renderNetworkOption(
                            network,
                            handleSourceSelect
                          )
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-3 rounded-[20px] border border-white/[0.06] bg-black/20 px-4 py-4 sm:px-5 sm:py-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <label
                        htmlFor="bridge-amount"
                        className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25"
                      >
                        Amount
                      </label>

                      <input
                        id="bridge-amount"
                        inputMode="decimal"
                        autoComplete="off"
                        value={
                          amount
                        }
                        onChange={(
                          event
                        ) =>
                          handleAmountChange(
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="0.00"
                        disabled={
                          isBridging
                        }
                        className="w-full min-w-0 bg-transparent text-[34px] font-black tracking-tight text-white outline-none placeholder:text-white/[0.12] sm:text-[42px]"
                      />
                    </div>

                    <div className="flex shrink-0 items-center gap-2.5">
                      <img
                        src="/tokens/usdc.svg"
                        alt="USDC"
                        className="h-8 w-8"
                      />

                      <span className="text-sm font-semibold text-white">
                        USDC
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SWITCH */}

              <div className="relative z-20 flex items-center justify-center">
                <button
                  type="button"
                  onClick={
                    handleSwapChains
                  }
                  disabled={
                    isBridging ||
                    !sourceChain ||
                    !destinationChain
                  }
                  aria-label="Switch bridge networks"
                  className="group flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.1] bg-[#111213] text-white/55 shadow-xl shadow-black/30 transition hover:border-white/[0.18] hover:bg-[#171819] hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 xl:h-12 xl:w-12"
                >
                  <SwapArrowIcon />
                </button>
              </div>

              {/* RECEIVE */}

              <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-white/35">
                    Receive
                  </span>

                  <span className="flex items-center gap-1.5 text-[11px] text-white/30">
                    <WalletIcon />

                    <span>
                      {isLoadingBalances
                        ? "Loading..."
                        : formatBalance(
                            destinationBalance
                          )}{" "}
                      USDC
                    </span>
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
                    className="flex min-h-[60px] w-full items-center justify-between rounded-[20px] border border-white/[0.07] bg-[#080a0d] px-4 transition hover:border-white/[0.14] hover:bg-[#0c1016] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <NetworkLogo
                        network={
                          destinationChain
                        }
                      />

                      <div className="min-w-0 text-left">
                        <span className="block truncate text-sm font-semibold text-white sm:text-[15px]">
                          {isLoadingChains
                            ? "Loading networks..."
                            : destinationChain?.name ??
                              "Select network"}
                        </span>

                        <span className="mt-1 block text-[11px] text-white/30">
                          Destination network
                        </span>
                      </div>
                    </div>

                    <ChevronDown />
                  </button>

                  {showDestinationChains && (
                    <div className="absolute left-0 right-0 top-[66px] z-40 max-h-[390px] overflow-y-auto rounded-[20px] border border-white/[0.09] bg-[#080a0d] p-1.5 shadow-2xl shadow-black/50">
                      <div className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25">
                        Destination network
                      </div>

                      {circleChains.map(
                        (
                          network
                        ) =>
                          renderNetworkOption(
                            network,
                            handleDestinationSelect
                          )
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-3 rounded-[20px] border border-white/[0.06] bg-black/20 px-4 py-4 sm:px-5 sm:py-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25">
                        You receive
                      </div>

                      <div className="text-[28px] font-black tracking-tight text-white sm:text-[34px]">
                        {
                          estimatedReceive
                        }
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2.5">
                      <img
                        src="/tokens/usdc.svg"
                        alt="USDC"
                        className="h-8 w-8"
                      />

                      <span className="text-sm font-semibold text-white">
                        USDC
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BRIDGE DETAILS */}

            {amount &&
              numericAmount > 0 &&
              sourceChain &&
              destinationChain &&
              !sameChain && (
                <div className="mt-4 rounded-[22px] border border-white/[0.06] bg-white/[0.02] px-4 py-2 sm:px-5">
                  <div className="divide-y divide-white/[0.05]">

                    <div className="flex min-h-[48px] items-center justify-between gap-4">
                      <span className="text-xs text-white/40">
                        Network fee
                      </span>

                      <span className="text-right text-xs font-medium text-white/65">
                        {isEstimating
                          ? "Calculating..."
                          : bridgeFee ??
                            (currentChainId !==
                            sourceChain.chainId
                              ? "Switch to source network"
                              : "Unavailable")}
                      </span>
                    </div>

                    <div className="flex min-h-[48px] items-center justify-between gap-4">
                      <span className="text-xs text-white/40">
                        Estimated time
                      </span>

                      <span className="text-right text-xs font-medium text-white/65">
                        {isEstimating
                          ? "Calculating..."
                          : estimatedTime ??
                            "Unavailable"}
                      </span>
                    </div>

                    <div className="flex min-h-[48px] items-center justify-between gap-4">
                      <span className="text-xs text-white/40">
                        Price impact
                      </span>

                      <span className="text-xs font-medium text-white/65">
                        0.00%
                      </span>
                    </div>

                    <div className="flex min-h-[48px] items-center justify-between gap-4">
                      <span className="text-xs text-white/40">
                        Slippage
                      </span>

                      <span className="text-xs font-medium text-white/65">
                        0.00%
                      </span>
                    </div>
                  </div>
                </div>
              )}

            {sameChain && (
              <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-amber-400/10 bg-amber-400/[0.035] px-3.5 py-3 text-xs text-amber-200/60">
                <AlertIcon />

                <span>
                  Select two different networks.
                </span>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-red-400/10 bg-red-400/[0.045] px-3.5 py-3 text-xs leading-5 text-red-300/85">
                <span className="mt-0.5 shrink-0">
                  <AlertIcon />
                </span>

                <span className="break-words">
                  {error}
                </span>
              </div>
            )}

            {status &&
              !error && (
                <div
                  aria-live="polite"
                  className="mt-4 flex items-center gap-2.5 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3 text-xs text-white/55"
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
              onClick={
                handleBridge
              }
              disabled={
                !canBridge
              }
              className={`${manrope.className} mt-4 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[18px] bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-white/25`}
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
