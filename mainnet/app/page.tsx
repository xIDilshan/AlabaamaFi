"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import Header from "@/components/Header";

// Brand font for the whole home page. Swap this one line if your Header uses a different font.
const brandFont = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });

/* ---------- Arc mainnet ---------- */
const ARC = {
  chainId: 5042,
  chainIdHex: "0x13b2",
  rpc: "https://rpc.mainnet.arc.io",
  explorer: "https://explorer.arc.io",
  docs: "https://docs.arc.io",
  x: "https://x.com/arc",
};

// Same edge padding at every zoom level, so content lines up with the header and never drifts right when zoomed out.
const CONTAINER = "w-full px-5 sm:px-8 lg:px-10";
const EYEBROW = "text-sm font-medium uppercase tracking-[0.22em] text-[#4abaff]";
const H2 = "mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl";

const BUTTON =
  "inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] px-7 py-3.5 font-semibold text-white shadow-[0_10px_40px_rgba(30,120,255,0.28)] transition duration-300 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_15px_50px_rgba(30,120,255,0.42)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39c4ff]";

const SECONDARY_BUTTON =
  "inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.045] px-7 py-3.5 font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:border-[#2f8bff]/40 hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39c4ff]";

/* ---------- data ---------- */
const FEATURES = [
  { number: "01", title: "USDC-native", text: "USDC is the native gas token, keeping transaction costs familiar and predictable." },
  { number: "02", title: "Fast settlement", text: "Arc is designed for rapid deterministic finality, making onchain movement feel immediate." },
  { number: "03", title: "EVM compatible", text: "Connect with the wallets, contracts, tools, and infrastructure you already use." },
  { number: "04", title: "Built for finance", text: "A network designed around payments, stablecoins, FX, lending, and tokenized assets." },
];

