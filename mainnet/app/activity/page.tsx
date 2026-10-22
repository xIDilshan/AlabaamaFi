"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Inter } from "next/font/google";
import { useAccount } from "wagmi";
import Header from "@/components/Header";

const brandFont = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });

const EXPLORER = "https://explorer.arc.io";
const CONTAINER = "w-full px-4 sm:px-8 lg:px-10 2xl:px-16";
const ZERO = "0x0000000000000000000000000000000000000000";
const USDC_ERC20 = "0x3600000000000000000000000000000000000000";
const MIN_VISIBLE = 8;
const AUTO_LOAD_LIMIT = 600;
const COPY_ICON = "M11 9h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2ZM15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2";
const BTN_TEXT_PX = 11;
const BTN_ICON_PX = 13;
const KNOWN_TOKENS: Record<string, string> = {
  "0x3600000000000000000000000000000000000000": "USDC",
  "0xbef5f6d51cb62b58e6a8f77868681825c6fe21c1": "EURC",
  "0x171a4217b86a807a64eb94757db6849fb4bdbaa0": "cirBTC",
};

/* ---------- raw data ---------- */
type Tx = { hash: string; t: number; status: "ok" | "error" | "pending"; method: string | null; from: string; to: string; value: string; fee: string | null };
type Tr = { key: string; hash: string; t: number; symbol: string; amount: string; from: string; to: string; token: string };
type Cursor = Record<string, string | number>;

/* ---------- what the page shows ---------- */
type Leg = { symbol: string; amount: string; dir: "in" | "out" };
type EvType = "send" | "receive" | "swap" | "bridge-out" | "bridge-in" | "contract";
type Ev = { hash: string; t: number; status: "ok" | "error" | "pending"; type: EvType; legs: Leg[]; peer?: string; fee?: string; method?: string };

type Filter = "all" | "send" | "receive" | "swap" | "bridge" | "contract";
const FILTERS: [Filter, string][] = [
  ["all", "All"],
  ["send", "Sent"],
  ["receive", "Received"],
  ["swap", "Swaps"],
  ["bridge", "Bridges"],
  ["contract", "Contracts"],
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

function toDecimal(raw: string, decimals: number): string {
  if (!/^\d+$/.test(raw)) return "0";
  const s = raw.replace(/^0+/, "") || "0";
  if (decimals <= 0) return s;
  const p = s.padStart(decimals + 1, "0");
  const whole = p.slice(0, p.length - decimals);
  const frac = p.slice(p.length - decimals).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
}

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
    if (horizon && w.t < horizon) continue;
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
    if (type === "contract" && !w.method && !w.legs.length && w.nFrom !== me) continue;
    out.push({ hash: w.hash, t: w.t, status: w.status, type, legs: w.legs, peer: w.peer ?? (type === "contract" && w.nTo && w.nTo !== me ? w.nTo : undefined), fee: w.fee, method: w.method });
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
    default: {
      const m = (e.method ?? "").trim();
      const tk = e.peer ? KNOWN_TOKENS[e.peer.toLowerCase()] : undefined;
      const t = tk ? ` ${tk}` : "";
      if (/^increaseallowance|0x39509351/i.test(m)) return `Increased allowance${t}`;
      if (/^decreaseallowance|0xa457c2d7/i.test(m)) return `Decreased allowance${t}`;
      if (/^setapprovalforall|0xa22cb465/i.test(m)) return "Approval for all";
      if (/^permit|0xd505accf/i.test(m)) return `Permit${t}`;
      if (/^approve|0x095ea7b3/i.test(m)) return tk ? `Approved ${tk}` : "Approval";
      return m ? `Contract: ${m}` : "Contract interaction";
    }
  }
}
function subtitleOf(e: Ev): string {
  if (e.type === "send" && e.peer) return `To ${short(e.peer)}`;
  if (e.type === "receive" && e.peer) return e.peer === ZERO ? "Minted" : `From ${short(e.peer)}`;
  if (e.type === "bridge-in") return e.peer && e.peer !== ZERO ? `From ${short(e.peer)}` : "USDC delivered to Arc";
  if (e.type === "bridge-out" && e.peer) return `Via ${short(e.peer)}`;
  if (e.type === "contract" && e.peer) return `Contract ${short(e.peer)}`;
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

const BtnText = ({ children }: { children: ReactNode }) => <span style={{ fontSize: "12px", lineHeight: 1, zoom: BTN_TEXT_PX / 12 }}>{children}</span>;

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
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-0 h-screen overflow-hidden">
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

const SLIDE = "block max-w-full overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
const DESK_COLS = "lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1.5fr)_minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,1.5fr)_minmax(0,1fr)]";

function ClockIcon({ t, size = 15 }: { t: number; size?: number }) {
  const d = new Date(t);
  const minutes = d.getMinutes();
  const hourDeg = ((d.getHours() % 12) + minutes / 60) * 30;
  const minuteDeg = minutes * 6;
  const tip = (deg: number, len: number) => {
    const r = (deg * Math.PI) / 180;
    return { x: 12 + len * Math.sin(r), y: 12 - len * Math.cos(r) };
  };
  const h = tip(hourDeg, 5);
  const m = tip(minuteDeg, 7.6);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" role="img" aria-label={`Clock showing ${timeOf(t)}`}>
      <circle cx="12" cy="12" r="9.5" strokeWidth="1.7" />
      <line x1="12" y1="12" x2={h.x} y2={h.y} strokeWidth="2.3" />
      <line x1="12" y1="12" x2={m.x} y2={m.y} strokeWidth="1.7" />
    </svg>
  );
}

