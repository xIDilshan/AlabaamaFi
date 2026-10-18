"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Inter, Manrope } from "next/font/google";
import { useAccount } from "wagmi";
import Header from "@/components/Header";

// Same fonts as the Send page.
const brandFont = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });
const manrope = Manrope({ subsets: ["latin"], weight: ["600", "700"], display: "swap" });

/* ---------- Arc mainnet ---------- */
const ARC = {
  chainId: 5042,
  chainIdHex: "0x13b2",
  rpc: "https://rpc.mainnet.arc.io",
  explorer: "https://explorer.arc.io",
};

// Name of Arc mainnet inside Circle's App Kit.
const KIT_CHAIN = "Arc";

// The App Kit reads gas prices and balances through these. Your wallet goes first, then Arc's public endpoints (all from docs.arc.io).
const ARC_RPCS = [
  "https://rpc.mainnet.arc.io",
  "https://rpc.blockdaemon.mainnet.arc.io",
  "https://rpc.drpc.mainnet.arc.io",
  "https://rpc.quicknode.mainnet.arc.io",
];

/* Tokens Arc can swap (docs.arc.io/arc/references/contract-addresses). cirBTC uses 8 decimals, the others 6. */
type Sym = "USDC" | "EURC" | "cirBTC";
const SYMS: Sym[] = ["USDC", "EURC", "cirBTC"];
const TOKENS: Record<Sym, { name: string; address: string; decimals: number }> = {
  USDC: { name: "USD Coin", address: "0x3600000000000000000000000000000000000000", decimals: 6 },
  EURC: { name: "Euro Coin", address: "0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1", decimals: 6 },
  cirBTC: { name: "Circle Wrapped Bitcoin", address: "0x171A4217b86A807A64eB94757Db6849fb4bDbAA0", decimals: 8 },
};

/* ---------- safety limits ---------- */
const PRICE_DRIFT = 0.005; // if the fresh price is >0.5% worse than the one shown, stop and ask again
const SWAP_GAS_ESTIMATE = 300000; // typical gas for a swap, used only for the "Network fee" estimate
const FEE_FLOOR = BigInt("20000000000"); // Arc minimum gas price (20 gwei)
const TX_HASH_RE = /^0x[0-9a-fA-F]{64}$/;

// Desktop layout (chart, side-by-side) starts at 900px so "desktop site" mode on a phone already gets it.
// Phones always show the page at 100%. Desktop-size screens show it at 90% (the [zoom:0.9] class on the <section> below).

const CONTAINER = "w-full px-4 sm:px-8 lg:px-10";

const BUTTON =
  "inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_40px_rgba(30,120,255,0.28)] transition duration-300 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_15px_50px_rgba(30,120,255,0.42)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39c4ff] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:brightness-100 sm:px-7 sm:py-4 sm:text-base";

const SECONDARY_BUTTON =
  "inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.045] px-6 py-3.5 text-[15px] font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:border-[#2f8bff]/40 hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39c4ff] sm:px-7 sm:py-4 sm:text-base";

/* ---------- number helpers (BigInt() calls instead of 1n literals, so any TS target works) ---------- */
const ZERO = BigInt(0);
const pow10 = (n: number) => BigInt("1" + "0".repeat(n));

function parseUnits(value: string, dec: number): bigint | null {
  const v = value.trim();
  if (!/^\d*\.?\d*$/.test(v) || v === "" || v === ".") return null;
  const [whole = "0", frac = ""] = v.split(".");
  if (frac.length > dec) return null;
  return BigInt(whole || "0") * pow10(dec) + BigInt((frac + "0".repeat(dec)).slice(0, dec) || "0");
}

function formatUnits(value: bigint, dec: number, minFrac = 2): string {
  const base = pow10(dec);
  const whole = (value / base).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  let frac = (value % base).toString().padStart(dec, "0").replace(/0+$/, "");
  while (frac.length < minFrac) frac += "0";
  return frac ? `${whole}.${frac}` : whole;
}

/** "12.3456789" -> "12.345678" (up to `dec` decimals, at least 2) */
function tidy(value: string, dec: number): string {
  const [w = "0", f = ""] = value.split(".");
  let frac = f.slice(0, dec).replace(/0+$/, "");
  while (frac.length < 2) frac += "0";
  return `${w.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${frac}`;
}

const trimDecimals = (value: string, dec: number) => {
  const [w, f] = value.split(".");
  return f === undefined ? value : `${w}.${f.slice(0, dec)}`;
};

