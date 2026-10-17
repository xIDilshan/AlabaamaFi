"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Inter } from "next/font/google";
import { useAccount } from "wagmi";
import Header from "@/components/Header";

const brandFont = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });

const EXPLORER = "https://explorer.arc.io";
const CONTAINER = "w-full px-4 sm:px-8 lg:px-10";
const ZERO = "0x0000000000000000000000000000000000000000";
const USDC_ERC20 = "0x3600000000000000000000000000000000000000";
const MIN_VISIBLE = 8; // keep loading older pages until at least this many rows can be shown

/* ---------- raw data from /api/activity (all of this wallet's history on Arc mainnet) ---------- */
type Tx = { hash: string; t: number; status: "ok" | "error" | "pending"; method: string | null; from: string; to: string; value: string; fee: string | null };
type Tr = { key: string; hash: string; t: number; symbol: string; amount: string; from: string; to: string; token: string };
type Cursor = Record<string, string | number>;

/* ---------- what the page shows ---------- */
type Leg = { symbol: string; amount: string; dir: "in" | "out" };
type EvType = "send" | "receive" | "swap" | "bridge-out" | "bridge-in" | "contract";
type Ev = { hash: string; t: number; status: "ok" | "error" | "pending"; type: EvType; legs: Leg[]; peer?: string; fee?: string; method?: string };

type Filter = "all" | "send" | "receive" | "swap" | "bridge";
const FILTERS: [Filter, string][] = [
  ["all", "All"],
  ["send", "Sent"],
  ["receive", "Received"],
  ["swap", "Swaps"],
  ["bridge", "Bridges"],
];

/* ---------- helpers ---------- */
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

function fmtAmt(s: string): string {
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  const max = n >= 1000 ? 2 : n >= 1 ? 4 : 8;
  return n.toLocaleString("en-US", { minimumFractionDigits: n >= 1 ? 2 : 0, maximumFractionDigits: max });
}
const timeOf = (t: number) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
function dayLabel(t: number) {
  const d = new Date(t);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: d.getFullYear() === today.getFullYear() ? undefined : "numeric" });
}

/** "1000000000000000000" with 18 decimals -> "1" (no floating point) */
function toDecimal(raw: string, decimals: number): string {
  if (!/^\d+$/.test(raw)) return "0";
  const s = raw.replace(/^0+/, "") || "0";
  if (decimals <= 0) return s;
  const p = s.padStart(decimals + 1, "0");
  const whole = p.slice(0, p.length - decimals);
  const frac = p.slice(p.length - decimals).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
}

/** Turns the raw transactions + token transfers into sends, receives, swaps and bridges. Works on everything loaded so far. */
function buildEvents(txs: Tx[], trs: Tr[], me: string, horizon: number): Ev[] {
  type Work = { hash: string; t: number; status: Ev["status"]; method?: string; fee?: string; nFrom: string; nTo: string; nValue: string; legs: Leg[]; peer?: string; minted: boolean; usdcKeys: Set<string> };
  const map = new Map<string, Work>();
  const get = (hash: string, t: number): Work => {
    let w = map.get(hash);
    if (!w) {
      w = { hash, t, status: "ok", nFrom: "", nTo: "", nValue: "0", legs: [], minted: false, usdcKeys: new Set() };
      map.set(hash, w);
    }
    if (t && !w.t) w.t = t;
    return w;
  };

  for (const x of txs) {
    const w = get(x.hash, x.t);
    w.status = x.status;
    w.method = x.method ?? undefined;
    w.nFrom = x.from;
    w.nTo = x.to;
    w.nValue = x.value;
    if (x.fee) w.fee = x.fee;
  }
  for (const tr of trs) {
    const w = get(tr.hash, tr.t);
    if (tr.from === me && tr.to === me) continue;
    const dir: "in" | "out" | null = tr.from === me ? "out" : tr.to === me ? "in" : null;
    if (!dir) continue;
    w.legs.push({ symbol: tr.symbol, amount: tr.amount, dir });
    w.peer = w.peer ?? (dir === "out" ? tr.to : tr.from);
    if (dir === "in" && tr.from === ZERO) w.minted = true;
    if (tr.token === USDC_ERC20) w.usdcKeys.add(`${dir}:${tr.amount}`);
  }
  /* plain USDC transfers (Arc's gas coin) that have no token-transfer record */
  for (const w of map.values()) {
    if (!/^[1-9]\d*$/.test(w.nValue)) continue;
    const amount = toDecimal(w.nValue, 18);
    if (w.nFrom === me && w.nTo !== me && !w.usdcKeys.has(`out:${amount}`)) {
      w.legs.push({ symbol: "USDC", amount, dir: "out" });
      w.peer = w.peer ?? w.nTo;
    } else if (w.nTo === me && w.nFrom !== me && !w.usdcKeys.has(`in:${amount}`)) {
      w.legs.push({ symbol: "USDC", amount, dir: "in" });
      w.peer = w.peer ?? w.nFrom;
    }
  }

  const out: Ev[] = [];
  for (const w of map.values()) {
    if (horizon && w.t < horizon) continue; // older pages aren't fully loaded yet
    const outs = w.legs.filter((l) => l.dir === "out");
    const ins = w.legs.filter((l) => l.dir === "in");
    const m = (w.method ?? "").toLowerCase();
    let type: EvType = "contract";
    if (/depositforburn|burn/.test(m) && outs.length) type = "bridge-out";
    else if (/receivemessage|mint/.test(m) && ins.length) type = "bridge-in";
    else if (outs.length && ins.length && outs.some((o) => ins.some((i) => i.symbol !== o.symbol))) type = "swap";
    else if (ins.length && w.minted && !outs.length) type = "bridge-in";
    else if (outs.length && !ins.length) type = "send";
    else if (ins.length && !outs.length) type = "receive";
    else if (outs.length && ins.length) type = "send";
    if (type === "contract" && !w.method && !w.legs.length) continue;
    out.push({ hash: w.hash, t: w.t, status: w.status, type, legs: w.legs, peer: w.peer, fee: w.fee, method: w.method });
  }
  return out.sort((a, b) => b.t - a.t);
}

