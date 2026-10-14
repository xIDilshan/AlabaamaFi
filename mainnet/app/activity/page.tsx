"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Inter } from "next/font/google";
import { useAccount } from "wagmi";
import Header from "@/components/Header";

const brandFont = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });

const EXPLORER = "https://explorer.arc.io";
const CONTAINER = "w-full px-4 sm:px-8 lg:px-10";

/* ---------- types (the same shape the /api/activity route sends) ---------- */
type Leg = { symbol: string; amount: string; dir: "in" | "out" };
type EvType = "send" | "receive" | "swap" | "bridge-out" | "bridge-in" | "contract";
type Ev = {
  hash: string;
  t: number;
  status: "ok" | "error" | "pending";
  type: EvType;
  legs: Leg[];
  peer?: string;
  fee?: string;
  method?: string;
  minted?: boolean;
  note?: string; // set for activity saved on this device
};

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
const ZERO = "0x0000000000000000000000000000000000000000";

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
  if (e.note) return e.note;
  if (e.type === "send" && e.peer) return `To ${short(e.peer)}`;
  if (e.type === "receive" && e.peer) return e.peer === ZERO ? "Minted" : `From ${short(e.peer)}`;
  if (e.type === "bridge-in") return e.peer && e.peer !== ZERO ? `From ${short(e.peer)}` : "USDC delivered to Arc";
  if (e.type === "bridge-out" && e.peer) return `Via ${short(e.peer)}`;
  return "";
}