const fmtUsd = (n: number | null) => {
  if (n === null || !Number.isFinite(n)) return "—";
  if (n > 0 && n < 0.01) return "<$0.01";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
const fmtPrice = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: n >= 100 ? 2 : n >= 1 ? 4 : 6 })}`;
const fmtCompact = (n: number | null) =>
  n === null || !Number.isFinite(n) ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 }).format(n);
const fmtRate = (r: number) => (r >= 1000 ? r.toFixed(2) : r >= 1 ? r.toFixed(4) : r >= 0.0001 ? r.toFixed(6) : r.toPrecision(4));
const fmtPct = (n: number) => `${Math.abs(n).toFixed(2)}%`;

const timeAgo = (t: number) => {
  const s = Math.max(1, Math.round((Date.now() - t) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  return new Date(t).toLocaleDateString();
};

const pad32 = (hex: string) => hex.replace(/^0x/, "").toLowerCase().padStart(64, "0");
const chainNum = (id: unknown) => (typeof id === "string" ? (id.startsWith("0x") ? parseInt(id, 16) : parseInt(id, 10)) : typeof id === "number" ? id : NaN);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Only trust explorer links that point at Arc's explorers; otherwise build our own from the tx hash. */
function safeExplorerUrl(url: string | undefined, hash: string) {
  try {
    if (url) {
      const u = new URL(url);
      if (u.protocol === "https:" && /(^|\.)(arcscan\.app|arc\.io|arc\.network)$/i.test(u.hostname)) return u.toString();
    }
  } catch {
    /* fall through */
  }
  return `${ARC.explorer}/tx/${hash}`;
}

/* ---------- wallet provider + Circle App Kit (loaded only in the browser, only when needed) ---------- */
type Eip1193 = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (arg: unknown) => void) => void;
  removeListener?: (event: string, handler: (arg: unknown) => void) => void;
};

type SwapArgs = {
  from: { adapter: unknown; chain: string };
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  config?: { slippageBps?: number };
};
type KitLike = {
  getSupportedChains: () => unknown;
  estimateSwap: (p: SwapArgs) => Promise<{ estimatedOutput: { amount: string }; stopLimit: { amount: string } }>;
  swap: (p: SwapArgs) => Promise<{ txHash: string; explorerUrl?: string; amountOut?: string; progress?: { status?: string } }>;
};

type MarketRow = { price: number; change24h: number | null; marketCap: number | null; volume24h: number | null; note?: string };
type Market = Partial<Record<Sym, MarketRow | null>>;
type SwapRecord = { id: string; t: number; from: Sym; to: Sym; paid: string; got: string; url: string };
type Slip = { mode: "auto" | "custom"; custom: string };

/** Auto slippage: tight for the two stablecoins, a bit wider whenever cirBTC is involved. */
const autoBps = (a: Sym, b: Sym) => (a === "cirBTC" || b === "cirBTC" ? 100 : 50);
const SLIP_PRESETS = ["0.1", "0.5", "1", "3", "5"];

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

const Pill = ({ onClick, children, disabled }: { onClick: () => void; children: ReactNode; disabled?: boolean }) => (
  <button type="button" onClick={onClick} disabled={disabled} className="inline-flex items-center rounded-full bg-white/[0.07] px-1.5 py-[1px] text-[8px] font-medium text-[#8fd4ff] transition hover:bg-white/[0.12] disabled:opacity-40 sm:px-2.5 sm:py-[3px] sm:text-[11px]">
    {children}
  </button>
);

const Spinner = () => <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />;

/** The swap icon assembling itself: the top arrow slides in from the right, the bottom one from the left,
    until the two sit one above the other. Then it repeats. */
const SwapArrows = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ overflow: "visible" }}>
    <g style={{ animation: "arrowSlideA 1.5s ease-out infinite" }}>
      <path d="M20 7H5M9 3 5 7l4 4" />
    </g>
    <g style={{ animation: "arrowSlideB 1.5s ease-out infinite" }}>
      <path d="M4 17h15M15 13l4 4-4 4" />
    </g>
  </svg>
);

/** Chevron pointing down / left / right. */
const Chevron = ({ dir = "down", size = 14 }: { dir?: "down" | "left" | "right"; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={dir === "down" ? "m6 9 6 6 6-6" : dir === "left" ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6"} />
  </svg>
);

function IconButton({ label, onClick, children, className = "flex" }: { label: string; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={`h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/[0.07] hover:text-white ${className}`}>
      {children}
    </button>
  );
}

const Svg = ({ d, size = 20 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const ICON_HISTORY = "M12 7v5l3 2M3 12a9 9 0 1 0 3-6.7M3 4v4h4";
const ICON_CHART = "M3 3v18h18M7 15l4-4 3 3 5-6";
const ICON_SETTINGS = "M20 7h-9M14 17H5M17 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM7 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z";
const ICON_SWAP = "M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4";

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
          <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.04] text-base text-white/45 transition hover:bg-white/[0.08] hover:text-white">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- logos ----------
   Files in mainnet/public/: arc-logo.png, usdc-logo.webp, eurc-logo.png, cirbtc-logo.jpg. If one is missing, a drawing is shown. */
const LOGO_SRC: Record<string, string> = { Arc: "/arc-logo.png", USDC: "/usdc-logo.webp", EURC: "/eurc-logo.png", cirBTC: "/cirbtc-logo.jpg" };

/** `fluid` makes the logo fill its parent, so the parent's size classes (h-7 sm:h-9 ...) decide how big it is. */
function Logo({ name, size = 24, fluid = false }: { name: "Arc" | Sym; size?: number; fluid?: boolean }) {
  const [failed, setFailed] = useState(false);
  const dim = fluid ? "100%" : size;
  if (!failed)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={LOGO_SRC[name]} alt={name} onError={() => setFailed(true)} className="shrink-0 rounded-full object-cover" style={{ width: dim, height: dim }} />;

  if (name === "cirBTC")
    return (
      <svg width={dim} height={dim} viewBox="0 0 24 24" role="img" aria-label="cirBTC" className="shrink-0">
        <defs>
          <linearGradient id="swapBtcBg" x1="3" y1="21" x2="21" y2="3">
            <stop stopColor="#a78bfa" />
            <stop offset="1" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="12" fill="url(#swapBtcBg)" />
        <text x="12" y="16.5" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">₿</text>
      </svg>
    );

  if (name === "Arc")
    return (
      <svg width={dim} height={dim} viewBox="0 0 24 24" fill="none" role="img" aria-label="Arc" className="shrink-0">
        <circle cx="12" cy="12" r="12" fill="#12253f" />
        <path d="M5.5 16.5a7 7 0 0 1 13 0" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="8.2" r="1.3" fill="#fff" />
      </svg>
    );

  return (
    <svg width={dim} height={dim} viewBox="0 0 24 24" fill="none" role="img" aria-label={name} className="shrink-0">
      <circle cx="12" cy="12" r="12" fill="#2775CA" />
      <path d="M5.64 5.64A9 9 0 0 0 5.64 18.36M18.36 5.64A9 9 0 0 1 18.36 18.36" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      {name === "USDC" ? (
        <path d="M14.4 9.4c0-1-1-1.7-2.4-1.7s-2.4.7-2.4 1.8c0 2.4 4.9 1.1 4.9 3.6 0 1.1-1.1 1.9-2.5 1.9s-2.5-.8-2.5-1.9M12 6.3v1.4M12 16.3v1.4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      ) : (
        <path d="M14.6 8.9a3.2 3.2 0 1 0 0 6.2M8.6 11h4.4M8.6 13h4.4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      )}
    </svg>
  );
}

/* big clickable token (opens the token list) */
const TokenButton = ({ sym, onClick, disabled }: { sym: Sym; onClick: () => void; disabled?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={`Choose token, now ${sym}`}
    className="flex shrink-0 items-center gap-2 rounded-full bg-white/[0.07] py-1 pl-1 pr-3 text-base font-bold transition hover:bg-white/[0.12] disabled:opacity-60 sm:gap-2.5 sm:py-1.5 sm:pl-1.5 sm:pr-3.5 sm:text-[17px]"
  >
    <span className="block h-9 w-9 shrink-0 sm:h-10 sm:w-10"><Logo name={sym} fluid /></span>
    <span style={{ fontWeight: 700 }}>{sym}</span>
    <span className="text-slate-400"><Chevron /></span>
  </button>
);

const Arrow = ({ up }: { up: boolean }) => (
  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className={up ? "" : "rotate-180"}>
    <path d="M5 1 9.5 8.5h-9z" fill="currentColor" />
  </svg>
);

const ChangeBadge = ({ value }: { value: number }) => {
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${up ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"}`}>
      <Arrow up={up} />
      {fmtPct(value)}
    </span>
  );
};

/* mobile only: thin card under "You receive". Logo, price, change, MCap and 24h Vol are lined up with the logo;
   MCap and 24h Vol have their label above the value. They only wrap onto a second line when there is not enough room. Tap to open the token chart. */
function MarketCompact({ sym, row, failed, onOpen }: { sym: Sym; row: MarketRow | null | undefined; failed: boolean; onOpen: () => void }) {
  const stat = (label: string, value: number | null) => (
    <span className="flex flex-col leading-tight">
      <span className="text-[10px] text-slate-500">{label}</span>
      <span className="whitespace-nowrap text-[11px] font-semibold text-slate-300">{fmtCompact(value)}</span>
    </span>
  );
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Show token chart"
      className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 text-left transition hover:bg-white/[0.045] min-[900px]:hidden"
    >
      <span className="block h-8 w-8 shrink-0"><Logo name={sym} fluid /></span>
      {row ? (
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1.5 tabular-nums">
          <span className="whitespace-nowrap text-sm font-semibold">{fmtPrice(row.price)}</span>
          {row.change24h !== null && <ChangeBadge value={row.change24h} />}
          {stat("MCap", row.marketCap)}
          {stat("24h Vol", row.volume24h)}
        </span>
      ) : (
        <span className="flex-1 text-xs text-slate-500">{failed ? "Market data unavailable" : "Loading price…"}</span>
      )}
      <span className="shrink-0 text-slate-400"><Chevron dir="right" size={18} /></span>
    </button>
  );
}

/* mobile only: opens in front of the swap card with the token's chart. Left arrow goes back. */
function MarketDetail({ sym, market, onBack }: { sym: Sym; market: Market; onBack: () => void }) {
  return (
    <div className="absolute inset-0 z-20 overflow-y-auto rounded-[1.75rem] bg-[#070d1a] p-4 sm:rounded-[2rem] sm:p-5 min-[900px]:hidden">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} aria-label="Back to swap" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/[0.07] hover:text-white">
          <Chevron dir="left" size={20} />
        </button>
        <span className="block h-8 w-8 shrink-0"><Logo name={sym} fluid /></span>
        <div className="leading-tight">
          <p className="text-base font-bold">{sym}</p>
          <p className="text-xs text-slate-500">{TOKENS[sym].name}</p>
        </div>
      </div>
      <div className="mt-4">
        <ChartPanel sym={sym} market={market} compact />
      </div>
    </div>
  );
}