function titleOf(e: Ev): string {
  const outs = e.legs.filter((l) => l.dir === "out");
  const ins = e.legs.filter((l) => l.dir === "in");
  switch (e.type) {
    case "send":
      return `Sent ${outs[0]?.symbol ?? ""}`.trim();
    case "receive":
      return `Received ${ins[0]?.symbol ?? ""}`.trim();
    case "swap":
      return `Swapped ${outs[0]?.symbol ?? ""} for ${ins[0]?.symbol ?? ""}`;
    case "bridge-out":
      return "Bridge out";
    case "bridge-in":
      return "Bridge in";
    default:
      return e.method ? `Contract: ${e.method}` : "Contract interaction";
  }
}
function subtitleOf(e: Ev): string {
  if (e.type === "send" && e.peer) return `To ${short(e.peer)}`;
  if (e.type === "receive" && e.peer) return e.peer === ZERO ? "Minted" : `From ${short(e.peer)}`;
  if (e.type === "bridge-in") return e.peer && e.peer !== ZERO ? `From ${short(e.peer)}` : "USDC delivered to Arc";
  if (e.type === "bridge-out" && e.peer) return `Via ${short(e.peer)}`;
  return "";
}

/* ---------- icons ---------- */
const BRIDGE_ICON = "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71";
const ICONS: Record<EvType, string> = {
  send: "M7 17 17 7M8 7h9v9",
  receive: "M17 7 7 17M16 17H7V8",
  swap: "M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4",
  "bridge-out": BRIDGE_ICON,
  "bridge-in": BRIDGE_ICON,
  contract: "m16 18 6-6-6-6M8 6l-6 6 6 6",
};
const TINT: Record<EvType, string> = {
  send: "text-slate-200",
  receive: "text-emerald-300",
  swap: "text-[#7dd3fc]",
  "bridge-out": "text-[#8fb4ff]",
  "bridge-in": "text-[#8fb4ff]",
  contract: "text-slate-300",
};