/* ---------- icons ---------- */
const ICONS: Record<EvType, string> = {
  send: "M7 17 17 7M8 7h9v9",
  receive: "M17 7 7 17M16 17H7V8",
  swap: "M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4",
  "bridge-out": "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  "bridge-in": "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
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

/** Swaps and bridges made on this device (saved by the Swap and Bridge pages). Used if the live list can't be loaded. */
function readLocal(address: string): Ev[] {
  const out: Ev[] = [];
  const key = address.toLowerCase();
  const split = (v: string) => {
    const [amt, ...rest] = v.trim().split(" ");
    return { amount: (amt ?? "0").replace(/,/g, ""), symbol: rest.join(" ") || "USDC" };
  };
  try {
    const sw = JSON.parse(window.localStorage.getItem(`alabaamafi:swaps:${key}`) ?? "[]") as { id: string; t: number; paid: string; got: string }[];
    for (const r of sw) {
      const a = split(r.paid);
      const b = split(r.got);
      out.push({ hash: r.id, t: r.t, status: "ok", type: "swap", legs: [{ ...a, dir: "out" }, { ...b, dir: "in" }], note: "Saved on this device" });
    }
  } catch {
    /* ignore */
  }
  try {
    const br = JSON.parse(window.localStorage.getItem(`alabaamafi:bridges:${key}`) ?? "[]") as { id: string; t: number; from: string; to: string; amount: string; received: string; burn?: string }[];
    for (const r of br) {
      out.push({ hash: r.burn ?? r.id, t: r.t, status: "ok", type: "bridge-out", legs: [{ symbol: "USDC", amount: r.amount.replace(/,/g, ""), dir: "out" }], note: `${r.from.replace(/_/g, " ")} to ${r.to.replace(/_/g, " ")} · saved on this device` });
    }
  } catch {
    /* ignore */
  }
  return out.sort((a, b) => b.t - a.t);
}

/* ---------- page ---------- */
export default function ActivityPage() {
  const { address, isConnected } = useAccount();
  const account = isConnected && address ? address : null;

  const [events, setEvents] = useState<Ev[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [local, setLocal] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [updated, setUpdated] = useState(0);

  const load = useCallback(
    async (quiet = false) => {
      if (!account) return;
      if (!quiet) setLoading(true);
      try {
        const r = await fetch(`/api/activity?address=${account}`);
        if (!r.ok) throw new Error(`activity ${r.status}`);
        const j = (await r.json()) as { events?: Ev[]; updated?: number };
        setEvents(j.events ?? []);
        setLocal(false);
        setError("");
        setUpdated(j.updated ?? Date.now());
      } catch {
        // live list unavailable: show what was saved on this device, and say so
        setEvents(readLocal(account));
        setLocal(true);
        setError("The live activity list couldn't be loaded right now.");
      } finally {
        setLoading(false);
      }
    },
    [account]
  );

  /* load when the wallet changes, then refresh every 30 seconds and when the tab is shown again */
  useEffect(() => {
    setEvents(null);
    setError("");
    if (!account) return;
    load();
    const id = setInterval(() => load(true), 30000);
    const onVis = () => document.visibilityState === "visible" && load(true);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [account, load]);

  const shown = useMemo(() => {
    const list = events ?? [];
    return list.filter((e) => (filter === "all" ? true : filter === "bridge" ? e.type.startsWith("bridge") : e.type === filter));
  }, [events, filter]);

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

  const Pill = ({ f, label }: { f: Filter; label: string }) => (
    <button
      onClick={() => setFilter(f)}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${filter === f ? "bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] text-white" : "bg-white/[0.05] text-slate-400 hover:bg-white/[0.09] hover:text-white"}`}
    >
      {label}
    </button>
  );

  let body: ReactNode;
  if (!account) {
    body = (
      <div className="px-4 py-14 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.05] text-slate-400"><Svg d="M3 12h4l3-8 4 16 3-8h4" size={26} /></span>
        <p className="mt-4 text-base font-semibold">Connect your wallet</p>
        <p className="mx-auto mt-1.5 max-w-xs text-sm leading-6 text-slate-500">Use the Connect button in the header to see your sends, swaps and bridges on Arc.</p>
      </div>
    );
  } else if (events === null || (loading && events.length === 0)) {
    body = <Skeleton />;
  } else if (shown.length === 0) {
    body = (
      <div className="px-4 py-14 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.05] text-slate-400"><Svg d="M12 7v5l3 2M3 12a9 9 0 1 0 3-6.7M3 4v4h4" size={26} /></span>
        <p className="mt-4 text-base font-semibold">{events.length === 0 ? "No activity yet" : "Nothing in this filter"}</p>
        <p className="mx-auto mt-1.5 max-w-xs text-sm leading-6 text-slate-500">{events.length === 0 ? "Your sends, swaps and bridges will show up here." : "Try another filter, or choose All."}</p>
      </div>
    );
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
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-6 text-slate-400 sm:mt-4 sm:text-lg sm:leading-7">Your recent sends, swaps and bridges on Arc.</p>
          </div>

          <div className="fade-up relative mx-auto mt-10 w-full max-w-2xl sm:mt-12" style={{ "--delay": "150ms" } as CSSProperties}>
            <div className="absolute -inset-10 rounded-full bg-[#1675ff]/10 blur-3xl" />
            <div className="relative rounded-[1.75rem] border border-white/[0.08] bg-[#050a16]/80 p-3 shadow-[0_30px_100px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:rounded-[2rem] sm:p-5">
              {/* filters + refresh */}
              <div className="flex items-center gap-2 px-1 pb-3">
                <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
                  {FILTERS.map(([f, label]) => (
                    <Pill key={f} f={f} label={label} />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => load()}
                  disabled={!account || loading}
                  aria-label="Refresh"
                  title="Refresh"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-40"
                >
                  <span className={loading ? "animate-spin" : ""}><Svg d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" /></span>
                </button>
              </div>

              {error && account && (
                <p className="mx-1 mb-2 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-xs leading-5 text-amber-200">
                  {error} {local ? "Showing swaps and bridges saved on this device." : ""}
                </p>
              )}

              {body}

              {account && (
                <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/[0.06] px-3 pt-4 text-xs text-slate-500">
                  <span>{updated && !local ? `Updated ${timeOf(updated)}` : local ? "Saved on this device" : ""}</span>
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