/* price chart: on the left of the swap card (desktop) and inside the mobile token view */
const RANGES = ["1H", "4H", "1D", "7D", "1M", "3M", "1Y"] as const;
type Range = (typeof RANGES)[number];
type Candle = [number, number, number, number, number]; // time, open, high, low, close

/** Candles from a price line: each candle goes from the previous price to this one. */
function pointsToCandles(pts: [number, number][]): Candle[] {
  const out: Candle[] = [];
  for (let i = 1; i < pts.length; i++) {
    const o = pts[i - 1][1];
    const c = pts[i][1];
    out.push([pts[i][0], o, Math.max(o, c), Math.min(o, c), c]);
  }
  return out;
}

const LineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 17l6-6 4 4 8-8M17 7h4v4" />
  </svg>
);
const CandleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 3v3M8 14v4M16 6v3M16 17v4" />
    <rect x="6" y="6" width="4" height="8" rx="1" />
    <rect x="14" y="9" width="4" height="8" rx="1" />
  </svg>
);

function ChartPanel({ sym, setSym, market, compact = false }: { sym: Sym; setSym?: (s: Sym) => void; market: Market; compact?: boolean }) {
  const [range, setRange] = useState<Range>("1D");
  const [kind, setKind] = useState<"line" | "candle">("line");
  const [data, setData] = useState<{ points?: [number, number][]; candles?: Candle[]; note?: string } | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "ok">("loading");
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    let live = true;
    setStatus("loading");
    setHover(null);
    fetch(`/api/market?type=chart&kind=${kind}&token=${sym}&range=${range}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("chart"))))
      .then((j) => {
        if (!live) return;
        setData(j);
        setStatus("ok");
      })
      .catch(() => live && setStatus("error"));
    return () => {
      live = false;
    };
  }, [sym, range, kind]);

  // works with either answer shape, so a price line can always be drawn as candles and the other way round
  const pts: [number, number][] = kind === "line" ? data?.points ?? (data?.candles ? data.candles.map((c) => [c[0], c[4]] as [number, number]) : []) : [];
  const candles: Candle[] = kind === "candle" ? data?.candles ?? (data?.points ? pointsToCandles(data.points) : []) : [];
  const n = kind === "candle" ? candles.length : pts.length;
  const W = 600;
  const H = 260;

  const lows = kind === "candle" ? candles.map((c) => c[3]) : pts.map((p) => p[1]);
  const highs = kind === "candle" ? candles.map((c) => c[2]) : pts.map((p) => p[1]);
  const lo = n ? Math.min(...lows) : 0;
  const hi = n ? Math.max(...highs) : 1;
  const pad = (hi - lo || hi * 0.001 || 1) * 0.12;
  const yOf = (p: number) => H - ((p - (lo - pad)) / (hi - lo + pad * 2)) * H;
  const xOf = (i: number) => (kind === "candle" ? (i + 0.5) * (W / Math.max(n, 1)) : n > 1 ? (i / (n - 1)) * W : 0);

  const closes = kind === "candle" ? candles.map((c) => c[4]) : pts.map((p) => p[1]);
  const firstVal = kind === "candle" ? candles[0]?.[1] : pts[0]?.[1];
  const lastVal = closes[closes.length - 1];
  const change = firstVal ? ((lastVal - firstVal) / firstVal) * 100 : 0;
  const up = change >= 0;
  const color = up ? "#34d399" : "#f87171";
  const idx = hover !== null && hover < n ? hover : n - 1;
  const shownPrice = n ? closes[idx] : market[sym]?.price;
  const shownTime = n ? (kind === "candle" ? candles[idx][0] : pts[idx][0]) : null;
  const line = pts.map((p, i) => `${i ? "L" : "M"}${xOf(i).toFixed(1)} ${yOf(p[1]).toFixed(1)}`).join(" ");
  const m = market[sym];

  const move = (e: ReactPointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - r.left) / r.width;
    setHover(Math.max(0, Math.min(n - 1, kind === "candle" ? Math.floor(frac * n) : Math.round(frac * (n - 1)))));
  };

  const kindToggle = (
    <div className="flex gap-1 rounded-full bg-white/[0.05] p-1">
      {(["line", "candle"] as const).map((k) => (
        <button
          key={k}
          onClick={() => setKind(k)}
          aria-label={k === "line" ? "Line chart" : "Candle chart"}
          title={k === "line" ? "Line chart" : "Candle chart"}
          className={`flex h-8 w-9 items-center justify-center rounded-full transition ${k === kind ? "bg-[#1978f5]/30 text-[#8fd4ff]" : "text-slate-400 hover:text-white"}`}
        >
          {k === "line" ? <LineIcon /> : <CandleIcon />}
        </button>
      ))}
    </div>
  );

  return (
    <div className={compact ? "" : "rounded-[2rem] border border-white/[0.08] bg-[#050a16]/80 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-6"}>
      <div className={`flex flex-wrap items-center gap-3 ${compact ? "justify-end" : "justify-between"}`}>
        {!compact && (
          <div className="flex gap-1.5">
            {SYMS.map((s) => (
              <button key={s} onClick={() => setSym?.(s)} className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold transition ${s === sym ? "bg-white/[0.12] text-white" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"}`}>
                <span className="block h-5 w-5"><Logo name={s} fluid /></span>
                {s}
              </button>
            ))}
          </div>
        )}
        {kindToggle}
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-2xl font-bold tabular-nums">{shownPrice ? fmtPrice(shownPrice) : "—"}</p>
          <p className="mt-0.5 text-xs text-slate-500">{shownTime ? new Date(shownTime).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}</p>
        </div>
        {status === "ok" && n > 1 && (
          <span className={`inline-flex items-center gap-1 text-sm font-semibold tabular-nums ${up ? "text-emerald-300" : "text-red-300"}`}>
            <Arrow up={up} />
            {fmtPct(change)} <span className="font-normal text-slate-500">{range}</span>
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5">
          <p className="text-xs text-slate-500">Market cap</p>
          <p className="font-semibold tabular-nums">{fmtCompact(m?.marketCap ?? null)}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5">
          <p className="text-xs text-slate-500">24h volume</p>
          <p className="font-semibold tabular-nums">{fmtCompact(m?.volume24h ?? null)}</p>
        </div>
      </div>

      <div className="relative mt-4" style={{ height: compact ? 220 : 260 }}>
        {status === "ok" && n > 1 ? (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="h-full w-full"
            style={{ touchAction: "pan-y" }}
            onPointerMove={move}
            onPointerDown={move}
            onPointerLeave={() => setHover(null)}
            onPointerCancel={() => setHover(null)}
          >
            <defs>
              <linearGradient id="swapChartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={color} stopOpacity="0.28" />
                <stop offset="1" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            {kind === "line" ? (
              <>
                <path d={`${line} L${W} ${H} L0 ${H} Z`} fill="url(#swapChartFill)" />
                <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
              </>
            ) : (
              candles.map((c, i) => {
                const col = c[4] >= c[1] ? "#34d399" : "#f87171";
                const w = (W / n) * 0.62;
                const yO = yOf(c[1]);
                const yC = yOf(c[4]);
                return (
                  <g key={i}>
                    <line x1={xOf(i)} x2={xOf(i)} y1={yOf(c[2])} y2={yOf(c[3])} stroke={col} strokeWidth="1.3" vectorEffect="non-scaling-stroke" />
                    <rect x={xOf(i) - w / 2} y={Math.min(yO, yC)} width={w} height={Math.max(1.5, Math.abs(yO - yC))} fill={col} />
                  </g>
                );
              })
            )}
            {hover !== null && <line x1={xOf(hover)} x2={xOf(hover)} y1="0" y2={H} stroke="#ffffff" strokeOpacity="0.25" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />}
          </svg>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">{status === "loading" ? "Loading chart…" : "Chart unavailable right now"}</div>
        )}
      </div>

      <div className="mt-3 flex gap-1 overflow-x-auto">
        {RANGES.map((r) => (
          <button key={r} onClick={() => setRange(r)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${r === range ? "bg-[#1978f5]/25 text-[#8fd4ff]" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"}`}>
            {r}
          </button>
        ))}
      </div>
      {(data?.note || m?.note) && status === "ok" && <p className="mt-2 text-xs text-slate-500">{data?.note ?? m?.note}</p>}
    </div>
  );
}

/* Pill on the top edge of the swap card: half of it sticks out above the card, half sits inside.
   It appears when you confirm the swap in your wallet:
   a round badge with the swap icon -> unfolds to show "Swapping" -> folds back -> check mark -> unfolds to show "Swap succeeded".
   Plain dark card; only the icon is colored. The text part is exactly as wide as its text. */
function StatusPill({ stage, url }: { stage: Exclude<PillStage, null>; url: string }) {
  const isDone = stage === "done-circle" || stage === "done-open";
  const open = stage === "swap-open" || stage === "done-open";
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex -translate-y-1/2 justify-center" role="status" aria-live="polite">
      <a
        href={isDone ? url : undefined}
        target={isDone ? "_blank" : undefined}
        rel={isDone ? "noreferrer" : undefined}
        aria-label={isDone ? "Swap succeeded. View the transaction on the explorer" : "Swapping"}
        className={`inline-flex h-12 items-center overflow-hidden rounded-full border border-white/[0.1] bg-[#0a0f1a]/95 text-[15px] font-semibold text-white shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:h-14 sm:text-base ${isDone ? "pointer-events-auto" : ""}`}
        style={{ animation: "pillIn .45s cubic-bezier(.2,1.2,.3,1) both" }}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center sm:h-14 sm:w-14">
          {isDone ? (
            <svg key="check" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 5px rgba(52,211,153,0.9))" }}>
              <path d="m5 12.5 4.5 4.5L19 7.5" strokeDasharray="24" strokeDashoffset="24" style={{ animation: "checkDraw .45s ease-out .1s forwards" }} />
            </svg>
          ) : (
            <span key="swap" className="text-[#39c4ff]" style={{ filter: "drop-shadow(0 0 6px rgba(57,196,255,0.8))" }}>
              <SwapArrows size={24} />
            </span>
          )}
        </span>
        <span
          className="grid overflow-hidden"
          style={{ gridTemplateColumns: open ? "1fr" : "0fr", opacity: open ? 1 : 0, transition: "grid-template-columns .5s cubic-bezier(.3,.8,.3,1), opacity .35s ease" }}
        >
          <span className="block min-w-0 overflow-hidden whitespace-nowrap pr-4">{isDone ? "Swap succeeded" : "Swapping"}</span>
        </span>
      </a>
    </div>
  );
}

