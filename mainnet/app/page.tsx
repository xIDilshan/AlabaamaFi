"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { Inter, Manrope } from "next/font/google";
import Header from "@/components/Header";

// Brand fonts. Swap Inter if your Header uses a different font. Manrope is used for numbers, like on the other pages.
const brandFont = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });
const manrope = Manrope({ subsets: ["latin"], weight: ["600", "700"], display: "swap" });
const NUM = { fontFamily: manrope.style.fontFamily } as CSSProperties;

/* ---------- Arc mainnet ---------- */
const ARC = {
  chainId: 5042,
  chainIdHex: "0x13b2",
  rpc: "https://rpc.mainnet.arc.io",
  explorer: "https://explorer.arc.io",
  docs: "https://docs.arc.io",
  x: "https://x.com/arc",
};

// Same edge padding as the Header, so the logo, the headline and every section line up.
const CONTAINER = "w-full px-4 sm:px-6 md:px-7 lg:px-10 xl:px-12";
const EYEBROW = "text-sm font-medium uppercase tracking-[0.22em] text-[#4abaff]";
const H2 = "mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl";
const GRAD = "bg-gradient-to-r from-[#18bfff] via-[#2588ff] to-[#4262ff] bg-clip-text text-transparent";

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

const ICON_SEND = "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z";
const ICON_SWAP = "M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4";
const ICON_BRIDGE = "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71";
const ICON_ACTIVITY = "M12 7v5l3 2M3 12a9 9 0 1 0 3-6.7M3 4v4h4";
const ICON_CHART = "M3 3v18h18M7 15l4-4 3 3 5-6";
const ICON_SETTINGS = "M20 7h-9M14 17H5M17 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM7 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z";
const ICON_FAST = "M13 2 3 14h9l-1 8 10-12h-9l1-8z";
const ICON_RECEIVE = "M17 7 7 17M16 17H7V8";
const ICON_UP_RIGHT = "M7 17 17 7M8 7h9v9";

const ACTIONS = [
  { href: "/send", title: "Send", text: "Move USDC directly to any wallet.", icon: ICON_SEND },
  { href: "/swap", title: "Swap", text: "Exchange USDC, EURC and cirBTC on Arc.", icon: ICON_SWAP },
  { href: "/bridge", title: "Bridge", text: "Move USDC between Arc and other networks.", icon: ICON_BRIDGE },
  { href: "/activity", title: "Activity", text: "Follow everything your wallet does on Arc.", icon: ICON_ACTIVITY },
];

