"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties, type ReactNode } from "react";
import { Inter, Manrope } from "next/font/google";
import { useAccount } from "wagmi";
import dynamic from "next/dynamic";
import Header from "@/components/Header";

const brandFont = Inter({ subsets: ["latin"], display: "swap" });
const manrope = Manrope({ subsets: ["latin"], weight: ["600", "700"], display: "swap" });

/* ---------- networks ---------- */
type ChainKey = string;
type ChainDef = {
  type?: string;
  chain: string;
  name: string;
  chainId?: number;
  isTestnet?: boolean;
  nativeCurrency?: { symbol?: string };
  explorerUrl?: string;
  rpcEndpoints?: string[];
  usdcAddress?: string | null;
  forwarderSupported?: { source?: boolean; destination?: boolean };
};
type ChainView = {
  key: ChainKey;
  label: string;
  chainId: number;
  usdc: string;
  gas: string;
  color: string;
  icons: string[];
  white: boolean;
  rpcs: string[];
  explorer: (hash: string) => string;
  lifi?: boolean;
};

type Fallback = { label: string; chainId: number; usdc: string; explorer: string; color: string; gas: string; icons: string[] };
const FALLBACK: Record<string, Fallback> = {
  Arc: { label: "Arc", chainId: 5042, usdc: "0x3600000000000000000000000000000000000000", explorer: "https://explorer.arc.io", color: "#12b9ff", gas: "USDC", icons: ["arc", "arc-network", "circle-arc"] },
  Ethereum: { label: "Ethereum", chainId: 1, usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", explorer: "https://etherscan.io", color: "#627EEA", gas: "ETH", icons: ["ethereum"] },
  Base: { label: "Base", chainId: 8453, usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", explorer: "https://basescan.org", color: "#0052FF", gas: "ETH", icons: ["base"] },
  Arbitrum: { label: "Arbitrum", chainId: 42161, usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", explorer: "https://arbiscan.io", color: "#28A0F0", gas: "ETH", icons: ["arbitrum-one", "arbitrum"] },
  Optimism: { label: "OP Mainnet", chainId: 10, usdc: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", explorer: "https://optimistic.etherscan.io", color: "#FF0420", gas: "ETH", icons: ["optimism"] },
  Polygon: { label: "Polygon", chainId: 137, usdc: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", explorer: "https://polygonscan.com", color: "#8247E5", gas: "POL", icons: ["polygon"] },
  Avalanche: { label: "Avalanche", chainId: 43114, usdc: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", explorer: "https://snowtrace.io", color: "#E84142", gas: "AVAX", icons: ["avalanche"] },
  Unichain: { label: "Unichain", chainId: 130, usdc: "0x078D782b760474a361dDA0AF3839290b0EF57AD6", explorer: "https://uniscan.xyz", color: "#F50DB4", gas: "ETH", icons: ["unichain"] },
  Linea: { label: "Linea", chainId: 59144, usdc: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff", explorer: "https://lineascan.build", color: "#3ABFE5", gas: "ETH", icons: ["linea"] },
};
const ICON_GUESS: Record<string, string[]> = { World_Chain: ["world"], Sonic: ["sonic"], Sei: ["sei-network"], Ink: ["ink"], Plume: ["plume"], Monad: ["monad"], HyperEVM: ["hyper-evm"], XDC: ["xdc"], Codex: ["codex"] };
const WHITE_LOGOS = new Set(["arc", "linea", "sonic", "worldchain"]);

const ALLOWED_NORM = new Set(["arbitrum", "arc", "avalanche", "base", "codex", "ethereum", "hyperevm", "ink", "linea", "monad", "optimism", "opmainnet", "plume", "polygon", "polygonpos", "sei", "sonic", "unichain", "worldchain", "xdc"]);
const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
const ICON_GUESS_N: Record<string, string[]> = Object.fromEntries(Object.entries(ICON_GUESS).map(([k, v]) => [norm(k), v]));
const ORDER = ["Arc", "Ethereum", "Base", "Arbitrum", "Optimism", "Polygon", "Avalanche", "Unichain", "Linea", "Robinhood"];
const ROBINHOOD_KEY = "Robinhood";

const FORWARDER_DEST = ["Arc", "Arbitrum", "Avalanche", "Base", "Ethereum", "HyperEVM", "Ink", "Linea", "Monad", "Optimism", "Polygon", "Sei", "Sonic", "Unichain", "World_Chain"];

const FAST_SOURCES = ["Arbitrum", "Base", "Codex", "Edge", "Ethereum", "Ink", "Linea", "Morph", "Optimism", "Plume", "Unichain", "World_Chain", "X_Layer"];
const STANDARD_TIME: Record<string, string> = {
  Arc: "~1 sec",
  Avalanche: "~8 sec",
  Polygon: "~8 sec",
  Ethereum: "~15–19 min",
  Base: "~15–19 min",
  Arbitrum: "~15–19 min",
  Optimism: "~15–19 min",
  Unichain: "~15–19 min",
  World_Chain: "~15–19 min",
  Ink: "~15–19 min",
  Codex: "~15–19 min",
  Linea: "~6–32 hours",
};
const fastTime = (key: string) => (key === "Ethereum" ? "~20 sec" : "~8 sec");

const ARC_RPCS = [
  "/api/arc-rpc",
  "https://rpc.mainnet.arc.io",
  "https://rpc.blockdaemon.mainnet.arc.io",
  "https://rpc.drpc.mainnet.arc.io",
  "https://rpc.quicknode.mainnet.arc.io",
];

/* ---------- safety limits ---------- */
const DECIMALS = 6;
const ARC_GAS_RESERVE = BigInt(20000);
const TX_HASH_RE = /^0x[0-9a-fA-F]{64}$/;
const ADDR_RE = /^0x[0-9a-fA-F]{40}$/;
const AUTO_SLIPPAGE = 0.5;
const SLIP_PRESETS = ["0.1", "0.5", "1", "3", "5"];
const FALLBACK_GAS_UNITS = 230000;

const CONTAINER = "w-full px-4 sm:px-8 lg:px-10";
const CHAIN_NAME_WEIGHT = 650;

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
const fmtGas = (n: number) => (n <= 0 ? "0" : n >= 1 ? n.toFixed(3) : n >= 0.001 ? n.toFixed(4) : n >= 0.000001 ? n.toFixed(6).replace(/0+$/, "") : "<0.000001");
const chainNum = (id: unknown) => (typeof id === "string" ? (id.startsWith("0x") ? parseInt(id, 16) : parseInt(id, 10)) : typeof id === "number" ? id : NaN);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const timeAgo = (t: number) => {
  const s = Math.max(1, Math.round((Date.now() - t) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  return new Date(t).toLocaleDateString();
};
const colorFor = (s: string) => `hsl(${Array.from(s).reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7)} 65% 50%)`;

/* ---------- wallet + App Kit types ---------- */
type Eip1193 = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (arg: unknown) => void) => void;
  removeListener?: (event: string, handler: (arg: unknown) => void) => void;
};
type Fee = { type?: string; token?: string; amount?: string };
type GasItem = { name?: string; token?: string; blockchain?: string; fees?: { fee?: string } | null; fee?: string; amount?: string };
type StepRes = { name?: string; state?: string; txHash?: string; errorMessage?: string };
type BridgeRes = { state?: string; steps?: StepRes[] };
type Dest = { adapter?: unknown; chain: string; recipientAddress?: string; useForwarder?: boolean };
type BridgeArgs = {
  from: { adapter: unknown; chain: string };
  to: Dest;
  amount: string;
  token: "USDC";
  config?: { transferSpeed?: "FAST" | "SLOW"; maxFee?: string };
};
type KitLike = {
  getSupportedChains: (op?: string) => unknown;
  estimateBridge: (p: BridgeArgs) => Promise<{ fees?: Fee[]; gasFees?: GasItem[] }>;
  bridge: (p: BridgeArgs) => Promise<BridgeRes>;
  retry?: (failed: BridgeRes, ctx: { from: unknown; to: unknown }) => Promise<BridgeRes>;
  on?: (event: string, handler: (e: unknown) => void) => void;
  off?: (event: string, handler: (e: unknown) => void) => void;
};
type ReadClient = {
  readContract: (args: unknown) => Promise<unknown>;
  getBalance: (args: { address: string }) => Promise<bigint>;
  getGasPrice: () => Promise<bigint>;
};

type GasFee = { amount: number; token: string };
type Quote = { receive: number | null; bridgeFee: number | null; deliveryFee: number; gas: GasFee[]; gasApprox: boolean; fast: boolean };
type StepKey = "approve" | "burn" | "fetchAttestation" | "mint";
type StepState = "pending" | "active" | "done" | "error";
type StepRow = { key: StepKey; state: StepState; hash?: string };
type HistoryRow = { id: string; t: number; from: ChainKey; to: ChainKey; amount: string; received: string; burn?: string; mint?: string; recipient?: string };
type Phase = "idle" | "bridging" | "done" | "failed";
type Slip = { mode: "auto" | "custom"; custom: string };
const STEP_ORDER: StepKey[] = ["approve", "burn", "fetchAttestation", "mint"];

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

const LifiWidget = dynamic(() => import("@/components/LifiWidget"), {
  ssr: false,
  loading: () => <div className="h-[520px] w-full animate-pulse rounded-[1.5rem] border border-white/[0.08] bg-white/[0.03]" aria-label="Loading the bridge" />,
});

function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
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
    <div className={`fixed inset-0 z-[95] flex items-center justify-center ${wide ? "px-2 sm:px-4" : "px-4"}`} role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/65" onClick={onClose} />
      <div className={`relative max-h-[85vh] w-full overflow-y-auto rounded-3xl border border-white/[0.1] bg-[#080a0d] p-5 shadow-[0_25px_80px_rgba(0,0,0,0.65)] ${wide ? "max-w-[calc(100vw-1rem)] sm:max-w-xl" : "max-w-sm"}`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.04] text-base text-white/45 transition hover:bg-white/[0.08] hover:text-white">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Popup({ children, onClose, label }: { children: ReactNode; onClose?: () => void; label: string }) {
  return (
    <div className="fixed inset-0 z-[96] flex items-end justify-center sm:items-center sm:px-4" role="dialog" aria-modal="true" aria-label={label}>
      <div className="absolute inset-0 bg-black/65" onClick={onClose} />
      <div className="popup-panel relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[1.75rem] border border-white/[0.1] bg-[#080a0d] p-5 pb-8 shadow-[0_25px_80px_rgba(0,0,0,0.65)] sm:rounded-3xl sm:p-6">
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
const ICON_SETTINGS = "M20 7h-9M14 17H5M17 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM7 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z";
const ICON_FAST = "M13 2 3 14h9l-1 8 10-12h-9l1-8z";

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

/* ---------- logos ---------- */
type IconComp = ComponentType<Record<string, unknown>>;
let networkIconPromise: Promise<IconComp | null> | null = null;
const loadNetworkIcon = () => {
  if (!networkIconPromise) {
    networkIconPromise = import("@web3icons/react/dynamic")
      .then((m) => (m as unknown as { NetworkIcon: IconComp }).NetworkIcon)
      .catch(() => null);
  }
  return networkIconPromise;
};

const GlobeMark = ({ size }: { size: number }) => (
  <svg width={size * 0.66} height={size * 0.66} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <ellipse cx="12" cy="12" rx="4" ry="9" />
    <path d="M3 12h18M4.5 7.5h15M4.5 16.5h15" />
  </svg>
);

function ChainLogo({ view, size = 28 }: { view: ChainView | undefined; size?: number }) {
  const [Icon, setIcon] = useState<IconComp | null>(null);
  const [idx, setIdx] = useState(0);
  const [hasSvg, setHasSvg] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const holder = useRef<HTMLSpanElement>(null);
  const attempts = view ? [...view.icons, "#chainId"] : [];
  const gaveUp = !!Icon && idx >= attempts.length;

  useEffect(() => {
    if (!view?.icons.length) return;
    let live = true;
    loadNetworkIcon().then((c) => {
      if (live && c) setIcon(() => c);
    });
    return () => {
      live = false;
    };
  }, [view?.icons.length, view?.key]);

  useEffect(() => {
    const el = holder.current;
    if (!Icon || !el) return;
    const check = () => setHasSvg(!!el.querySelector("svg"));
    check();
    const mo = new MutationObserver(check);
    mo.observe(el, { childList: true, subtree: true });
    const t = setTimeout(() => {
      if (!el.querySelector("svg")) setIdx((i) => i + 1);
    }, 700);
    return () => {
      mo.disconnect();
      clearTimeout(t);
    };
  }, [Icon, idx]);

  if (!view) return <span className="shrink-0 rounded-full bg-white/10" style={{ width: size, height: size }} />;

  const white = view.white;
  const attempt = attempts[idx];
  const isWorld = norm(view.key) === "worldchain";
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{ width: size, height: size, background: hasSvg ? "#101827" : view.key === "Arc" && !imgFailed ? "transparent" : isWorld ? "#101827" : view.color, border: hasSvg || isWorld ? "1px solid rgba(255,255,255,0.12)" : "none" }}
      aria-label={view.label}
    >
      {!hasSvg &&
        (view.key === "Arc" && !imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/arc-logo.png" alt="Arc" onError={() => setImgFailed(true)} className="h-full w-full rounded-full object-cover" />
        ) : isWorld ? (
          <GlobeMark size={size} />
        ) : (
          <span className="font-bold text-white" style={{ fontSize: size * 0.45 }}>{view.label[0]}</span>
        ))}
      {Icon && !gaveUp && attempt && (
        <span
          ref={holder}
          key={attempt}
          className="absolute inset-0 flex items-center justify-center [&>svg]:h-full [&>svg]:w-full"
          style={{ padding: hasSvg ? size * 0.15 : 0, opacity: hasSvg ? 1 : 0, color: white ? "#ffffff" : undefined }}
        >
          {attempt === "#chainId" ? (
            <Icon chainId={view.chainId} variant={white ? "mono" : "branded"} size={Math.round(size * 0.7)} />
          ) : (
            <Icon id={attempt} variant={white ? "mono" : "branded"} size={Math.round(size * 0.7)} />
          )}
        </span>
      )}
    </span>
  );
}

function UsdcLogo({ size = 36 }: { size?: number }) {
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

function ChainButton({ view, onClick, disabled }: { view: ChainView | undefined; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={`Choose network, now ${view?.label ?? ""}`} className="inline-flex items-center gap-2.5 rounded-full bg-white/[0.07] py-1 pl-1 pr-3 text-[15px] font-semibold transition hover:bg-white/[0.12] disabled:opacity-60 sm:py-1.5 sm:pl-1.5 sm:pr-3.5 sm:text-base">
      <ChainLogo view={view} size={30} />
      <span style={{ fontWeight: CHAIN_NAME_WEIGHT }}>{view?.label ?? "Select"}</span>
      <span className="text-slate-400"><Chevron /></span>
    </button>
  );
}

const STEP_LABEL = (key: StepKey, fromLabel: string, toLabel: string, forwarder: boolean) =>
  ({
    approve: `Approve USDC on ${fromLabel}`,
    burn: `Send USDC from ${fromLabel}`,
    fetchAttestation: "Circle confirms the transfer",
    mint: forwarder ? `Circle delivers USDC on ${toLabel}` : `Receive USDC on ${toLabel}`,
  })[key];

function Road({ steps, phase, fromLabel, toLabel, forwarder }: { steps: StepRow[]; phase: Phase; fromLabel: string; toLabel: string; forwarder: boolean }) {
  const sub = (s: StepRow): string => {
    if (s.state === "done") return "Done";
    if (s.state === "error") return "Stopped";
    if (s.state === "active" && phase === "bridging") return s.key === "fetchAttestation" ? "Waiting for Circle" : s.key === "mint" && forwarder ? "Circle is delivering" : "Confirm in your wallet";
    return "Waiting";
  };
  return (
    <ol className="relative px-1">
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        const next = steps[i + 1];
        const lit = s.state === "done" && next?.state === "done";
        const flowing = s.state === "done" && next?.state === "active" && phase === "bridging";
        const broken = next?.state === "error" || s.state === "error";
        const lineStyle: CSSProperties = lit
          ? { background: "linear-gradient(180deg,#34d399,#39c4ff)", boxShadow: "0 0 12px rgba(57,196,255,0.85), 0 0 24px rgba(52,211,153,0.4)" }
          : flowing
          ? { background: "linear-gradient(180deg,rgba(57,196,255,0.12) 0%,#39c4ff 50%,rgba(57,196,255,0.12) 100%)", backgroundSize: "100% 56px", backgroundRepeat: "repeat-y", animation: "roadFlow 1.1s linear infinite", boxShadow: "0 0 12px rgba(57,196,255,0.7)" }
          : broken
          ? { background: "linear-gradient(180deg,rgba(248,113,113,0.5),rgba(248,113,113,0.1))" }
          : { background: "rgba(255,255,255,0.1)" };
        const nodeCls =
          s.state === "done"
            ? "border border-emerald-300 bg-emerald-400/15 text-emerald-300 shadow-[0_0_16px_rgba(52,211,153,0.75)]"
            : s.state === "error"
            ? "border border-red-400 bg-red-400/10 text-red-300 shadow-[0_0_16px_rgba(248,113,113,0.6)]"
            : s.state === "active"
            ? "border-2 border-[#39c4ff] bg-[#08162d] text-[#8fe3ff]"
            : "border border-white/15 bg-white/[0.03] text-slate-500";
        return (
          <li key={s.key} className={`relative flex gap-4 ${last ? "" : "pb-7"}`}>
            {!last && <span aria-hidden className="absolute left-4 top-9 -bottom-0 w-[3px] -translate-x-1/2 rounded-full" style={lineStyle} />}
            <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${nodeCls}`} style={s.state === "active" && phase === "bridging" ? { animation: "nodePulse 1.6s ease-in-out infinite" } : undefined}>
              {s.state === "done" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
              ) : s.state === "error" ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
              ) : (
                i + 1
              )}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className={`text-sm font-semibold leading-5 ${s.state === "pending" ? "text-slate-500" : s.state === "error" ? "text-red-200" : "text-white"}`}>{STEP_LABEL(s.key, fromLabel, toLabel, forwarder)}</p>
              <p className="mt-0.5 text-xs text-slate-400">{sub(s)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function explain(e: unknown, fallback: string, gasCoin = "gas coin"): string {
  const err = e as { code?: number | string; message?: string; shortMessage?: string; details?: string; cause?: { code?: number | string; message?: string } };
  const msg = `${err?.shortMessage ?? ""} ${err?.message ?? ""} ${err?.details ?? ""} ${err?.cause?.message ?? ""}`;
  const code = err?.code ?? err?.cause?.code;
  const known: Record<string, string> = {
    NO_WALLET: "Wallet not ready. Reconnect and try again.",
    ACCOUNT_CHANGED: "Your wallet account changed. Reconnect and try again.",
    BAD_AMOUNT: "Enter a valid amount.",
    NO_BALANCE: "Insufficient balance",
    NO_QUOTE: "Couldn't get a quote right now. Try again.",
    QUOTE_CHANGED: "The fees changed more than your slippage allows. Review the new amount and tap Bridge again.",
    TOO_SMALL: "This amount is too small to cover the bridge fees.",
    WRONG_NETWORK: "Switch your wallet to the network you are bridging from, then try again.",
  };
  const trimmed = (err?.message ?? "").trim();
  if (known[trimmed]) return known[trimmed];
  if (/switch.{0,20}(chain|network)|wallet_switchEthereumChain|unrecognized chain|chain.{0,20}not (added|supported)/i.test(msg) && code === 4001) return "You cancelled the network switch in your wallet.";
  if (code === 4001 || code === "ACTION_REJECTED" || /user rejected|user denied|rejected the request|request rejected|denied transaction|user cancel|cancelled by user|canceled by user/i.test(msg)) return "You rejected the request in your wallet.";
  if (/switch.{0,20}(chain|network)|wallet_switchEthereumChain|unrecognized chain/i.test(msg)) return "Your wallet couldn't switch networks. Switch manually and try again.";
  if (/insufficient funds|gas required exceeds|exceeds the balance of the account/i.test(msg)) return `Not enough ${gasCoin} to pay the network fee. Add some and try again.`;
  if (/transfer amount exceeds balance|exceeds balance/i.test(msg)) return "Insufficient USDC balance.";
  if (/nonce too low|replacement transaction underpriced|already known|transaction underpriced/i.test(msg)) return "A transaction is already pending in your wallet. Wait for it to finish, then try again.";
  if (/attestation/i.test(msg)) return "Circle hasn't confirmed the transfer yet. Wait a moment, then try Resume.";
  if (/timeout|timed out|ETIMEDOUT/i.test(msg)) return "The request timed out. Try again. If your USDC already left, use Resume.";
  if (/rate limit|429|too many requests/i.test(msg)) return "The service is busy. Wait a moment and try again.";
  if (/failed to fetch|HTTP request failed|network ?error|ECONN|fetch failed/i.test(msg)) return "Couldn't reach the network. Check your connection and try again.";
  if (/execution reverted|reverted/i.test(msg)) return "The network rejected the transaction. Try a different amount.";
  return trimmed ? trimmed.slice(0, 160) : fallback;
}

/* ---------- page ---------- */
export default function BridgePage() {
  const { address, isConnected, connector } = useAccount();
  const account = isConnected && address ? address : null;

  const [provider, setProvider] = useState<Eip1193 | undefined>(undefined);
  const [walletChain, setWalletChain] = useState<number | null>(null);
  const [defs, setDefs] = useState<ChainDef[]>([]);
  const [fromKey, setFromKey] = useState<ChainKey>("Ethereum");
  const [toKey, setToKey] = useState<ChainKey>("Arc");
  const [flips, setFlips] = useState(0);

  const [amount, setAmount] = useState("");
  const [fast, setFast] = useState(true);
  const [slip, setSlip] = useState<Slip>({ mode: "auto", custom: "1" });

  const [useOther, setUseOther] = useState(false);
  const [otherAddr, setOtherAddr] = useState("");
  const [otherChecked, setOtherChecked] = useState(false);

  const [bals, setBals] = useState<Record<string, bigint | null>>({});
  const [refreshTick, setRefreshTick] = useState(0);
  const [native, setNative] = useState<Record<string, number>>({});

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [fwdBlocked, setFwdBlocked] = useState<Record<string, boolean>>({});

  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [steps, setSteps] = useState<StepRow[]>([]);
  const [summary, setSummary] = useState<HistoryRow | null>(null);
  const [canResume, setCanResume] = useState(false);
  const [usedForwarder, setUsedForwarder] = useState(true);
  const [notice, setNotice] = useState("");

  const [modal, setModal] = useState<null | "from" | "to" | "history" | "settings" | "fast">(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);

  const kitRef = useRef<KitLike | null>(null);
  const adapterRef = useRef<unknown>(null);
  const clientsRef = useRef<Record<string, ReadClient>>({});
  const executingRef = useRef(false);
  const lockRef = useRef(false);
  const failedRef = useRef<BridgeRes | null>(null);
  const stepsRef = useRef<StepRow[]>([]);
  const recipientRef = useRef<string>("");

  const customPct = parseFloat(slip.custom);
  const customValid = Number.isFinite(customPct) && customPct >= 0.01 && customPct <= 50;
  const slipPct = slip.mode === "custom" && customValid ? customPct : AUTO_SLIPPAGE;

  /* ----- network list ----- */
  const views = useMemo(() => {
    const out: Record<string, ChainView> = {};
    const add = (key: string, def?: ChainDef) => {
      if (!ALLOWED_NORM.has(norm(key)) && !ALLOWED_NORM.has(norm(def?.name ?? ""))) return;
      const f = FALLBACK[key];
      const usdc = def?.usdcAddress ?? f?.usdc ?? null;
      const chainId = def?.chainId ?? f?.chainId ?? 0;
      if (!usdc || !chainId) return;
      const tmpl = def?.explorerUrl && def.explorerUrl.startsWith("https://") ? def.explorerUrl : null;
      out[key] = {
        key,
        label: key === "Arc" ? "Arc" : def?.name ?? f?.label ?? key.replace(/_/g, " "),
        chainId,
        usdc,
        gas: key === "Arc" ? "USDC" : def?.nativeCurrency?.symbol ?? f?.gas ?? "",
        color: f?.color ?? colorFor(key),
        icons: f?.icons ?? ICON_GUESS_N[norm(key)] ?? [],
        white: WHITE_LOGOS.has(norm(key)),
        rpcs: key === "Arc" ? ARC_RPCS : def?.rpcEndpoints ?? [],
        explorer: (hash: string) => (tmpl ? (tmpl.includes("{hash}") ? tmpl.replace("{hash}", hash) : `${tmpl.replace(/\/$/, "")}/tx/${hash}`) : `${f?.explorer ?? ""}/tx/${hash}`),
      };
    };
    Object.keys(FALLBACK).forEach((k) => add(k, defs.find((d) => d.chain === k)));
    defs.filter((d) => !d.isTestnet && (d.type ?? "evm") === "evm").forEach((d) => add(d.chain, d));
    out[ROBINHOOD_KEY] = {
      key: ROBINHOOD_KEY,
      label: "Robinhood Chain",
      chainId: 4663,
      usdc: "",
      gas: "ETH",
      color: "#00C805",
      icons: ["robinhood-chain", "robinhood"],
      white: false,
      rpcs: ["https://rpc.mainnet.chain.robinhood.com"],
      explorer: () => "#",
      lifi: true,
    };
    return out;
  }, [defs]);
  const list = useMemo(() => {
    const keys = Object.keys(views);
    return [...ORDER.filter((k) => views[k]), ...keys.filter((k) => !ORDER.includes(k)).sort((a, b) => views[a].label.localeCompare(views[b].label))];
  }, [views]);
  const fromView = views[fromKey];
  const toView = views[toKey];
  const txUrl = (key: ChainKey, hash: string) => views[key]?.explorer(hash) ?? "#";
  const lifiMode = !!fromView?.lifi || !!toView?.lifi;

  const canFast = FAST_SOURCES.includes(fromKey);
  const useFast = fast && canFast;
  const speed: "FAST" | "SLOW" = useFast ? "FAST" : "SLOW";

  const routeKey = `${fromKey}>${toKey}`;
  const defTo = defs.find((d) => d.chain === toKey)?.forwarderSupported?.destination;
  const forwarder = (FORWARDER_DEST.includes(toKey) || defTo === true) && !fwdBlocked[routeKey];

  const otherTrim = otherAddr.trim();
  const otherIsToken = list.some((k) => !!views[k]?.usdc && views[k].usdc.toLowerCase() === otherTrim.toLowerCase());
  const otherValid = useOther && ADDR_RE.test(otherTrim) && !/^0x0{40}$/i.test(otherTrim) && !otherIsToken;
  const recipient = useOther && otherValid ? otherTrim : account ?? "";
  const customRecipient = useOther && otherValid && otherTrim.toLowerCase() !== (account ?? "").toLowerCase();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("alabaamafi:bridge-settings");
      if (raw) {
        const j = JSON.parse(raw) as { fast?: boolean; slip?: Slip };
        if (typeof j.fast === "boolean") setFast(j.fast);
        if (j.slip) setSlip(j.slip);
      }
    } catch {
      return;
    }
  }, []);
  const saveSettings = (next: { fast?: boolean; slip?: Slip }) => {
    const f = next.fast ?? fast;
    const s = next.slip ?? slip;
    setFast(f);
    setSlip(s);
    try {
      window.localStorage.setItem("alabaamafi:bridge-settings", JSON.stringify({ fast: f, slip: s }));
    } catch {
      return;
    }
  };

  useEffect(() => {
    let live = true;
    setProvider(undefined);
    setWalletChain(null);
    if (!connector) return;
    connector.getProvider().then((p) => { if (live) setProvider(p as Eip1193); }).catch(() => {});
    return () => { live = false; };
  }, [connector]);
  useEffect(() => {
    if (!provider) return;
    const read = (id: unknown) => {
      const n = chainNum(id);
      setWalletChain(Number.isNaN(n) ? null : n);
    };
    provider.request({ method: "eth_chainId" }).then(read).catch(() => {});
    provider.on?.("chainChanged", read);
    return () => provider.removeListener?.("chainChanged", read);
  }, [provider]);

  useEffect(() => {
    adapterRef.current = null;
    clientsRef.current = {};
  }, [provider, account]);

  const getKit = async (): Promise<KitLike> => {
    if (!kitRef.current) {
      const { AppKit } = await import("@circle-fin/app-kit");
      kitRef.current = new AppKit() as unknown as KitLike;
    }
    return kitRef.current;
  };

  useEffect(() => {
    let live = true;
    getKit()
      .then((kit) => {
        const all = kit.getSupportedChains("bridge") as ChainDef[];
        if (live && Array.isArray(all)) setDefs(all);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    let live = true;
    const load = async () => {
      try {
        const r = await fetch("/api/market?type=native");
        if (!r.ok) return;
        const j = (await r.json()) as { native?: Record<string, number> };
        if (live) setNative(j.native ?? {});
      } catch {
        return;
      }
    };
    load();
    const id = setInterval(load, 60000);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, []);

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

  const getClient = useCallback(
    async (key: ChainKey): Promise<ReadClient> => {
      const cached = clientsRef.current[key];
      if (cached) return cached;
      const v = views[key];
      if (!v) throw new Error("Unknown network");
      const { createPublicClient, fallback, http, defineChain } = await import("viem");
      const chain = defineChain({ id: v.chainId, name: v.label, nativeCurrency: { name: v.gas, symbol: v.gas || "ETH", decimals: 18 }, rpcUrls: { default: { http: v.rpcs.length ? v.rpcs : ["https://invalid.invalid"] } } });
      const urls = v.rpcs.map((u) => http(u, { retryCount: 1, timeout: 8000 }));
      const client = createPublicClient({ chain: chain as never, transport: fallback([...urls, await guardedWallet(v.chainId)]) }) as unknown as ReadClient;
      clientsRef.current[key] = client;
      return client;
    },
    [views, guardedWallet]
  );

  const readUsdc = useCallback(
    async (key: ChainKey, owner: string): Promise<bigint | null> => {
      try {
        const v = views[key];
        if (!v || !v.usdc) return null;
        const { erc20Abi } = await import("viem");
        const c = await getClient(key);
        return (await c.readContract({ address: v.usdc, abi: erc20Abi, functionName: "balanceOf", args: [owner] })) as bigint;
      } catch {
        return null;
      }
    },
    [getClient, views]
  );

  const bk = (k: ChainKey) => (account ? `${account.toLowerCase()}:${k}` : "");
  const loadOne = useCallback(
    async (k: ChainKey, live: () => boolean) => {
      if (!account || !views[k]?.usdc) return;
      for (let attempt = 0; attempt < 3; attempt++) {
        const v = await readUsdc(k, account);
        if (!live()) return;
        if (v !== null) {
          setBals((p) => ({ ...p, [`${account.toLowerCase()}:${k}`]: v }));
          return;
        }
        await sleep(700);
      }
    },
    [account, readUsdc, views]
  );
  useEffect(() => {
    if (!account) {
      setBals({});
      return;
    }
    if (lifiMode) return;
    let alive = true;
    const live = () => alive;
    loadOne(fromKey, live);
    loadOne(toKey, live);
    (async () => {
      try {
        if (fromKey === "Arc") return;
        const v = await (await getClient(fromKey)).getBalance({ address: account });
        if (alive) setBals((p) => ({ ...p, [`${account.toLowerCase()}:${fromKey}:gas`]: v }));
      } catch {
        return;
      }
    })();
    return () => {
      alive = false;
    };
  }, [account, fromKey, toKey, loadOne, getClient, refreshTick, provider, views, lifiMode]);

  useEffect(() => {
    if (!account || (modal !== "from" && modal !== "to")) return;
    let alive = true;
    list.forEach((k) => {
      if (bals[bk(k)] === undefined) loadOne(k, () => alive);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modal, account, list, loadOne]);

  const balance = bals[bk(fromKey)] ?? null;
  const destBalance = bals[bk(toKey)] ?? null;
  const gasBalance = fromKey === "Arc" ? balance : bals[`${bk(fromKey)}:gas`] ?? null;

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
              transport: fallback([
                ...(chain.id === 5042 ? ARC_RPCS.map((u) => http(u, { retryCount: 1, timeout: 8000 })) : [http()]),
                ...(provider ? [custom({ request: async (args: { method: string; params?: unknown[] }) => { if (chainNum(await provider.request({ method: "eth_chainId" })) !== chain.id) throw new Error("WALLET_ON_OTHER_CHAIN"); return provider.request(args); } } as never)] : []),
              ]),
            }),
          getWalletClient: async ({ chain }: { chain: KitChain }) => {
            if (executingRef.current) await ensureWalletChain(chain);
            return createWalletClient({ account: account as `0x${string}`, chain: chain as never, transport: custom(provider as never) });
          },
        } as never,
        { addressContext: "user-controlled", supportedChains } as never
      );
    }
    return adapterRef.current;
  };

  const destination = (adapter: unknown, to: string): Dest =>
    forwarder ? { recipientAddress: to, chain: toKey, useForwarder: true } : to.toLowerCase() === (account ?? "").toLowerCase() ? { adapter, chain: toKey } : { adapter, chain: toKey, recipientAddress: to };

  /* ---------- derived values ---------- */
  const units = parseUnits6(amount);
  const cleanAmount = amount.endsWith(".") ? amount.slice(0, -1) : amount;
  const amountNum = cleanAmount && Number(cleanAmount) > 0 ? Number(cleanAmount) : 0;
  const busy = phase === "bridging";
  const ready = !!account;
  const wrongNetwork = ready && walletChain !== null && !!fromView && walletChain !== fromView.chainId;

  useEffect(() => {
    setQuote(null);
    setQuoteError("");
    if (lifiMode || !ready || !provider || !units || units <= ZERO || !fromView || !toView || fromKey === toKey || (useOther && !otherValid)) return;
    let live = true;
    setQuoting(true);
    const t = setTimeout(async () => {
      try {
        const kit = await getKit();
        const adapter = await getAdapter();
        let est: Awaited<ReturnType<KitLike["estimateBridge"]>>;
        try {
          est = await kit.estimateBridge({ from: { adapter, chain: fromKey }, to: destination(adapter, recipient), amount: cleanAmount, token: "USDC", config: { transferSpeed: speed } });
        } catch (e) {
          if (forwarder && /forward|relay|unsupported|not supported/i.test((e as Error)?.message ?? "")) {
            if (live) setFwdBlocked((p) => ({ ...p, [routeKey]: true }));
            return;
          }
          throw e;
        }

        const fees = Array.isArray(est?.fees) ? est.fees : null;
        let bridgeFee: number | null = null;
        let deliveryFee = 0;
        const gas: GasFee[] = [];
        if (fees) {
          bridgeFee = 0;
          for (const f of fees) {
            const amt = Number(f.amount);
            if (!Number.isFinite(amt)) continue;
            const token = (f.token ?? "USDC").toUpperCase();
            if (/gas/i.test(f.type ?? "")) gas.push({ amount: amt, token });
            else if (token === "USDC") {
              if (/forward|relay/i.test(f.type ?? "")) deliveryFee += amt;
              else bridgeFee += amt;
            }
          }
        }
        const gasItems = Array.isArray(est?.gasFees) ? est.gasFees : [];
        for (const g of gasItems) {
          const amt = Number(g.fees?.fee ?? g.fee ?? g.amount);
          if (!Number.isFinite(amt) || amt <= 0) continue;
          const chainSym = (g.blockchain && views[g.blockchain]?.gas) || fromView.gas;
          const tok = (g.token && g.token.toUpperCase() !== "NATIVE" ? g.token : chainSym).toUpperCase();
          gas.push({ amount: amt, token: tok });
        }
        let gasApprox = false;
        if (!gas.length) {
          try {
            const price = await (await getClient(fromKey)).getGasPrice();
            gas.push({ amount: (Number(price) * FALLBACK_GAS_UNITS) / 1e18, token: fromView.gas || "ETH" });
            gasApprox = true;
          } catch {
            gasApprox = false;
          }
        }
        const receive = bridgeFee === null ? null : amountNum - bridgeFee - deliveryFee;
        if (live) setQuote({ receive, bridgeFee, deliveryFee, gas, gasApprox, fast: useFast });
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
  }, [ready, provider, fromKey, toKey, cleanAmount, speed, account, views, forwarder, recipient, useOther, otherValid]);

  /* ---------- validation ---------- */
  const reserve = fromKey === "Arc" ? ARC_GAS_RESERVE : ZERO;
  const problem = useMemo((): { text: string; hard: boolean } | null => {
    if (fromKey === toKey) return { text: "Choose two different networks", hard: true };
    if (useOther) {
      if (!otherTrim) return { text: "Enter the recipient address", hard: false };
      if (otherIsToken) return { text: "That is a USDC contract address, not a wallet", hard: true };
      if (!otherValid) return { text: "Enter a valid wallet address", hard: true };
      if (customRecipient && !otherChecked) return { text: "Confirm the recipient address above", hard: false };
    }
    if (!amount) return { text: "Enter an amount", hard: false };
    if (units === null) return { text: `Use up to ${DECIMALS} decimal places`, hard: true };
    if (units <= ZERO) return { text: "Enter an amount", hard: false };
    if (balance !== null && units > balance) return { text: "Insufficient balance", hard: true };
    if (reserve > ZERO && balance !== null && units + reserve > balance) return { text: "Keep a little USDC for the network fee", hard: true };
    if (fromKey !== "Arc" && gasBalance !== null && gasBalance === ZERO) return { text: `You need some ${fromView?.gas ?? "gas coin"} on ${fromView?.label ?? "this network"} for gas`, hard: true };
    if (quote && quote.receive !== null && quote.receive <= 0) return { text: "Amount is too small to cover the fees", hard: true };
    return null;
  }, [amount, units, balance, reserve, fromKey, toKey, gasBalance, quote, fromView, useOther, otherTrim, otherIsToken, otherValid, customRecipient, otherChecked]);

  /* ---------- actions ---------- */
  const flip = () => {
    if (busy) return;
    setFromKey(toKey);
    setToKey(fromKey);
    setFlips((n) => n + 1);
    setAmount("");
    setMessage("");
  };
  const pickNetwork = (side: "from" | "to", key: ChainKey) => {
    if (side === "from") {
      if (key === toKey) setToKey(fromKey);
      setFromKey(key);
    } else {
      if (key === fromKey) setFromKey(toKey);
      setToKey(key);
    }
    setAmount("");
    setMessage("");
    setModal(null);
  };
  const setFraction = (half: boolean) => {
    if (balance === null) return;
    let v = half ? balance / BigInt(2) : balance;
    if (v + reserve > balance) v = balance > reserve ? balance - reserve : ZERO;
    setAmount(formatUnits6(v, 0).replace(/,/g, ""));
  };

  const switchWallet = async () => {
    if (!provider || !fromView) return;
    setNotice("");
    const hex = `0x${fromView.chainId.toString(16)}`;
    try {
      await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hex }] });
    } catch (e) {
      if ((e as { code?: number }).code === 4902) {
        try {
          const https = fromView.rpcs.filter((u) => u.startsWith("https://"));
          let explorerOrigin: string | undefined;
          try {
            explorerOrigin = new URL(fromView.explorer("0x")).origin;
          } catch {
            explorerOrigin = undefined;
          }
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [{ chainId: hex, chainName: fromView.label, nativeCurrency: { name: fromView.gas || "ETH", symbol: fromView.gas || "ETH", decimals: 18 }, rpcUrls: https, blockExplorerUrls: explorerOrigin ? [explorerOrigin] : undefined }],
          });
        } catch (err) {
          setNotice(explain(err, `Couldn't add ${fromView.label} to your wallet.`));
        }
      } else {
        setNotice(explain(e, "Network switch was cancelled."));
      }
    }
  };

  const putSteps = (next: StepRow[]) => {
    stepsRef.current = next;
    setSteps(next);
  };
  const closePopup = () => {
    const wasDone = phase === "done";
    setPhase("idle");
    setMessage("");
    putSteps([]);
    setSummary(null);
    setCanResume(false);
    if (wasDone) {
      setAmount("");
      setQuote(null);
      setOtherChecked(false);
      failedRef.current = null;
    }
    setBals((p) => {
      const n = { ...p };
      delete n[bk(fromKey)];
      delete n[bk(toKey)];
      return n;
    });
    setRefreshTick((t) => t + 1);
  };

  const startSteps = () => putSteps(STEP_ORDER.map((key, i) => ({ key, state: i === 0 ? "active" : "pending" })));
  const onKitEvent = (e: unknown) => {
    const ev = e as { method?: string; values?: { txHash?: string; state?: string; errorMessage?: string; error?: unknown } };
    const idx = STEP_ORDER.indexOf(ev?.method as StepKey);
    if (idx < 0) return;
    const failed = ev.values?.state === "error" || !!ev.values?.errorMessage || !!ev.values?.error;
    const hash = ev.values?.txHash && TX_HASH_RE.test(ev.values.txHash) ? ev.values.txHash : undefined;
    putSteps(
      stepsRef.current.map((s, i) => {
        if (failed) return i === idx ? { ...s, state: "error" } : s;
        return i < idx ? (s.state === "error" ? s : { ...s, state: "done" }) : i === idx ? { ...s, state: "done", hash: hash ?? s.hash } : i === idx + 1 ? { ...s, state: "active" } : s;
      })
    );
  };
  const applyResultSteps = (res: BridgeRes) => {
    if (!res.steps?.length) return;
    const keyOf = (name: string): StepKey | null => (/approve/i.test(name) ? "approve" : /burn/i.test(name) ? "burn" : /attest/i.test(name) ? "fetchAttestation" : /mint/i.test(name) ? "mint" : null);
    putSteps(
      stepsRef.current.map((s) => {
        const r = res.steps?.find((x) => keyOf(x.name ?? "") === s.key);
        if (!r) return s;
        const state: StepState = /success|complete|done/i.test(r.state ?? "") ? "done" : /error|fail/i.test(r.state ?? "") ? "error" : s.state === "done" ? "done" : "pending";
        const hash = r.txHash && TX_HASH_RE.test(r.txHash) ? r.txHash : s.hash;
        return { ...s, state, hash };
      })
    );
  };

  const finish = async (res: BridgeRes, before: bigint | null, sent: string) => {
    applyResultSteps(res);
    if (res.state !== "success") throw new Error(res.steps?.find((s) => s.errorMessage)?.errorMessage ?? "The bridge did not finish.");
    const hashOf = (re: RegExp) => {
      const h = res.steps?.find((s) => re.test(s.name ?? ""))?.txHash;
      return h && TX_HASH_RE.test(h) ? h : undefined;
    };
    const burn = hashOf(/burn/i);
    const mint = hashOf(/mint/i);
    let got = quote?.receive != null ? fmtNum(quote.receive) : "—";
    for (let i = 0; i < 8 && recipientRef.current; i++) {
      const after = await readUsdc(toKey, recipientRef.current);
      if (before !== null && after !== null && after > before) {
        got = formatUnits6(after - before);
        break;
      }
      await sleep(2500);
    }
    const isCustom = recipientRef.current.toLowerCase() !== (account ?? "").toLowerCase();
    const row: HistoryRow = { id: burn ?? `${Date.now()}`, t: Date.now(), from: fromKey, to: toKey, amount: sent, received: got, burn, mint, recipient: isCustom ? recipientRef.current : undefined };
    setSummary(row);
    putSteps(stepsRef.current.map((s) => ({ ...s, state: "done" })));
    setPhase("done");
    setCanResume(false);
    failedRef.current = null;
    if (historyKey) {
      const next = [row, ...history].slice(0, 50);
      setHistory(next);
      try {
        window.localStorage.setItem(historyKey, JSON.stringify(next));
      } catch {
        return;
      }
    }
  };

  const failedMarks = () => putSteps(stepsRef.current.map((s) => (s.state === "active" ? { ...s, state: "error" } : s)));

  const bridge = async () => {
    if (lockRef.current || !provider || !account || problem || !quote || !units || !recipient) return;
    lockRef.current = true;
    recipientRef.current = recipient;
    setPhase("bridging");
    setMessage("");
    setCanResume(false);
    setUsedForwarder(forwarder);
    startSteps();
    let kit: KitLike | null = null;
    try {
      const accts = (await provider.request({ method: "eth_accounts" })) as string[];
      if (!accts?.[0] || accts[0].toLowerCase() !== account.toLowerCase()) throw new Error("ACCOUNT_CHANGED");
      if (fromView && chainNum(await provider.request({ method: "eth_chainId" })) !== fromView.chainId) throw new Error("WRONG_NETWORK");
      const balNow = await readUsdc(fromKey, account);
      if (balNow !== null && units > balNow) throw new Error("NO_BALANCE");

      kit = await getKit();
      const adapter = await getAdapter();
      const params: BridgeArgs = { from: { adapter, chain: fromKey }, to: destination(adapter, recipient), amount: cleanAmount, token: "USDC", config: { transferSpeed: speed } };
      const fresh = await kit.estimateBridge(params);
      const freshFees = Array.isArray(fresh?.fees) ? fresh.fees : null;
      if (freshFees && quote.receive !== null) {
        const fee = freshFees.filter((f) => !/gas/i.test(f.type ?? "") && (f.token ?? "USDC").toUpperCase() === "USDC").reduce((a, f) => a + (Number(f.amount) || 0), 0);
        const now = amountNum - fee;
        if (now <= 0) throw new Error("TOO_SMALL");
        if (now < quote.receive * (1 - slipPct / 100)) {
          setQuote({ ...quote, receive: now });
          throw new Error("QUOTE_CHANGED");
        }
        if (speed === "FAST" && fee > 0) params.config = { transferSpeed: "FAST", maxFee: (Math.ceil((fee + quote.receive * (slipPct / 100)) * 1e6) / 1e6).toFixed(6) };
      }

      const before = await readUsdc(toKey, recipient);
      kit.on?.("*", onKitEvent);
      executingRef.current = true;
      const res = await kit.bridge(params);
      executingRef.current = false;
      failedRef.current = res.state === "success" ? null : res;
      await finish(res, before, fmtNum(Number(cleanAmount)));
    } catch (e) {
      executingRef.current = false;
      failedMarks();
      setMessage(explain(e, "The bridge could not be completed.", fromView?.gas));
      setPhase("failed");
      setCanResume(!!failedRef.current && !!kit?.retry && stepsRef.current.find((s) => s.key === "burn")?.state === "done");
    } finally {
      kit?.off?.("*", onKitEvent);
      executingRef.current = false;
      lockRef.current = false;
    }
  };

  const resume = async () => {
    const failed = failedRef.current;
    if (lockRef.current || !failed || !provider || !account) return;
    lockRef.current = true;
    setPhase("bridging");
    setMessage("");
    putSteps(stepsRef.current.map((s) => (s.state === "error" ? { ...s, state: "active" } : s)));
    let kit: KitLike | null = null;
    try {
      kit = await getKit();
      const adapter = await getAdapter();
      const before = await readUsdc(toKey, recipientRef.current || account);
      kit.on?.("*", onKitEvent);
      executingRef.current = true;
      const res = await kit.retry!(failed, { from: adapter, to: usedForwarder ? undefined : adapter });
      executingRef.current = false;
      failedRef.current = res.state === "success" ? null : res;
      await finish(res, before, fmtNum(Number(cleanAmount)));
    } catch (e) {
      executingRef.current = false;
      failedMarks();
      setMessage(explain(e, "The retry could not be completed.", toView?.gas));
      setPhase("failed");
      setCanResume(!!failedRef.current);
    } finally {
      kit?.off?.("*", onKitEvent);
      executingRef.current = false;
      lockRef.current = false;
    }
  };

  /* ---------- main button ---------- */
  let action: { label: ReactNode; onClick: () => void; disabled: boolean };
  if (!account) action = { label: "Connect wallet", onClick: () => {}, disabled: true };
  else if (busy) action = { label: <span className="flex items-center gap-3"><Spinner />Bridging</span>, onClick: () => {}, disabled: true };
  else if (wrongNetwork) action = { label: `Switch to ${fromView?.label}`, onClick: switchWallet, disabled: false };
  else action = { label: "Bridge", onClick: bridge, disabled: !!problem || !quote || quoting };

  const amountFont = amount.length > 9 ? "clamp(1.25rem, 5vw, 1.375rem)" : amount.length > 6 ? "clamp(1.375rem, 5.6vw, 1.625rem)" : "clamp(1.5rem, 6.5vw, 1.875rem)";

  const gasText = useMemo(() => {
    if (!quote || !quote.gas.length) return "—";
    const sums = new Map<string, number>();
    quote.gas.forEach((g) => sums.set(g.token, (sums.get(g.token) ?? 0) + g.amount));
    const usdStr = (usd: number) => (usd > 0 && usd < 0.01 ? "<$0.01" : `$${usd.toFixed(2)}`);
    const parts = Array.from(sums.entries()).map(([token, amt]) => {
      if (token === "USDC") return usdStr(amt);
      const price = native[token];
      return `${fmtGas(amt)} ${token}${price ? ` (${usdStr(amt * price)})` : ""}`;
    });
    return `${quote.gasApprox ? "≈ " : ""}${parts.join(" + ")}`;
  }, [quote, native]);

  const timeText = quote ? (quote.fast ? fastTime(fromKey) : STANDARD_TIME[fromKey] ?? "Varies") : "";
  const failedStep = steps.find((s) => s.state === "error");
  const burnState = steps.find((s) => s.key === "burn")?.state;
  const burnHash = steps.find((s) => s.key === "burn")?.hash;

  return (
    <main className={`${brandFont.className} relative min-h-screen overflow-x-hidden bg-[#010205] text-white selection:bg-[#167cff]/30`}>
      <style>{`
        @keyframes backgroundFloat{0%,100%{transform:translate3d(-50%,0,0) scale(1)}50%{transform:translate3d(-46%,2vw,0) scale(1.08)}}
        @keyframes backgroundFloatReverse{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(5vw,-3vw,0) scale(1.12)}}
        @keyframes twinkle{0%,100%{opacity:.12}50%{opacity:.9}}
        @keyframes floatUp{0%{transform:translateY(0);opacity:0}15%{opacity:.7}100%{transform:translateY(-220px);opacity:0}}
        @keyframes checkPop{0%{opacity:0;transform:scale(.3)}100%{opacity:1;transform:scale(1)}}
        @keyframes checkDraw{to{stroke-dashoffset:0}}
        @keyframes roadFlow{from{background-position:0 0}to{background-position:0 56px}}
        @keyframes nodePulse{0%,100%{box-shadow:0 0 0 0 rgba(57,196,255,.55),0 0 14px rgba(57,196,255,.6)}50%{box-shadow:0 0 0 8px rgba(57,196,255,0),0 0 22px rgba(57,196,255,.9)}}
        @keyframes sheetUp{from{transform:translateY(100%)}to{transform:none}}
        @keyframes popIn{from{opacity:0;transform:scale(.94) translateY(8px)}to{opacity:1;transform:none}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
        .popup-panel{animation:sheetUp .38s cubic-bezier(.2,.8,.2,1) both}
        @media (min-width:640px){.popup-panel{animation:popIn .3s cubic-bezier(.2,.8,.2,1) both}}
        .fade-up{opacity:0;animation:fadeUp .9s cubic-bezier(.2,.7,.2,1) forwards;animation-delay:var(--delay,0ms)}
        @media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-delay:0s!important;animation-iteration-count:1!important}.fade-up{opacity:1}}
      `}</style>

      <SpaceBackground />

      <div className="relative z-10">
        <Header />

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
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-3 sm:pb-4">
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Route</p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
                    <span className="inline-flex items-center gap-1.5"><ChainLogo view={fromView} size={20} />{fromView?.label}</span>
                    <span className="text-slate-500">to</span>
                    <span className="inline-flex items-center gap-1.5"><ChainLogo view={toView} size={20} />{toView?.label}</span>
                  </p>
                </div>
                {!lifiMode && (
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => setModal("history")} aria-label="Bridge history" title="Bridge history" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/[0.07] hover:text-white">
                    <Svg d={ICON_HISTORY} />
                  </button>
                  <button type="button" onClick={() => setModal("settings")} aria-label="Settings" title="Settings" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/[0.07] hover:text-white">
                    <Svg d={ICON_SETTINGS} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal("fast")}
                    aria-label={useFast ? "Fast transfer is on" : "Fast transfer is off"}
                    title={useFast ? "Fast transfer: on" : canFast ? "Fast transfer: off" : "Fast transfer is not available from this network"}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/[0.07] ${useFast ? "text-[#39c4ff]" : "text-slate-400 hover:text-white"}`}
                    style={useFast ? { filter: "drop-shadow(0 0 6px rgba(57,196,255,0.9)) drop-shadow(0 0 14px rgba(22,136,245,0.6))" } : undefined}
                  >
                    <Svg d={ICON_FAST} />
                  </button>
                </div>
                )}
              </div>

              {lifiMode ? (
                <div className="mt-4 sm:mt-5">
                  <div className="flex items-center justify-between gap-2">
                    <ChainButton view={fromView} onClick={() => setModal("from")} />
                    <button type="button" onClick={flip} aria-label="Switch direction" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-[#071025] text-[#55c5ff] shadow-lg transition hover:border-[#2f8bff]/50 hover:text-white">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform .4s ease", transform: `rotate(${flips * 180}deg)` }}>
                        <path d="M17 4 21 8l-4 4M3 8h18M7 20l-4-4 4-4M21 16H3" />
                      </svg>
                    </button>
                    <ChainButton view={toView} onClick={() => setModal("to")} />
                  </div>
                  <p className="mt-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-xs leading-5 text-slate-400">
                    Circle&apos;s USDC bridge doesn&apos;t support Robinhood Chain, so this route is bridged by LI.FI, a third-party bridge aggregator. USDC sent to Robinhood Chain usually arrives as USDG. Check the quote and the token you receive, and start with a small amount.
                  </p>
                  <div className="mt-4">
                    <LifiWidget key={`${fromKey}-${toKey}`} from={fromView?.chainId} to={toView?.chainId} embedded />
                  </div>
                  <p className="mt-3 text-center text-xs text-slate-500">
                    Widget not working for this pair?{" "}
                    <a href={`https://jumper.exchange/?fromChain=${fromView?.chainId}&toChain=${toView?.chainId}`} target="_blank" rel="noreferrer" className="font-medium text-[#65caff] hover:text-white">Open it in Jumper</a>
                  </p>
                </div>
              ) : (
              <>
              <div className="mt-4 sm:mt-5">
                {/* ---------- FROM ---------- */}
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3.5 transition focus-within:border-[#2588ff]/60 focus-within:bg-white/[0.05] sm:p-4">
                  <div className="flex items-center justify-between gap-3 text-[13px] font-medium text-slate-400">
                    <span>From</span>
                    <span className="text-xs tabular-nums">{ready && balance !== null ? `Balance ${formatUnits6(balance)} USDC` : "Balance —"}</span>
                  </div>
                  <div className="mt-2.5">
                    <ChainButton view={fromView} onClick={() => setModal("from")} disabled={busy} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <input
                      value={amount}
                      onChange={(e) => {
                        const v = e.target.value.replace(",", ".");
                        if (v === "" || /^\d*\.?\d{0,6}$/.test(v)) setAmount(v);
                      }}
                      disabled={busy}
                      inputMode="decimal"
                      placeholder="0.00"
                      autoComplete="off"
                      aria-label="Amount of USDC to bridge"
                      style={{ fontSize: amountFont, fontWeight: 600, lineHeight: 1.1, fontFamily: manrope.style.fontFamily }}
                      className="w-full min-w-0 flex-1 bg-transparent tabular-nums tracking-tight text-white outline-none placeholder:text-slate-700 disabled:opacity-60"
                    />
                    <span className="flex shrink-0 items-center gap-2.5 rounded-full bg-white/[0.07] py-1 pl-1 pr-3.5 text-base font-semibold sm:py-1.5 sm:pl-1.5 sm:pr-4 sm:text-[17px]"><UsdcLogo size={36} />USDC</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-500 tabular-nums">{fmtUsd(amountNum)}</p>
                    <div className="flex gap-1.5">
                      <Pill onClick={() => setFraction(true)} disabled={busy || !ready || balance === null}>50%</Pill>
                      <Pill onClick={() => setFraction(false)} disabled={busy || !ready || balance === null}>Max</Pill>
                    </div>
                  </div>
                </div>

                {/* ---------- FLIP ---------- */}
                <div className="relative z-10 -my-3 flex justify-center">
                  <button type="button" onClick={flip} disabled={busy} aria-label="Switch direction" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] bg-[#071025] text-[#55c5ff] shadow-lg transition hover:border-[#2f8bff]/50 hover:text-white disabled:opacity-50 sm:h-10 sm:w-10">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform .4s ease", transform: `rotate(${flips * 180}deg)` }}>
                      <path d="M7 4v13m0 0-3-3m3 3 3-3M17 20V7m0 0-3 3m3-3 3 3" />
                    </svg>
                  </button>
                </div>

                {/* ---------- TO ---------- */}
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3.5 sm:p-4">
                  <div className="flex items-center justify-between gap-3 text-[13px] font-medium text-slate-400">
                    <span>To</span>
                    <span className="text-xs tabular-nums">{customRecipient ? `Recipient ${shortAddr(otherTrim)}` : ready && destBalance !== null ? `Balance ${formatUnits6(destBalance)} USDC` : "Balance —"}</span>
                  </div>
                  <div className="mt-2.5">
                    <ChainButton view={toView} onClick={() => setModal("to")} disabled={busy} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className={`min-w-0 flex-1 truncate tabular-nums tracking-tight ${quote && quote.receive !== null ? "text-white" : "text-slate-700"}`} style={{ fontSize: amountFont, fontWeight: 600, lineHeight: 1.1, fontFamily: manrope.style.fontFamily }}>
                      {quote && quote.receive !== null ? fmtNum(Math.max(quote.receive, 0)) : quoting ? "…" : "0.00"}
                    </div>
                    <span className="flex shrink-0 items-center gap-2.5 rounded-full bg-white/[0.07] py-1 pl-1 pr-3.5 text-base font-semibold sm:py-1.5 sm:pl-1.5 sm:pr-4 sm:text-[17px]"><UsdcLogo size={36} />USDC</span>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-500 tabular-nums">{quote && quote.receive !== null ? fmtUsd(Math.max(quote.receive, 0)) : fmtUsd(0)}</p>
                </div>

                {/* ---------- SEND TO ANOTHER ADDRESS ---------- */}
                <div className="mt-3 flex items-center justify-between gap-3 px-1">
                  <span className="text-sm text-slate-400">Send to a different address</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={useOther}
                    aria-label="Send to a different address"
                    disabled={busy}
                    onClick={() => {
                      setUseOther((v) => !v);
                      setOtherChecked(false);
                    }}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${useOther ? "bg-[#1978f5]" : "bg-white/15"}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${useOther ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
                {useOther && (
                  <div className={`mt-3 rounded-2xl border bg-white/[0.035] p-3.5 sm:p-4 ${otherTrim && !otherValid ? "border-red-400/40" : "border-white/[0.07]"}`}>
                    <p className="text-[13px] font-medium text-slate-400">Recipient address on {toView?.label}</p>
                    <input
                      value={otherAddr}
                      onChange={(e) => {
                        setOtherAddr(e.target.value);
                        setOtherChecked(false);
                      }}
                      disabled={busy}
                      placeholder="0x…"
                      spellCheck={false}
                      autoComplete="off"
                      autoCapitalize="off"
                      aria-label="Recipient wallet address"
                      style={{ fontFamily: manrope.style.fontFamily, fontWeight: 700, fontSize: "1rem" }}
                      className="mt-2 w-full bg-transparent tracking-tight text-white outline-none placeholder:font-normal placeholder:text-slate-600 disabled:opacity-60"
                    />
                    {otherTrim && !otherValid && <p className="mt-2 text-xs text-red-300">{otherIsToken ? "That is a USDC contract address, not a wallet." : "Enter a valid wallet address (0x… with 42 characters)."}</p>}
                    {customRecipient && (
                      <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-xs leading-5 text-slate-300">
                        <input type="checkbox" checked={otherChecked} onChange={(e) => setOtherChecked(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#1978f5]" />
                        <span>I checked that this address is correct and works on {toView?.label}. USDC sent to a wrong address cannot be recovered.</span>
                      </label>
                    )}
                  </div>
                )}
              </div>

              {/* ---------- QUOTE DETAILS ---------- */}
              {quote && (
                <dl className="mt-4 space-y-2 px-1 text-[13px] sm:text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Slippage</dt>
                    <dd className="text-right text-slate-300 tabular-nums">{slipPct}%{slip.mode === "auto" || !customValid ? " (Auto)" : ""}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Gas fee</dt>
                    <dd className="text-right text-slate-300 tabular-nums">{gasText}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Estimated time</dt>
                    <dd className="text-right text-slate-300 tabular-nums">{timeText}</dd>
                  </div>
                  {quote.fast ? (
                    <div className="flex justify-between gap-4">
                      <dt className="flex items-center gap-1.5 text-slate-500"><span className="text-[#39c4ff]"><Svg d={ICON_FAST} size={13} /></span>Fast transfer</dt>
                      <dd className="text-right text-slate-300 tabular-nums">On{quote.bridgeFee !== null ? ` · fee ${fmtNum(quote.bridgeFee)} USDC` : ""}</dd>
                    </div>
                  ) : fast && !canFast ? (
                    <div className="flex justify-between gap-4">
                      <dt className="flex items-center gap-1.5 text-slate-500"><span className="text-slate-500"><Svg d={ICON_FAST} size={13} /></span>Fast transfer</dt>
                      <dd className="text-right text-slate-300">Not needed here</dd>
                    </div>
                  ) : (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Bridge fee</dt>
                      <dd className="text-right text-slate-300 tabular-nums">{quote.bridgeFee === null ? "—" : `${fmtNum(quote.bridgeFee)} USDC`}</dd>
                    </div>
                  )}
                  {quote.deliveryFee > 0 && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Delivery fee</dt>
                      <dd className="text-right text-slate-300 tabular-nums">{fmtNum(quote.deliveryFee)} USDC</dd>
                    </div>
                  )}
                  {customRecipient && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Recipient</dt>
                      <dd className="text-right text-slate-300 tabular-nums">{shortAddr(otherTrim)}</dd>
                    </div>
                  )}
                  {quote.bridgeFee === null && <p className="text-xs leading-5 text-amber-300">Couldn&apos;t read the fee. Check the amounts in your wallet before you confirm.</p>}
                  {!forwarder && <p className="text-xs leading-5 text-slate-500">Circle can&apos;t deliver to {toView?.label} for you, so receiving there needs one extra confirmation in your wallet.</p>}
                </dl>
              )}

              <button onClick={action.onClick} disabled={action.disabled} className={`${BUTTON} mt-5 sm:mt-6`}>{action.label}</button>

              <div className="mt-3 min-h-5 text-center text-sm" role="status">
                {notice ? (
                  <span className="text-red-300">{notice}</span>
                ) : wrongNetwork && !busy ? (
                  <span className="text-slate-500">Your wallet is on another network. Switch to {fromView?.label} to bridge.</span>
                ) : !busy && ready && problem && (amount || problem.hard || useOther) ? (
                  <span className={problem.hard ? "text-red-300" : "text-slate-500"}>{problem.text}</span>
                ) : !busy && ready && quoteError ? (
                  <span className="text-red-300">{quoteError}</span>
                ) : !busy && ready && quoting ? (
                  <span className="text-slate-500">Getting your quote…</span>
                ) : null}
              </div>
              </>
              )}
            </div>
          </div>

          <ul className="fade-up mx-auto mt-8 flex max-w-lg flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-500" style={{ "--delay": "300ms" } as CSSProperties}>
            <li>{lifiMode ? "Robinhood Chain routes are bridged by LI.FI" : "Powered by Circle CCTP"}</li>
            {!lifiMode && <li>{customRecipient ? "Sent to the address you entered" : "Sent to your own wallet address"}</li>}
            {!lifiMode && <li>{forwarder ? "No wallet prompt on the receiving network" : "One extra wallet confirmation on the receiving network"}</li>}
          </ul>
        </section>
      </div>

      {/* ---------- bridge popup ---------- */}
      {phase !== "idle" && (
        <Popup label="Bridge status" onClose={phase === "bridging" ? undefined : closePopup}>
          {phase === "done" && summary && (
            <div className="mb-5 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center" style={{ animation: "checkPop .55s cubic-bezier(.2,1.3,.3,1) both" }}>
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 6px rgba(52,211,153,0.9)) drop-shadow(0 0 18px rgba(52,211,153,0.55))" }}>
                  <path d="m4.5 12.5 5 5L19.5 6.5" strokeDasharray="24" strokeDashoffset="24" style={{ animation: "checkDraw .45s ease-out .2s forwards" }} />
                </svg>
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Bridge complete</h2>
              <dl className="mt-6 space-y-3 text-left text-[15px]">
                <div className="flex items-center justify-between gap-4"><dt className="text-slate-400">Sent</dt><dd className="font-semibold tabular-nums">{summary.amount} USDC</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-slate-400">Received</dt><dd className="font-semibold tabular-nums">{summary.received} USDC</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-slate-400">Route</dt><dd className="font-semibold">{views[summary.from]?.label} to {views[summary.to]?.label}</dd></div>
                {summary.recipient && <div className="flex items-center justify-between gap-4"><dt className="text-slate-400">Recipient</dt><dd className="font-semibold tabular-nums">{shortAddr(summary.recipient)}</dd></div>}
              </dl>
            </div>
          )}

          {phase === "bridging" && <h2 className="mb-5 text-xl font-semibold tracking-tight">Bridging USDC</h2>}
          {phase === "failed" && (
            <div className="mb-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-400/10 text-red-300">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight">Bridge stopped</h2>
              <p className="mt-2 text-sm leading-6 text-red-300">{message}</p>
            </div>
          )}

          <Road steps={steps} phase={phase} fromLabel={fromView?.label ?? ""} toLabel={toView?.label ?? ""} forwarder={usedForwarder} />

          {phase === "bridging" && (
            <p className="mt-5 text-center text-xs leading-5 text-slate-500">
              {usedForwarder ? "You only confirm on " + (fromView?.label ?? "the first network") + ". Circle delivers the USDC for you." : "Confirm each prompt in your wallet."} Keep this page open until it finishes{useFast ? "" : canFast ? "; Standard can take 15 minutes or more" : ""}.
            </p>
          )}

          {phase === "failed" && (
            <div className="mt-5 text-center text-xs leading-5">
              {burnState === "done" ? (
                <p className="text-amber-300">Your USDC already left {fromView?.label} and has not arrived on {toView?.label} yet. Do not send it again.{canResume ? " Tap Resume to finish." : " Check your wallet activity or the explorer."}</p>
              ) : failedStep?.key === "burn" ? (
                <p className="text-amber-300">If your wallet shows this transaction as confirmed, your USDC may already be on its way. Check your wallet activity before trying again.</p>
              ) : (
                <p className="text-slate-400">No USDC left your wallet.</p>
              )}
              {burnHash && <a href={txUrl(fromKey, burnHash)} target="_blank" rel="noreferrer" className="mt-2 inline-block font-medium text-[#65caff] hover:text-white">View the transaction</a>}
            </div>
          )}

          {phase === "done" && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {summary?.burn ? <a href={txUrl(summary.from, summary.burn)} target="_blank" rel="noreferrer" className={SECONDARY_BUTTON}>View on explorer</a> : <span />}
              <button onClick={closePopup} className={BUTTON}>Done</button>
            </div>
          )}
          {phase === "failed" && (
            <div className="mt-5 grid gap-3">
              {canResume && <button onClick={resume} className={BUTTON}>Resume bridge</button>}
              <button onClick={closePopup} className={canResume ? SECONDARY_BUTTON : BUTTON}>{canResume ? "Close" : "Try again"}</button>
            </div>
          )}
        </Popup>
      )}

      {/* ---------- choose a network ---------- */}
      <Modal wide open={modal === "from" || modal === "to"} onClose={() => setModal(null)} title={modal === "from" ? "Bridge from" : "Bridge to"}>
        <ul className="space-y-1">
          {list.map((k) => {
            const side = modal === "from" ? "from" : "to";
            const current = side === "from" ? fromKey : toKey;
            const b = bals[bk(k)];
            return (
              <li key={k}>
                <button onClick={() => pickNetwork(side, k)} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/[0.06] ${k === current ? "bg-white/[0.06] ring-1 ring-[#2588ff]/50" : ""}`}>
                  <ChainLogo view={views[k]} size={38} />
                  <span className="min-w-0 flex-1 truncate text-base font-semibold">{views[k].label}</span>
                  {views[k].lifi ? (
                    <span className="shrink-0 rounded-full bg-white/[0.07] px-2.5 py-1 text-[11px] font-semibold text-[#8fd4ff]">via LI.FI</span>
                  ) : (
                    <span className="shrink-0 text-sm tabular-nums text-slate-400">{account ? (b === undefined ? "…" : b === null ? "—" : `${formatUnits6(b)} USDC`) : ""}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </Modal>

      {/* ---------- settings: slippage ---------- */}
      <Modal open={modal === "settings"} onClose={() => setModal(null)} title="Settings">
        <p className="text-sm font-medium">Max slippage</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">Bridging USDC doesn&apos;t trade tokens, so there is no price to move. Slippage only limits how much the fees may change before your bridge starts: if you would receive more than this much less than quoted, the bridge stops.</p>
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-full bg-white/[0.05] p-1">
          {(["auto", "custom"] as const).map((m) => (
            <button key={m} onClick={() => saveSettings({ slip: { ...slip, mode: m } })} className={`rounded-full py-2 text-sm font-semibold capitalize transition ${slip.mode === m ? "bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] text-white" : "text-slate-400 hover:text-white"}`}>
              {m}
            </button>
          ))}
        </div>
        {slip.mode === "auto" ? (
          <p className="mt-3 text-xs leading-5 text-slate-400">Auto uses <span className="font-semibold text-white">{AUTO_SLIPPAGE}%</span>.</p>
        ) : (
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              {SLIP_PRESETS.map((p) => (
                <button key={p} onClick={() => saveSettings({ slip: { ...slip, custom: p } })} className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition ${parseFloat(slip.custom) === parseFloat(p) ? "bg-[#1978f5]/30 text-[#8fd4ff]" : "bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]"}`}>
                  {p}%
                </button>
              ))}
            </div>
            <div className={`mt-3 flex items-center rounded-2xl border bg-white/[0.035] px-4 py-3 ${customValid || !slip.custom ? "border-white/[0.07]" : "border-red-400/40"}`}>
              <input
                value={slip.custom}
                onChange={(e) => {
                  const v = e.target.value.replace(",", ".");
                  if (v === "" || /^\d{0,2}\.?\d{0,2}$/.test(v)) saveSettings({ slip: { ...slip, custom: v } });
                }}
                inputMode="decimal"
                placeholder="Custom"
                aria-label="Custom slippage in percent"
                style={{ fontFamily: manrope.style.fontFamily, fontWeight: 700, fontSize: "1.125rem" }}
                className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-600"
              />
              <span className="text-slate-400">%</span>
            </div>
            <p className={`mt-2 text-xs leading-5 ${!customValid ? "text-red-300" : customPct > 5 || customPct < 0.1 ? "text-amber-300" : "text-slate-500"}`}>
              {!customValid ? `Enter a value from 0.01% to 50%. Auto (${AUTO_SLIPPAGE}%) is used until then.` : customPct > 5 ? "High slippage: you could receive noticeably less than quoted." : customPct < 0.1 ? "Very low slippage: the bridge may stop if the fee moves a little." : `You'll receive at least ${(100 - customPct).toFixed(2)}% of the quoted amount.`}
            </p>
          </div>
        )}
      </Modal>

      {/* ---------- Fast transfer ---------- */}
      <Modal open={modal === "fast"} onClose={() => setModal(null)} title="Fast transfer">
        <div className="flex items-center gap-3">
          <span className={`flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.06] ${useFast ? "text-[#39c4ff]" : "text-slate-400"}`} style={useFast ? { filter: "drop-shadow(0 0 6px rgba(57,196,255,0.9))" } : undefined}>
            <Svg d={ICON_FAST} size={22} />
          </span>
          <p className="text-sm font-semibold">{fast ? "Fast transfer is on" : "Fast transfer is off"}</p>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Fast transfer uses Circle&apos;s CCTP Fast Transfer. Your USDC arrives on the other network in seconds instead of waiting about 15 minutes for the first network to finalize.
        </p>
        <ul className="mt-3 space-y-1.5 text-xs leading-5 text-slate-400">
          <li>It adds a small fee, taken from the USDC you receive.</li>
          <li>With Fast off, Standard transfer is used: no Fast fee, but slower.</li>
          <li>If the Fast fee goes above your slippage limit, the transfer falls back to Standard.</li>
          <li>Fast works when sending from networks such as Ethereum, Base, Arbitrum, OP Mainnet, Unichain and Linea. From Arc, Avalanche and Polygon the standard transfer is already fast.</li>
          {!canFast && <li className="text-amber-300">The network you are sending from ({fromView?.label}) doesn&apos;t need Fast.</li>}
        </ul>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              saveSettings({ fast: true });
              setModal(null);
            }}
            className={BUTTON}
          >
            Enable
          </button>
          <button
            onClick={() => {
              saveSettings({ fast: false });
              setModal(null);
            }}
            className={SECONDARY_BUTTON}
          >
            Disable
          </button>
        </div>
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
                <a href={h.burn ? txUrl(h.from, h.burn) : "#"} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-white/[0.06]">
                  <span className="flex -space-x-2"><ChainLogo view={views[h.from]} size={26} /><ChainLogo view={views[h.to]} size={26} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold tabular-nums">{h.amount} USDC</span>
                    <span className="block truncate text-xs text-slate-500">{views[h.from]?.label} to {views[h.to]?.label} · received {h.received}{h.recipient ? ` · to ${shortAddr(h.recipient)}` : ""}</span>
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