/** Turns a wallet / SDK error into a short message for the screen. */
function explain(e: unknown, fallback: string): string {
  const err = e as { code?: number | string; message?: string };
  const msg = err?.message ?? "";
  if (err?.code === 4001 || /reject|denied|cancel/i.test(msg)) return "User rejected the transaction";
  const known: Record<string, string> = {
    WRONG_NETWORK: "Switch to Arc Mainnet and try again.",
    ACCOUNT_CHANGED: "Your wallet account changed. Reconnect and try again.",
    BAD_AMOUNT: "Enter a valid amount.",
    NO_BALANCE: "Insufficient balance",
    NO_QUOTE: "Couldn't get a price right now. Try again.",
    PRICE_CHANGED: "The price moved. Review the new price and tap Swap again.",
    BAD_TX: "Got an unexpected answer from the swap service. Check your wallet activity before trying again.",
    SWAP_FAILED: "The swap did not complete. No tokens were swapped.",
    TX_REVERTED: "The transaction was reverted on-chain. No tokens were swapped; only the network fee was spent.",
  };
  for (const k of Object.keys(known)) if (msg === k) return known[k];
  if (/INPUT_UNSUPPORTED_ROUTE|331001/i.test(msg)) return "No swap route for this amount right now. Try a different amount.";
  if (/ONCHAIN_SIMULATION_FAILED/i.test(msg)) return "This swap would fail right now. Try a different amount.";
  if (/failed to fetch|HTTP request failed|network ?error/i.test(msg)) return "Couldn't reach the network. Please try again.";
  return msg ? msg.slice(0, 140) : fallback;
}

/* ---------- page ---------- */
type Phase = "idle" | "swapping" | "failed";
type ModalKind = null | "from" | "to" | "settings" | "history";
type PillStage = null | "swap-circle" | "swap-open" | "swap-fold" | "done-circle" | "done-open";

