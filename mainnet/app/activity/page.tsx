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
  const outs = e.legs.filter((l) => l.dir === "out");
  const ins = e.legs.filter((l) => l.dir === "in");
  const sub = subtitleOf(e);
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

const Pill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) => (
  <button onClick={onClick} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${active ? "bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] text-white" : "bg-white/[0.05] text-slate-400 hover:bg-white/[0.09] hover:text-white"}`}>
    {children}
  </button>
);

/* ---------- page ---------- */
export default function ActivityPage() {
  const { address, isConnected } = useAccount();
  const account = isConnected && address ? address : null;
  const me = account ? account.toLowerCase() : "";

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

  const merge = (j: { txs?: Tx[]; transfers?: Tr[] }) => {
    for (const x of j.txs ?? []) txMap.current.set(x.hash, x);
    for (const x of j.transfers ?? []) trMap.current.set(x.key, x);
  };

  /** Newest page of both feeds. Called on load and every 30 seconds; it only adds what's new. */
  const loadNewest = useCallback(
    async (initial: boolean) => {
      if (!account || busyRef.current) return;
      busyRef.current = true;
      try {
        const r = await fetch(`/api/activity?address=${account}`);
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
    [account]
  );

  /** One older page of both feeds. */
  const loadMore = useCallback(async () => {
    if (!account || busyRef.current || (!txCursor.current && !trCursor.current)) return;
    busyRef.current = true;
    setLoadingMore(true);
    try {
      const q = new URLSearchParams({ address: account });
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
  }, [account]);

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
    setVersion((v) => v + 1);
    if (!account) return;
    loadNewest(true);
    const id = setInterval(() => loadNewest(false), 30000);
    const onVis = () => document.visibilityState === "visible" && loadNewest(false);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [account, loadNewest]);

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
    return account ? buildEvents(Array.from(txMap.current.values()), Array.from(trMap.current.values()), me, horizon) : [];
  }, [version, horizon, account, me]);

  const shown = useMemo(() => events.filter((e) => (filter === "all" ? true : filter === "bridge" ? e.type.startsWith("bridge") : e.type === filter)), [events, filter]);

  /* keep loading older pages while the list is short, and whenever you scroll to the bottom */
  useEffect(() => {
    if (!account || first || done || loadingMore || error || failsRef.current > 0) return;
    if (shown.length < MIN_VISIBLE) loadMore();
  }, [account, first, done, loadingMore, error, shown.length, loadMore, version]);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !account) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !done && !error) loadMore();
    }, { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, [account, done, error, loadMore, shown.length]);

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

  let body: ReactNode;
  if (!account) {
    body = (
      <div className="px-4 py-14 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.05] text-slate-400"><Svg d="M3 12h4l3-8 4 16 3-8h4" size={26} /></span>
        <p className="mt-4 text-base font-semibold">Connect your wallet</p>
        <p className="mx-auto mt-1.5 max-w-xs text-sm leading-6 text-slate-500">Use the Connect button in the header to see all of this wallet&apos;s activity on Arc.</p>
      </div>
    );
  } else if (first) {
    body = <Skeleton />;
  } else if (error && events.length === 0 && txMap.current.size === 0 && trMap.current.size === 0) {
    body = (
      <div className="px-4 py-12 text-center">
        <p className="text-base font-semibold">Couldn&apos;t load activity</p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-slate-500">{error} This is the explorer data for this wallet; nothing is read from your device.</p>
        <button onClick={() => { setFirst(true); loadNewest(true); }} className="mx-auto mt-5 inline-flex rounded-full bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] px-6 py-3 text-sm font-semibold">Try again</button>
      </div>
    );
  } else if (shown.length === 0 && (done || filter !== "all")) {
    body = (
      <div className="px-4 py-14 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.05] text-slate-400"><Svg d="M12 7v5l3 2M3 12a9 9 0 1 0 3-6.7M3 4v4h4" size={26} /></span>
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

        {/* phones: normal size. Screens 900px+ wide: content at 90% (same as the Swap page). */}
        <section className={`pb-20 pt-8 sm:pt-12 lg:pb-32 lg:pt-14 min-[900px]:[zoom:0.9] ${CONTAINER}`}>
          <div className="fade-up mx-auto max-w-2xl text-center">
            <h1 className="text-[2.4rem] font-bold leading-[1.05] tracking-[-0.035em] sm:text-[3.9rem]">
              <span className="bg-gradient-to-r from-[#18bfff] via-[#2588ff] to-[#4262ff] bg-clip-text text-transparent">Activity</span>
            </h1>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-6 text-slate-400 sm:mt-4 sm:text-lg sm:leading-7">Everything this wallet has done on Arc mainnet.</p>
          </div>

          <div className="fade-up relative mx-auto mt-10 w-full max-w-2xl sm:mt-12" style={{ "--delay": "150ms" } as CSSProperties}>
            <div className="absolute -inset-10 rounded-full bg-[#1675ff]/10 blur-3xl" />
            <div className="relative rounded-[1.75rem] border border-white/[0.08] bg-[#050a16]/80 p-3 shadow-[0_30px_100px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:rounded-[2rem] sm:p-5">
              {/* filters + refresh */}
              <div className="flex items-center gap-2 px-1 pb-3">
                <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
                  {FILTERS.map(([f, label]) => (
                    <Pill key={f} active={filter === f} onClick={() => setFilter(f)}>{label}</Pill>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => loadNewest(false)}
                  disabled={!account}
                  aria-label="Refresh"
                  title="Refresh"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-40"
                >
                  <Svg d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" />
                </button>
              </div>

              {error && account && (txMap.current.size > 0 || trMap.current.size > 0) && (
                <p className="mx-1 mb-2 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-xs leading-5 text-amber-200">{error}</p>
              )}

              {body}

              {/* older history loads as you scroll; this button is the backup */}
              {account && !first && shown.length > 0 && (
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

              {account && (
                <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/[0.06] px-3 pt-4 text-xs text-slate-500">
                  <span>{updated ? `Updated ${timeOf(updated)}` : ""}</span>
                  <a href={`${EXPLORER}/address/${account}`} target="_blank" rel="noreferrer" className="font-medium text-[#65caff] hover:text-white">
                    See everything on the explorer
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