// New icons: arrow-up-right, left-right arrows, bridge arch, history clock
const ACTIONS = [
  { href: "/send", title: "Send", text: "Move USDC directly to any wallet.", icon: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" },
  { href: "/swap", title: "Swap", text: "Exchange supported assets on Arc.", icon: "M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4" },
  { href: "/bridge", title: "Bridge", text: "Move assets between networks.", icon: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" },
  { href: "/activity", title: "Activity", text: "Follow your wallet activity onchain.", icon: "M12 7v5l3 2M3 12a9 9 0 1 0 3-6.7M3 4v4h4" },
];


/* ---------- helpers ---------- */
function Icon({ d, size = 22 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${visible ? "reveal-visible" : ""} ${className}`} style={{ "--delay": `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
}

/* ---------- WHOLE PAGE: dark space, gradient, stars + drifting particles (scroll with the page, no rings) ---------- */
function SpaceBackground() {
  const { stars, dust } = useMemo(() => {
    let seed = 23;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const r2 = (n: number) => Math.round(n * 100) / 100;
    return {
      stars: Array.from({ length: 230 }, (_, id) => ({ id, x: r2(rnd() * 100), y: r2(rnd() * 100), size: r2(1 + rnd() * 1.8), d: r2(rnd() * 7), t: r2(3 + rnd() * 5) })),
      dust: Array.from({ length: 44 }, (_, id) => ({ id, x: r2(rnd() * 100), y: r2(rnd() * 100), size: r2(1.5 + rnd() * 2), d: r2(rnd() * 14), t: r2(14 + rnd() * 14) })),
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#010205_0%,#020a1c_22%,#031126_50%,#020918_75%,#010307_100%)]" />
      <div className="absolute -right-[22vw] top-[2%] h-[60vw] w-[60vw] rounded-full bg-[radial-gradient(circle,rgba(22,115,255,0.2),transparent_68%)] blur-3xl" style={{ animation: "backgroundFloat 18s ease-in-out infinite" }} />
      <div className="absolute -left-[25vw] top-[30%] h-[55vw] w-[55vw] rounded-full bg-[radial-gradient(circle,rgba(20,90,255,0.12),transparent_68%)] blur-3xl" style={{ animation: "backgroundFloatReverse 24s ease-in-out infinite" }} />
      <div className="absolute -right-[18vw] top-[58%] h-[50vw] w-[50vw] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.1),transparent_68%)] blur-3xl" style={{ animation: "backgroundFloat 26s ease-in-out infinite reverse" }} />
      <div className="absolute -left-[20vw] top-[84%] h-[50vw] w-[50vw] rounded-full bg-[radial-gradient(circle,rgba(20,90,255,0.1),transparent_68%)] blur-3xl" style={{ animation: "backgroundFloatReverse 28s ease-in-out infinite" }} />

      {stars.map((st) => (
        <span key={st.id} className="absolute rounded-full bg-[#a9dfff]" style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.size, height: st.size, animation: `twinkle ${st.t}s ease-in-out ${st.d}s infinite` }} />
      ))}
      {dust.map((p) => (
        <span key={p.id} className="absolute rounded-full bg-[#6cc4ff]" style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, animation: `floatUp ${p.t}s linear ${p.d}s infinite` }} />
      ))}
    </div>
  );
}

/* ---------- HEADER AREA ONLY: glowing rings, comets, ripples, sweeping lines ---------- */
function HeroOrbits() {
  const rings = [
    { rx: 210, dur: 34, rev: false },
    { rx: 300, dur: 46, rev: true },
    { rx: 400, dur: 60, rev: false },
    { rx: 510, dur: 78, rev: true },
    { rx: 630, dur: 100, rev: false },
  ];
  const CX = 1000, CY = 330;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden [-webkit-mask-image:linear-gradient(to_bottom,#000_72%,transparent)] [mask-image:linear-gradient(to_bottom,#000_72%,transparent)]">
      <svg className="h-full w-full" viewBox="0 0 1200 720" preserveAspectRatio="xMaxYMid slice">
        <defs>
          <linearGradient id="orbitGradient" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#1769ff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#278aff" stopOpacity="0.3" />
            <stop offset="1" stopColor="#78d9ff" stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id="heroGlow" cx={CX} cy={CY} r="520" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#39aaff" stopOpacity="0.35" />
            <stop offset="0.4" stopColor="#1264ff" stopOpacity="0.12" />
            <stop offset="1" stopColor="#001b55" stopOpacity="0" />
          </radialGradient>
          <filter id="blueGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <circle cx={CX} cy={CY} r="520" fill="url(#heroGlow)" style={{ animation: "glowPulse 8s ease-in-out infinite" }} />

        {[0, 3, 6].map((delay) => (
          <circle key={delay} cx={CX} cy={CY} r="390" fill="none" stroke="#3e9dff" strokeWidth="1" opacity="0" style={{ transformOrigin: `${CX}px ${CY}px`, animation: `ripple 10s ease-out ${delay}s infinite` }} />
        ))}

        {["M 300 640 Q 700 260 1200 80", "M 120 700 Q 650 420 1200 250", "M 0 330 Q 360 220 760 0"].map((d, i) => (
          <g key={d}>
            <path d={d} fill="none" stroke="#277aff" strokeOpacity="0.14" />
            <path d={d} fill="none" stroke="#7ddcff" strokeWidth="1.6" strokeLinecap="round" pathLength={1000} strokeDasharray="80 920" filter="url(#blueGlow)" style={{ animation: `dashMove ${8 + i * 2.5}s linear ${i * -2.5}s infinite` }} />
          </g>
        ))}

        {rings.map((r, i) => (
          <g key={r.rx} style={{ transformOrigin: `${CX}px ${CY}px`, animation: `${r.rev ? "orbitReverse" : "orbit"} ${r.dur}s linear infinite` }}>
            <ellipse cx={CX} cy={CY} rx={r.rx} ry={r.rx * 0.34} fill="none" stroke="url(#orbitGradient)" strokeWidth={i === 0 ? 1.6 : 1} opacity={0.6 - i * 0.07} />
            <ellipse cx={CX} cy={CY} rx={r.rx} ry={r.rx * 0.34} fill="none" stroke="#9be4ff" strokeWidth="2.2" strokeLinecap="round" pathLength={1000} strokeDasharray="70 930" opacity="0.85" filter="url(#blueGlow)" />
          </g>
        ))}
      </svg>
      {/* keeps the headline readable */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(1,2,5,0.8)_0%,rgba(1,2,5,0.4)_45%,transparent_80%)]" />
    </div>
  );
}

function ActionCard({ href, title, text, icon }: { href: string; title: string; text: string; icon: string }) {
  return (
    <Link
      href={href}
      className="group relative flex h-full min-h-[12rem] flex-col overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.015] p-6 transition duration-500 hover:-translate-y-1.5 hover:border-[#2588ff]/50 hover:shadow-[0_30px_90px_rgba(16,93,255,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#39c4ff] sm:p-7"
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#39c4ff] to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
      <div aria-hidden className="pointer-events-none absolute -bottom-10 -right-10 text-[#2588ff]/[0.07] transition duration-500 group-hover:scale-110 group-hover:text-[#2588ff]/[0.14]">
        <Icon d={icon} size={160} />
      </div>
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#12b9ff] via-[#1978f5] to-[#273ee8] text-white shadow-[0_10px_30px_rgba(30,120,255,0.35)] transition duration-500 group-hover:-rotate-3 group-hover:scale-105">
        <Icon d={icon} size={24} />
      </div>
      <h3 className="relative mt-auto pt-10 text-2xl font-semibold tracking-tight">{title}</h3>
      <p className="relative mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </Link>
  );
}

/* ---------- preview mock-ups (sample data, not live) ---------- */
function Field({ label, side, value, tag }: { label: string; side?: string; value: string; tag?: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.035] p-4">
      <div className="flex justify-between text-xs text-slate-500"><span>{label}</span><span>{side}</span></div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="truncate text-xl font-semibold">{value}</span>
        {tag && <span className="shrink-0 rounded-full bg-white/[0.06] px-4 py-2 text-sm font-medium">{tag}</span>}
      </div>
    </div>
  );
}

function PreviewCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-10 rounded-full bg-[#1675ff]/10 blur-3xl" />
      <div aria-hidden className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#050a16]/75 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl" style={{ animation: "floatCard 7s ease-in-out infinite" }}>
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-5">
          <div>
            <p className="text-xs text-slate-500">{subtitle}</p>
            <p className="mt-1 font-medium">{title}</p>
          </div>
          <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs text-slate-400">Preview</span>
        </div>
        <div className="mt-5 space-y-2">{children}</div>
      </div>
    </div>
  );
}

