"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Inter, Manrope } from "next/font/google";
import { useAccount } from "wagmi";
import Header from "@/components/Header";

const brandFont = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const ARC = {
  chainId: 5042,
  chainIdHex: "0x13b2",
  rpc: "https://rpc.mainnet.arc.io",
  explorer: "https://explorer.arc.io",
};

type TokenSymbol = "USDC" | "EURC" | "cirBTC";

type Token = {
  symbol: TokenSymbol;
  name: string;
  address: string;
  decimals: number;
  logo: string;
};

const TOKENS: Record<TokenSymbol, Token> = {
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x3600000000000000000000000000000000000000",
    decimals: 6,
    logo: "/tokens/usdc-logo.webp",
  },

  EURC: {
    symbol: "EURC",
    name: "Euro Coin",
    address: "0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1",
    decimals: 6,
    logo: "/tokens/eurc-logo.png",
  },

  cirBTC: {
    symbol: "cirBTC",
    name: "Circle Wrapped Bitcoin",
    address: "0x171A4217b86A807A64eB94757Db6849fb4bDbAA0",
    decimals: 8,
    logo: "/tokens/cirbtc-logo.jpeg",
  },
};

const TOKEN_LIST = Object.keys(TOKENS) as TokenSymbol[];

const ZERO = BigInt(0);

const GAS_BUFFER = BigInt(50000);

const BUTTON =
  "inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] px-6 py-4 font-semibold text-white shadow-[0_10px_40px_rgba(30,120,255,0.25)] transition duration-300 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40";

const SECONDARY_BUTTON =
  "inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.045] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:opacity-40";

const EIP1193_METHODS = new Set([
  "eth_chainId",
  "eth_blockNumber",
  "eth_call",
  "eth_getBalance",
  "eth_getCode",
  "eth_getTransactionCount",
  "eth_getTransactionReceipt",
  "eth_getTransactionByHash",
  "eth_getBlockByNumber",
  "eth_gasPrice",
  "eth_estimateGas",
  "eth_feeHistory",
  "eth_maxPriorityFeePerGas",
]);

type Eip1193 = {
  request: (args: {
    method: string;
    params?: unknown[];
  }) => Promise<unknown>;

  on?: (
    event: string,
    handler: (arg: unknown) => void
  ) => void;

  removeListener?: (
    event: string,
    handler: (arg: unknown) => void
  ) => void;
};

type SwapKit = {
  estimateSwap: (args: {
    from: {
      adapter: unknown;
      chain: string;
    };
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    config?: {
      slippageBps?: number;
    };
  }) => Promise<{
    estimatedOutput: {
      amount: string;
    };
    stopLimit: {
      amount: string;
    };
  }>;

  swap: (args: {
    from: {
      adapter: unknown;
      chain: string;
    };
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    config?: {
      slippageBps?: number;
    };
  }) => Promise<{
    txHash: string;
    explorerUrl?: string;
    amountOut?: string;
    progress?: {
      status?: string;
    };
  }>;
};

type Phase = "idle" | "swapping" | "done" | "failed";

function parseUnits(
  value: string,
  decimals: number
): bigint | null {
  const input = value.trim();

  if (!/^\d*\.?\d*$/.test(input) || input === "") {
    return null;
  }

  const [whole = "0", fraction = ""] = input.split(".");

  if (fraction.length > decimals) {
    return null;
  }

  const base = BigInt(10) ** BigInt(decimals);

  const fractional = BigInt(
    (fraction + "0".repeat(decimals)).slice(0, decimals) || "0"
  );

  return BigInt(whole || "0") * base + fractional;
}

function formatUnits(
  value: bigint,
  decimals: number,
  minimumFraction = 2
): string {
  const base = BigInt(10) ** BigInt(decimals);

  const whole = (value / base)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  let fraction = (value % base)
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "");

  while (fraction.length < minimumFraction) {
    fraction += "0";
  }

  return fraction ? `${whole}.${fraction}` : whole;
}