const Svg = ({ d, size = 20 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

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

const TOKEN_LOGO: Record<string, string> = { USDC: "/usdc-logo.webp", EURC: "/eurc-logo.png", cirBTC: "/cirbtc-logo.jpg" };
function TokenDot({ symbol, size = 16 }: { symbol: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const src = TOKEN_LOGO[symbol];
  if (src && !failed)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={symbol} onError={() => setFailed(true)} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full bg-white/10 font-bold text-white" style={{ width: size, height: size, fontSize: size * 0.5 }} aria-hidden>
      {symbol[0] ?? "?"}
    </span>
  );
}

function Row({ e }: { e: Ev }) {
  const [copied, setCopied] = useState(false);
  const outs = e.legs.filter((l) => l.dir === "out");
  const ins = e.legs.filter((l) => l.dir === "in");
  const sub = subtitleOf(e);
  const copyHash = async (ev: { preventDefault: () => void; stopPropagation: () => void }) => {
    ev.preventDefault(); // the row is a link to the explorer; copying must not open it
    ev.stopPropagation();
    try {
      await navigator.clipboard.writeText(e.hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <a href={`${EXPLORER}/tx/${e.hash}`} target="_blank" rel="noreferrer" className="group flex items-center gap-3.5 rounded-2xl px-3 py-3.5 transition hover:bg-white/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#39c4ff]">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] ${e.status === "error" ? "text-red-300" : TINT[e.type]}`}>
        <Svg d={ICONS[e.type]} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="truncate text-[15px] font-semibold">{titleOf(e)}</span>
          {e.status === "error" && <span className="rounded-full bg-red-400/10 px-2 py-0.5 text-[11px] font-semibold text-red-300">Failed</span>}
          {e.status === "pending" && <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300">Pending</span>}
        </span>
        <span className="mt-0.5 block truncate text-xs text-slate-500">{[sub, e.t ? timeOf(e.t) : ""].filter(Boolean).join(" · ")}</span>
        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
          <span className="tabular-nums">Txn {e.hash.slice(0, 10)}…{e.hash.slice(-6)}</span>
          <span
            role="button"
            tabIndex={0}
            aria-label={copied ? "Transaction hash copied" : "Copy transaction hash"}
            title={copied ? "Copied" : "Copy hash"}
            onClick={copyHash}
            onKeyDown={(ev) => {
              if (ev.key === "Enter" || ev.key === " ") copyHash(ev);
            }}
            className="inline-flex h-5 shrink-0 items-center justify-center rounded px-1 text-slate-500 transition hover:bg-white/[0.08] hover:text-white"
          >
            {copied ? <span className="text-[11px] font-semibold text-emerald-300">Copied</span> : <Svg d="M9 9h10v10H9zM5 15V5h10" size={13} />}
          </span>
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-0.5 text-right">
        {[...ins, ...outs].map((l, i) => (
          <span key={i} className={`flex items-center gap-1.5 text-sm font-semibold tabular-nums ${l.dir === "in" ? "text-emerald-300" : "text-slate-100"}`}>
            {l.dir === "in" ? "+" : "−"}
            {fmtAmt(l.amount)}
            <TokenDot symbol={l.symbol} />
          </span>
        ))}
        {e.fee && <span className="text-[11px] tabular-nums text-slate-600">Fee {fmtAmt(e.fee)} USDC</span>}
      </span>
    </a>
  );
}

function Skeleton() {
  return (
    <div className="space-y-1 px-1" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3.5 px-3 py-3.5">
          <span className="h-11 w-11 animate-pulse rounded-full bg-white/[0.06]" />
          <span className="flex-1 space-y-2">
            <span className="block h-3.5 w-32 animate-pulse rounded bg-white/[0.06]" />
            <span className="block h-3 w-20 animate-pulse rounded bg-white/[0.04]" />
          </span>
          <span className="h-3.5 w-16 animate-pulse rounded bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}

const FilterBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) => (
  <button onClick={onClick} aria-pressed={active} className={`shrink-0 rounded-md px-3.5 py-1.5 text-sm font-medium transition ${active ? "bg-white/[0.12] text-white" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"}`}>
    {children}
  </button>
);

/* ---------- portfolio ---------- */
type Info = { balances: Record<string, string> | null; txCount: number | null; transfersCount: number | null; sent: number | null };
const PORTFOLIO = [
  { sym: "USDC", name: "USD Coin", dec: 6, color: "#26bcff" },
  { sym: "EURC", name: "Euro Coin", dec: 6, color: "#0076ff" },
  { sym: "cirBTC", name: "Circle Wrapped Bitcoin", dec: 8, color: "#0043be" },
];
const ADDR_RE = /^0x[a-fA-F0-9]{40}$/;
const fmtUsd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n: number | null) => (n === null ? "—" : n.toLocaleString("en-US"));
const hue = (a: string) => parseInt(a.slice(2, 8), 16) % 360;

/** An icon drawn as a glowing line (no box around it). */
const GlowIcon = ({ d, size = 28 }: { d: string; size?: number }) => (
  <span className="inline-flex text-[#62d4ff]" style={{ filter: "drop-shadow(0 0 5px rgba(57,196,255,0.9)) drop-shadow(0 0 14px rgba(22,136,245,0.6))" }}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  </span>
);
const I = {
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35",
  wallet: "M3 7a2 2 0 0 1 2-2h13v4M3 7v10a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2ZM16.5 14h.01",
  pie: "M21 12A9 9 0 1 1 12 3v9h9ZM15 3.5A9 9 0 0 1 20.5 9H15V3.5Z",
  history: "M12 7v5l3 2M3 12a9 9 0 1 0 3-6.7M3 4v4h4",
  copy: "M9 9h10v10H9zM5 15V5h10",
  link: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  back: "M19 12H5M12 19l-7-7 7-7",
  refresh: "M21 12a9 9 0 1 1-3-6.7M21 4v5h-5",
};

/* ---------- page ---------- */
export default function ActivityPage() {
  const { address, isConnected, connector } = useAccount();
  const account = isConnected && address ? address : null;

  /* any wallet can be looked up; otherwise the connected wallet is shown */
  const [lookup, setLookup] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState("");
  const target = lookup ?? account;
  const me = target ? target.toLowerCase() : "";
  const viewingOther = !!lookup && lookup.toLowerCase() !== (account ?? "").toLowerCase();

  /* everything loaded so far lives in these maps (no duplicates), newest pages first, older pages added on demand */
  const txMap = useRef<Map<string, Tx>>(new Map());
  const trMap = useRef<Map<string, Tr>>(new Map());
  const txCursor = useRef<Cursor | null>(null); // null = that feed is finished
  const trCursor = useRef<Cursor | null>(null);
  const busyRef = useRef(false);
  const failsRef = useRef(0);
  const [version, setVersion] = useState(0);
  const [first, setFirst] = useState(true); // the first page hasn't arrived yet
  const [loadingMore, setLoadingMore] = useState(false);
  const [txDone, setTxDone] = useState(false);
  const [trDone, setTrDone] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [updated, setUpdated] = useState(0);
  const sentinel = useRef<HTMLDivElement>(null);

  /* portfolio + counts + prices */
  const [info, setInfo] = useState<Info | null>(null);
  const [infoFailed, setInfoFailed] = useState(false);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState(false);

  const merge = (j: { txs?: Tx[]; transfers?: Tr[] }) => {
    for (const x of j.txs ?? []) txMap.current.set(x.hash, x);
    for (const x of j.transfers ?? []) trMap.current.set(x.key, x);
  };

  /** Newest page of both feeds. Called on load and every 30 seconds; it only adds what's new. */
  const loadNewest = useCallback(
    async (initial: boolean) => {
      if (!target || busyRef.current) return;
      busyRef.current = true;
      try {
        const r = await fetch(`/api/activity?address=${target}`);
        if (!r.ok) throw new Error(`activity ${r.status}`);
        const j = (await r.json()) as { txs?: Tx[]; transfers?: Tr[]; txNext?: Cursor | null; trNext?: Cursor | null };
        merge(j);
        if (initial) {
          txCursor.current = j.txNext ?? null;
          trCursor.current = j.trNext ?? null;
          setTxDone(!j.txNext);
          setTrDone(!j.trNext);
          setFirst(false);
        }
        setError("");
        setUpdated(Date.now());
        setVersion((v) => v + 1);
      } catch {
        if (initial) setFirst(false);
        setError("The activity list couldn't be loaded from the explorer.");
      } finally {
        busyRef.current = false;
      }
    },
    [target]
  );

  /** One older page of both feeds. */
  const loadMore = useCallback(async () => {
    if (!target || busyRef.current || (!txCursor.current && !trCursor.current)) return;
    busyRef.current = true;
    setLoadingMore(true);
    try {
      const q = new URLSearchParams({ address: target });
      q.set("txc", txCursor.current ? JSON.stringify(txCursor.current) : "none");
      q.set("trc", trCursor.current ? JSON.stringify(trCursor.current) : "none");
      const r = await fetch(`/api/activity?${q.toString()}`);
      if (!r.ok) throw new Error(`activity ${r.status}`);
      const j = (await r.json()) as { txs?: Tx[]; transfers?: Tr[]; txNext?: Cursor | null; trNext?: Cursor | null };
      merge(j);
      txCursor.current = txCursor.current ? j.txNext ?? null : null;
      trCursor.current = trCursor.current ? j.trNext ?? null : null;
      setTxDone(!txCursor.current);
      setTrDone(!trCursor.current);
      failsRef.current = 0;
      setError("");
      setVersion((v) => v + 1);
    } catch {
      failsRef.current += 1;
      setError("Couldn't load older activity. Tap Load more to try again.");
    } finally {
      busyRef.current = false;
      setLoadingMore(false);
    }
  }, [target]);

  /* a new wallet starts from scratch; then new activity is checked for every 30 seconds and when the tab is shown again */
  useEffect(() => {
    txMap.current = new Map();
    trMap.current = new Map();
    txCursor.current = null;
    trCursor.current = null;
    failsRef.current = 0;
    setTxDone(false);
    setTrDone(false);
    setFirst(true);
    setError("");
    setFilter("all");
    setVersion((v) => v + 1);
    if (!target) return;
    loadNewest(true);
    const id = setInterval(() => loadNewest(false), 30000);
    const onVis = () => document.visibilityState === "visible" && loadNewest(false);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [target, loadNewest]);

  /* the portfolio: balances and counts, refreshed every minute */
  const loadInfo = useCallback(async () => {
    if (!target) return;
    try {
      const r = await fetch(`/api/activity?address=${target}&info=1`);
      if (!r.ok) throw new Error("info");
      setInfo((await r.json()) as Info);
      setInfoFailed(false);
    } catch {
      setInfoFailed(true);
    }
  }, [target]);
  useEffect(() => {
    setInfo(null);
    setInfoFailed(false);
    if (!target) return;
    loadInfo();
    const id = setInterval(loadInfo, 60000);
    return () => clearInterval(id);
  }, [target, loadInfo]);

  /* dollar prices (optional: if they can't load, USDC counts as $1 and the others show no dollar value) */
  useEffect(() => {
    let live = true;
    const load = async () => {
      try {
        const r = await fetch("/api/market?type=prices");
        if (!r.ok) return;
        const j = (await r.json()) as { prices?: Record<string, { price?: number } | null> };
        const p: Record<string, number> = {};
        for (const k of ["USDC", "EURC", "cirBTC"]) if (typeof j.prices?.[k]?.price === "number") p[k] = j.prices[k]!.price as number;
        if (live) setPrices(p);
      } catch {
        /* optional */
      }
    };
    load();
    const id = setInterval(load, 60000);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, []);

  /* "complete up to here": a row is only shown once BOTH feeds have loaded back to its time, so swaps and bridges are never half-built */
  const done = txDone && trDone;
  const horizon = useMemo(() => {
    void version;
    if (done) return 0;
    const oldest = (arr: number[]) => (arr.length ? Math.min(...arr) : 0);
    const oT = txDone ? 0 : oldest(Array.from(txMap.current.values()).map((x) => x.t).filter(Boolean));
    const oR = trDone ? 0 : oldest(Array.from(trMap.current.values()).map((x) => x.t).filter(Boolean));
    return Math.max(oT, oR);
  }, [version, done, txDone, trDone]);

  const events = useMemo(() => {
    void version;
    return target ? buildEvents(Array.from(txMap.current.values()), Array.from(trMap.current.values()), me, horizon) : [];
  }, [version, horizon, target, me]);

  const shown = useMemo(() => events.filter((e) => (filter === "all" ? true : filter === "bridge" ? e.type.startsWith("bridge") : e.type === filter)), [events, filter]);

  /* keep loading older pages while the list is short, and whenever you scroll to the bottom */
  useEffect(() => {
    if (!target || first || done || loadingMore || error || failsRef.current > 0) return;
    if (shown.length < MIN_VISIBLE) loadMore();
  }, [target, first, done, loadingMore, error, shown.length, loadMore, version]);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !target) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !done && !error) loadMore();
    }, { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, [target, done, error, loadMore, shown.length]);

  const groups = useMemo(() => {
    const out: { day: string; items: Ev[] }[] = [];
    for (const e of shown) {
      const day = e.t ? dayLabel(e.t) : "Earlier";
      const last = out[out.length - 1];
      if (last && last.day === day) last.items.push(e);
      else out.push({ day, items: [e] });
    }
    return out;
  }, [shown]);

  /* ----- portfolio numbers ----- */
  const rows = PORTFOLIO.map((t) => {
    const raw = info?.balances?.[t.sym];
    const amount = raw !== undefined ? toDecimal(raw, t.dec) : null;
    const price = prices[t.sym] ?? (t.sym === "USDC" ? 1 : null);
    const usd = amount !== null && price !== null ? Number(amount) * price : null;
    return { ...t, amount, usd };
  });
  const totalUsd = rows.reduce((a, r) => a + (r.usd ?? 0), 0);
  const haveUsd = rows.some((r) => r.usd !== null);
  const totalTx = info?.txCount ?? (txDone && txMap.current.size ? txMap.current.size : null);

  /* ----- actions ----- */
  const submitLookup = (raw: string) => {
    const v = raw.trim();
    if (!v) return setInputError("Paste a wallet address to look it up.");
    if (!ADDR_RE.test(v)) return setInputError("That doesn’t look like a wallet address. It should start with 0x and have 42 characters.");
    setInputError("");
    setInput("");
    setLookup(v);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const copyAddress = async () => {
    if (!target) return;
    try {
      await navigator.clipboard.writeText(target);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };
  const connect = () => window.dispatchEvent(new Event("open-wallet-modal"));

  /* the search box (used on the landing screen and at the top of the dashboard) */
  const searchBox = (big: boolean) => (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitLookup(input);
        }}
        className={`flex items-center gap-2 rounded-full border bg-[#0a1018] pl-4 pr-1.5 transition focus-within:border-[#2588ff]/60 ${inputError ? "border-red-400/50" : "border-white/[0.1]"} ${big ? "py-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]" : "py-1"}`}
      >
        <span className="shrink-0 text-slate-500"><Svg d={I.search} size={18} /></span>
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setInputError("");
          }}
          placeholder={big ? "Paste any wallet address (0x…)" : "Search another wallet (0x…)"}
          aria-label="Wallet address to search"
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          className={`min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-600 ${big ? "py-2.5 text-[15px]" : "py-2 text-sm"}`}
        />
        <button type="submit" className={`shrink-0 rounded-full bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] font-bold text-white transition hover:brightness-110 ${big ? "px-5 py-2.5 text-sm" : "px-4 py-2 text-xs"}`}>Search</button>
      </form>
      {inputError && <p className="mt-2 px-4 text-xs text-red-300">{inputError}</p>}
    </div>
  );

  /* ----- the activity list ----- */
  let body: ReactNode;
  if (first) {
    body = <Skeleton />;
  } else if (error && events.length === 0 && txMap.current.size === 0 && trMap.current.size === 0) {
    body = (
      <div className="px-4 py-12 text-center">
        <p className="text-base font-semibold">Couldn&apos;t load activity</p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-slate-500">{error}</p>
        <button onClick={() => { setFirst(true); loadNewest(true); }} className="mx-auto mt-5 inline-flex rounded-full bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] px-6 py-3 text-sm font-semibold">Try again</button>
      </div>
    );
  } else if (shown.length === 0 && (done || filter !== "all")) {
    body = (
      <div className="px-4 py-14 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.05] text-slate-400"><Svg d={I.history} size={26} /></span>
        <p className="mt-4 text-base font-semibold">{events.length === 0 ? "No activity yet" : "Nothing in this filter"}</p>
        <p className="mx-auto mt-1.5 max-w-xs text-sm leading-6 text-slate-500">{events.length === 0 ? "No transactions found for this wallet on Arc mainnet." : done ? "Try another filter, or choose All." : "Older activity is still loading."}</p>
      </div>
    );
  } else if (shown.length === 0) {
    body = <Skeleton />;
  } else {
    body = (
      <div>
        {groups.map((g) => (
          <section key={g.day} className="mb-2">
            <h3 className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{g.day}</h3>
            {g.items.map((e) => (
              <Row key={`${e.hash}-${e.type}`} e={e} />
            ))}
          </section>
        ))}
      </div>
    );
  }

  return (
    <main className={`${brandFont.className} relative min-h-screen overflow-x-hidden bg-[#010205] text-white selection:bg-[#167cff]/30`}>
      <style>{`
        @keyframes backgroundFloat{0%,100%{transform:translate3d(-50%,0,0) scale(1)}50%{transform:translate3d(-46%,2vw,0) scale(1.08)}}
        @keyframes backgroundFloatReverse{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(5vw,-3vw,0) scale(1.12)}}
        @keyframes twinkle{0%,100%{opacity:.12}50%{opacity:.9}}
        @keyframes floatUp{0%{transform:translateY(0);opacity:0}15%{opacity:.7}100%{transform:translateY(-220px);opacity:0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
        .fade-up{opacity:0;animation:fadeUp .9s cubic-bezier(.2,.7,.2,1) forwards;animation-delay:var(--delay,0ms)}
        @media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-delay:0s!important;animation-iteration-count:1!important}.fade-up{opacity:1}}
      `}</style>

      <SpaceBackground />

      <div className="relative z-10">
        <Header />

        <section className={`pb-20 pt-8 sm:pt-12 lg:pb-32 lg:pt-14 min-[900px]:[zoom:0.9] ${CONTAINER}`}>
          {!target ? (
            /* ================= BEFORE A WALLET IS CONNECTED ================= */
            <>
              <div className="fade-up mx-auto max-w-2xl text-center">
                <h1 className="text-[2.4rem] font-bold leading-[1.05] tracking-[-0.035em] sm:text-[3.9rem]">
                  <span className="bg-gradient-to-r from-[#18bfff] via-[#2588ff] to-[#4262ff] bg-clip-text text-transparent">Activity Checker</span>
                </h1>
                <p className="mx-auto mt-3 max-w-md text-[15px] leading-6 text-slate-400 sm:mt-4 sm:text-lg sm:leading-7">See the portfolio and transactions of any wallet on Arc.</p>
              </div>

              <div className="fade-up mx-auto mt-10 max-w-2xl" style={{ "--delay": "120ms" } as CSSProperties}>
                <p className="mb-3 px-2 text-center text-sm font-medium text-slate-400">Search a wallet address</p>
                {searchBox(true)}

                <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-slate-600">
                  <span className="h-px flex-1 bg-white/[0.08]" />
                  or
                  <span className="h-px flex-1 bg-white/[0.08]" />
                </div>

                <button onClick={connect} className="inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-white/10 bg-white/[0.045] px-7 py-4 text-base font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:border-[#2f8bff]/40 hover:bg-white/[0.08]">
                  <Svg d={I.wallet} size={20} /> Connect your wallet
                </button>
              </div>
            </>
          ) : (
            /* ================= A WALLET IS SHOWN ================= */
            <div className="mx-auto max-w-5xl">
              {/* who is shown, and the search */}
              <div className="fade-up rounded-[1.75rem] border border-white/[0.08] bg-[#050a16]/80 p-4 backdrop-blur-xl sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span className="h-12 w-12 shrink-0 rounded-full border border-white/10" style={{ background: `linear-gradient(135deg, hsl(${hue(target)} 85% 60%), hsl(${(hue(target) + 60) % 360} 80% 38%))` }} aria-hidden />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">{viewingOther ? "Viewing another wallet" : "Your wallet"}</p>
                      <p className="mt-0.5 truncate text-lg font-bold tracking-tight sm:text-xl" title={target}>{short(target)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={copyAddress} className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08]">
                      <Svg d={I.copy} size={14} /> {copied ? "Copied" : "Copy"}
                    </button>
                    <a href={`${EXPLORER}/address/${target}`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08]">
                      <Svg d={I.link} size={14} /> Explorer
                    </a>
                    {!account && lookup && (
                      <button onClick={connect} className="inline-flex h-9 items-center gap-2 rounded-full bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] px-3.5 text-xs font-bold text-white transition hover:brightness-110">
                        <Svg d={I.wallet} size={15} /> Connect wallet
                      </button>
                    )}
                    {account && viewingOther && (
                      <button onClick={() => { setLookup(null); setInput(""); setInputError(""); }} className="inline-flex h-9 items-center gap-2 rounded-full bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] px-3.5 text-xs font-bold text-white transition hover:brightness-110">
                        {connector?.icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={connector.icon} alt="" className="h-[18px] w-[18px] rounded-[5px] bg-white/90 object-contain p-[1px]" />
                        ) : (
                          <Svg d={I.wallet} size={15} />
                        )}
                        My wallet
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-4">{searchBox(false)}</div>
              </div>

              {/* portfolio + counts */}
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div className="fade-up rounded-[1.75rem] border border-white/[0.08] bg-[#050a16]/80 p-5 backdrop-blur-xl sm:p-6 lg:col-span-2" style={{ "--delay": "100ms" } as CSSProperties}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2588ff]">Portfolio</p>
                      <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">
                        {info === null && !infoFailed ? <span className="inline-block h-9 w-40 animate-pulse rounded-lg bg-white/[0.07]" /> : haveUsd ? fmtUsd(totalUsd) : "—"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">USDC, EURC and cirBTC on Arc</p>
                    </div>
                    <button onClick={() => { loadInfo(); loadNewest(false); }} aria-label="Refresh" title="Refresh" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/[0.07] hover:text-white"><Svg d={I.refresh} /></button>
                  </div>

                  {/* how the value is split */}
                  <div className="mt-5 flex h-2 w-full overflow-hidden rounded-full bg-white/[0.06]" aria-hidden>
                    {haveUsd && totalUsd > 0 && rows.map((r) => (r.usd && r.usd > 0 ? <span key={r.sym} style={{ width: `${Math.max((r.usd / totalUsd) * 100, 2)}%`, background: r.color }} /> : null))}
                  </div>

                  <ul className="mt-4 divide-y divide-white/[0.06]">
                    {rows.map((r) => (
                      <li key={r.sym} className="flex items-center gap-3.5 py-3.5">
                        <TokenDot symbol={r.sym} size={38} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="text-[15px] font-semibold">{r.sym}</span>
                            <span className="h-2 w-2 rounded-full" style={{ background: r.color }} aria-hidden />
                          </span>
                          <span className="block truncate text-xs text-slate-500">{r.name}</span>
                        </span>
                        <span className="text-right">
                          <span className="block text-[15px] font-semibold tabular-nums">
                            {info === null && !infoFailed ? <span className="inline-block h-4 w-20 animate-pulse rounded bg-white/[0.07]" /> : r.amount === null ? "—" : fmtAmt(r.amount)}
                          </span>
                          <span className="block text-xs tabular-nums text-slate-500">{r.usd !== null ? fmtUsd(r.usd) : ""}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  {infoFailed && <p className="mt-2 text-xs text-amber-300">Couldn&apos;t load balances right now. Tap refresh to try again.</p>}
                </div>

                <div className="fade-up rounded-[1.75rem] border border-white/[0.08] bg-[#050a16]/80 p-5 backdrop-blur-xl sm:p-6" style={{ "--delay": "180ms" } as CSSProperties}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2588ff]">Transactions</p>
                  <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">{info === null && !infoFailed && totalTx === null ? <span className="inline-block h-9 w-24 animate-pulse rounded-lg bg-white/[0.07]" /> : fmtInt(totalTx)}</p>
                  <p className="mt-1 text-xs text-slate-500">Total on Arc mainnet</p>
                  <dl className="mt-6 space-y-3.5 border-t border-white/[0.06] pt-5 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-400">Sent by this wallet</dt>
                      <dd className="font-semibold tabular-nums">{fmtInt(info?.sent ?? null)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-400">Token transfers</dt>
                      <dd className="font-semibold tabular-nums">{fmtInt(info?.transfersCount ?? null)}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* the activity list */}
              <div className="fade-up mt-4 rounded-[1.75rem] border border-white/[0.08] bg-[#050a16]/80 p-3 shadow-[0_30px_100px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:rounded-[2rem] sm:p-5" style={{ "--delay": "260ms" } as CSSProperties}>
                <div className="px-1 pb-3">
                  <div className="inline-flex max-w-full gap-0.5 overflow-x-auto rounded-lg border border-white/[0.1] bg-white/[0.03] p-0.5">
                    {FILTERS.map(([f, label]) => (
                      <FilterBtn key={f} active={filter === f} onClick={() => setFilter(f)}>{label}</FilterBtn>
                    ))}
                  </div>
                </div>

                {error && (txMap.current.size > 0 || trMap.current.size > 0) && (
                  <p className="mx-1 mb-2 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-xs leading-5 text-amber-200">{error}</p>
                )}

                {body}

                {/* older history loads as you scroll; this button is the backup */}
                {!first && shown.length > 0 && (
                  <div ref={sentinel} className="px-3 pb-1 pt-4 text-center">
                    {done ? (
                      <p className="text-xs text-slate-600">That&apos;s the whole history of this wallet on Arc mainnet.</p>
                    ) : (
                      <button onClick={() => { failsRef.current = 0; setError(""); loadMore(); }} disabled={loadingMore} className="rounded-full border border-white/10 bg-white/[0.045] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:opacity-60">
                        {loadingMore ? "Loading older activity…" : "Load more"}
                      </button>
                    )}
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/[0.06] px-3 pt-4 text-xs text-slate-500">
                  <span>{updated ? `Updated ${timeOf(updated)}` : ""}</span>
                  <a href={`${EXPLORER}/address/${target}`} target="_blank" rel="noreferrer" className="font-medium text-[#65caff] hover:text-white">
                    See everything on the explorer
                  </a>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