export default function SwapPage() {
  // Same wallet state as the header (wagmi).
  const { address, isConnected, connector } = useAccount();
  const account = isConnected && address ? address : null;

  const [provider, setProvider] = useState<Eip1193 | undefined>(undefined);
  const [chainOk, setChainOk] = useState<boolean | null>(null);
  const [balances, setBalances] = useState<Record<Sym, bigint | null>>({ USDC: null, EURC: null, cirBTC: null });

  const [from, setFrom] = useState<Sym>("USDC");
  const [to, setTo] = useState<Sym>("EURC");
  const [amount, setAmount] = useState("");
  const [flips, setFlips] = useState(0);

  const [quote, setQuote] = useState<{ out: string; min: string } | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [netFee, setNetFee] = useState<number | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [pill, setPill] = useState<PillStage>(null);
  const [pillUrl, setPillUrl] = useState("");

  const [modal, setModal] = useState<ModalKind>(null);
  const [showChart, setShowChart] = useState(false);
  const [chartSym, setChartSym] = useState<Sym>("EURC");
  const [marketOpen, setMarketOpen] = useState(false);
  const [market, setMarket] = useState<Market>({});
  const [marketFailed, setMarketFailed] = useState(false);
  const [history, setHistory] = useState<SwapRecord[]>([]);
  const [slip, setSlip] = useState<Slip>({ mode: "auto", custom: "1" });

  const kitRef = useRef<KitLike | null>(null);
  const adapterRef = useRef<unknown>(null);
  const swapLock = useRef(false);

  /* the pill: circle -> unfolds to "Swapping" -> folds -> check mark circle -> unfolds to "Swap succeeded" */
  const pillRef = useRef<PillStage>(null);
  const pillTimers = useRef<number[]>([]);
  const confirmRef = useRef<(() => void) | null>(null);
  const setStage = (st: PillStage) => {
    pillRef.current = st;
    setPill(st);
  };
  const clearPillTimers = () => {
    pillTimers.current.forEach((t) => window.clearTimeout(t));
    pillTimers.current = [];
  };
  const later = (fn: () => void, ms: number) => {
    pillTimers.current.push(window.setTimeout(fn, ms));
  };
  const hidePill = () => {
    clearPillTimers();
    setStage(null);
  };
  const showSwapping = () => {
    clearPillTimers();
    setStage("swap-circle");
    later(() => setStage("swap-open"), 450);
  };
  const showDone = () => {
    clearPillTimers();
    const wasShown = pillRef.current === "swap-circle" || pillRef.current === "swap-open";
    if (wasShown) setStage("swap-fold");
    const t1 = wasShown ? 500 : 0;
    later(() => setStage("done-circle"), t1);
    later(() => setStage("done-open"), t1 + 550);
    later(() => setStage(null), t1 + 550 + 9000);
  };
  useEffect(() => () => pillTimers.current.forEach((t) => window.clearTimeout(t)), []);

  /* settings are remembered on this device */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("alabaamafi:slippage");
      if (raw) setSlip(JSON.parse(raw) as Slip);
    } catch {
      /* ignore */
    }
  }, []);
  const saveSlip = (s: Slip) => {
    setSlip(s);
    try {
      window.localStorage.setItem("alabaamafi:slippage", JSON.stringify(s));
    } catch {
      /* ignore */
    }
  };

  const customPct = parseFloat(slip.custom);
  const customValid = Number.isFinite(customPct) && customPct >= 0.01 && customPct <= 50;
  const slippageBps = slip.mode === "custom" && customValid ? Math.round(customPct * 100) : autoBps(from, to);

  /* swap history (this device) */
  const historyKey = account ? `alabaamafi:swaps:${account.toLowerCase()}` : null;
  useEffect(() => {
    if (!historyKey) return setHistory([]);
    try {
      const raw = window.localStorage.getItem(historyKey);
      setHistory(raw ? (JSON.parse(raw) as SwapRecord[]) : []);
    } catch {
      setHistory([]);
    }
  }, [historyKey]);


  /* market prices, refreshed every minute */
  useEffect(() => {
    let live = true;
    const load = async () => {
      try {
        const r = await fetch("/api/market?type=prices");
        if (!r.ok) throw new Error("market");
        const j = (await r.json()) as { prices?: Market };
        if (live) {
          setMarket(j.prices ?? {});
          setMarketFailed(false);
        }
      } catch {
        if (live) setMarketFailed(true);
      }
    };
    load();
    const id = setInterval(load, 60000);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, []);

  /* the connected wallet's own provider */
  useEffect(() => {
    let live = true;
    setProvider(undefined);
    setChainOk(null);
    if (!connector) return;
    connector.getProvider().then((p) => { if (live) setProvider(p as Eip1193); }).catch(() => {});
    return () => { live = false; };
  }, [connector]);

  /* which network the wallet is on */
  useEffect(() => {
    if (!provider) return;
    const checkChain = (id: unknown) => setChainOk(Number.isNaN(chainNum(id)) ? null : chainNum(id) === ARC.chainId);
    provider.request({ method: "eth_chainId" }).then(checkChain).catch(() => {});
    provider.on?.("chainChanged", checkChain);
    return () => provider.removeListener?.("chainChanged", checkChain);
  }, [provider]);

  /* a new wallet or account needs a fresh adapter */
  useEffect(() => {
    adapterRef.current = null;
  }, [provider, account]);

  const getKit = async (): Promise<KitLike> => {
    if (!kitRef.current) {
      const { AppKit } = await import("@circle-fin/app-kit");
      kitRef.current = new AppKit() as unknown as KitLike;
    }
    return kitRef.current;
  };

  /* Adapter for the connected wallet. Reads go through your wallet first, then Arc's public RPCs. */
  const getAdapter = async (): Promise<unknown> => {
    if (!adapterRef.current) {
      const { ViemAdapter } = await import("@circle-fin/adapter-viem-v2");
      const { createPublicClient, createWalletClient, custom, fallback, http } = await import("viem");
      const kit = await getKit();
      const supportedChains = ((await kit.getSupportedChains()) as { type: string }[]).filter((c) => c.type === "evm");
      const walletTransport = () => custom(provider as never);
      // The wallet client reports when you confirm the swap transaction in your wallet, so the pill can appear at that moment.
      const raw = provider as Eip1193;
      const watched = {
        request: async (args: { method: string; params?: unknown[] }) => {
          const result = await raw.request(args);
          if (args.method === "eth_sendTransaction") {
            // a token approval (0x095ea7b3) is not the swap itself; the first other transaction is
            const tx = (args.params?.[0] ?? {}) as { data?: string; input?: string };
            const data = (tx.data ?? tx.input ?? "").toLowerCase();
            if (!data.startsWith("0x095ea7b3")) confirmRef.current?.();
          }
          return result;
        },
        on: raw.on?.bind(raw),
        removeListener: raw.removeListener?.bind(raw),
      };
      adapterRef.current = new ViemAdapter(
        {
          getPublicClient: ({ chain }: { chain: unknown }) =>
            createPublicClient({
              chain: chain as never,
              transport: fallback([walletTransport(), ...ARC_RPCS.map((u) => http(u, { retryCount: 1, timeout: 8000 }))]),
            }),
          getWalletClient: ({ chain }: { chain: unknown }) =>
            createWalletClient({ account: account as `0x${string}`, chain: chain as never, transport: custom(watched as never) }),
        } as never,
        { addressContext: "user-controlled", supportedChains } as never
      );
    }
    return adapterRef.current;
  };

  /* balances (ERC-20 face of each token) */
  const readBalance = useCallback(
    async (sym: Sym): Promise<bigint | null> => {
      if (!provider || !account) return null;
      try {
        const res = (await provider.request({ method: "eth_call", params: [{ to: TOKENS[sym].address, data: "0x70a08231" + pad32(account) }, "latest"] })) as string;
        return BigInt(res || "0x0");
      } catch {
        return null;
      }
    },
    [provider, account]
  );

  const loadBalances = useCallback(async () => {
    if (!provider || !account || !chainOk) return setBalances({ USDC: null, EURC: null, cirBTC: null });
    const [usdc, eurc, btc] = await Promise.all([readBalance("USDC"), readBalance("EURC"), readBalance("cirBTC")]);
    setBalances({ USDC: usdc, EURC: eurc, cirBTC: btc });
  }, [provider, account, chainOk, readBalance]);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  /* derived */
  const fromDec = TOKENS[from].decimals;
  const toDec = TOKENS[to].decimals;
  const units = parseUnits(amount, fromDec);
  const cleanAmount = amount.endsWith(".") ? amount.slice(0, -1) : amount;
  const balance = balances[from];
  const busy = phase === "swapping";
  const ready = !!account && chainOk === true;

  /* live price (Circle swap service), 0.5s after you stop typing */
  useEffect(() => {
    setQuote(null);
    setQuoteError("");
    if (!ready || !units || units <= ZERO) return;
    let live = true;
    setQuoting(true);
    const t = setTimeout(async () => {
      try {
        const kit = await getKit();
        const adapter = await getAdapter();
        const est = await kit.estimateSwap({
          from: { adapter, chain: KIT_CHAIN },
          tokenIn: from,
          tokenOut: to,
          amountIn: cleanAmount,
          config: { slippageBps },
        });
        if (live) setQuote({ out: est.estimatedOutput.amount, min: est.stopLimit.amount });
      } catch (e) {
        if (live) setQuoteError(explain(e, "Couldn't get a price right now."));
      } finally {
        if (live) setQuoting(false);
      }
    }, 500);
    return () => {
      live = false;
      clearTimeout(t);
      setQuoting(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, from, to, cleanAmount, slippageBps, provider, account]);

  /* rough network fee: current gas price x a typical swap's gas (paid in USDC) */
  useEffect(() => {
    setNetFee(null);
    if (!provider || !quote) return;
    let live = true;
    provider
      .request({ method: "eth_gasPrice" })
      .then((p) => {
        let price = BigInt(p as string);
        if (price < FEE_FLOOR) price = FEE_FLOOR;
        const wei = price * BigInt(SWAP_GAS_ESTIMATE);
        if (live) setNetFee(Number(wei) / 1e18);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [provider, quote]);

  /* dollar values under each amount */
  const priceOf = (s: Sym): number | null => market[s]?.price ?? (s === "USDC" ? 1 : null);
  const payNum = cleanAmount && Number(cleanAmount) > 0 ? Number(cleanAmount) : 0;
  const getNum = quote ? Number(quote.out) : 0;
  const payUsd = priceOf(from) !== null ? payNum * (priceOf(from) as number) : null;
  const getUsd = priceOf(to) !== null ? getNum * (priceOf(to) as number) : null;

  /* USDC kept back for the network fee: 1.5x the estimated fee (at least 0.01 USDC, or 0.02 while there is no estimate yet) */
  const gasReserve = netFee !== null ? BigInt(Math.max(10000, Math.ceil(netFee * 1.5 * 1e6))) : BigInt(20000);

  /* validation */
  const problem = useMemo((): { text: string; hard: boolean } | null => {
    if (!amount) return { text: "Enter an amount", hard: false };
    if (units === null) return { text: `Use up to ${fromDec} decimal places`, hard: true };
    if (units <= ZERO) return { text: "Enter an amount", hard: false };
    if (balance !== null && units > balance) return { text: "Insufficient balance", hard: true };
    if (from === "USDC" && balance !== null && units + gasReserve > balance) return { text: "Keep a little USDC for the network fee", hard: true };
    return null;
  }, [amount, units, balance, from, fromDec, gasReserve]);

  /* actions */
  const switchToArc = async () => {
    if (!provider) return;
    try {
      await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: ARC.chainIdHex }] });
    } catch (e) {
      if ((e as { code?: number }).code === 4902) {
        try {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [{ chainId: ARC.chainIdHex, chainName: "Arc Mainnet", nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 }, rpcUrls: [ARC.rpc], blockExplorerUrls: [ARC.explorer] }],
          });
        } catch {
          setMessage("Couldn't add Arc Mainnet to your wallet.");
        }
      } else {
        setMessage("Network switch was cancelled.");
      }
    }
  };

  const flip = () => {
    if (busy) return;
    setFrom(to);
    setTo(from);
    setAmount(""); // clear the amount when the tokens are flipped
    setFlips((n) => n + 1);
    setMessage("");
  };

  /* choose a token on either side; picking the token that's on the other side swaps them */
  const pick = (side: "from" | "to", sym: Sym) => {
    let nf = from;
    let nt = to;
    if (side === "from") {
      if (sym === to) nt = from;
      nf = sym;
    } else {
      if (sym === from) nf = to;
      nt = sym;
    }
    setFrom(nf);
    setTo(nt);
    setAmount((a) => trimDecimals(a, TOKENS[nf].decimals));
    setChartSym(nt);
    setModal(null);
    setMessage("");
  };

  const setFraction = (half: boolean) => {
    if (balance === null) return;
    const buffer = from === "USDC" ? gasReserve : ZERO;
    let v = half ? balance / BigInt(2) : balance;
    if (v + buffer > balance) v = balance > buffer ? balance - buffer : ZERO;
    setAmount(formatUnits(v, fromDec, 0).replace(/,/g, ""));
  };

  /** Waits for the swap transaction to be mined. Returns null if it isn't confirmed within about a minute. */
  const waitForReceipt = async (hash: string): Promise<{ status?: string } | null> => {
    for (let i = 0; i < 60; i++) {
      try {
        const r = (await provider?.request({ method: "eth_getTransactionReceipt", params: [hash] })) as { status?: string } | null;
        if (r) return r;
      } catch {
        /* keep polling */
      }
      await sleep(1000);
    }
    return null;
  };

  const swap = async () => {
    if (swapLock.current || !provider || !account || problem || !quote) return; // lock stops double taps
    swapLock.current = true;
    setPhase("swapping");
    hidePill();
    confirmRef.current = () => {
      if (pillRef.current === null) showSwapping();
    };
    setMessage("");
    try {
      /* 1. check the wallet right before sending */
      if (chainNum(await provider.request({ method: "eth_chainId" })) !== ARC.chainId) throw new Error("WRONG_NETWORK");
      const accts = (await provider.request({ method: "eth_accounts" })) as string[];
      if (!accts?.[0] || accts[0].toLowerCase() !== account.toLowerCase()) throw new Error("ACCOUNT_CHANGED");
      if (!units || units <= ZERO) throw new Error("BAD_AMOUNT");
      const balNow = await readBalance(from);
      if (balNow !== null && units > balNow) throw new Error("NO_BALANCE");

      /* 2. get a fresh price; if it got worse than what the user saw, stop and show the new one */
      const kit = await getKit();
      const adapter = await getAdapter();
      const params: SwapArgs = { from: { adapter, chain: KIT_CHAIN }, tokenIn: from, tokenOut: to, amountIn: cleanAmount, config: { slippageBps } };
      const fresh = await kit.estimateSwap(params);
      const shown = Number(quote.out);
      const now = Number(fresh.estimatedOutput.amount);
      if (!Number.isFinite(now) || now <= 0) throw new Error("NO_QUOTE");
      if (now < shown * (1 - PRICE_DRIFT)) {
        setQuote({ out: fresh.estimatedOutput.amount, min: fresh.stopLimit.amount });
        throw new Error("PRICE_CHANGED");
      }

      /* 3. swap. The minimum received (slippage) is enforced by the swap itself. */
      const before = await readBalance(to);
      const result = await kit.swap(params);

      /* 4. check what came back */
      if (!TX_HASH_RE.test(result.txHash ?? "")) throw new Error("BAD_TX");
      const url = safeExplorerUrl(result.explorerUrl, result.txHash);
      const st = result.progress?.status;
      if (st === "FAILED" || st === "NOT_FOUND") throw new Error("SWAP_FAILED");

      /* 5. confirm on-chain */
      const receipt = await waitForReceipt(result.txHash);
      if (receipt === null) {
        hidePill();
        setPhase("idle");
        setMessage("Swap sent, but not confirmed yet. Check the explorer before trying again.");
        setPillUrl(url);
        loadBalances();
        return;
      }
      if (receipt.status !== "0x1") throw new Error("TX_REVERTED");

      /* 6. compare what you actually received with the minimum */
      let got = tidy(result.amountOut ?? quote.out, toDec);
      let warn = "";
      const after = await readBalance(to);
      if (before !== null && after !== null && after > before) {
        const recv = after - before;
        got = formatUnits(recv, toDec, 2);
        const minUnits = parseUnits(trimDecimals(quote.min, toDec), toDec);
        if (minUnits !== null && recv < minUnits) warn = "You received less than the minimum shown. Please check the transaction on the explorer.";
      }

      const paid = `${tidy(cleanAmount, fromDec)} ${from}`;
      setPillUrl(url);
      showDone();
      setPhase("idle");
      setAmount("");
      setQuote(null);
      setMessage(warn);
      loadBalances();
      if (historyKey) {
        const next = [{ id: result.txHash, t: Date.now(), from, to, paid, got: `${got} ${to}`, url }, ...history].slice(0, 50);
        setHistory(next);
        try {
          window.localStorage.setItem(historyKey, JSON.stringify(next));
        } catch {
          /* ignore */
        }
      }
    } catch (e) {
      hidePill();
      setMessage(explain(e, "The swap could not be completed."));
      setPhase("failed");
    } finally {
      swapLock.current = false;
      confirmRef.current = null;
    }
  };

  /* main button */
  let action: { label: ReactNode; onClick: () => void; disabled: boolean };
  if (!account) action = { label: "Connect wallet", onClick: () => {}, disabled: true };
  else if (chainOk === false) action = { label: "Switch to Arc Mainnet", onClick: switchToArc, disabled: false };
  else if (busy) action = { label: <span className="flex items-center gap-3"><Spinner />Swapping</span>, onClick: () => {}, disabled: true };
  else action = { label: "Swap", onClick: swap, disabled: !!problem || !quote || quoting || chainOk === null };

  const amountFont = amount.length > 9 ? "clamp(1.25rem, 5vw, 1.375rem)" : amount.length > 6 ? "clamp(1.375rem, 5.6vw, 1.625rem)" : "clamp(1.5rem, 6.5vw, 1.875rem)";
  const rate = quote && payNum > 0 ? Number(quote.out) / payNum : null;
  const balText = (s: Sym) => (ready && balances[s] !== null ? `Balance ${formatUnits(balances[s] as bigint, TOKENS[s].decimals)}` : "Balance —");
  const slipLabel = `${slippageBps / 100}%${slip.mode === "auto" || !customValid ? " (Auto)" : ""}`;

  return (
    <main className={`${brandFont.className} relative min-h-screen overflow-x-hidden bg-[#010205] text-white selection:bg-[#167cff]/30`}>
      <style>{`
        @keyframes backgroundFloat{0%,100%{transform:translate3d(-50%,0,0) scale(1)}50%{transform:translate3d(-46%,2vw,0) scale(1.08)}}
        @keyframes backgroundFloatReverse{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(5vw,-3vw,0) scale(1.12)}}
        @keyframes twinkle{0%,100%{opacity:.12}50%{opacity:.9}}
        @keyframes floatUp{0%{transform:translateY(0);opacity:0}15%{opacity:.7}100%{transform:translateY(-220px);opacity:0}}
        @keyframes arrowSlideA{0%{transform:translateX(10px);opacity:0}40%{transform:translateX(0);opacity:1}80%{transform:translateX(0);opacity:1}100%{transform:translateX(0);opacity:0}}
        @keyframes arrowSlideB{0%{transform:translateX(-10px);opacity:0}40%{transform:translateX(0);opacity:1}80%{transform:translateX(0);opacity:1}100%{transform:translateX(0);opacity:0}}
        @keyframes pillIn{from{opacity:0;transform:translateY(-8px) scale(.9)}to{opacity:1;transform:none}}
        @keyframes checkDraw{to{stroke-dashoffset:0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
        .fade-up{opacity:0;animation:fadeUp .9s cubic-bezier(.2,.7,.2,1) forwards;animation-delay:var(--delay,0ms)}
        @media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-delay:0s!important;animation-iteration-count:1!important}.fade-up{opacity:1}}
      `}</style>

      <SpaceBackground />

      <div className="relative z-10">
        <Header />

        {/* phones: normal size. Screens 900px+ wide: content at 90%, so 100% browser zoom looks like 90% did. Delete min-[900px]:[zoom:0.9] to turn this off. */}
        <section className={`pb-20 pt-8 sm:pt-12 lg:pb-32 lg:pt-14 min-[900px]:[zoom:0.9] ${CONTAINER}`}>
          {/* title */}
          <div className="fade-up mx-auto max-w-2xl text-center">
            <h1 className="text-[2.4rem] font-bold leading-[1.05] tracking-[-0.035em] sm:text-[3.9rem]">
              Swap <span className="bg-gradient-to-r from-[#18bfff] via-[#2588ff] to-[#4262ff] bg-clip-text text-transparent">Tokens</span>
            </h1>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-6 text-slate-400 sm:mt-4 sm:text-lg sm:leading-7">Swap USDC, EURC and cirBTC on Arc.</p>
          </div>

          {/* chart on the left (desktop only) + swap card */}
          <div className={`mx-auto mt-10 flex w-full items-start justify-center gap-6 sm:mt-12 ${showChart ? "max-w-lg min-[900px]:max-w-[1240px]" : "max-w-lg"}`}>
            {showChart && (
              <div className="hidden min-w-0 flex-1 min-[900px]:block">
                <ChartPanel sym={chartSym} setSym={setChartSym} market={market} />
              </div>
            )}

            <div className="fade-up relative w-full max-w-lg shrink-0" style={{ "--delay": "150ms" } as CSSProperties}>
              <div className="absolute -inset-10 rounded-full bg-[#1675ff]/10 blur-3xl" />
              <div className="relative rounded-[1.75rem] border border-white/[0.08] bg-[#050a16]/80 p-4 shadow-[0_30px_100px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:rounded-[2rem] sm:p-7">
                {pill && <StatusPill stage={pill} url={pillUrl} />}

                <div className={`flex items-center justify-between border-b border-white/[0.06] pb-3 transition-[margin] duration-300 sm:pb-4 ${pill ? "mt-4 sm:mt-2" : ""}`}>
                  <div>
                    <p className="text-xs text-slate-500">Network</p>
                    <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                      <span className="block h-5 w-5"><Logo name="Arc" fluid /></span>
                      Arc Mainnet
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconButton label="Swap history" onClick={() => setModal("history")}>
                      <Svg d={ICON_HISTORY} />
                    </IconButton>
                    <IconButton label="Price chart" onClick={() => { setChartSym(to); setShowChart((v) => !v); }} className="hidden min-[900px]:flex">
                      <span className={showChart ? "text-[#39c4ff]" : ""}><Svg d={ICON_CHART} /></span>
                    </IconButton>
                    <IconButton label="Settings" onClick={() => setModal("settings")}>
                      <Svg d={ICON_SETTINGS} />
                    </IconButton>
                  </div>
                </div>

                <div className="mt-4 sm:mt-5">
                  {/* you pay */}
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3.5 transition focus-within:border-[#2588ff]/60 focus-within:bg-white/[0.05] sm:p-4">
                    <div className="flex items-center justify-between gap-3 text-[13px] font-medium text-slate-400">
                      <span>You pay</span>
                      <span className="text-xs tabular-nums">{balText(from)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <input
                        value={amount}
                        onChange={(e) => {
                          const v = e.target.value.replace(",", ".");
                          if (v === "" || new RegExp(`^\\d*\\.?\\d{0,${fromDec}}$`).test(v)) setAmount(v);
                        }}
                        disabled={busy}
                        inputMode="decimal"
                        placeholder="0.00"
                        autoComplete="off"
                        aria-label={`Amount of ${from} to swap`}
                        style={{ fontSize: amountFont, fontWeight: 600, lineHeight: 1.1, fontFamily: manrope.style.fontFamily }}
                        className="w-full min-w-0 flex-1 bg-transparent tabular-nums tracking-tight text-white outline-none placeholder:text-slate-700 disabled:opacity-60"
                      />
                      <TokenButton sym={from} onClick={() => setModal("from")} disabled={busy} />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-500 tabular-nums">{fmtUsd(payUsd)}</p>
                      <div className="flex gap-1.5">
                        <Pill onClick={() => setFraction(true)} disabled={busy || !ready || balance === null}>50%</Pill>
                        <Pill onClick={() => setFraction(false)} disabled={busy || !ready || balance === null}>Max</Pill>
                      </div>
                    </div>
                  </div>

                  {/* flip */}
                  <div className="relative z-10 -my-3 flex justify-center">
                    <button
                      type="button"
                      onClick={flip}
                      disabled={busy}
                      aria-label="Switch tokens"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] bg-[#071025] text-[#55c5ff] shadow-lg transition hover:border-[#2f8bff]/50 hover:text-white disabled:opacity-50 sm:h-10 sm:w-10"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform .4s ease", transform: `rotate(${flips * 180}deg)` }}>
                        <path d="M7 4v13m0 0-3-3m3 3 3-3M17 20V7m0 0-3 3m3-3 3 3" />
                      </svg>
                    </button>
                  </div>

                  {/* you receive */}
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3.5 sm:p-4">
                    <div className="flex items-center justify-between gap-3 text-[13px] font-medium text-slate-400">
                      <span>You receive</span>
                      <span className="text-xs tabular-nums">{balText(to)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div
                        className={`min-w-0 flex-1 truncate tabular-nums tracking-tight ${quote ? "text-white" : "text-slate-700"}`}
                        style={{ fontSize: amountFont, fontWeight: 600, lineHeight: 1.1, fontFamily: manrope.style.fontFamily }}
                      >
                        {quote ? tidy(quote.out, toDec) : quoting ? "…" : "0.00"}
                      </div>
                      <TokenButton sym={to} onClick={() => setModal("to")} disabled={busy} />
                    </div>
                    <div className="mt-1.5">
                      <p className="text-sm text-slate-500 tabular-nums">{fmtUsd(getUsd)}</p>
                    </div>
                  </div>

                  <MarketCompact sym={to} row={market[to]} failed={marketFailed} onOpen={() => setMarketOpen(true)} />
                </div>

                {/* price info, shown once there's a quote */}
                {quote && (
                  <dl className="mt-4 space-y-2 px-1 text-[13px] sm:mt-5 sm:text-sm">
                    {rate !== null && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Rate</dt>
                        <dd className="text-right text-slate-300 tabular-nums">1 {from} ≈ {fmtRate(rate)} {to}</dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Minimum received</dt>
                      <dd className="text-right text-slate-300 tabular-nums">{tidy(quote.min, toDec)} {to}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Slippage</dt>
                      <dd className="text-right text-slate-300 tabular-nums">{slipLabel}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Network fee</dt>
                      <dd className="text-right text-slate-300 tabular-nums">{netFee === null ? "—" : `≈ ${netFee < 0.001 ? "<0.001" : netFee.toFixed(3)} USDC`}</dd>
                    </div>
                  </dl>
                )}

                <button onClick={action.onClick} disabled={action.disabled} className={`${BUTTON} mt-5 sm:mt-6`}>
                  {action.label}
                </button>

                {/* hints / errors */}
                <div className="mt-3 min-h-5 text-center text-sm" role="status">
                  {phase === "failed" && message ? (
                    <span className="text-red-300">{message}</span>
                  ) : !busy && ready && problem && amount ? (
                    <span className={problem.hard ? "text-red-300" : "text-slate-500"}>{problem.text}</span>
                  ) : !busy && ready && quoteError ? (
                    <span className="text-red-300">{quoteError}</span>
                  ) : !busy && ready && quoting ? (
                    <span className="text-slate-500">Getting the best price…</span>
                  ) : !busy && message ? (
                    <span className="text-slate-400">
                      {message}
                      {pillUrl && message.startsWith("Swap sent") && (
                        <> <a href={pillUrl} target="_blank" rel="noreferrer" className="font-medium text-[#65caff] hover:text-white">View on explorer</a></>
                      )}
                    </span>
                  ) : null}
                </div>

                {phase === "failed" && (
                  <button onClick={() => { setPhase("idle"); setMessage(""); }} className={`${SECONDARY_BUTTON} mt-3`}>Try again</button>
                )}

                {/* mobile market view, in front of the card */}
                {marketOpen && <MarketDetail sym={to} market={market} onBack={() => setMarketOpen(false)} />}
              </div>
            </div>
          </div>

          {/* reassurance */}
          <ul className="fade-up mx-auto mt-8 flex max-w-lg flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-500" style={{ "--delay": "300ms" } as CSSProperties}>
            <li>Fees paid in USDC</li>
            <li>Final in under a second</li>
            <li>You always receive at least the minimum shown</li>
          </ul>
        </section>
      </div>

      {/* ---------- token list ---------- */}
      <Modal open={modal === "from" || modal === "to"} onClose={() => setModal(null)} title="Select a token">
        <ul className="space-y-1">
          {SYMS.map((s) => {
            const side = modal === "from" ? "from" : "to";
            const current = side === "from" ? from : to;
            return (
              <li key={s}>
                <button onClick={() => pick(side, s)} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/[0.06] ${s === current ? "bg-white/[0.05]" : ""}`}>
                  <span className="block h-10 w-10 shrink-0"><Logo name={s} fluid /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold">{s}</span>
                    <span className="block truncate text-xs text-slate-500">{TOKENS[s].name}</span>
                  </span>
                  <span className="text-sm text-slate-400 tabular-nums">{ready && balances[s] !== null ? formatUnits(balances[s] as bigint, TOKENS[s].decimals) : "—"}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Modal>

      {/* ---------- settings ---------- */}
      <Modal open={modal === "settings"} onClose={() => setModal(null)} title="Settings">
        <p className="text-sm font-medium">Max slippage</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">The most the price can move against you before the swap is cancelled.</p>
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-full bg-white/[0.05] p-1">
          {(["auto", "custom"] as const).map((m) => (
            <button key={m} onClick={() => saveSlip({ ...slip, mode: m })} className={`rounded-full py-2 text-sm font-semibold capitalize transition ${slip.mode === m ? "bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] text-white" : "text-slate-400 hover:text-white"}`}>
              {m}
            </button>
          ))}
        </div>
        {slip.mode === "auto" ? (
          <p className="mt-3 text-xs leading-5 text-slate-400">
            Auto uses <span className="font-semibold text-white">{autoBps(from, to) / 100}%</span> for this pair: 0.5% for USDC and EURC, 1% whenever cirBTC is involved.
          </p>
        ) : (
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              {SLIP_PRESETS.map((p) => (
                <button key={p} onClick={() => saveSlip({ ...slip, custom: p })} className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition ${parseFloat(slip.custom) === parseFloat(p) ? "bg-[#1978f5]/30 text-[#8fd4ff]" : "bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]"}`}>
                  {p}%
                </button>
              ))}
            </div>
            <div className={`mt-3 flex items-center rounded-2xl border bg-white/[0.035] px-4 py-3 ${customValid || !slip.custom ? "border-white/[0.07]" : "border-red-400/40"}`}>
              <input
                value={slip.custom}
                onChange={(e) => {
                  const v = e.target.value.replace(",", ".");
                  if (v === "" || /^\d{0,2}\.?\d{0,2}$/.test(v)) saveSlip({ ...slip, custom: v });
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
              {!customValid ? "Enter a value from 0.01% to 50%. Auto is used until then." : customPct > 5 ? "High slippage: you could receive much less than expected." : customPct < 0.1 ? "Very low slippage: the swap may fail if the price moves." : `You'll receive at least ${(100 - customPct).toFixed(2)}% of the estimated amount.`}
            </p>
          </div>
        )}
      </Modal>

      {/* ---------- history ---------- */}
      <Modal open={modal === "history"} onClose={() => setModal(null)} title="Swap history">
        {!account ? (
          <p className="py-6 text-center text-sm text-slate-500">Connect your wallet to see your swaps.</p>
        ) : history.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No swaps yet. Swaps you make here will show up in this list.</p>
        ) : (
          <ul className="space-y-1">
            {history.map((h) => (
              <li key={h.id}>
                <a href={h.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-white/[0.06]">
                  <span className="flex -space-x-2">
                    <span className="block h-7 w-7"><Logo name={h.from} fluid /></span>
                    <span className="block h-7 w-7"><Logo name={h.to} fluid /></span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold tabular-nums">{h.paid}</span>
                    <span className="block truncate text-xs text-slate-500 tabular-nums">for {h.got}</span>
                  </span>
                  <span className="text-xs text-slate-500">{timeAgo(h.t)}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
        {account && (
          <div className="mt-4 border-t border-white/[0.06] pt-4">
            <p className="text-xs text-slate-500">Shows swaps made on this device.</p>
            <a href={`${ARC.explorer}/address/${account}`} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-[#65caff] hover:text-white">
              See all activity on the explorer
            </a>
          </div>
        )}
      </Modal>
    </main>
  );
}