const STEPS = [
  { n: "01", title: "Connect your wallet", text: "Use Connect Wallet in the header to link any EVM wallet." },
  { n: "02", title: "Switch to Arc", text: "Add Arc Mainnet to your wallet with one click." },
  { n: "03", title: "Make your move", text: "Send, swap, bridge, and track everything in one place." },
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

/* ---------- WHOLE PAGE: dark space, gradient, stars + drifting particles (scroll with the page) ---------- */
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

/* =====================================================================
   HERO ART: glowing lines that draw the AlabaamaFi logo.
   The shapes were traced from your logo: 4 curved blades and 16 dots.
   Each cycle: the outlines draw, the blades fill in, the dots appear one by one, the logo holds and turns slowly, then it fades and draws again.
===================================================================== */
const LOGO_ARCS = [
  { d: "M40.75 -84.23C42.13 -85.47 31.54 -87.31 25.55 -87.82C19.56 -88.32 10.31 -87.82 4.82 -87.27C-0.66 -86.71 -2.27 -86.39 -7.34 -84.50C-12.40 -82.61 -20.74 -78.74 -25.58 -75.93C-30.41 -73.12 -32.53 -71.37 -36.35 -67.64C-40.18 -63.91 -45.38 -58.02 -48.51 -53.55C-51.65 -49.08 -53.76 -43.97 -55.15 -40.84C-56.53 -37.70 -56.80 -36.92 -56.80 -34.76C-56.80 -32.59 -56.39 -29.55 -55.15 -27.85C-53.90 -26.14 -51.09 -24.94 -49.34 -24.53C-47.59 -24.12 -47.78 -20.89 -44.64 -25.36C-41.51 -29.83 -34.37 -45.49 -30.55 -51.34C-26.73 -57.19 -25.21 -57.51 -21.71 -60.46C-18.21 -63.41 -16.04 -65.71 -9.55 -69.03C-3.05 -72.34 8.88 -77.82 17.26 -80.36C25.64 -82.89 39.37 -82.98 40.75 -84.23Z", x1: 29.3, y1: -99.9, x2: -60.0, y2: -34.5, c1: "#205fb7", c2: "#0da6df" },
  { d: "M25.55 -54.10C23.76 -53.00 22.28 -50.97 22.24 -49.13C22.19 -47.28 22.37 -44.84 25.28 -43.05C28.18 -41.25 35.46 -40.19 39.65 -38.35C43.84 -36.51 47.11 -34.43 50.43 -31.99C53.74 -29.55 56.28 -27.16 59.55 -23.70C62.82 -20.25 66.36 -17.76 70.05 -11.26C73.73 -4.77 78.89 5.13 81.65 15.27C84.42 25.40 85.16 46.73 86.63 49.54C88.10 52.35 89.95 38.53 90.50 32.12C91.05 25.72 90.41 16.79 89.95 11.12C89.48 5.46 89.53 3.70 87.73 -1.87C85.94 -7.44 82.02 -16.93 79.17 -22.32C76.31 -27.71 75.07 -29.69 70.60 -34.20C66.13 -38.72 57.20 -46.09 52.36 -49.40C47.52 -52.72 44.81 -53.04 41.58 -54.10C38.36 -55.16 35.69 -55.76 33.01 -55.76C30.34 -55.76 27.35 -55.21 25.55 -54.10Z", x1: 34.9, y1: -60.7, x2: 104.3, y2: 37.0, c1: "#10a3e0", c2: "#235eb6" },
  { d: "M-83.06 -54.10C-83.98 -53.32 -88.72 -41.76 -89.97 -34.76C-91.21 -27.75 -91.17 -18.91 -90.52 -12.09C-89.88 -5.28 -87.94 0.57 -86.10 6.15C-84.26 11.72 -82.05 16.83 -79.47 21.35C-76.89 25.86 -73.80 29.64 -70.62 33.23C-67.44 36.82 -63.16 40.60 -60.40 42.90C-57.63 45.21 -57.54 45.25 -54.04 47.05C-50.54 48.84 -43.86 52.58 -39.39 53.68C-34.93 54.79 -30.09 54.65 -27.23 53.68C-24.38 52.71 -22.86 49.58 -22.26 47.88C-21.66 46.17 -23.00 44.56 -23.64 43.46C-24.29 42.35 -23.13 42.44 -26.13 41.24C-29.12 40.05 -37.14 38.25 -41.60 36.27C-46.07 34.29 -48.93 32.54 -52.94 29.36C-56.94 26.18 -62.38 21.21 -65.65 17.20C-68.92 13.19 -69.89 11.44 -72.56 5.32C-75.23 -0.81 -79.70 -12.09 -81.68 -19.56C-83.66 -27.02 -84.21 -33.70 -84.44 -39.45C-84.67 -45.21 -82.14 -54.88 -83.06 -54.10Z", x1: -104.1, y1: -39.6, x2: -35.7, y2: 59.5, c1: "#215fb4", c2: "#088de0" },
  { d: "M55.12 27.98C53.93 26.60 51.02 24.62 49.32 24.11C47.62 23.60 46.10 24.16 44.90 24.94C43.70 25.72 43.01 26.46 42.13 28.81C41.26 31.16 40.84 36.04 39.65 39.03C38.45 42.03 38.31 42.86 34.95 46.77C31.59 50.69 23.80 58.79 19.47 62.52C15.14 66.26 15.79 66.26 8.97 69.16C2.15 72.06 -11.30 77.59 -21.43 79.94C-31.56 82.28 -49.76 81.92 -51.83 83.25C-53.90 84.59 -39.58 87.03 -33.87 87.95C-28.15 88.87 -22.81 89.01 -17.56 88.78C-12.31 88.55 -8.21 88.04 -2.36 86.57C3.49 85.09 11.04 83.21 17.54 79.94C24.03 76.67 31.45 71.37 36.61 66.95C41.77 62.52 45.36 57.87 48.49 53.40C51.62 48.94 54.06 43.64 55.40 40.14C56.74 36.64 56.55 34.43 56.51 32.40C56.46 30.37 56.32 29.36 55.12 27.98Z", x1: 60.8, y1: 36.9, x2: -40.7, y2: 100.9, c1: "#128cdf", c2: "#225fb4" },
];

const LOGO_DOTS = [
  { x: 2.3, y: -58.8, r: 8.4, c: "#1087ec" },
  { x: 27.0, y: -67.0, r: 8.1, c: "#1566dc" },
  { x: 55.0, y: -66.9, r: 8.7, c: "#1763de" },
  { x: 43.0, y: -19.9, r: 8.8, c: "#0994e9" },
  { x: 60.2, y: 1.3, r: 8.7, c: "#1072f2" },
  { x: 69.6, y: 28.8, r: 8.3, c: "#1c5fd4" },
  { x: 68.9, y: 55.3, r: 7.7, c: "#235eb9" },
  { x: 20.8, y: 40.8, r: 8.3, c: "#0a89f2" },
  { x: 0.3, y: 57.3, r: 8.7, c: "#1968ef" },
  { x: -27.5, y: 66.2, r: 8.3, c: "#1864e5" },
  { x: -56.7, y: 65.2, r: 8.5, c: "#1b61d8" },
  { x: -41.3, y: 21.0, r: 8.4, c: "#0791ec" },
  { x: -60.0, y: -0.1, r: 8.6, c: "#0e85f0" },
  { x: -69.0, y: -26.9, r: 8.1, c: "#1567e3" },
  { x: -67.7, y: -54.2, r: 8.0, c: "#1c60cb" },
  { x: -20.0, y: -41.4, r: 8.7, c: "#0ba3f0" },
];

const LOGO_CYCLE = 15; // seconds for one draw -> hold -> fade round
const LOGO_HOLD_END = 12.4;
const LOGO_FADE_END = 13.8;

function logoCss(): string {
  const D = LOGO_CYCLE;
  const p = (s: number) => `${((s / D) * 100).toFixed(3)}%`;
  let css = "";
  LOGO_ARCS.forEach((_, i) => {
    const s = 0.3 + i * 0.45;
    css += `@keyframes arcLine${i}{0%,${p(s)}{stroke-dashoffset:1;opacity:0}${p(s + 0.05)}{opacity:1;animation-timing-function:cubic-bezier(.4,0,.2,1)}${p(s + 1.7)}{stroke-dashoffset:0;opacity:1}${p(s + 2.8)}{stroke-dashoffset:0;opacity:.35}${p(LOGO_HOLD_END)}{stroke-dashoffset:0;opacity:.35}${p(LOGO_FADE_END)}{stroke-dashoffset:0;opacity:0}${p(LOGO_FADE_END + 0.05)},100%{stroke-dashoffset:1;opacity:0}}`;
    css += `@keyframes arcFill${i}{0%,${p(s + 1)}{opacity:0}${p(s + 2.3)}{opacity:1}${p(LOGO_HOLD_END)}{opacity:1}${p(LOGO_FADE_END)}{opacity:0}100%{opacity:0}}`;
  });
  LOGO_DOTS.forEach((_, k) => {
    const s = 2 + k * 0.17;
    css += `@keyframes dotRing${k}{0%,${p(s)}{stroke-dashoffset:1;opacity:0}${p(s + 0.04)}{opacity:1}${p(s + 0.55)}{stroke-dashoffset:0;opacity:1}${p(s + 0.9)}{stroke-dashoffset:0;opacity:0}100%{stroke-dashoffset:0;opacity:0}}`;
    css += `@keyframes dotFill${k}{0%,${p(s + 0.3)}{opacity:0;transform:scale(.2)}${p(s + 0.75)}{opacity:1;transform:scale(1.18)}${p(s + 0.95)}{opacity:1;transform:scale(1)}${p(LOGO_HOLD_END)}{opacity:1;transform:scale(1)}${p(LOGO_FADE_END)}{opacity:0;transform:scale(1)}100%{opacity:0;transform:scale(.2)}}`;
  });
  return css;
}

/** Sits behind the Header and the hero (starts at the very top of the page), so there is no hard edge under the Header. */
function HeroLogo() {
  const css = useMemo(logoCss, []);
  const D = LOGO_CYCLE;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[820px] overflow-hidden [-webkit-mask-image:linear-gradient(to_bottom,#000_70%,transparent)] [mask-image:linear-gradient(to_bottom,#000_70%,transparent)]">
      <style>{css}</style>
      <div className="absolute -right-[24%] top-0 h-[min(105vw,700px)] w-[min(105vw,700px)] sm:-right-[8%] lg:right-[1%] xl:right-[4%]">
        <div className="absolute inset-[6%] rounded-full bg-[radial-gradient(circle,rgba(30,120,255,0.42),transparent_68%)] blur-2xl" style={{ animation: "glowPulse 8s ease-in-out infinite" }} />
        <svg viewBox="-120 -120 240 240" className="relative h-full w-full opacity-55 sm:opacity-90 lg:opacity-100" style={{ filter: "drop-shadow(0 0 18px rgba(40,150,255,0.5))" }}>
          <defs>
            {LOGO_ARCS.map((a, i) => (
              <linearGradient key={i} id={`logoArc${i}`} gradientUnits="userSpaceOnUse" x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}>
                <stop offset="0" stopColor={a.c1} />
                <stop offset="1" stopColor={a.c2} />
              </linearGradient>
            ))}
            <filter id="logoGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.2" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <g className="logo-spin" style={{ transformOrigin: "0px 0px", animation: "logoSpin 90s linear infinite" }}>
            {LOGO_ARCS.map((a, i) => (
              <g key={i}>
                <path className="logo-part" d={a.d} fill={`url(#logoArc${i})`} style={{ animation: `arcFill${i} ${D}s linear infinite` }} />
                <path className="logo-part logo-line" d={a.d} fill="none" stroke="#8fe6ff" strokeWidth="1.3" strokeLinejoin="round" pathLength={1} strokeDasharray="1" filter="url(#logoGlow)" style={{ animation: `arcLine${i} ${D}s linear infinite` }} />
              </g>
            ))}
            {LOGO_DOTS.map((d, k) => (
              <g key={k}>
                <circle className="logo-part" cx={d.x} cy={d.y} r={d.r} fill={d.c} style={{ transformBox: "fill-box", transformOrigin: "center", animation: `dotFill${k} ${D}s linear infinite` }} />
                <circle className="logo-part logo-line" cx={d.x} cy={d.y} r={d.r + 1.6} fill="none" stroke="#a6ecff" strokeWidth="1.1" pathLength={1} strokeDasharray="1" filter="url(#logoGlow)" style={{ animation: `dotRing${k} ${D}s linear infinite` }} />
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}

/* ---------- action cards (same look as the cards on the other pages) ---------- */
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

/* =====================================================================
   PREVIEWS: static copies of the real pages (same cards, boxes, chips, logos and numbers)
===================================================================== */
const TOKEN_SRC = { USDC: "/usdc-logo.webp", EURC: "/eurc-logo.png", cirBTC: "/cirbtc-logo.jpg" } as const;
type Tok = keyof typeof TOKEN_SRC;

function TokenLogo({ sym, size = 36 }: { sym: Tok; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (!failed)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={TOKEN_SRC[sym]} alt={sym} onError={() => setFailed(true)} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full bg-[#2775CA] font-bold text-white" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {sym[0]}
    </span>
  );
}

/** Big token chip, like on the Swap, Bridge and Send pages. */
const Chip = ({ sym, caret = false }: { sym: Tok; caret?: boolean }) => (
  <span className="flex shrink-0 items-center gap-2.5 rounded-full bg-white/[0.07] py-1 pl-1 pr-3.5 text-base font-semibold sm:py-1.5 sm:pl-1.5 sm:pr-4 sm:text-[17px]">
    <TokenLogo sym={sym} />
    {sym}
    {caret && (
      <span className="-mr-1 text-slate-400">
        <Icon d="m6 9 6 6 6-6" size={14} />
      </span>
    )}
  </span>
);

/** Round network badge: Arc uses your logo file, others a colored letter. */
function NetBadge({ name, size = 30 }: { name: "Arc" | "Ethereum" | "Base"; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (name === "Arc" && !failed)
    return (
      <span className="relative inline-flex shrink-0 items-center justify-center rounded-full" style={{ width: size, height: size, background: "#101827", border: "1px solid rgba(255,255,255,0.12)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/arc-logo.png" alt="Arc" onError={() => setFailed(true)} className="rounded-full object-cover" style={{ width: Math.round(size * 0.74), height: Math.round(size * 0.74) }} />
      </span>
    );
  const color = name === "Ethereum" ? "#627EEA" : name === "Base" ? "#0052FF" : "#12b9ff";
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full font-bold text-white" style={{ width: size, height: size, background: color, fontSize: size * 0.45 }}>
      {name[0]}
    </span>
  );
}

const NetChip = ({ name }: { name: "Arc" | "Ethereum" | "Base" }) => (
  <span className="inline-flex items-center gap-2.5 rounded-full bg-white/[0.07] py-1 pl-1 pr-3 text-[15px] font-semibold sm:py-1.5 sm:pl-1.5 sm:pr-3.5 sm:text-base">
    <NetBadge name={name} />
    {name}
    <span className="text-slate-400"><Icon d="m6 9 6 6 6-6" size={14} /></span>
  </span>
);

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-10 rounded-full bg-[#1675ff]/10 blur-3xl" />
      <div aria-hidden className="relative rounded-[1.75rem] border border-white/[0.08] bg-[#050a16]/80 p-4 shadow-[0_30px_100px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:rounded-[2rem] sm:p-6" style={{ animation: "floatCard 7s ease-in-out infinite" }}>
        {children}
      </div>
    </div>
  );
}

const Box = ({ children }: { children: ReactNode }) => <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3.5 sm:p-4">{children}</div>;
const BoxLabel = ({ left, right }: { left: string; right?: string }) => (
  <div className="flex items-center justify-between gap-3 text-[13px] font-medium text-slate-400">
    <span>{left}</span>
    {right && <span className="text-xs tabular-nums">{right}</span>}
  </div>
);
const Amount = ({ children, dim = false }: { children: ReactNode; dim?: boolean }) => (
  <span className={`min-w-0 truncate tabular-nums tracking-tight ${dim ? "text-slate-700" : "text-white"}`} style={{ ...NUM, fontSize: "1.75rem", fontWeight: 600, lineHeight: 1.1 }}>
    {children}
  </span>
);
const PillBtn = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center rounded-full bg-white/[0.07] px-2 py-[2px] text-[9px] font-medium text-[#8fd4ff] sm:px-2.5 sm:py-[3px] sm:text-[11px]">{children}</span>
);
const MainBtn = ({ children }: { children: ReactNode }) => (
  <div className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_40px_rgba(30,120,255,0.28)]">{children}</div>
);
const Flip = () => (
  <div className="relative z-10 -my-3 flex justify-center">
    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] bg-[#071025] text-[#55c5ff] shadow-lg sm:h-10 sm:w-10">
      <Icon d="M7 4v13m0 0-3-3m3 3 3-3M17 20V7m0 0-3 3m3-3 3 3" size={18} />
    </span>
  </div>
);
const IconDot = ({ d, glow = false }: { d: string; glow?: boolean }) => (
  <span className={`flex h-9 w-9 items-center justify-center rounded-full ${glow ? "text-[#39c4ff]" : "text-slate-400"}`} style={glow ? { filter: "drop-shadow(0 0 6px rgba(57,196,255,0.9)) drop-shadow(0 0 14px rgba(22,136,245,0.6))" } : undefined}>
    <Icon d={d} size={20} />
  </span>
);
const Rows = ({ rows }: { rows: [string, string][] }) => (
  <dl className="mt-4 space-y-2 px-1 text-[13px] sm:text-sm">
    {rows.map(([k, v]) => (
      <div key={k} className="flex justify-between gap-4">
        <dt className="text-slate-500">{k}</dt>
        <dd className="text-right tabular-nums text-slate-300">{v}</dd>
      </div>
    ))}
  </dl>
);

function Preview({ kind }: { kind: "send" | "swap" | "bridge" | "activity" }) {
  /* ---- Send page ---- */
  if (kind === "send")
    return (
      <Shell>
        <div className="space-y-3">
          <Box>
            <div className="flex items-center justify-between gap-3 text-[13px] font-medium text-slate-400">
              <span>Recipient</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3 py-1 text-xs font-medium text-[#8fd4ff]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></svg>
                Paste
              </span>
            </div>
            <p className="mt-3 text-base font-bold tracking-tight" style={NUM}>0x7a3c…f91d</p>
          </Box>
          <Box>
            <BoxLabel left="Amount" right="" />
            <div className="mt-3 flex items-center justify-between gap-3">
              <Amount>25</Amount>
              <Chip sym="USDC" />
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-sm text-slate-500">$25.00</span>
              <span className="flex gap-1.5"><PillBtn>50%</PillBtn><PillBtn>Max</PillBtn></span>
            </div>
          </Box>
        </div>
        <MainBtn>Send USDC</MainBtn>
      </Shell>
    );

  /* ---- Swap page ---- */
  if (kind === "swap")
    return (
      <Shell>
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div>
            <p className="text-xs text-slate-500">Network</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-medium"><NetBadge name="Arc" size={20} />Arc Mainnet</p>
          </div>
          <div className="flex items-center gap-1"><IconDot d={ICON_ACTIVITY} /><IconDot d={ICON_CHART} /><IconDot d={ICON_SETTINGS} /></div>
        </div>
        <div className="mt-4">
          <Box>
            <BoxLabel left="You pay" right="Balance 240.50" />
            <div className="mt-2 flex items-center justify-between gap-3">
              <Amount>100.00</Amount>
              <Chip sym="USDC" caret />
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-sm text-slate-500">$100.00</span>
              <span className="flex gap-1.5"><PillBtn>50%</PillBtn><PillBtn>Max</PillBtn></span>
            </div>
          </Box>
          <Flip />
          <Box>
            <BoxLabel left="You receive" right="Balance 18.20" />
            <div className="mt-2 flex items-center justify-between gap-3">
              <Amount>86.41</Amount>
              <Chip sym="EURC" caret />
            </div>
            <div className="mt-1.5"><span className="text-sm text-slate-500">$99.80</span></div>
          </Box>
        </div>
        <Rows rows={[["Rate", "1 USDC ≈ 0.8641 EURC"], ["Minimum received", "85.97 EURC"], ["Slippage", "0.5% (Auto)"]]} />
        <MainBtn>Swap</MainBtn>
      </Shell>
    );

  /* ---- Bridge page ---- */
  if (kind === "bridge")
    return (
      <Shell>
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
          <div>
            <p className="text-xs text-slate-500">Route</p>
            <p className="mt-1.5 flex items-center gap-2 text-sm font-medium"><NetBadge name="Ethereum" size={20} />Ethereum <span className="text-slate-500">to</span> <NetBadge name="Arc" size={20} />Arc</p>
          </div>
          <div className="flex items-center gap-1"><IconDot d={ICON_ACTIVITY} /><IconDot d={ICON_SETTINGS} /><IconDot d={ICON_FAST} glow /></div>
        </div>
        <div className="mt-4">
          <Box>
            <BoxLabel left="From" right="Balance 500.00 USDC" />
            <div className="mt-2.5"><NetChip name="Ethereum" /></div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <Amount>100</Amount>
              <Chip sym="USDC" />
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-sm text-slate-500">$100.00</span>
              <span className="flex gap-1.5"><PillBtn>50%</PillBtn><PillBtn>Max</PillBtn></span>
            </div>
          </Box>
          <Flip />
          <Box>
            <BoxLabel left="To" right="Balance 12.00 USDC" />
            <div className="mt-2.5"><NetChip name="Arc" /></div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <Amount>99.78</Amount>
              <Chip sym="USDC" />
            </div>
          </Box>
        </div>
        <Rows rows={[["Slippage", "0.5% (Auto)"], ["Gas fee", "0.00021 ETH ($0.74)"], ["Estimated time", "~20 sec"], ["Fast transfer", "On · fee 0.02 USDC"]]} />
        <MainBtn>Bridge</MainBtn>
      </Shell>
    );

  /* ---- Activity page ---- */
  const feed: { icon: string; tint: string; title: string; sub: string; legs: { v: string; sym: Tok; in: boolean }[] }[] = [
    { icon: ICON_SWAP, tint: "text-[#7dd3fc]", title: "Swapped USDC for EURC", sub: "2:14 PM", legs: [{ v: "+86.41", sym: "EURC", in: true }, { v: "−100.00", sym: "USDC", in: false }] },
    { icon: ICON_UP_RIGHT, tint: "text-slate-200", title: "Sent USDC", sub: "To 0x7a3c…f91d · 11:02 AM", legs: [{ v: "−25.00", sym: "USDC", in: false }] },
    { icon: ICON_BRIDGE, tint: "text-[#8fb4ff]", title: "Bridge in", sub: "USDC delivered to Arc · Yesterday", legs: [{ v: "+99.78", sym: "USDC", in: true }] },
    { icon: ICON_RECEIVE, tint: "text-emerald-300", title: "Received EURC", sub: "From 0x91be…02a7 · Yesterday", legs: [{ v: "+40.00", sym: "EURC", in: true }] },
  ];
  return (
    <Shell>
      <div className="flex gap-2 overflow-hidden pb-3">
        {["All", "Sent", "Received", "Swaps", "Bridges"].map((f, i) => (
          <span key={f} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${i === 0 ? "bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] text-white" : "bg-white/[0.05] text-slate-400"}`}>{f}</span>
        ))}
      </div>
      <p className="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Today</p>
      <div>
        {feed.map((r) => (
          <div key={r.title} className="flex items-center gap-3.5 rounded-2xl px-2 py-3">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] ${r.tint}`}><Icon d={r.icon} /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold">{r.title}</span>
              <span className="mt-0.5 block truncate text-xs text-slate-500">{r.sub}</span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-0.5">
              {r.legs.map((l) => (
                <span key={l.v + l.sym} className={`flex items-center gap-1.5 text-sm font-semibold tabular-nums ${l.in ? "text-emerald-300" : "text-slate-100"}`}>
                  {l.v}
                  <TokenLogo sym={l.sym} size={16} />
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </Shell>
  );
}

const SHOWCASE: { kind: "send" | "swap" | "bridge" | "activity"; label: string; pre: string; hi: string; post: string; text: string }[] = [
  { kind: "send", label: "Send", pre: "Send ", hi: "USDC", post: " in seconds.", text: "Paste an address, enter an amount, and send. Fees are paid in USDC, so there is no second token to hold." },
  { kind: "swap", label: "Swap", pre: "Swap ", hi: "tokens", post: " with clear pricing.", text: "Swap USDC, EURC and cirBTC on Arc. See the rate, the minimum you receive, and the market price before you confirm." },
  { kind: "bridge", label: "Bridge", pre: "Bridge ", hi: "USDC", post: " to and from Arc.", text: "Move USDC between Arc and other networks with Circle's CCTP. Turn on Fast transfer, and send to your own address or another one." },
  { kind: "activity", label: "Activity", pre: "Every ", hi: "move", post: ", in one list.", text: "See everything this wallet has done on Arc: sends, swaps and bridges, newest first." },
];

/* ---------- page ---------- */
export default function Home() {
  const [walletMsg, setWalletMsg] = useState("");

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
        @keyframes glowPulse{0%,100%{opacity:.65}50%{opacity:1}}
        @keyframes logoSpin{to{transform:rotate(360deg)}}
        @keyframes floatCard{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
        .reveal{opacity:0;transform:translateY(34px);transition:opacity .9s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1);transition-delay:var(--delay,0ms)}
        .reveal-visible{opacity:1;transform:none}
        @media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important}.reveal{opacity:1;transform:none;transition:none}.logo-part{animation:none!important}.logo-line{display:none}.logo-spin{animation:none!important}}
      `}</style>

      <SpaceBackground />
      <HeroLogo />

      <div className="relative z-10">
        <Header />

        {/* ---------------- HERO ---------------- */}
        <section className="relative min-h-[440px] sm:min-h-[480px] lg:min-h-[540px]">
          <div className={`relative flex min-h-[440px] items-center sm:min-h-[480px] lg:min-h-[540px] ${CONTAINER}`}>
            <div className="relative z-10 w-full max-w-[950px] py-10 sm:py-12 lg:py-14 xl:max-w-none">
              <Reveal>
                <h1 className="text-[2.75rem] font-bold leading-[1.02] tracking-[-0.035em] sm:text-[3.5rem] md:text-7xl lg:text-[5.8rem] xl:whitespace-nowrap xl:text-[clamp(4.5rem,5.6vw,10rem)]">
                  One place.{" "}
                  <br className="xl:hidden" />
                  <span className={GRAD}>Every move.</span>
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
        <section className={`pb-24 pt-12 lg:pb-32 ${CONTAINER}`}>
          <Reveal>
            <p className={EYEBROW}>Everything in one place</p>
            <h2 className={H2}>Move through <span className={GRAD}>Arc.</span></h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">A focused interface for the actions you use most onchain.</p>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ACTIONS.map((a, i) => (
              <Reveal key={a.title} delay={i * 90} className="h-full [&>a]:h-full"><ActionCard {...a} /></Reveal>
            ))}
          </div>
        </section>

        {/* ---------------- SHOWCASE: one block per AlabaamaFi page, with a copy of the real page ---------------- */}
        <section className={`pb-10 lg:pb-16 ${CONTAINER}`}>
          {SHOWCASE.map((item, i) => (
            <div key={item.kind} className="grid items-center gap-10 py-12 lg:grid-cols-2 lg:gap-20 lg:py-20">
              <Reveal className={i % 2 ? "lg:order-2" : ""}>
                <p className={EYEBROW}>{`0${i + 1} · ${item.label}`}</p>
                <h2 className={H2}>{item.pre}<span className={GRAD}>{item.hi}</span>{item.post}</h2>
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
    </main>
  );
}