const ActionBtn = ({ children }: { children: ReactNode }) => (
  <div className="mt-2 rounded-2xl bg-gradient-to-r from-[#0d75dc] to-[#3154ee] py-3 text-center text-sm font-semibold">{children}</div>
);
const Arrow = () => (
  <div className="relative z-10 mx-auto -my-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-[#071025] text-[#55c5ff]">
    <Icon d="M12 5v14m0 0-6-6m6 6 6-6" size={16} />
  </div>
);

function Preview({ kind }: { kind: "send" | "swap" | "bridge" | "activity" }) {
  if (kind === "send")
    return (
      <PreviewCard title="Send USDC" subtitle="Send">
        <Field label="Recipient" value="0x7a3c…f91d" />
        <Field label="Amount" side="Balance" value="25" tag="USDC" />
        <ActionBtn>Send USDC</ActionBtn>
        <p className="px-1 pt-2 text-xs text-slate-500">Network fee paid in USDC</p>
      </PreviewCard>
    );
  if (kind === "swap")
    return (
      <PreviewCard title="Exchange assets" subtitle="Swap">
        <Field label="You pay" side="Balance" value="100" tag="USDC" />
        <Arrow />
        <Field label="You receive" side="Estimated" value="99.8" tag="EURC" />
        <ActionBtn>Preview swap</ActionBtn>
      </PreviewCard>
    );
  if (kind === "bridge")
    return (
      <PreviewCard title="Move to Arc" subtitle="Bridge">
        <Field label="From" value="Ethereum" tag="Network" />
        <Arrow />
        <Field label="To" value="Arc Mainnet" tag="Network" />
        <Field label="Amount" value="100" tag="USDC" />
        <ActionBtn>Bridge to Arc</ActionBtn>
      </PreviewCard>
    );
  return (
    <PreviewCard title="Recent moves" subtitle="Activity">
      {[
        ["Sent", "25 USDC", "2 min ago"],
        ["Swapped", "100 USDC to EURC", "1 hr ago"],
        ["Bridged", "100 USDC to Arc", "Yesterday"],
      ].map(([a, b, c]) => (
        <div key={a} className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.035] px-4 py-3.5">
          <div>
            <p className="text-sm font-medium">{a}</p>
            <p className="mt-0.5 text-xs text-slate-500">{b}</p>
          </div>
          <span className="text-xs text-slate-500">{c}</span>
        </div>
      ))}
    </PreviewCard>
  );
}