function formatAmount(value: string, decimals: number): string {
  if (!value || !Number.isFinite(Number(value))) {
    return "0.00";
  }

  const number = Number(value);

  if (number === 0) {
    return "0.00";
  }

  return number.toLocaleString("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 2,
  });
}

function pad32(value: string): string {
  return value.replace(/^0x/, "").toLowerCase().padStart(64, "0");
}

async function publicRpc(
  method: string,
  params: unknown[] = []
): Promise<unknown> {
  const response = await fetch("/api/swap", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
    cache: "no-store",
  });

  const result = await response.json();

  if (!response.ok || result.error) {
    throw new Error(
      result.error?.message ||
        result.error ||
        "Arc RPC request failed."
    );
  }

  return result.result;
}

function Field({
  label,
  right,
  children,
}: {
  label: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 transition focus-within:border-[#2588ff]/60">
      <div className="flex items-center justify-between gap-3 text-[13px] font-medium text-slate-400">
        <span>{label}</span>
        {right}
      </div>

      <div className="mt-3">{children}</div>
    </div>
  );
}

function TokenLogo({
  token,
  size = 26,
}: {
  token: TokenSymbol;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  const item = TOKENS[token];

  if (!failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.logo}
        alt={item.symbol}
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }

  const background =
    token === "cirBTC" ? "#f7931a" : "#2775ca";

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
      style={{
        width: size,
        height: size,
        background,
      }}
      aria-label={item.symbol}
    >
      {token === "cirBTC" ? "₿" : token === "EURC" ? "€" : "$"}
    </span>
  );
}

function TokenSelector({
  value,
  onChange,
  disabled,
}: {
  value: TokenSymbol;
  onChange: (token: TokenSymbol) => void;
  disabled?: boolean;
}) {
  return (
    <div className="relative flex shrink-0 items-center gap-2 rounded-full border border-white/[0.08] bg-[#101729] py-2 pl-2 pr-3">
      <TokenLogo token={value} size={26} />

      <select
        aria-label="Select token"
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value as TokenSymbol)
        }
        className="max-w-[105px] cursor-pointer appearance-none bg-transparent pr-3 text-sm font-bold text-white outline-none disabled:opacity-50"
      >
        {TOKEN_LIST.map((symbol) => (
          <option
            key={symbol}
            value={symbol}
            className="bg-[#08101f] text-white"
          >
            {symbol}
          </option>
        ))}
      </select>

      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
        className="pointer-events-none -ml-2 text-slate-400"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
  );
}

