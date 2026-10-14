"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Inter, Manrope } from "next/font/google";
import { useAccount } from "wagmi";
import Header from "@/components/Header";

const brandFont = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });
const manrope = Manrope({ subsets: ["latin"], weight: ["600", "700"], display: "swap" });

/* ---------- networks (USDC addresses: developers.circle.com/stablecoins/usdc-contract-addresses) ---------- */
type ChainKey = "Arc" | "Ethereum" | "Base" | "Arbitrum" | "Optimism" | "Polygon" | "Avalanche" | "Unichain" | "Linea";
type ChainInfo = { label: string; chainId: number; usdc: string; explorer: string; color: string; gas: string };

// The key is the name App Kit uses for the network (OP Mainnet is "Optimism", Polygon PoS is "Polygon").
const CHAINS: Record<ChainKey, ChainInfo> = {
  Arc: { label: "Arc", chainId: 5042, usdc: "0x3600000000000000000000000000000000000000", explorer: "https://explorer.arc.io", color: "#12b9ff", gas: "USDC" },
  Ethereum: { label: "Ethereum", chainId: 1, usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", explorer: "https://etherscan.io", color: "#627EEA", gas: "ETH" },
  Base: { label: "Base", chainId: 8453, usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", explorer: "https://basescan.org", color: "#0052FF", gas: "ETH" },
  Arbitrum: { label: "Arbitrum", chainId: 42161, usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", explorer: "https://arbiscan.io", color: "#28A0F0", gas: "ETH" },
  Optimism: { label: "OP Mainnet", chainId: 10, usdc: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", explorer: "https://optimistic.etherscan.io", color: "#FF0420", gas: "ETH" },
  Polygon: { label: "Polygon", chainId: 137, usdc: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", explorer: "https://polygonscan.com", color: "#8247E5", gas: "POL" },
  Avalanche: { label: "Avalanche", chainId: 43114, usdc: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", explorer: "https://snowtrace.io", color: "#E84142", gas: "AVAX" },
  Unichain: { label: "Unichain", chainId: 130, usdc: "0x078D782b760474a361dDA0AF3839290b0EF57AD6", explorer: "https://uniscan.xyz", color: "#F50DB4", gas: "ETH" },
  Linea: { label: "Linea", chainId: 59144, usdc: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff", explorer: "https://lineascan.build", color: "#3ABFE5", gas: "ETH" },
};
const PARTNERS: ChainKey[] = ["Ethereum", "Base", "Arbitrum", "Optimism", "Polygon", "Avalanche", "Unichain", "Linea"];

const ARC_RPCS = [
  "https://rpc.mainnet.arc.io",
  "https://rpc.blockdaemon.mainnet.arc.io",
  "https://rpc.drpc.mainnet.arc.io",
  "https://rpc.quicknode.mainnet.arc.io",
];

/* ---------- safety limits ---------- */
const DECIMALS = 6; // USDC has 6 decimals on every network above
const ARC_GAS_RESERVE = BigInt(20000); // keep ~0.02 USDC for gas when bridging out of Arc
const RECEIVE_DRIFT = 0.005; // if the fresh quote gives >0.5% less than the one shown, stop and ask again
const TX_HASH_RE = /^0x[0-9a-fA-F]{64}$/;

const CONTAINER = "w-full px-4 sm:px-8 lg:px-10";

const BUTTON =
  "inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_40px_rgba(30,120,255,0.28)] transition duration-300 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_15px_50px_rgba(30,120,255,0.42)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39c4ff] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:brightness-100 sm:px-7 sm:py-4 sm:text-base";

const SECONDARY_BUTTON =
  "inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.045] px-6 py-3.5 text-[15px] font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:border-[#2f8bff]/40 hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39c4ff] sm:px-7 sm:py-4 sm:text-base";

/* ---------- number helpers ---------- */
const ZERO = BigInt(0);
const E6 = BigInt(1000000);

function parseUnits6(value: string): bigint | null {
  const v = value.trim();
  if (!/^\d*\.?\d*$/.test(v) || v === "" || v === ".") return null;
  const [whole = "0", frac = ""] = v.split(".");
  if (frac.length > DECIMALS) return null;
  return BigInt(whole || "0") * E6 + BigInt((frac + "000000").slice(0, DECIMALS) || "0");
}
function formatUnits6(value: bigint, minFrac = 2): string {
  const whole = (value / E6).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  let frac = (value % E6).toString().padStart(DECIMALS, "0").replace(/0+$/, "");
  while (frac.length < minFrac) frac += "0";
  return frac ? `${whole}.${frac}` : whole;
}
const fmtNum = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
const fmtUsd = (n: number | null) => (n === null || !Number.isFinite(n) ? "—" : n > 0 && n < 0.01 ? "<$0.01" : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const chainNum = (id: unknown) => (typeof id === "string" ? (id.startsWith("0x") ? parseInt(id, 16) : parseInt(id, 10)) : typeof id === "number" ? id : NaN);
const pad32 = (hex: string) => hex.replace(/^0x/, "").toLowerCase().padStart(64, "0");
const timeAgo = (t: number) => {
  const s = Math.max(1, Math.round((Date.now() - t) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  return new Date(t).toLocaleDateString();
};
/** Explorer links are always built here from the transaction hash, never taken from the SDK. */
const txUrl = (key: ChainKey, hash: string) => `${CHAINS[key].explorer}/tx/${hash}`;

/* ---------- wallet + App Kit types ---------- */
type Eip1193 = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};
type Fee = { type?: string; token?: string; amount?: string };
type StepRes = { name?: string; state?: string; txHash?: string; errorMessage?: string };
type BridgeRes = { state?: string; steps?: StepRes[] };
type BridgeArgs = {
  from: { adapter: unknown; chain: string };
  to: { adapter: unknown; chain: string };
  amount: string;
  token: "USDC";
  config?: { transferSpeed?: "FAST" | "SLOW"; maxFee?: string };
};
type KitLike = {
  getSupportedChains: (op?: string) => unknown;
  estimateBridge: (p: BridgeArgs) => Promise<{ fees?: Fee[] }>;
  bridge: (p: BridgeArgs) => Promise<BridgeRes>;
  retry?: (failed: BridgeRes, ctx: { from: unknown; to: unknown }) => Promise<BridgeRes>;
  on?: (event: string, handler: (e: unknown) => void) => void;
  off?: (event: string, handler: (e: unknown) => void) => void;
};
type ReadClient = {
  readContract: (args: unknown) => Promise<unknown>;
  getBalance: (args: { address: string }) => Promise<bigint>;
};

type Speed = "FAST" | "SLOW";
type Quote = { receive: number | null; bridgeFee: number | null; gas: string[]; speed: Speed };
type StepState = "pending" | "active" | "done";
type StepRow = { key: "approve" | "burn" | "fetchAttestation" | "mint"; state: StepState; hash?: string };
type HistoryRow = { id: string; t: number; from: ChainKey; to: ChainKey; amount: string; received: string; burn?: string; mint?: string };
type Phase = "idle" | "bridging" | "done" | "failed";

/* ---------- small UI pieces ---------- */
function SpaceBackground() {
  const { stars, dust } = useMemo(() => {
    let seed = 41;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const r2 = (n: number) => Math.round(n * 100) / 100;
    return {
      stars: Array.from({ length: 140 }, (_, id) => ({ id, x: r2(rnd() * 100), y: r2(rnd() * 100), size: r2(1 + rnd() * 1.8), d: r2(rnd() * 7), t: r2(3 + rnd() * 5) })),
      dust: Array.from({ length: 26 }, (_, id) => ({ id, x: r2(rnd() * 100), y: r2(rnd() * 100), size: r2(1.5 + rnd() * 2), d: r2(rnd() * 14), t: r2(14 + rnd() * 14) })),
    };
  }, []);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute -inset-6 blur-[3px]">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#010205_0%,#020a1c_30%,#031126_60%,#010307_100%)]" />
        <div className="absolute left-1/2 top-[8%] h-[55vw] w-[55vw] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(22,115,255,0.22),transparent_68%)] blur-3xl" style={{ animation: "backgroundFloat 18s ease-in-out infinite" }} />
        <div className="absolute -left-[25vw] top-[45%] h-[50vw] w-[50vw] rounded-full bg-[radial-gradient(circle,rgba(20,90,255,0.12),transparent_68%)] blur-3xl" style={{ animation: "backgroundFloatReverse 24s ease-in-out infinite" }} />
        {stars.map((s) => (
          <span key={s.id} className="absolute rounded-full bg-[#a9dfff]" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, animation: `twinkle ${s.t}s ease-in-out ${s.d}s infinite` }} />
        ))}
        {dust.map((p) => (
          <span key={p.id} className="absolute rounded-full bg-[#6cc4ff]" style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, animation: `floatUp ${p.t}s linear ${p.d}s infinite` }} />
        ))}
      </div>
    </div>
  );
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/65" onClick={onClose} />
      <div className="relative max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-3xl border border-white/[0.1] bg-[#080a0d] p-5 shadow-[0_25px_80px_rgba(0,0,0,0.65)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.04] text-base text-white/45 transition hover:bg-white/[0.08] hover:text-white">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const Svg = ({ d, size = 20 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const ICON_HISTORY = "M12 7v5l3 2M3 12a9 9 0 1 0 3-6.7M3 4v4h4";
const Chevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const Spinner = ({ size = 16 }: { size?: number }) => <span className="inline-block animate-spin rounded-full border-2 border-white/30 border-t-white" style={{ width: size, height: size }} />;

const Pill = ({ onClick, children, disabled }: { onClick: () => void; children: ReactNode; disabled?: boolean }) => (
  <button type="button" onClick={onClick} disabled={disabled} className="inline-flex items-center rounded-full bg-white/[0.07] px-1.5 py-[1px] text-[8px] font-medium text-[#8fd4ff] transition hover:bg-white/[0.12] disabled:opacity-40 sm:px-2.5 sm:py-[3px] sm:text-[11px]">
    {children}
  </button>
);

/** Round logo for a network. Arc and USDC use your logo files (mainnet/public), the others a colored letter. */
function ChainLogo({ chain, size = 28 }: { chain: ChainKey; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (chain === "Arc" && !failed)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src="/arc-logo.png" alt="Arc" onError={() => setFailed(true)} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full font-bold text-white" style={{ width: size, height: size, background: CHAINS[chain].color, fontSize: size * 0.45 }} aria-hidden>
      {CHAINS[chain].label[0]}
    </span>
  );
}
function UsdcLogo({ size = 28 }: { size?: number }) {
  const [failed, setFailed] = useState(false);
  if (!failed)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src="/usdc-logo.webp" alt="USDC" onError={() => setFailed(true)} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" role="img" aria-label="USDC" className="shrink-0">
      <circle cx="12" cy="12" r="12" fill="#2775CA" />
      <path d="M5.64 5.64A9 9 0 0 0 5.64 18.36M18.36 5.64A9 9 0 0 1 18.36 18.36" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M14.4 9.4c0-1-1-1.7-2.4-1.7s-2.4.7-2.4 1.8c0 2.4 4.9 1.1 4.9 3.6 0 1.1-1.1 1.9-2.5 1.9s-2.5-.8-2.5-1.9M12 6.3v1.4M12 16.3v1.4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChainButton({ chain, onClick, disabled }: { chain: ChainKey; onClick?: () => void; disabled?: boolean }) {
  const content = (
    <>
      <ChainLogo chain={chain} size={30} />
      <span>{CHAINS[chain].label}</span>
      {onClick && <span className="text-slate-400"><Chevron /></span>}
    </>
  );
  const cls = "flex items-center gap-2.5 rounded-full bg-white/[0.07] py-1 pl-1 pr-3 text-[15px] font-semibold sm:py-1.5 sm:pl-1.5 sm:pr-3.5 sm:text-base";
  return onClick ? (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={`Choose network, now ${CHAINS[chain].label}`} className={`${cls} transition hover:bg-white/[0.12] disabled:opacity-60`}>
      {content}
    </button>
  ) : (
    <span className={cls}>{content}</span>
  );
}

const STEP_LABEL = (key: StepRow["key"], from: ChainKey, to: ChainKey) =>
  ({
    approve: `Approve USDC on ${CHAINS[from].label}`,
    burn: `Send USDC from ${CHAINS[from].label}`,
    fetchAttestation: "Circle confirms the transfer",
    mint: `Receive USDC on ${CHAINS[to].label}`,
  })[key];

function explain(e: unknown, fallback: string): string {
  const err = e as { code?: number | string; message?: string };
  const msg = err?.message ?? "";
  if (err?.code === 4001 || /reject|denied|cancel/i.test(msg)) return "User rejected the transaction";
  const known: Record<string, string> = {
    NO_WALLET: "Wallet not ready. Reconnect and try again.",
    ACCOUNT_CHANGED: "Your wallet account changed. Reconnect and try again.",
    BAD_AMOUNT: "Enter a valid amount.",
    NO_BALANCE: "Insufficient balance",
    NO_QUOTE: "Couldn't get a quote right now. Try again.",
    QUOTE_CHANGED: "The fees changed. Review the new amount and tap Bridge again.",
    TOO_SMALL: "This amount is too small to cover the bridge fees.",
  };
  for (const k of Object.keys(known)) if (msg === k) return known[k];
  if (/failed to fetch|HTTP request failed|network ?error/i.test(msg)) return "Couldn't reach the network. Please try again.";
  return msg ? msg.slice(0, 160) : fallback;
}

/* ---------- page ---------- */
export default function BridgePage() {
  const { address, isConnected, connector } = useAccount();
  const account = isConnected && address ? address : null;

  const [provider, setProvider] = useState<Eip1193 | undefined>(undefined);
  const [partner, setPartner] = useState<ChainKey>("Ethereum");
  const [dir, setDir] = useState<"in" | "out">("in"); // "in": partner -> Arc, "out": Arc -> partner
  const [flips, setFlips] = useState(0);
  const fromKey: ChainKey = dir === "in" ? partner : "Arc";
  const toKey: ChainKey = dir === "in" ? "Arc" : partner;

  const [amount, setAmount] = useState("");
  const [speed, setSpeed] = useState<Speed>("FAST");
  const [balance, setBalance] = useState<bigint | null>(null); // USDC on the source network
  const [destBalance, setDestBalance] = useState<bigint | null>(null);
  const [gasBalance, setGasBalance] = useState<bigint | null>(null); // native coin on the source network

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [steps, setSteps] = useState<StepRow[]>([]);
  const [summary, setSummary] = useState<HistoryRow | null>(null);
  const [canRetry, setCanRetry] = useState(false);

  const [modal, setModal] = useState<null | "chain" | "history">(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);

  const kitRef = useRef<KitLike | null>(null);
  const adapterRef = useRef<unknown>(null);
  const clientsRef = useRef<Partial<Record<ChainKey, ReadClient>>>({});
  const executingRef = useRef(false);
  const lockRef = useRef(false);
  const failedRef = useRef<BridgeRes | null>(null);

  /* the connected wallet's own provider */
  useEffect(() => {
    let live = true;
    setProvider(undefined);
    if (!connector) return;
    connector.getProvider().then((p) => { if (live) setProvider(p as Eip1193); }).catch(() => {});
    return () => { live = false; };
  }, [connector]);

  /* new wallet or account: fresh adapter and read clients */
  useEffect(() => {
    adapterRef.current = null;
    clientsRef.current = {};
  }, [provider, account]);

  /* history (this device) */
  const historyKey = account ? `alabaamafi:bridges:${account.toLowerCase()}` : null;
  useEffect(() => {
    if (!historyKey) return setHistory([]);
    try {
      const raw = window.localStorage.getItem(historyKey);
      setHistory(raw ? (JSON.parse(raw) as HistoryRow[]) : []);
    } catch {
      setHistory([]);
    }
  }, [historyKey]);

  const getKit = async (): Promise<KitLike> => {
    if (!kitRef.current) {
      const { AppKit } = await import("@circle-fin/app-kit");
      kitRef.current = new AppKit() as unknown as KitLike;
    }
    return kitRef.current;
  };

  /* A wallet transport that only answers when the wallet is on the right network; otherwise public RPCs take over. */
  const guardedWallet = useCallback(
    async (chainId: number) => {
      const { custom } = await import("viem");
      return custom({
        request: async (args: { method: string; params?: unknown[] }) => {
          if (!provider) throw new Error("NO_WALLET");
          const cur = chainNum(await provider.request({ method: "eth_chainId" }));
          if (cur !== chainId) throw new Error("WALLET_ON_OTHER_CHAIN");
          return provider.request(args);
        },
      } as never);
    },
    [provider]
  );

  /* read-only client for any network (balances, gas) */
  const getClient = useCallback(
    async (key: ChainKey): Promise<ReadClient> => {
      const cached = clientsRef.current[key];
      if (cached) return cached;
      const { createPublicClient, fallback, http, defineChain } = await import("viem");
      const chains = await import("viem/chains");
      const map: Record<string, unknown> = { Ethereum: chains.mainnet, Base: chains.base, Arbitrum: chains.arbitrum, Optimism: chains.optimism, Polygon: chains.polygon, Avalanche: chains.avalanche, Unichain: chains.unichain, Linea: chains.linea };
      const chain =
        key === "Arc"
          ? defineChain({ id: 5042, name: "Arc", nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 }, rpcUrls: { default: { http: ARC_RPCS } } })
          : map[key];
      const urls = key === "Arc" ? ARC_RPCS.map((u) => http(u, { retryCount: 1, timeout: 8000 })) : [http()];
      const client = createPublicClient({ chain: chain as never, transport: fallback([await guardedWallet(CHAINS[key].chainId), ...urls]) }) as unknown as ReadClient;
      clientsRef.current[key] = client;
      return client;
    },
    [guardedWallet]
  );

  const readUsdc = useCallback(
    async (key: ChainKey, owner: string): Promise<bigint | null> => {
      try {
        const { erc20Abi } = await import("viem");
        const c = await getClient(key);
        return (await c.readContract({ address: CHAINS[key].usdc, abi: erc20Abi, functionName: "balanceOf", args: [owner] })) as bigint;
      } catch {
        return null;
      }
    },
    [getClient]
  );

  /* balances on both networks + gas coin on the source network */
  const loadBalances = useCallback(async () => {
    if (!account) {
      setBalance(null);
      setDestBalance(null);
      setGasBalance(null);
      return;
    }
    const [src, dst] = await Promise.all([readUsdc(fromKey, account), readUsdc(toKey, account)]);
    setBalance(src);
    setDestBalance(dst);
    try {
      setGasBalance(fromKey === "Arc" ? src : await (await getClient(fromKey)).getBalance({ address: account }));
    } catch {
      setGasBalance(null);
    }
  }, [account, fromKey, toKey, readUsdc, getClient]);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  /* Adapter for the connected wallet. It switches the wallet to each network only while a bridge is running. */
  const getAdapter = async (): Promise<unknown> => {
    if (!adapterRef.current) {
      const { ViemAdapter } = await import("@circle-fin/adapter-viem-v2");
      const { createPublicClient, createWalletClient, custom, fallback, http } = await import("viem");
      const kit = await getKit();
      const supportedChains = ((await kit.getSupportedChains("bridge")) as { type: string }[]).filter((c) => c.type === "evm");
      type KitChain = { id: number; name: string; nativeCurrency: unknown; rpcUrls: { default: { http: string[] } }; blockExplorers?: { default?: { url?: string } } };

      const ensureWalletChain = async (chain: KitChain) => {
        if (!provider) throw new Error("NO_WALLET");
        if (chainNum(await provider.request({ method: "eth_chainId" })) === chain.id) return;
        const hex = `0x${chain.id.toString(16)}`;
        try {
          await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hex }] });
        } catch (e) {
          if ((e as { code?: number }).code !== 4902) throw e;
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [{ chainId: hex, chainName: chain.name, nativeCurrency: chain.nativeCurrency, rpcUrls: chain.rpcUrls.default.http, blockExplorerUrls: chain.blockExplorers?.default?.url ? [chain.blockExplorers.default.url] : undefined }],
          });
          await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hex }] });
        }
      };

      adapterRef.current = new ViemAdapter(
        {
          getPublicClient: ({ chain }: { chain: KitChain }) =>
            createPublicClient({
              chain: chain as never,
              transport: fallback([...(provider ? [custom({ request: async (args: { method: string; params?: unknown[] }) => { if (chainNum(await provider.request({ method: "eth_chainId" })) !== chain.id) throw new Error("WALLET_ON_OTHER_CHAIN"); return provider.request(args); } } as never)] : []), ...(chain.id === 5042 ? ARC_RPCS.map((u) => http(u, { retryCount: 1, timeout: 8000 })) : [http()])]),
            }),
          getWalletClient: async ({ chain }: { chain: KitChain }) => {
            if (executingRef.current) await ensureWalletChain(chain); // never switches networks while only getting a quote
            return createWalletClient({ account: account as `0x${string}`, chain: chain as never, transport: custom(provider as never) });
          },
        } as never,
        { addressContext: "user-controlled", supportedChains } as never
      );
    }
    return adapterRef.current;
  };

  /* derived */
  const units = parseUnits6(amount);
  const cleanAmount = amount.endsWith(".") ? amount.slice(0, -1) : amount;
  const amountNum = cleanAmount && Number(cleanAmount) > 0 ? Number(cleanAmount) : 0;
  const busy = phase === "bridging";
  const ready = !!account;

  /* quote: bridge fee, gas, and what you receive (0.6s after you stop typing) */
  useEffect(() => {
    setQuote(null);
    setQuoteError("");
    if (!ready || !provider || !units || units <= ZERO) return;
    let live = true;
    setQuoting(true);
    const t = setTimeout(async () => {
      try {
        const kit = await getKit();
        const adapter = await getAdapter();
        const est = await kit.estimateBridge({ from: { adapter, chain: fromKey }, to: { adapter, chain: toKey }, amount: cleanAmount, token: "USDC", config: { transferSpeed: speed } });
        const fees = Array.isArray(est?.fees) ? est.fees : null;
        let bridgeFee: number | null = null;
        const gas: string[] = [];
        if (fees) {
          bridgeFee = 0;
          for (const f of fees) {
            const amt = Number(f.amount);
            if (!Number.isFinite(amt)) continue;
            if (/gas/i.test(f.type ?? "")) gas.push(`${amt < 0.0001 ? "<0.0001" : amt.toFixed(4)} ${f.token ?? ""}`.trim());
            else if ((f.token ?? "USDC").toUpperCase() === "USDC") bridgeFee += amt;
          }
        }
        const receive = bridgeFee === null ? null : amountNum - bridgeFee;
        if (live) setQuote({ receive, bridgeFee, gas, speed });
      } catch (e) {
        if (live) setQuoteError(explain(e, "Couldn't get a quote right now."));
      } finally {
        if (live) setQuoting(false);
      }
    }, 600);
    return () => {
      live = false;
      clearTimeout(t);
      setQuoting(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, provider, fromKey, toKey, cleanAmount, speed, account]);

  /* validation */
  const reserve = fromKey === "Arc" ? ARC_GAS_RESERVE : ZERO;
  const problem = useMemo((): { text: string; hard: boolean } | null => {
    if (!amount) return { text: "Enter an amount", hard: false };
    if (units === null) return { text: `Use up to ${DECIMALS} decimal places`, hard: true };
    if (units <= ZERO) return { text: "Enter an amount", hard: false };
    if (balance !== null && units > balance) return { text: "Insufficient balance", hard: true };
    if (reserve > ZERO && balance !== null && units + reserve > balance) return { text: "Keep a little USDC for the network fee", hard: true };
    if (fromKey !== "Arc" && gasBalance !== null && gasBalance === ZERO) return { text: `You need some ${CHAINS[fromKey].gas} on ${CHAINS[fromKey].label} for gas`, hard: true };
    if (quote && quote.receive !== null && quote.receive <= 0) return { text: "Amount is too small to cover the fees", hard: true };
    return null;
  }, [amount, units, balance, reserve, fromKey, gasBalance, quote]);

  /* actions */
  const flip = () => {
    if (busy) return;
    setDir((d) => (d === "in" ? "out" : "in"));
    setFlips((n) => n + 1);
    setAmount("");
    setMessage("");
  };
  const setFraction = (half: boolean) => {
    if (balance === null) return;
    let v = half ? balance / BigInt(2) : balance;
    if (v + reserve > balance) v = balance > reserve ? balance - reserve : ZERO;
    setAmount(formatUnits6(v, 0).replace(/,/g, ""));
  };
  const reset = () => {
    setPhase("idle");
    setMessage("");
    setAmount("");
    setQuote(null);
    setSteps([]);
    setSummary(null);
    setCanRetry(false);
    failedRef.current = null;
    loadBalances();
  };

  const stepOrder: StepRow["key"][] = ["approve", "burn", "fetchAttestation", "mint"];
  const startSteps = () => setSteps(stepOrder.map((key, i) => ({ key, state: i === 0 ? "active" : "pending" })));
  const onKitEvent = (e: unknown) => {
    const ev = e as { method?: string; values?: { txHash?: string } };
    const idx = stepOrder.indexOf(ev?.method as StepRow["key"]);
    if (idx < 0) return;
    const hash = ev.values?.txHash && TX_HASH_RE.test(ev.values.txHash) ? ev.values.txHash : undefined;
    setSteps((prev) => prev.map((s, i) => (i < idx ? { ...s, state: "done" } : i === idx ? { ...s, state: "done", hash: hash ?? s.hash } : i === idx + 1 ? { ...s, state: "active" } : s)));
  };

  /** Finish: check the result, compare the destination balance, save history. */
  const finish = async (res: BridgeRes, before: bigint | null, sent: string) => {
    if (res.state !== "success") throw new Error(res.steps?.find((s) => s.errorMessage)?.errorMessage ?? "BRIDGE_FAILED");
    const hashOf = (re: RegExp) => {
      const h = res.steps?.find((s) => re.test(s.name ?? ""))?.txHash;
      return h && TX_HASH_RE.test(h) ? h : undefined;
    };
    const burn = hashOf(/burn/i);
    const mint = hashOf(/mint/i);
    const after = account ? await readUsdc(toKey, account) : null;
    const got = before !== null && after !== null && after > before ? formatUnits6(after - before) : quote?.receive != null ? fmtNum(quote.receive) : "—";
    const row: HistoryRow = { id: burn ?? `${Date.now()}`, t: Date.now(), from: fromKey, to: toKey, amount: sent, received: got, burn, mint };
    setSummary(row);
    setSteps((p) => p.map((s) => ({ ...s, state: "done" })));
    setPhase("done");
    setCanRetry(false);
    failedRef.current = null;
    loadBalances();
    if (historyKey) {
      const next = [row, ...history].slice(0, 50);
      setHistory(next);
      try {
        window.localStorage.setItem(historyKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    }
  };

  const bridge = async () => {
    if (lockRef.current || !provider || !account || problem || !quote || !units) return; // lock stops double taps
    lockRef.current = true;
    setPhase("bridging");
    setMessage("");
    setCanRetry(false);
    startSteps();
    let kit: KitLike | null = null;
    try {
      /* 1. checks right before sending */
      const accts = (await provider.request({ method: "eth_accounts" })) as string[];
      if (!accts?.[0] || accts[0].toLowerCase() !== account.toLowerCase()) throw new Error("ACCOUNT_CHANGED");
      const balNow = await readUsdc(fromKey, account);
      if (balNow !== null && units > balNow) throw new Error("NO_BALANCE");

      /* 2. fresh quote: stop if you would receive clearly less than what was shown */
      kit = await getKit();
      const adapter = await getAdapter();
      const params: BridgeArgs = { from: { adapter, chain: fromKey }, to: { adapter, chain: toKey }, amount: cleanAmount, token: "USDC", config: { transferSpeed: speed } };
      const fresh = await kit.estimateBridge(params);
      const freshFees = Array.isArray(fresh?.fees) ? fresh.fees : null;
      if (freshFees && quote.receive !== null) {
        const fee = freshFees.filter((f) => !/gas/i.test(f.type ?? "") && (f.token ?? "USDC").toUpperCase() === "USDC").reduce((a, f) => a + (Number(f.amount) || 0), 0);
        const now = amountNum - fee;
        if (now <= 0) throw new Error("TOO_SMALL");
        if (now < quote.receive * (1 - RECEIVE_DRIFT)) {
          setQuote({ ...quote, receive: now, bridgeFee: fee });
          throw new Error("QUOTE_CHANGED");
        }
        // for Fast transfers, cap the fee a little above the quote (the kit falls back to Standard if the fee goes above it)
        if (speed === "FAST" && fee > 0) params.config = { transferSpeed: "FAST", maxFee: (Math.ceil(fee * 1.2 * 1e6) / 1e6).toFixed(6) };
      }

      /* 3. run the bridge. The wallet is switched to each network as needed. */
      const before = await readUsdc(toKey, account);
      kit.on?.("*", onKitEvent);
      executingRef.current = true;
      const res = await kit.bridge(params);
      executingRef.current = false;
      failedRef.current = res.state === "success" ? null : res;
      await finish(res, before, tidySent(cleanAmount));
    } catch (e) {
      executingRef.current = false;
      setMessage(explain(e, "The bridge could not be completed."));
      setPhase("failed");
      setCanRetry(!!failedRef.current && !!kit?.retry);
    } finally {
      kit?.off?.("*", onKitEvent);
      executingRef.current = false;
      lockRef.current = false;
    }
  };

  /** Resume a bridge that stopped halfway (for example, USDC was sent but not yet received). */
  const retry = async () => {
    const failed = failedRef.current;
    if (lockRef.current || !failed || !provider || !account) return;
    lockRef.current = true;
    setPhase("bridging");
    setMessage("");
    let kit: KitLike | null = null;
    try {
      kit = await getKit();
      const adapter = await getAdapter();
      const before = await readUsdc(toKey, account);
      kit.on?.("*", onKitEvent);
      executingRef.current = true;
      const res = await kit.retry!(failed, { from: adapter, to: adapter });
      executingRef.current = false;
      failedRef.current = res.state === "success" ? null : res;
      await finish(res, before, tidySent(cleanAmount));
    } catch (e) {
      executingRef.current = false;
      setMessage(explain(e, "The retry could not be completed."));
      setPhase("failed");
      setCanRetry(!!failedRef.current);
    } finally {
      kit?.off?.("*", onKitEvent);
      executingRef.current = false;
      lockRef.current = false;
    }
  };

  const tidySent = (v: string) => fmtNum(Number(v));

  /* main button */
  let action: { label: ReactNode; onClick: () => void; disabled: boolean };
  if (!account) action = { label: "Connect wallet", onClick: () => {}, disabled: true };
  else if (busy) action = { label: <span className="flex items-center gap-3"><Spinner />Bridging</span>, onClick: () => {}, disabled: true };
  else action = { label: "Bridge", onClick: bridge, disabled: !!problem || !quote || quoting };

  const amountFont = amount.length > 9 ? "clamp(1.25rem, 5vw, 1.375rem)" : amount.length > 6 ? "clamp(1.375rem, 5.6vw, 1.625rem)" : "clamp(1.5rem, 6.5vw, 1.875rem)";
  const slow = speed === "SLOW";

  return (
    <main className={`${brandFont.className} relative min-h-screen overflow-x-hidden bg-[#010205] text-white selection:bg-[#167cff]/30`}>
      <style>{`
        @keyframes backgroundFloat{0%,100%{transform:translate3d(-50%,0,0) scale(1)}50%{transform:translate3d(-46%,2vw,0) scale(1.08)}}
        @keyframes backgroundFloatReverse{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(5vw,-3vw,0) scale(1.12)}}
        @keyframes twinkle{0%,100%{opacity:.12}50%{opacity:.9}}
        @keyframes floatUp{0%{transform:translateY(0);opacity:0}15%{opacity:.7}100%{transform:translateY(-220px);opacity:0}}
        @keyframes checkPop{0%{opacity:0;transform:scale(.3)}100%{opacity:1;transform:scale(1)}}
        @keyframes checkDraw{to{stroke-dashoffset:0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
        .fade-up{opacity:0;animation:fadeUp .9s cubic-bezier(.2,.7,.2,1) forwards;animation-delay:var(--delay,0ms)}
        @media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-delay:0s!important;animation-iteration-count:1!important}.fade-up{opacity:1}}
      `}</style>

      <SpaceBackground />

      <div className="relative z-10">
        <Header />

        {/* phones: normal size. Screens 900px+ wide: content at 90% (same as the Swap page). */}
        <section className={`pb-20 pt-8 sm:pt-12 lg:pb-32 lg:pt-14 min-[900px]:[zoom:0.9] ${CONTAINER}`}>
          <div className="fade-up mx-auto max-w-2xl text-center">
            <h1 className="text-[2.4rem] font-bold leading-[1.05] tracking-[-0.035em] sm:text-[3.9rem]">
              Bridge <span className="bg-gradient-to-r from-[#18bfff] via-[#2588ff] to-[#4262ff] bg-clip-text text-transparent">USDC</span>
            </h1>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-6 text-slate-400 sm:mt-4 sm:text-lg sm:leading-7">Move USDC between Arc and other networks.</p>
          </div>

          <div className="fade-up relative mx-auto mt-10 w-full max-w-lg sm:mt-12" style={{ "--delay": "150ms" } as CSSProperties}>
            <div className="absolute -inset-10 rounded-full bg-[#1675ff]/10 blur-3xl" />
            <div className="relative rounded-[1.75rem] border border-white/[0.08] bg-[#050a16]/80 p-4 shadow-[0_30px_100px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:rounded-[2rem] sm:p-7">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 sm:pb-4">
                <div>
                  <p className="text-xs text-slate-500">Route</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                    {CHAINS[fromKey].label}
                    <span className="text-slate-500">to</span>
                    {CHAINS[toKey].label}
                  </p>
                </div>
                <button type="button" onClick={() => setModal("history")} aria-label="Bridge history" title="Bridge history" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/[0.07] hover:text-white">
                  <Svg d={ICON_HISTORY} />
                </button>
              </div>

              {phase === "bridging" || phase === "done" || (phase === "failed" && steps.length > 0) ? (
                /* progress / result */
                <div className="mt-5">
                  {phase === "done" && summary && (
                    <div className="mb-5 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center" style={{ animation: "checkPop .55s cubic-bezier(.2,1.3,.3,1) both" }}>
                        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 6px rgba(52,211,153,0.9)) drop-shadow(0 0 18px rgba(52,211,153,0.55))" }}>
                          <path d="m4.5 12.5 5 5L19.5 6.5" strokeDasharray="24" strokeDashoffset="24" style={{ animation: "checkDraw .45s ease-out .2s forwards" }} />
                        </svg>
                      </div>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight">Bridge succeeded</h2>
                      <dl className="mt-6 space-y-3 text-left text-[15px]">
                        <div className="flex items-center justify-between gap-4"><dt className="text-slate-400">Sent</dt><dd className="font-semibold tabular-nums">{summary.amount} USDC</dd></div>
                        <div className="flex items-center justify-between gap-4"><dt className="text-slate-400">Received</dt><dd className="font-semibold tabular-nums">{summary.received} USDC</dd></div>
                        <div className="flex items-center justify-between gap-4"><dt className="text-slate-400">Route</dt><dd className="font-semibold">{CHAINS[summary.from].label} to {CHAINS[summary.to].label}</dd></div>
                      </dl>
                    </div>
                  )}

                  <ol className="space-y-2.5">
                    {steps.map((s) => (
                      <li key={s.key} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                          {s.state === "done" ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
                          ) : s.state === "active" && phase === "bridging" ? (
                            <Spinner />
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-white/20" />
                          )}
                        </span>
                        <span className={`min-w-0 flex-1 text-sm ${s.state === "pending" ? "text-slate-500" : "text-white"}`}>{STEP_LABEL(s.key, fromKey, toKey)}</span>
                        {s.hash && (
                          <a href={txUrl(s.key === "mint" ? toKey : fromKey, s.hash)} target="_blank" rel="noreferrer" className="text-xs font-medium text-[#65caff] hover:text-white">View</a>
                        )}
                      </li>
                    ))}
                  </ol>

                  {phase === "bridging" && (
                    <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                      Confirm each prompt in your wallet. Keep this page open until it finishes{slow ? "; Standard can take 15 minutes or more" : ""}.
                    </p>
                  )}
                  {phase === "failed" && (
                    <div className="mt-4">
                      <p className="text-center text-sm text-red-300">{message}</p>
                      {canRetry && (
                        <>
                          <p className="mt-2 text-center text-xs leading-5 text-slate-400">If USDC already left {CHAINS[fromKey].label}, do not send it again. Use Resume instead.</p>
                          <button onClick={retry} className={`${BUTTON} mt-3`}>Resume bridge</button>
                        </>
                      )}
                    </div>
                  )}
                  {(phase === "done" || phase === "failed") && (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {phase === "done" && summary?.burn && (
                        <a href={txUrl(summary.from, summary.burn)} target="_blank" rel="noreferrer" className={SECONDARY_BUTTON}>View on explorer</a>
                      )}
                      <button onClick={reset} className={phase === "done" ? BUTTON : `${SECONDARY_BUTTON} sm:col-span-2`}>{phase === "done" ? "Bridge again" : "Back"}</button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="mt-4 sm:mt-5">
                    {/* from */}
                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3.5 transition focus-within:border-[#2588ff]/60 focus-within:bg-white/[0.05] sm:p-4">
                      <div className="flex items-center justify-between gap-3 text-[13px] font-medium text-slate-400">
                        <span>From</span>
                        <span className="text-xs tabular-nums">{ready && balance !== null ? `Balance ${formatUnits6(balance)} USDC` : "Balance —"}</span>
                      </div>
                      <div className="mt-2.5">
                        <ChainButton chain={fromKey} onClick={dir === "in" ? () => setModal("chain") : undefined} disabled={busy} />
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <input
                          value={amount}
                          onChange={(e) => {
                            const v = e.target.value.replace(",", ".");
                            if (v === "" || /^\d*\.?\d{0,6}$/.test(v)) setAmount(v);
                          }}
                          inputMode="decimal"
                          placeholder="0.00"
                          autoComplete="off"
                          aria-label="Amount of USDC to bridge"
                          style={{ fontSize: amountFont, fontWeight: 600, lineHeight: 1.1, fontFamily: manrope.style.fontFamily }}
                          className="w-full min-w-0 flex-1 bg-transparent tabular-nums tracking-tight text-white outline-none placeholder:text-slate-700"
                        />
                        <span className="flex shrink-0 items-center gap-2 rounded-full bg-white/[0.07] py-1 pl-1 pr-3 text-[15px] font-semibold sm:py-1.5 sm:pl-1.5 sm:text-base"><UsdcLogo size={30} />USDC</span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between gap-3">
                        <p className="text-sm text-slate-500 tabular-nums">{fmtUsd(amountNum)}</p>
                        <div className="flex gap-1.5">
                          <Pill onClick={() => setFraction(true)} disabled={!ready || balance === null}>50%</Pill>
                          <Pill onClick={() => setFraction(false)} disabled={!ready || balance === null}>Max</Pill>
                        </div>
                      </div>
                    </div>

                    {/* flip */}
                    <div className="relative z-10 -my-3 flex justify-center">
                      <button type="button" onClick={flip} aria-label="Switch direction" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] bg-[#071025] text-[#55c5ff] shadow-lg transition hover:border-[#2f8bff]/50 hover:text-white sm:h-10 sm:w-10">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform .4s ease", transform: `rotate(${flips * 180}deg)` }}>
                          <path d="M7 4v13m0 0-3-3m3 3 3-3M17 20V7m0 0-3 3m3-3 3 3" />
                        </svg>
                      </button>
                    </div>

                    {/* to */}
                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3.5 sm:p-4">
                      <div className="flex items-center justify-between gap-3 text-[13px] font-medium text-slate-400">
                        <span>To</span>
                        <span className="text-xs tabular-nums">{ready && destBalance !== null ? `Balance ${formatUnits6(destBalance)} USDC` : "Balance —"}</span>
                      </div>
                      <div className="mt-2.5">
                        <ChainButton chain={toKey} onClick={dir === "out" ? () => setModal("chain") : undefined} disabled={busy} />
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className={`min-w-0 flex-1 truncate tabular-nums tracking-tight ${quote && quote.receive !== null ? "text-white" : "text-slate-700"}`} style={{ fontSize: amountFont, fontWeight: 600, lineHeight: 1.1, fontFamily: manrope.style.fontFamily }}>
                          {quote && quote.receive !== null ? fmtNum(Math.max(quote.receive, 0)) : quoting ? "…" : "0.00"}
                        </div>
                        <span className="flex shrink-0 items-center gap-2 rounded-full bg-white/[0.07] py-1 pl-1 pr-3 text-[15px] font-semibold sm:py-1.5 sm:pl-1.5 sm:text-base"><UsdcLogo size={30} />USDC</span>
                      </div>
                      <p className="mt-1.5 text-sm text-slate-500 tabular-nums">{quote && quote.receive !== null ? fmtUsd(Math.max(quote.receive, 0)) : fmtUsd(0)}</p>
                    </div>

                    {/* speed */}
                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-full bg-white/[0.05] p-1">
                      {(["FAST", "SLOW"] as const).map((m) => (
                        <button key={m} onClick={() => setSpeed(m)} className={`rounded-full py-2 text-sm font-semibold transition ${speed === m ? "bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] text-white" : "text-slate-400 hover:text-white"}`}>
                          {m === "FAST" ? "Fast" : "Standard"}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 px-1 text-xs leading-5 text-slate-500">
                      {speed === "FAST" ? "Fast: credited in seconds, with a small fee." : "Standard: waits for the source network to finalize and can take 15 minutes or more. Lowest fee."}
                    </p>
                  </div>

                  {quote && (
                    <dl className="mt-4 space-y-2 px-1 text-[13px] sm:text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Bridge fee</dt>
                        <dd className="text-right text-slate-300 tabular-nums">{quote.bridgeFee === null ? "—" : `${fmtNum(quote.bridgeFee)} USDC`}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Network fee</dt>
                        <dd className="text-right text-slate-300 tabular-nums">{quote.gas.length ? quote.gas.join(" + ") : "Paid in your wallet"}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Estimated time</dt>
                        <dd className="text-right text-slate-300">{quote.speed === "FAST" ? "Seconds to a few minutes" : "15+ minutes"}</dd>
                      </div>
                      {quote.bridgeFee === null && <p className="text-xs leading-5 text-amber-300">Couldn&apos;t read the fee. Check the amounts in your wallet before you confirm.</p>}
                    </dl>
                  )}

                  <button onClick={action.onClick} disabled={action.disabled} className={`${BUTTON} mt-5 sm:mt-6`}>{action.label}</button>

                  <div className="mt-3 min-h-5 text-center text-sm" role="status">
                    {!busy && ready && problem && amount ? (
                      <span className={problem.hard ? "text-red-300" : "text-slate-500"}>{problem.text}</span>
                    ) : !busy && ready && quoteError ? (
                      <span className="text-red-300">{quoteError}</span>
                    ) : !busy && ready && quoting ? (
                      <span className="text-slate-500">Getting your quote…</span>
                    ) : message ? (
                      <span className="text-slate-400">{message}</span>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>

          <ul className="fade-up mx-auto mt-8 flex max-w-lg flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-500" style={{ "--delay": "300ms" } as CSSProperties}>
            <li>Powered by Circle CCTP</li>
            <li>Sent to your own wallet address</li>
            <li>Your wallet asks you to switch networks when needed</li>
          </ul>
        </section>
      </div>

      {/* ---------- choose the other network ---------- */}
      <Modal open={modal === "chain"} onClose={() => setModal(null)} title="Select a network">
        <ul className="space-y-1">
          {PARTNERS.map((k) => (
            <li key={k}>
              <button
                onClick={() => {
                  setPartner(k);
                  setAmount("");
                  setModal(null);
                }}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/[0.06] ${k === partner ? "bg-white/[0.05]" : ""}`}
              >
                <ChainLogo chain={k} size={36} />
                <span className="min-w-0 flex-1 text-base font-semibold">{CHAINS[k].label}</span>
                <span className="text-xs text-slate-500">gas: {CHAINS[k].gas}</span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>

      {/* ---------- history ---------- */}
      <Modal open={modal === "history"} onClose={() => setModal(null)} title="Bridge history">
        {!account ? (
          <p className="py-6 text-center text-sm text-slate-500">Connect your wallet to see your bridges.</p>
        ) : history.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No bridges yet. Bridges you make here will show up in this list.</p>
        ) : (
          <ul className="space-y-1">
            {history.map((h) => (
              <li key={h.id}>
                <a href={h.burn ? txUrl(h.from, h.burn) : CHAINS[h.from].explorer} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-white/[0.06]">
                  <span className="flex -space-x-2"><ChainLogo chain={h.from} size={26} /><ChainLogo chain={h.to} size={26} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold tabular-nums">{h.amount} USDC</span>
                    <span className="block truncate text-xs text-slate-500">{CHAINS[h.from].label} to {CHAINS[h.to].label} · received {h.received}</span>
                  </span>
                  <span className="text-xs text-slate-500">{timeAgo(h.t)}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
        {account && <p className="mt-4 border-t border-white/[0.06] pt-4 text-xs text-slate-500">Shows bridges made on this device.</p>}
      </Modal>
    </main>
  );
}