const fullDate = (t: number) => new Date(t).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

function StatusText({ status }: { status: Ev["status"] }) {
  const cfg = status === "error" ? { c: "bg-red-400", t: "text-red-300", l: "Failed" } : status === "pending" ? { c: "bg-amber-400", t: "text-amber-300", l: "Pending" } : { c: "bg-emerald-400", t: "text-emerald-300", l: "Success" };
  return (
    <span className={`inline-flex items-center gap-2 text-sm font-medium ${cfg.t}`}>
      <span className={`h-2 w-2 rounded-full ${cfg.c}`} aria-hidden />
      {cfg.l}
    </span>
  );
}

function Row({ e }: { e: Ev }) {
  const [copied, setCopied] = useState(false);
  const outs = e.legs.filter((l) => l.dir === "out");
  const ins = e.legs.filter((l) => l.dir === "in");
  const who = subtitleOf(e);
  const [peerCopied, setPeerCopied] = useState(false);
  const canCopyPeer = !!e.peer && e.peer !== ZERO && who.includes(short(e.peer));
  const copyPeer = async (ev: { preventDefault: () => void; stopPropagation: () => void }) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (!e.peer) return;
    try {
      await navigator.clipboard.writeText(e.peer);
      setPeerCopied(true);
      setTimeout(() => setPeerCopied(false), 1500);
    } catch {
      setPeerCopied(false);
    }
  };
  const peerBtn = canCopyPeer ? (
    <span
      role="button"
      tabIndex={0}
      aria-label={peerCopied ? "Address copied" : "Copy address"}
      title={peerCopied ? "Copied" : "Copy address"}
      onClick={copyPeer}
      onKeyDown={(ev) => {
        if (ev.key === "Enter" || ev.key === " ") copyPeer(ev);
      }}
      className="inline-flex h-5 shrink-0 items-center justify-center rounded px-1 text-slate-500 transition hover:bg-white/[0.08] hover:text-white"
    >
      {peerCopied ? <span className="text-[11px] font-semibold text-emerald-300">Copied</span> : <Svg d={COPY_ICON} size={13} />}
    </span>
  ) : null;
  const whoLine = who ? (
    <span className="mt-0.5 flex min-w-0 items-center gap-1.5">
      <span className={`${SLIDE} min-w-0 text-[13px] text-slate-400`} title={who}>{who}</span>
      {peerBtn}
    </span>
  ) : null;
  const copyHash = async (ev: { preventDefault: () => void; stopPropagation: () => void }) => {
    ev.preventDefault();
    ev.stopPropagation();
    try {
      await navigator.clipboard.writeText(e.hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  const hashCell = (
    <span className="inline-flex items-center gap-1.5">
      <span className="tabular-nums text-slate-300">{e.hash.slice(0, 7)}…{e.hash.slice(-4)}</span>
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
        {copied ? <span className="text-[11px] font-semibold text-emerald-300">Copied</span> : <Svg d={COPY_ICON} size={13} />}
      </span>
    </span>
  );
  const amounts = [...ins, ...outs].map((l, i) => (
    <span key={i} className={`flex items-center justify-end gap-1.5 text-sm font-semibold tabular-nums ${l.dir === "in" ? "text-emerald-300" : "text-slate-100"}`}>
      {l.dir === "in" ? "+" : "−"}
      {fmtAmt(l.amount)}
      <TokenDot symbol={l.symbol} />
    </span>
  ));
  const iconBox = (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center ${e.status === "error" ? "text-red-300" : TINT[e.type]}`} style={{ filter: "drop-shadow(0 0 5px currentColor)" }}>
      <Svg d={ICONS[e.type]} size={22} />
    </span>
  );
  const timeCell = e.t ? (
    <span className="inline-flex items-center gap-1.5 text-slate-300" title={new Date(e.t).toLocaleString()}>
      <span className="text-slate-500"><ClockIcon t={e.t} /></span>
      <span className="tabular-nums">{timeOf(e.t)}</span>
    </span>
  ) : (
    <span className="text-slate-600">—</span>
  );

  return (
    <a href={`${EXPLORER}/tx/${e.hash}`} target="_blank" rel="noreferrer" className="group block px-2 py-4 transition hover:bg-white/[0.035] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#39c4ff]">
      {/* ---------- phones and tablets ---------- */}
      <div className="flex items-start gap-3.5 lg:hidden">
        {iconBox}
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className={`${SLIDE} min-w-0 text-[15px] font-semibold`} title={titleOf(e)}>{titleOf(e)}</span>
            {e.status === "error" && <span className="rounded-full bg-red-400/10 px-2 py-0.5 text-[11px] font-semibold text-red-300">Failed</span>}
            {e.status === "pending" && <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300">Pending</span>}
          </span>
          {whoLine}
          <span className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
            <span>Tx hash</span>
            {hashCell}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-0.5 text-right">
          {amounts}
          <span className="mt-1 text-xs">{timeCell}</span>
          {e.fee && <span className="text-[11px] tabular-nums text-slate-600">Fee {fmtAmt(e.fee)} USDC</span>}
        </span>
      </div>

      {/* ---------- wide screens ---------- */}
      <div className={`hidden items-center gap-x-5 text-sm lg:grid ${DESK_COLS}`}>
        <span className="flex min-w-0 items-center gap-3.5">
          {iconBox}
          <span className="min-w-0">
            <span className={`${SLIDE} text-[15px] font-semibold`} title={titleOf(e)}>{titleOf(e)}</span>
            {whoLine}
          </span>
        </span>
        <span className="min-w-0 truncate">{hashCell}</span>
        <span className="min-w-0">
          <span className="block text-sm">{timeCell}</span>
          {e.t ? <span className="mt-0.5 block pl-[21px] text-xs text-slate-500">{fullDate(e.t)}</span> : null}
        </span>
        <span><StatusText status={e.status} /></span>
        <span className="flex flex-col items-end gap-0.5 text-right">{amounts.length ? amounts : <span className="text-slate-600">—</span>}</span>
        <span className="text-right text-sm tabular-nums text-slate-400">{e.fee ? `${fmtAmt(e.fee)} USDC` : "—"}</span>
      </div>
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
  { sym: "USDC", name: "USD Coin", dec: 6, color: "#0076ff" },
  { sym: "EURC", name: "Euro Coin", dec: 6, color: "#0043be" },
  { sym: "cirBTC", name: "Circle Wrapped Bitcoin", dec: 8, color: "#9a73ff" },
];
const ADDR_RE = /^0x[a-fA-F0-9]{40}$/;
const fmtUsd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n: number | null) => (n === null ? "—" : n.toLocaleString("en-US"));
const hue = (a: string) => parseInt(a.slice(2, 8), 16) % 360;

const GlowIcon = ({ d, size = 28 }: { d: string; size?: number }) => (
  <span className="inline-flex text-[#62d4ff]" style={{ filter: "drop-shadow(0 0 3px rgba(57,196,255,0.4))" }}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  </span>
);
const SectionTitle = ({ icon, children }: { icon: string; children: ReactNode }) => (
  <div className="flex items-center gap-2.5">
    <GlowIcon d={icon} size={20} />
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4abaff]">{children}</p>
  </div>
);
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";
const MATTE_CARD = "relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#08111f]/55 p-5 backdrop-blur-[6px] sm:p-6";
const Grain = () => <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />;
const SepLine = () => <div aria-hidden className="h-px w-full bg-white/[0.06]" />;
const fmtPct = (p: number) => (p <= 0 ? "0%" : p >= 99.95 ? "100%" : p < 0.1 ? "<0.1%" : `${p.toFixed(1)}%`);

const I = {
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35",
  wallet: "M3 7a2 2 0 0 1 2-2h13v4M3 7v10a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2ZM16.5 14h.01",
  pie: "M21 12A9 9 0 1 1 12 3v9h9ZM15 3.5A9 9 0 0 1 20.5 9H15V3.5Z",
  history: "M12 7v5l3 2M3 12a9 9 0 1 0 3-6.7M3 4v4h4",
  copy: COPY_ICON,
  arrow: "M5 12h14M13 6l6 6-6 6",
  link: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  back: "M19 12H5M12 19l-7-7 7-7",
  refresh: "M21 12a9 9 0 1 1-3-6.7M21 4v5h-5",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
};

/* ---------- page ---------- */
function ActivityInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { address, isConnected, status } = useAccount();
  const account = isConnected && address ? address : null;

  const rawAddress = params.get("address") ?? "";
  const target = ADDR_RE.test(rawAddress) ? rawAddress : null;
  const me = target ? target.toLowerCase() : "";
  const viewingOther = !!account && !!target && target.toLowerCase() !== account.toLowerCase();
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState("");

  const goTo = useCallback(
    (addr: string, replace = false) => {
      const url = `/activity?address=${addr}`;
      if (replace) router.replace(url);
      else router.push(url);
      if (typeof window !== "undefined") window.scrollTo({ top: 0 });
    },
    [router]
  );

  useEffect(() => {
    setInput("");
    setInputError("");
  }, [account, target]);

  const mountedAt = useRef(Date.now());
  const prevAccount = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const prev = prevAccount.current;
    prevAccount.current = account;
    if (!account || target) return;
    const justOpened = Date.now() - mountedAt.current < 2500;
    if (prev === undefined) goTo(account, true);
    else if (!prev) goTo(account, justOpened);
  }, [account, target, goTo]);

  const wasConnected = useRef<string | null>(null);
  useEffect(() => {
    if (status === "connected" && address) {
      wasConnected.current = address.toLowerCase();
    } else if (status === "disconnected" && wasConnected.current) {
      const was = wasConnected.current;
      wasConnected.current = null;
      if (target && target.toLowerCase() === was) {
        router.replace("/activity");
        if (typeof window !== "undefined") window.scrollTo({ top: 0 });
      }
    }
  }, [status, address, target, router]);

  const txMap = useRef<Map<string, Tx>>(new Map());
  const trMap = useRef<Map<string, Tr>>(new Map());
  const txCursor = useRef<Cursor | null>(null);
  const trCursor = useRef<Cursor | null>(null);
  const busyRef = useRef(false);
  const failsRef = useRef(0);
  const [version, setVersion] = useState(0);
  const [first, setFirst] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [txDone, setTxDone] = useState(false);
  const [trDone, setTrDone] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [updated, setUpdated] = useState(0);
  const sentinel = useRef<HTMLDivElement>(null);

  const [info, setInfo] = useState<Info | null>(null);
  const [infoFailed, setInfoFailed] = useState(false);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const merge = (j: { txs?: Tx[]; transfers?: Tr[] }) => {
    for (const x of j.txs ?? []) txMap.current.set(x.hash, x);
    for (const x of j.transfers ?? []) trMap.current.set(x.key, x);
  };

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

  useEffect(() => {
    if (!target || first || done || loadingMore || error || failsRef.current > 0) return;
    if (shown.length < MIN_VISIBLE || txMap.current.size + trMap.current.size < AUTO_LOAD_LIMIT) loadMore();
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

  const typeCounts = useMemo(() => {
    const c = { send: 0, receive: 0, swap: 0, bridge: 0, contract: 0 };
    for (const e of events) {
      if (e.type === "send") c.send++;
      else if (e.type === "receive") c.receive++;
      else if (e.type === "swap") c.swap++;
      else if (e.type.startsWith("bridge")) c.bridge++;
      else c.contract++;
    }
    return c;
  }, [events]);

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
    if (!v) return setInputError("Paste a wallet address first.");
    if (!ADDR_RE.test(v)) return setInputError("Invalid wallet address.");
    setInputError("");
    setInput("");
    goTo(v);
  };
  const copyAddress = async () => {
    if (!target) return;
    try {
      await navigator.clipboard.writeText(target);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  const connect = () => window.dispatchEvent(new Event("open-wallet-modal"));
  const backToStart = () => {
    setInput("");
    setInputError("");
    router.push("/activity");
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };
  const refreshCard = async () => {
    if (refreshing) return;
    setRefreshing(true);
    const t0 = Date.now();
    await Promise.all([loadInfo(), loadNewest(false)]);
    const wait = 900 - (Date.now() - t0);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    setRefreshing(false);
  };
  const loadingInfo = (info === null && !infoFailed) || refreshing;

  const searchBox = (big: boolean) => {
    const typed = input.trim();
    const found = ADDR_RE.test(typed);
    return (
      <div className="relative">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitLookup(input);
          }}
          className={`flex items-center gap-2 rounded-full border bg-[#0a1018] px-4 transition focus-within:border-[#2588ff]/60 ${inputError ? "border-red-400/50" : "border-white/[0.1]"} ${big ? "py-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]" : "py-1"}`}
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
            enterKeyHint="search"
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            className={`min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-600 ${big ? "py-2.5 text-[15px]" : "py-2 text-sm"}`}
          />
        </form>
        {inputError && <p className="mt-2 px-4 text-xs text-red-300">{inputError}</p>}
        {found && (
          <button
            type="button"
            onClick={() => submitLookup(typed)}
            className="absolute inset-x-0 top-full z-30 mt-2 flex w-full items-center gap-3 rounded-2xl border border-white/[0.1] bg-[#0a1018] px-3.5 py-3 text-left shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition hover:border-[#2588ff]/50 hover:bg-[#0d1522]"
          >
            <span className="h-9 w-9 shrink-0 rounded-full border border-white/10" style={{ background: `linear-gradient(135deg, hsl(${hue(typed)} 85% 60%), hsl(${(hue(typed) + 60) % 360} 80% 38%))` }} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] uppercase tracking-[0.14em] text-slate-500">Wallet address</span>
              <span className="mt-0.5 block break-all text-sm font-semibold tabular-nums text-white">{typed}</span>
            </span>
            <span className="shrink-0 text-slate-500"><Svg d={I.arrow} size={18} /></span>
          </button>
        )}
      </div>
    );
  };

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
            <h3 className="border-b border-white/[0.08] px-2 pb-2 pt-6 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{g.day}</h3>
            <div className="divide-y divide-white/[0.05]">
              {g.items.map((e) => (
                <Row key={`${e.hash}-${e.type}`} e={e} />
              ))}
            </div>
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

        <section className={`pb-20 pt-8 sm:pt-12 lg:pb-32 lg:pt-14 ${!target ? "min-[900px]:[zoom:0.9]" : ""} ${CONTAINER}`}>
          {!target ? (
            /* ================= BEFORE A WALLET IS CONNECTED ================= */
            <>
              <div className="fade-up mx-auto max-w-2xl text-center">
                <h1 className="text-[2.4rem] font-bold leading-[1.05] tracking-[-0.035em] sm:text-[3.9rem]">
                  Activity <span className="bg-gradient-to-r from-[#18bfff] via-[#2588ff] to-[#4262ff] bg-clip-text text-transparent">Checker</span>
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

                <button onClick={() => (account ? goTo(account) : connect())} className="inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-white/10 bg-white/[0.045] px-7 py-4 text-base font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:border-[#2f8bff]/40 hover:bg-white/[0.08]">
                  <Svg d={I.wallet} size={20} /> {account ? "View my wallet" : "Connect your wallet"}
                </button>
              </div>
            </>
          ) : (
            /* ================= A WALLET IS SHOWN ================= */
            <div className="w-full">
              {/* ---------- WALLET AND SEARCH ---------- */}
              <div className="fade-up relative z-20">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span className="h-12 w-12 shrink-0 rounded-full border border-white/10" style={{ background: `linear-gradient(135deg, hsl(${hue(target)} 85% 60%), hsl(${(hue(target) + 60) % 360} 80% 38%))` }} aria-hidden />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{!account ? "Wallet address" : viewingOther ? "Viewing another wallet" : "Your wallet"}</p>
                      <p className="mt-1 break-all text-lg font-bold leading-snug tracking-tight sm:text-xl" title={target}>
                        <span className="xl:hidden">{target.slice(0, 12)}…{target.slice(-8)}</span>
                        <span className="hidden xl:inline">{target}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button onClick={copyAddress} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.045] px-3 font-semibold text-slate-200 transition hover:bg-white/[0.08]">
                      <Svg d={I.copy} size={BTN_ICON_PX} /> <BtnText>{copied ? "Copied" : "Copy"}</BtnText>
                    </button>
                    <a href={`${EXPLORER}/address/${target}`} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.045] px-3 font-semibold text-slate-200 transition hover:bg-white/[0.08]">
                      <Svg d={I.link} size={BTN_ICON_PX} /> <BtnText>Explorer</BtnText>
                    </a>
                    {!account && (
                      <button onClick={backToStart} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] px-3 font-bold text-white transition hover:brightness-110">
                        <Svg d={I.wallet} size={BTN_ICON_PX} /> <BtnText>Connect wallet</BtnText>
                      </button>
                    )}
                    {account && viewingOther && (
                      <button onClick={() => account && goTo(account)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] px-3 font-bold text-white transition hover:brightness-110">
                        <Svg d={I.wallet} size={BTN_ICON_PX} /> <BtnText>My wallet</BtnText>
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-5">{searchBox(false)}</div>
              </div>

              {/* ---------- PORTFOLIO AND TRANSACTIONS ---------- */}
              <div className="mt-6 grid items-stretch gap-4 lg:grid-cols-2">
                <section className={`fade-up ${MATTE_CARD}`} style={{ "--delay": "100ms" } as CSSProperties}>
                  <Grain />
                  <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <SectionTitle icon={I.pie}>Portfolio</SectionTitle>
                      <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-white sm:text-4xl">
                        {loadingInfo ? <span className="inline-block h-8 w-40 animate-pulse rounded-lg bg-white/[0.07]" /> : haveUsd ? fmtUsd(totalUsd) : "—"}
                      </p>
                      <p className="mt-1.5 text-xs text-slate-500">USDC, EURC and cirBTC on Arc</p>
                    </div>
                    <button onClick={refreshCard} disabled={refreshing} aria-label="Refresh portfolio" title="Refresh" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-default">
                      <span className={`inline-flex ${refreshing ? "animate-spin text-[#62d4ff]" : ""}`}><Svg d={I.refresh} /></span>
                    </button>
                  </div>

                  <div className="mt-5" role="img" aria-label="How the wallet value is split between the coins">
                    <div className={`flex h-7 w-full gap-0.5 ${loadingInfo ? "animate-pulse" : ""}`}>
                      {(() => {
                        const live = rows.filter((r) => (r.usd ?? 0) > 0);
                        if (loadingInfo || totalUsd <= 0 || live.length === 0) return <span className="h-full w-full rounded-md bg-white/[0.07]" />;
                        return live.map((r, i) => (
                          <span
                            key={r.sym}
                            title={`${r.sym} ${fmtPct(((r.usd ?? 0) / totalUsd) * 100)}`}
                            className={`h-full ${i === 0 ? "rounded-l-md" : ""} ${i === live.length - 1 ? "rounded-r-md" : ""}`}
                            style={{ flex: `${r.usd} 1 0%`, minWidth: 4, background: r.color }}
                          />
                        ));
                      })()}
                    </div>
                  </div>

                  <ul className="mt-4 divide-y divide-white/[0.06]">
                    {rows.map((r) => {
                      const pct = r.usd !== null && totalUsd > 0 ? (r.usd / totalUsd) * 100 : null;
                      return (
                        <li key={r.sym} className="flex items-center gap-3.5 py-3.5">
                          <TokenDot symbol={r.sym} size={38} />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="text-[15px] font-semibold">{r.sym}</span>
                              <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} aria-hidden />
                              {!loadingInfo && pct !== null && <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-white">{fmtPct(pct)}</span>}
                            </span>
                            <span className="block truncate text-xs text-slate-500">{r.name}</span>
                          </span>
                          <span className="text-right">
                            <span className="block text-[15px] font-semibold tabular-nums">
                              {loadingInfo ? <span className="inline-block h-4 w-20 animate-pulse rounded bg-white/[0.07]" /> : r.amount === null ? "—" : fmtAmt(r.amount)}
                            </span>
                            <span className="block text-xs tabular-nums text-slate-500">{loadingInfo ? <span className="mt-1 inline-block h-3 w-12 animate-pulse rounded bg-white/[0.05]" /> : r.usd !== null ? fmtUsd(r.usd) : ""}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {infoFailed && !refreshing && <p className="mt-2 text-xs text-amber-300">Couldn&apos;t load balances right now. Tap refresh to try again.</p>}
                  </div>
                </section>

                <section className={`fade-up ${MATTE_CARD}`} style={{ "--delay": "180ms" } as CSSProperties}>
                  <Grain />
                  <div className="relative">
                  <SectionTitle icon={I.history}>Transactions</SectionTitle>
                  <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-white sm:text-4xl">{loadingInfo && totalTx === null ? <span className="inline-block h-8 w-24 animate-pulse rounded-lg bg-white/[0.07]" /> : fmtInt(totalTx)}</p>
                  <p className="mt-1.5 text-xs text-slate-500">Total on Arc mainnet</p>

                  <dl className="mt-6 space-y-3.5 border-t border-white/[0.06] pt-5 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-400">Sent by this wallet</dt>
                      <dd className="font-semibold tabular-nums">{loadingInfo ? <span className="inline-block h-4 w-10 animate-pulse rounded bg-white/[0.07]" /> : fmtInt(info?.sent ?? null)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-400">Token transfers</dt>
                      <dd className="font-semibold tabular-nums">{loadingInfo ? <span className="inline-block h-4 w-10 animate-pulse rounded bg-white/[0.07]" /> : fmtInt(info?.transfersCount ?? null)}</dd>
                    </div>
                  </dl>

                  <div className="mt-5"><SepLine /></div>

                  <dl className="mt-5 space-y-3.5 text-sm">
                    {(
                      [
                        ["Sent", typeCounts.send],
                        ["Received", typeCounts.receive],
                        ["Swaps", typeCounts.swap],
                        ["Bridges", typeCounts.bridge],
                        ["Contracts", typeCounts.contract],
                      ] as [string, number][]
                    ).map(([label, n]) => (
                      <div key={label} className="flex items-center justify-between gap-3">
                        <dt className="text-slate-400">{label}</dt>
                        <dd className="font-semibold tabular-nums">{first ? <span className="inline-block h-4 w-10 animate-pulse rounded bg-white/[0.07]" /> : `${fmtInt(n)}${done ? "" : "+"}`}</dd>
                      </div>
                    ))}
                  </dl>
                  {!first && !done && !error && <p className="mt-3 text-[11px] text-slate-600">Still counting older activity…</p>}
                  </div>
                </section>
              </div>

              {/* ---------- ACTIVITY LIST ---------- */}
              <section className="fade-up mt-4 min-w-0 rounded-[1.75rem] border border-white/[0.1] bg-[#050a16]/85 p-4 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:rounded-[2rem] sm:p-6" style={{ "--delay": "260ms" } as CSSProperties}>
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pb-4">
                  <SectionTitle icon={I.list}>Activity</SectionTitle>
                  <div className="inline-flex max-w-full gap-1 overflow-x-auto">
                    {FILTERS.map(([f, label]) => (
                      <FilterBtn key={f} active={filter === f} onClick={() => setFilter(f)}>{label}</FilterBtn>
                    ))}
                  </div>
                </div>

                {error && (txMap.current.size > 0 || trMap.current.size > 0) && (
                  <p className="mb-3 border-l-2 border-amber-400/60 py-1.5 pl-3 text-xs leading-5 text-amber-200">{error}</p>
                )}

                {!first && shown.length > 0 && (
                  <div className={`hidden items-center gap-x-5 border-y border-white/[0.08] px-2 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 lg:grid ${DESK_COLS}`}>
                    <span>Transaction</span>
                    <span>Tx hash</span>
                    <span>Time</span>
                    <span>Status</span>
                    <span className="text-right">Amount</span>
                    <span className="text-right">Fee</span>
                  </div>
                )}

                {body}

                {!first && shown.length > 0 && (
                  <div ref={sentinel} className="px-3 pb-1 pt-6 text-center">
                    {done ? (
                      <p className="text-xs text-slate-600">That&apos;s the whole history of this wallet on Arc mainnet.</p>
                    ) : (
                      <button onClick={() => { failsRef.current = 0; setError(""); loadMore(); }} disabled={loadingMore} className="rounded-full border border-white/10 bg-white/[0.045] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:opacity-60">
                        {loadingMore ? "Loading older activity…" : "Load more"}
                      </button>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.08] px-2 pt-4 text-xs text-slate-500">
                  <span>{updated ? `Updated ${timeOf(updated)}` : ""}</span>
                  <a href={`${EXPLORER}/address/${target}`} target="_blank" rel="noreferrer" className="font-medium text-[#65caff] hover:text-white">
                    See everything on the explorer
                  </a>
                </div>
              </section>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function ActivityPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#010205]" />}>
      <ActivityInner />
    </Suspense>
  );
}