export default function SwapPage() {
  const { address, isConnected, connector } = useAccount();

  const account = isConnected && address ? address : null;

  const [walletProvider, setWalletProvider] =
    useState<Eip1193 | null>(null);

  const [chainOk, setChainOk] = useState<boolean | null>(null);

  const [balances, setBalances] = useState<
    Record<TokenSymbol, bigint | null>
  >({
    USDC: null,
    EURC: null,
    cirBTC: null,
  });

  const [from, setFrom] = useState<TokenSymbol>("USDC");
  const [to, setTo] = useState<TokenSymbol>("EURC");

  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<{
    out: string;
    min: string;
  } | null>(null);

  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");

  const [done, setDone] = useState({
    paid: "",
    received: "",
    txHash: "",
  });

  const [flips, setFlips] = useState(0);

  const kitRef = useRef<SwapKit | null>(null);
  const adapterRef = useRef<unknown>(null);
  const quoteSequence = useRef(0);

  /*
   * Wallet provider:
   * signing requests stay with the connected wallet.
   */
  useEffect(() => {
    let active = true;

    setWalletProvider(null);
    setChainOk(null);
    adapterRef.current = null;

    if (!connector) {
      return;
    }

    connector
      .getProvider()
      .then((provider) => {
        if (active) {
          setWalletProvider(provider as Eip1193);
        }
      })
      .catch(() => {
        if (active) {
          setWalletProvider(null);
        }
      });

    return () => {
      active = false;
    };
  }, [connector]);

  /*
   * Check the connected wallet's chain.
   */
  useEffect(() => {
    if (!walletProvider) {
      setChainOk(null);
      return;
    }

    const checkChain = (chain: unknown) => {
      if (typeof chain === "string") {
        setChainOk(chain.toLowerCase() === ARC.chainIdHex);
      } else if (typeof chain === "number") {
        setChainOk(chain === ARC.chainId);
      }
    };

    walletProvider
      .request({ method: "eth_chainId" })
      .then(checkChain)
      .catch(() => setChainOk(null));

    walletProvider.on?.("chainChanged", checkChain);

    return () => {
      walletProvider.removeListener?.("chainChanged", checkChain);
    };
  }, [walletProvider]);

  /*
   * Hybrid provider:
   * public reads and gas requests use Arc's public RPC proxy.
   * Transaction signing and submission use the wallet provider.
   */
  const hybridProvider = useMemo<Eip1193 | null>(() => {
    if (!walletProvider) {
      return null;
    }

    return {
      request: async ({ method, params }) => {
        if (EIP1193_METHODS.has(method)) {
          return publicRpc(method, params ?? []);
        }

        return walletProvider.request({
          method,
          params,
        });
      },

      on: walletProvider.on?.bind(walletProvider),

      removeListener:
        walletProvider.removeListener?.bind(walletProvider),
    };
  }, [walletProvider]);

  useEffect(() => {
    adapterRef.current = null;
  }, [hybridProvider, account]);

  /*
   * Load the swap SDK only in the browser.
   */
  const getKit = useCallback(async (): Promise<SwapKit> => {
    if (!kitRef.current) {
      const { AppKit } = await import("@circle-fin/app-kit");

      kitRef.current = new AppKit() as unknown as SwapKit;
    }

    return kitRef.current;
  }, []);

  const getAdapter = useCallback(async (): Promise<unknown> => {
    if (!hybridProvider) {
      throw new Error("Connect your wallet first.");
    }

    if (!adapterRef.current) {
      const { createViemAdapterFromProvider } =
        await import("@circle-fin/adapter-viem-v2");

      adapterRef.current = await createViemAdapterFromProvider({
        provider: hybridProvider as never,
      });
    }

    return adapterRef.current;
  }, [hybridProvider]);

  /*
   * Read all three balances from Arc Mainnet.
   *
   * USDC/EURC: 6 decimals
   * cirBTC: 8 decimals
   */
  const loadBalances = useCallback(async () => {
    if (!account || chainOk !== true) {
      setBalances({
        USDC: null,
        EURC: null,
        cirBTC: null,
      });

      return;
    }

    const entries = await Promise.all(
      TOKEN_LIST.map(async (symbol) => {
        try {
          const result = await publicRpc("eth_call", [
            {
              to: TOKENS[symbol].address,
              data: "0x70a08231" + pad32(account),
            },
            "latest",
          ]);

          return [symbol, BigInt(String(result || "0x0"))] as const;
        } catch {
          return [symbol, null] as const;
        }
      })
    );

    setBalances({
      USDC: entries[0][1],
      EURC: entries[1][1],
      cirBTC: entries[2][1],
    });
  }, [account, chainOk]);

  useEffect(() => {
    void loadBalances();
  }, [loadBalances]);

  const inputToken = TOKENS[from];
  const outputToken = TOKENS[to];

  const units = parseUnits(amount, inputToken.decimals);

  const balance = balances[from];

  const busy = phase === "swapping";

  const ready = !!account && chainOk === true;

  const cleanAmount = amount.endsWith(".")
    ? amount.slice(0, -1)
    : amount;

  /*
   * Quote after the user stops typing.
   */
  useEffect(() => {
    const sequence = ++quoteSequence.current;

    setQuote(null);
    setQuoteError("");
    setQuoting(false);

    if (
      !ready ||
      !units ||
      units <= ZERO ||
      from === to ||
      phase !== "idle"
    ) {
      return;
    }

    let active = true;

    const timer = setTimeout(async () => {
      setQuoting(true);

      try {
        const kit = await getKit();
        const adapter = await getAdapter();

        const result = await kit.estimateSwap({
          from: {
            adapter,
            chain: "Arc",
          },
          tokenIn: from,
          tokenOut: to,
          amountIn: cleanAmount,
          config: {
            slippageBps: 100,
          },
        });

        if (
          active &&
          sequence === quoteSequence.current
        ) {
          setQuote({
            out: result.estimatedOutput.amount,
            min: result.stopLimit.amount,
          });
        }
      } catch (error) {
        if (
          active &&
          sequence === quoteSequence.current
        ) {
          setQuoteError(
            error instanceof Error
              ? error.message.slice(0, 180)
              : "Unable to get a swap quote."
          );
        }
      } finally {
        if (
          active &&
          sequence === quoteSequence.current
        ) {
          setQuoting(false);
        }
      }
    }, 500);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    ready,
    units,
    from,
    to,
    cleanAmount,
    getKit,
    getAdapter,
    phase,
  ]);

  /*
   * Validation.
   */
  const problem = useMemo(() => {
    if (!amount) {
      return "Enter an amount";
    }

    if (units === null) {
      return `Use up to ${inputToken.decimals} decimal places`;
    }

    if (units <= ZERO) {
      return "Enter a valid amount";
    }

    if (balance !== null && units > balance) {
      return "Insufficient token balance";
    }

    if (
      from === "USDC" &&
      balance !== null &&
      units + GAS_BUFFER > balance
    ) {
      return "Keep a little USDC for network fees";
    }

    return "";
  }, [
    amount,
    units,
    inputToken.decimals,
    balance,
    from,
  ]);

  /*
   * Add Arc Mainnet when the wallet does not know the network.
   */
  const switchToArc = async () => {
    if (!walletProvider) {
      return;
    }

    try {
      await walletProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ARC.chainIdHex }],
      });
    } catch (error) {
      const code = (
        error as {
          code?: number;
        }
      ).code;

      if (code === 4902) {
        try {
          await walletProvider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: ARC.chainIdHex,
                chainName: "Arc Mainnet",
                nativeCurrency: {
                  name: "USDC",
                  symbol: "USDC",
                  decimals: 18,
                },
                rpcUrls: [ARC.rpc],
                blockExplorerUrls: [ARC.explorer],
              },
            ],
          });
        } catch {
          setMessage("Unable to add Arc Mainnet to your wallet.");
        }
      } else {
        setMessage("Network switching was cancelled.");
      }
    }
  };

  /*
   * Token selection.
   * Never allow the same token on both sides.
   */
  const changeFrom = (symbol: TokenSymbol) => {
    if (busy) return;

    setFrom(symbol);

    if (symbol === to) {
      setTo(from);
    }

    setAmount("");
    setQuote(null);
    setMessage("");
  };

  const changeTo = (symbol: TokenSymbol) => {
    if (busy) return;

    setTo(symbol);

    if (symbol === from) {
      setFrom(to);
    }

    setQuote(null);
    setMessage("");
  };

  /*
   * Reverse the token pair.
   */
  const flip = () => {
    if (busy) return;

    setFrom(to);
    setTo(from);

    setAmount("");
    setQuote(null);
    setQuoteError("");
    setMessage("");

    setFlips((value) => value + 1);
  };

  /*
   * Use the available balance, keeping a USDC gas buffer.
   */
  const setMax = () => {
    if (balance === null) {
      return;
    }

    const buffer =
      from === "USDC" ? GAS_BUFFER : ZERO;

    const max = balance > buffer
      ? balance - buffer
      : ZERO;

    setAmount(
      formatUnits(max, inputToken.decimals, 0)
        .replace(/,/g, "")
    );
  };

  const reset = () => {
    setPhase("idle");
    setMessage("");
    setAmount("");
    setQuote(null);
    setQuoteError("");
    setDone({
      paid: "",
      received: "",
      txHash: "",
    });
  };

  /*
   * Execute the swap.
   * The connected wallet remains responsible for signing.
   */
  const executeSwap = async () => {
    if (
      !account ||
      !hybridProvider ||
      !quote ||
      problem ||
      !units
    ) {
      return;
    }

    setPhase("swapping");
    setMessage("");

    try {
      const kit = await getKit();
      const adapter = await getAdapter();

      const result = await kit.swap({
        from: {
          adapter,
          chain: "Arc",
        },
        tokenIn: from,
        tokenOut: to,
        amountIn: cleanAmount,
        config: {
          slippageBps: 100,
        },
      });

      const txHash = result.txHash;

      if (!txHash) {
        throw new Error(
          "The swap provider did not return a transaction hash."
        );
      }

      if (
        result.progress?.status === "FAILED" ||
        result.progress?.status === "NOT_FOUND"
      ) {
        throw new Error(
          "The swap failed. Check the transaction status."
        );
      }

      setDone({
        paid: `${cleanAmount} ${from}`,
        received: `${result.amountOut ?? quote.out} ${to}`,
        txHash,
      });

      setPhase("done");

      void loadBalances();
    } catch (error) {
      setPhase("failed");

      const err = error as {
        code?: number | string;
        message?: string;
      };

      if (
        err.code === 4001 ||
        /user rejected|user denied|rejected the request/i.test(
          err.message ?? ""
        )
      ) {
        setMessage("Transaction rejected in your wallet.");
      } else {
        setMessage(
          err.message?.slice(0, 180) ||
            "The swap could not be completed."
        );
      }
    }
  };

  let action: {
    label: ReactNode;
    onClick: () => void;
    disabled: boolean;
  };

  if (!account) {
    action = {
      label: "Connect wallet",
      onClick: () => {},
      disabled: true,
    };
  } else if (chainOk === false) {
    action = {
      label: "Switch to Arc Mainnet",
      onClick: switchToArc,
      disabled: false,
    };
  } else if (busy) {
    action = {
      label: (
        <span className="flex items-center gap-3">
          <Spinner />
          Swapping
        </span>
      ),
      onClick: () => {},
      disabled: true,
    };
  } else {
    action = {
      label: "Swap",
      onClick: executeSwap,
      disabled:
        !!problem ||
        !quote ||
        quoting ||
        chainOk !== true,
    };
  }

  const rate =
    quote && Number(cleanAmount) > 0
      ? Number(quote.out) / Number(cleanAmount)
      : null;

  return (
    <main
      className={`${brandFont.className} relative min-h-screen overflow-x-hidden bg-[#010205] text-white selection:bg-[#167cff]/30`}
    >
      <style>{`
        @keyframes backgroundFloat {
          0%,100% { transform: translate3d(-50%,0,0) scale(1); }
          50% { transform: translate3d(-46%,2vw,0) scale(1.08); }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .swap-fade {
          animation: fadeUp .65s ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          *,*::before,*::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#010205_0%,#020a1c_48%,#010307_100%)]" />

        <div
          className="absolute left-1/2 top-0 h-[650px] w-[650px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(22,115,255,0.18),transparent_68%)] blur-3xl"
          style={{
            animation:
              "backgroundFloat 18s ease-in-out infinite",
          }}
        />
      </div>

      <div className="relative z-10">
        <Header />

        <section className="px-5 pb-24 pt-10 sm:px-8 sm:pt-14 lg:px-10 lg:pb-32">
          <div className="swap-fade mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#248aff]/20 bg-[#167cff]/[0.07] px-4 py-2 text-xs font-semibold tracking-wide text-[#8fd4ff]">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              ARC MAINNET
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
              <span className="bg-gradient-to-r from-[#18bfff] via-[#2588ff] to-[#4262ff] bg-clip-text text-transparent">
                Swap Tokens
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-400 sm:text-lg">
              Swap between USDC, EURC, and cirBTC on Arc.
              Simple token selection, clear quotes, and
              wallet-controlled transactions.
            </p>
          </div>

          <div className="swap-fade relative mx-auto mt-10 w-full max-w-lg">
            <div className="absolute -inset-8 rounded-full bg-[#1675ff]/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#050a16]/90 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-7">
              {phase !== "done" && (
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-5">
                  <div>
                    <p className="text-xs text-slate-500">
                      Network
                    </p>

                    <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#12b9ff] to-[#273ee8] text-xs">
                        A
                      </span>
                      Arc Mainnet
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      Slippage
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      1.00%
                    </p>
                  </div>
                </div>
              )}

              {phase === "done" ? (
                <div className="py-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-3xl text-emerald-400">
                    ✓
                  </div>

                  <h2 className="mt-5 text-2xl font-bold">
                    Swap submitted
                  </h2>

                  <p className="mt-3 text-sm text-slate-400">
                    Your transaction has been submitted.
                    Check the explorer for its final status.
                  </p>

                  <div className="mt-8 space-y-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-left">
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-slate-400">
                        You paid
                      </span>

                      <span className="text-right font-semibold">
                        {done.paid}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-slate-400">
                        You received
                      </span>

                      <span className="text-right font-semibold">
                        {done.received}
                      </span>
                    </div>
                  </div>

                  <a
                    href={`${ARC.explorer}/tx/${done.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`${SECONDARY_BUTTON} mt-6 w-full`}
                  >
                    View transaction
                  </a>

                  <button
                    onClick={reset}
                    className={`${BUTTON} mt-3`}
                  >
                    Swap again
                  </button>
                </div>
              ) : (
                <>
                  <div className="mt-5">
                    <Field
                      label="You pay"
                      right={
                        <span className="flex items-center gap-2">
                          {ready && balance !== null && (
                            <span className="text-xs tabular-nums">
                              Balance:{" "}
                              {formatUnits(
                                balance,
                                inputToken.decimals
                              )}
                            </span>
                          )}

                          {ready && balance !== null && (
                            <button
                              type="button"
                              onClick={setMax}
                              disabled={busy}
                              className="rounded-full bg-white/[0.07] px-3 py-1 text-xs font-semibold text-[#8fd4ff] hover:bg-white/[0.12]"
                            >
                              MAX
                            </button>
                          )}
                        </span>
                      }
                    >
                      <div className="flex items-center gap-3">
                        <input
                          value={amount}
                          onChange={(event) => {
                            const value =
                              event.target.value.replace(",", ".");

                            const decimals =
                              inputToken.decimals;

                            const pattern = new RegExp(
                              `^\\d*\\.?\\d{0,${decimals}}$`
                            );

                            if (
                              value === "" ||
                              pattern.test(value)
                            ) {
                              setAmount(value);
                              setPhase("idle");
                              setMessage("");
                            }
                          }}
                          disabled={busy}
                          inputMode="decimal"
                          placeholder="0.00"
                          autoComplete="off"
                          aria-label={`Amount of ${from} to swap`}
                          style={{
                            fontSize:
                              amount.length > 10
                                ? "clamp(1rem,4vw,1.25rem)"
                                : "clamp(1.375rem,5vw,1.875rem)",
                            fontWeight: 600,
                            fontFamily: manrope.style.fontFamily,
                          }}
                          className="min-w-0 flex-1 bg-transparent tracking-tight text-white outline-none placeholder:text-slate-700"
                        />

                        <TokenSelector
                          value={from}
                          onChange={changeFrom}
                          disabled={busy}
                        />
                      </div>

                      <p className="mt-3 text-xs text-slate-500">
                        {inputToken.name}
                      </p>
                    </Field>

                    <div className="relative z-10 -my-3 flex justify-center">
                      <button
                        type="button"
                        onClick={flip}
                        disabled={busy}
                        aria-label="Switch token pair"
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.1] bg-[#071025] text-[#55c5ff] shadow-lg transition hover:border-[#2f8bff]/50 hover:text-white disabled:opacity-50"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            transition: "transform .35s ease",
                            transform: `rotate(${flips * 180}deg)`,
                          }}
                        >
                          <path d="M7 4v13m0 0-3-3m3 3 3-3M17 20V7m0 0-3 3m3-3 3 3" />
                        </svg>
                      </button>
                    </div>

                    <Field
                      label="You receive"
                      right={
                        ready && balances[to] !== null ? (
                          <span className="text-xs tabular-nums">
                            Balance:{" "}
                            {formatUnits(
                              balances[to] as bigint,
                              outputToken.decimals
                            )}
                          </span>
                        ) : undefined
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`min-w-0 flex-1 break-all tracking-tight ${
                            quote
                              ? "text-white"
                              : "text-slate-600"
                          }`}
                          style={{
                            fontSize:
                              "clamp(1.25rem,5vw,1.875rem)",
                            fontWeight: 600,
                            fontFamily: manrope.style.fontFamily,
                          }}
                        >
                          {quote
                            ? formatAmount(
                                quote.out,
                                outputToken.decimals
                              )
                            : quoting
                              ? "Getting quote..."
                              : "0.00"}
                        </div>

                        <TokenSelector
                          value={to}
                          onChange={changeTo}
                          disabled={busy}
                        />
                      </div>

                      <p className="mt-3 text-xs text-slate-500">
                        {outputToken.name}
                      </p>
                    </Field>
                  </div>

                  {quote && (
                    <dl className="mt-5 space-y-3 px-1 text-sm">
                      {rate !== null && (
                        <div className="flex justify-between gap-4">
                          <dt className="text-slate-500">
                            Estimated rate
                          </dt>

                          <dd className="text-right text-slate-300">
                            1 {from} ≈{" "}
                            {rate.toLocaleString("en-US", {
                              maximumFractionDigits: 8,
                            })}{" "}
                            {to}
                          </dd>
                        </div>
                      )}

                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">
                          Minimum received
                        </dt>

                        <dd className="text-right text-slate-300">
                          {formatAmount(
                            quote.min,
                            outputToken.decimals
                          )}{" "}
                          {to}
                        </dd>
                      </div>
                    </dl>
                  )}

                  <button
                    type="button"
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={`${BUTTON} mt-6`}
                  >
                    {action.label}
                  </button>

                  <div
                    className="mt-4 min-h-5 text-center text-sm"
                    role="status"
                    aria-live="polite"
                  >
                    {!account ? (
                      <span className="text-slate-500">
                        Connect your wallet to get started.
                      </span>
                    ) : chainOk === false ? (
                      <span className="text-amber-300">
                        Switch your wallet to Arc Mainnet.
                      </span>
                    ) : problem && amount ? (
                      <span className="text-red-300">
                        {problem}
                      </span>
                    ) : quoting ? (
                      <span className="text-slate-500">
                        Finding an available swap route...
                      </span>
                    ) : quoteError ? (
                      <span className="text-red-300">
                        {quoteError}
                      </span>
                    ) : message ? (
                      <span className="text-red-300">
                        {message}
                      </span>
                    ) : !quote && amount && ready ? (
                      <span className="text-slate-500">
                        Waiting for a valid quote...
                      </span>
                    ) : null}
                  </div>

                  {phase === "failed" && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhase("idle");
                        setMessage("");
                      }}
                      className={`${SECONDARY_BUTTON} mt-3 w-full`}
                    >
                      Try again
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mx-auto mt-8 flex max-w-lg flex-wrap justify-center gap-x-6 gap-y-3 text-xs text-slate-500">
            <span>Arc Mainnet</span>
            <span>USDC gas fees</span>
            <span>Wallet-controlled signing</span>
          </div>
        </section>
      </div>
    </main>
  );
}