const SHOWCASE: { kind: "send" | "swap" | "bridge" | "activity"; href: string; label: string; title: string; text: string }[] = [
  { kind: "send", href: "/send", label: "Send", title: "Send USDC in seconds.", text: "Paste an address, enter an amount, and send. Network fees are paid in USDC, so there is no second token to hold." },
  { kind: "swap", href: "/swap", label: "Swap", title: "Swap with clear pricing.", text: "Exchange supported assets on Arc and review every amount before you confirm." },
  { kind: "bridge", href: "/bridge", label: "Bridge", title: "Bring assets to Arc.", text: "Move assets between networks and Arc without leaving AlabaamaFi." },
  { kind: "activity", href: "/activity", label: "Activity", title: "Every move, in one list.", text: "Follow your sends, swaps, and bridges from your connected wallet." },
];

const STEPS = [
  { n: "01", title: "Connect your wallet", text: "Use Connect Wallet in the header to link any EVM wallet." },
  { n: "02", title: "Switch to Arc", text: "Add Arc Mainnet to your wallet with one click." },
  { n: "03", title: "Make your move", text: "Send, swap, bridge, and track everything in one place." },
];

/* ---------- page ---------- */
export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletMsg, setWalletMsg] = useState("");

  useEffect(() => {
    const handleMenuState = (event: Event) => setMobileMenuOpen((event as CustomEvent<boolean>).detail);
    window.addEventListener("mobile-menu-state", handleMenuState);
    return () => window.removeEventListener("mobile-menu-state", handleMenuState);
  }, []);

  const addArcToWallet = async () => {
    const ethereum = (window as Window & { ethereum?: { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
    if (!ethereum) return setWalletMsg("No EVM wallet detected.");
    try {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{ chainId: ARC.chainIdHex, chainName: "Arc Mainnet", nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 }, rpcUrls: [ARC.rpc], blockExplorerUrls: [ARC.explorer] }],
      });
      setWalletMsg("Arc Mainnet added to your wallet.");
    } catch {
      setWalletMsg("The wallet request was cancelled or failed.");
    }
  };

  return (
    <main className={`${brandFont.className} relative min-h-screen overflow-x-hidden bg-[#010205] text-white selection:bg-[#167cff]/30`}>
      <style>{`
        @keyframes backgroundFloat{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(-4vw,2vw,0) scale(1.08)}}
        @keyframes backgroundFloatReverse{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(5vw,-3vw,0) scale(1.12)}}
        @keyframes twinkle{0%,100%{opacity:.12}50%{opacity:.9}}
        @keyframes floatUp{0%{transform:translateY(0);opacity:0}15%{opacity:.7}100%{transform:translateY(-220px);opacity:0}}
        @keyframes orbit{to{transform:rotate(360deg)}}
        @keyframes orbitReverse{to{transform:rotate(-360deg)}}
        @keyframes dashMove{to{stroke-dashoffset:-1000}}
        @keyframes ripple{0%{transform:scale(.25);opacity:.55}100%{transform:scale(1.9);opacity:0}}
        @keyframes glowPulse{0%,100%{opacity:.65}50%{opacity:1}}
        @keyframes lineSweep{0%{transform:translateX(-100%);opacity:0}15%{opacity:1}85%{opacity:1}100%{transform:translateX(400%);opacity:0}}
        @keyframes floatCard{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
        .reveal{opacity:0;transform:translateY(34px);transition:opacity .9s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1);transition-delay:var(--delay,0ms)}
        .reveal-visible{opacity:1;transform:none}
        @media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important}.reveal{opacity:1;transform:none;transition:none}}
      `}</style>

      <SpaceBackground />

      <div className="relative z-10">
        <Header />

        <div className={`transition-[filter] duration-500 ${mobileMenuOpen ? "blur-md" : "blur-0"}`}>
          {/* ---------------- HERO (rings live here only) ---------------- */}
          <section className="relative min-h-[440px] overflow-hidden sm:min-h-[480px] lg:min-h-[540px]">
            <HeroOrbits />
            <div className={`relative flex min-h-[440px] items-center sm:min-h-[480px] lg:min-h-[540px] ${CONTAINER}`}>
              <div className="relative z-10 w-full max-w-[950px] py-10 sm:py-12 lg:py-14 xl:max-w-none">
                <Reveal>
                  <h1 className="text-[2.75rem] font-bold leading-[1.02] tracking-[-0.035em] sm:text-[3.5rem] md:text-7xl lg:text-[5.8rem] xl:whitespace-nowrap xl:text-[clamp(4.5rem,5.6vw,10rem)]">
                    One place.{" "}
                    <br className="xl:hidden" />
                    <span className="bg-gradient-to-r from-[#18bfff] via-[#2588ff] to-[#4262ff] bg-clip-text text-transparent">Every move.</span>
                  </h1>
                </Reveal>
                <Reveal delay={120}>
                  <p className="mt-7 text-xl font-medium tracking-tight text-slate-300 sm:text-2xl">A simple interface for Arc</p>
                  <p className="mt-5 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">Send, swap, bridge, and explore assets on Arc Mainnet through one simple interface.</p>
                </Reveal>
                <Reveal delay={240}>
                  <div className="mt-9 flex flex-wrap gap-3">
                    <Link href="/swap" className={BUTTON}>Start swapping</Link>
                    <Link href="/bridge" className={SECONDARY_BUTTON}>Bridge to Arc</Link>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          {/* ---------------- ACTIONS ---------------- */}
          <section className={`pb-28 pt-12 lg:pb-36 ${CONTAINER}`}>
            <div className="flex items-end gap-10">
              <Reveal className="shrink-0">
                <p className={EYEBROW}>Everything in one place</p>
                <h2 className={H2}>Move through Arc.</h2>
                <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">A focused interface for the actions you use most onchain.</p>
              </Reveal>

              {/* glowing line, desktop only */}
              <Reveal delay={120} className="hidden flex-1 lg:block">
                <div aria-hidden className="relative mb-2 h-6 overflow-hidden">
                  <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-[#2588ff]/70 via-[#2588ff]/25 to-transparent" />
                  <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-gradient-to-r from-[#2588ff]/40 via-[#2588ff]/10 to-transparent blur-[3px]" />
                  <span
                    className="absolute left-0 top-1/2 h-px w-1/4 bg-gradient-to-r from-transparent via-[#b8f0ff] to-transparent shadow-[0_0_14px_3px_rgba(90,200,255,0.65)]"
                    style={{ animation: "lineSweep 4.5s ease-in-out infinite" }}
                  />
                </div>
              </Reveal>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ACTIONS.map((a, i) => (
                <Reveal key={a.title} delay={i * 90} className="h-full [&>a]:h-full"><ActionCard {...a} /></Reveal>
              ))}
            </div>
          </section>

          {/* ---------------- SHOWCASE: one block per AlabaamaFi page ---------------- */}
          <section className={`pb-10 lg:pb-16 ${CONTAINER}`}>
            {SHOWCASE.map((item, i) => (
              <div key={item.kind} className="grid items-center gap-10 py-12 lg:grid-cols-2 lg:gap-20 lg:py-20">
                <Reveal className={i % 2 ? "lg:order-2" : ""}>
                  <p className={EYEBROW}>{`0${i + 1} · ${item.label}`}</p>
                  <h2 className={H2}>{item.title}</h2>
                  <p className="mt-5 max-w-md text-base leading-7 text-slate-400 sm:text-lg">{item.text}</p>
                </Reveal>
                <Reveal delay={120} className={i % 2 ? "lg:order-1" : ""}>
                  <Preview kind={item.kind} />
                </Reveal>
              </div>
            ))}
          </section>

          {/* ---------------- HOW IT WORKS ---------------- */}
          <section className="relative mb-28 lg:mb-40">
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#010205]/85 to-transparent" />
            <div className={`relative py-20 text-center lg:py-28 ${CONTAINER}`}>
              <Reveal>
                <p className={EYEBROW}>Getting started</p>
                <h2 className={`${H2} mx-auto max-w-3xl`}>Three steps to your first move.</h2>
              </Reveal>
              <div className="mx-auto mt-14 grid max-w-5xl gap-10 md:grid-cols-3">
                {STEPS.map((st, i) => (
                  <Reveal key={st.n} delay={i * 100}>
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#2588ff]/30 bg-[#0d4fc5]/10 text-xs tracking-[0.1em] text-[#62c8ff]">{st.n}</span>
                    <h3 className="mt-5 text-xl font-semibold">{st.title}</h3>
                    <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">{st.text}</p>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ---------------- WHY ARC ---------------- */}
          <section className={`pb-28 lg:pb-40 ${CONTAINER}`}>
            <div className="grid gap-14 lg:grid-cols-[0.75fr_1.25fr]">
              <Reveal>
                <p className={EYEBROW}>The network</p>
                <h2 className={H2}>Why Arc?</h2>
                <p className="mt-5 max-w-md leading-7 text-slate-400">Arc is a USDC-native, EVM-compatible Layer 1 designed around modern onchain finance and payments.</p>
                <a href={ARC.docs} target="_blank" rel="noreferrer" className={`${SECONDARY_BUTTON} mt-8`}>Read Arc documentation</a>
              </Reveal>
              <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
                {FEATURES.map((f, i) => (
                  <Reveal key={f.number} delay={i * 100}>
                    <span className="text-xs tracking-[0.2em] text-[#2588ff]">{f.number}</span>
                    <h3 className="mt-3 text-xl font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{f.text}</p>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ---------------- WALLET SETUP ---------------- */}
          <section className={`pb-28 lg:pb-40 ${CONTAINER}`}>
            <Reveal>
              <div className="grid gap-14 lg:grid-cols-2">
                <div>
                  <p className={EYEBROW}>Wallet setup</p>
                  <h2 className={H2}>Add Arc to your wallet.</h2>
                  <p className="mt-5 max-w-md leading-7 text-slate-400">Add Arc Mainnet to any EVM wallet in one click, or browse the network in the explorer.</p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button onClick={addArcToWallet} className={BUTTON}>Add Arc Mainnet</button>
                    <a href={ARC.explorer} target="_blank" rel="noreferrer" className={SECONDARY_BUTTON}>Explorer</a>
                  </div>
                  <p role="status" className="mt-4 min-h-5 text-sm text-slate-500">{walletMsg}</p>
                </div>
                <div>
                  <div className="grid grid-cols-2 border-y border-white/[0.07]">
                    {[
                      ["Network", "Arc Mainnet"],
                      ["Chain ID", String(ARC.chainId)],
                      ["Gas token", "USDC"],
                      ["Finality", "< 1 second"],
                    ].map(([k, v], i) => (
                      <div key={k} className={`min-w-0 break-words p-4 sm:p-7 ${i % 2 === 0 ? "border-r border-white/[0.07]" : ""} ${i < 2 ? "border-b border-white/[0.07]" : ""}`}>
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-600">{k}</p>
                        <p className="mt-2 font-medium tabular-nums">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          {/* ---------------- CTA ---------------- */}
          <section className={`pb-28 lg:pb-40 ${CONTAINER}`}>
            <Reveal>
              <div className="relative py-10 text-center sm:py-16">
                <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1675ff]/10 blur-3xl" />
                <div className="relative">
                  <p className={EYEBROW}>AlabaamaFi</p>
                  <h2 className="mx-auto mt-5 text-[2.25rem] font-semibold leading-tight tracking-[-0.04em] md:whitespace-nowrap md:text-[clamp(2.25rem,5vw,6.5rem)]">
                    Make your next move
                    <span className="bg-gradient-to-r from-[#18bfff] to-[#4262ff] bg-clip-text text-transparent"> on Arc.</span>
                  </h2>
                  <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-slate-500">One place to move, manage, and explore assets on Arc.</p>
                  <div className="mt-9 flex flex-wrap justify-center gap-3">
                    <Link href="/send" className={BUTTON}>Send USDC</Link>
                    <Link href="/swap" className={SECONDARY_BUTTON}>Start swapping</Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          {/* ---------------- FOOTER ---------------- */}
          <footer>
            <div className={`flex flex-col gap-5 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between ${CONTAINER}`}>
              <p>© {new Date().getFullYear()} AlabaamaFi. An independent interface for Arc.</p>
              <nav className="flex flex-wrap gap-6">
                <a href={ARC.docs} target="_blank" rel="noreferrer" className="transition hover:text-white">Docs</a>
                <a href={ARC.explorer} target="_blank" rel="noreferrer" className="transition hover:text-white">Explorer</a>
                <a href={ARC.x} target="_blank" rel="noreferrer" className="transition hover:text-white">Arc on X</a>
              </nav>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
