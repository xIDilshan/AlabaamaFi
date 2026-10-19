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
};

const SOCIAL = {
  x: "https://x.com/Alabaama_Fi",
  discord: "https://discord.gg/NBKHmUfw",
  github: "https://github.com/xIDilshan/AlabaamaFi", // change this to your real GitHub page
};

/* footer sizes you can adjust (pixels). Text below 12px is drawn at 12px and scaled, so it really gets smaller on every phone. */
const FOOTER_LINK_TEXT_PX = 11; // the words Docs and FAQ
const FOOTER_SOCIAL_PX = 20; // Discord and GitHub (X is 2px smaller)

/* the fine "matte" grain laid over the frosted glass behind the page sections */
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

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

const STEPS = [
  { n: "01", title: "Connect your wallet", text: "Use Connect Wallet in the header to link any EVM wallet." },
  { n: "02", title: "Switch to Arc", text: "Add Arc Mainnet to your wallet with one click." },
  { n: "03", title: "Make your move", text: "Send, swap, bridge, and track everything in one place." },
];

/* ---------- helpers ---------- */
function Icon({ d, size = 22, sw = 1.7 }: { d: string; size?: number; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function XLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function DiscordLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  );
}

function GitHubLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12Z" />
    </svg>
  );
}

function Reveal({ children, delay = 0, className = "", from = "bottom" }: { children: ReactNode; delay?: number; className?: string; from?: "bottom" | "right" | "left" }) {
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
    <div ref={ref} className={`reveal ${from === "right" ? "reveal-right" : from === "left" ? "reveal-left" : ""} ${visible ? "reveal-visible" : ""} ${className}`} style={{ "--delay": `${delay}ms` } as CSSProperties}>
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
  { d: "M34.8 -89.3C31.9 -89.7 22.5 -90.6 16.8 -90.4C11.2 -90.3 6.2 -89.5 1.0 -88.3C-4.2 -87.1 -9.5 -85.5 -14.6 -83.3C-19.6 -81.1 -24.8 -78.3 -29.4 -75.0C-34.0 -71.8 -38.4 -68.1 -42.3 -63.9C-46.1 -59.7 -50.3 -53.3 -52.5 -49.8C-54.8 -46.2 -55.1 -44.5 -55.8 -42.3C-56.6 -40.2 -56.9 -38.3 -57.1 -36.8C-57.3 -35.2 -57.3 -34.2 -57.0 -32.9C-56.6 -31.6 -56.2 -30.1 -55.2 -28.9C-54.3 -27.7 -52.5 -26.4 -51.4 -25.9C-50.3 -25.4 -49.5 -25.6 -48.5 -25.8C-47.6 -25.9 -46.6 -26.3 -45.8 -26.9C-45.0 -27.5 -44.6 -27.5 -43.7 -29.5C-42.7 -31.5 -41.7 -35.8 -40.1 -39.0C-38.5 -42.3 -36.7 -45.8 -34.1 -49.2C-31.6 -52.6 -27.8 -56.7 -24.8 -59.6C-21.9 -62.5 -20.2 -63.9 -16.4 -66.5C-12.6 -69.0 -6.0 -72.7 -1.9 -74.7C2.3 -76.8 4.5 -77.6 8.7 -78.9C12.9 -80.2 18.8 -81.7 23.3 -82.4C27.8 -83.2 33.6 -83.0 35.7 -83.6C37.8 -84.2 36.1 -85.3 36.0 -86.0C35.8 -86.7 34.9 -87.2 34.7 -87.7C34.5 -88.3 37.8 -88.8 34.8 -89.3Z", x1: 27.7, y1: -99.4, x2: -60.8, y2: -36.8, c1: "#003294", cm: "#0076ff", c2: "#26bcff" },
  { d: "M27.0 -55.6C26.0 -55.1 25.3 -54.6 24.7 -53.8C24.1 -52.9 23.6 -51.8 23.4 -50.8C23.3 -49.7 23.5 -48.6 23.8 -47.6C24.2 -46.7 22.8 -46.4 25.7 -45.0C28.6 -43.7 37.2 -41.1 41.3 -39.3C45.3 -37.5 46.8 -36.4 49.8 -34.2C52.8 -32.0 56.1 -29.4 59.2 -26.1C62.4 -22.7 66.0 -18.6 68.9 -14.2C71.9 -9.9 74.7 -4.2 76.7 0.1C78.6 4.3 79.1 4.4 80.8 11.2C82.5 18.0 85.3 35.7 86.8 40.6C88.3 45.5 89.3 40.3 89.8 40.5C90.3 40.6 89.7 41.4 89.9 41.6C90.1 41.8 90.9 41.9 90.9 41.6C91.0 41.3 90.1 40.0 90.2 39.6C90.3 39.2 91.0 42.1 91.4 39.3C91.7 36.6 92.4 28.7 92.2 23.2C92.0 17.7 91.4 12.2 90.2 6.5C89.0 0.8 87.3 -5.3 85.1 -10.8C82.9 -16.3 80.1 -21.5 76.9 -26.3C73.8 -31.1 70.4 -35.5 66.2 -39.6C62.1 -43.7 55.7 -48.2 52.0 -50.8C48.2 -53.3 46.2 -53.8 43.7 -54.7C41.1 -55.7 38.9 -56.4 36.7 -56.7C34.5 -57.1 32.2 -57.1 30.5 -56.9C28.9 -56.7 28.0 -56.1 27.0 -55.6Z", x1: 35.4, y1: -61.7, x2: 103.1, y2: 32.9, c1: "#29bbff", cm: "#006bff", c2: "#003090" },
  { d: "M-88.5 -39.2C-89.0 -39.0 -88.3 -38.5 -88.6 -38.2C-89.0 -37.9 -89.9 -39.3 -90.4 -37.6C-90.8 -36.0 -91.4 -33.1 -91.4 -28.3C-91.3 -23.6 -91.1 -15.3 -90.2 -9.4C-89.3 -3.4 -87.9 1.8 -85.8 7.3C-83.7 12.9 -80.7 19.1 -77.8 23.9C-74.9 28.8 -71.0 33.3 -68.2 36.5C-65.4 39.7 -63.6 41.1 -61.1 43.2C-58.6 45.2 -55.5 47.3 -53.0 48.9C-50.4 50.5 -48.4 51.5 -45.7 52.6C-42.9 53.7 -39.0 55.0 -36.5 55.5C-34.1 56.0 -32.5 55.8 -30.8 55.6C-29.2 55.4 -27.7 54.7 -26.7 54.2C-25.6 53.6 -25.1 53.0 -24.6 52.2C-24.0 51.4 -23.5 50.4 -23.4 49.5C-23.3 48.5 -23.6 47.2 -24.0 46.3C-24.4 45.4 -23.2 45.2 -26.0 43.9C-28.8 42.6 -36.4 40.6 -40.7 38.8C-44.9 36.9 -47.8 35.3 -51.4 32.6C-55.0 29.9 -59.4 26.0 -62.4 22.8C-65.4 19.6 -67.2 17.1 -69.5 13.5C-71.8 9.8 -74.5 5.0 -76.4 0.9C-78.3 -3.2 -79.6 -6.9 -80.9 -11.2C-82.2 -15.5 -83.5 -20.4 -84.2 -25.1C-85.0 -29.7 -84.8 -36.7 -85.5 -39.0C-86.2 -41.4 -88.0 -39.3 -88.5 -39.2Z", x1: -101.6, y1: -29.5, x2: -35.0, y2: 60.3, c1: "#002e8d", cm: "#0063fc", c2: "#009dff" },
  { d: "M56.2 28.9C55.3 27.6 53.1 25.9 52.0 25.3C50.8 24.7 50.4 25.1 49.5 25.3C48.7 25.6 47.5 26.0 46.7 26.8C45.8 27.5 45.7 27.5 44.5 29.9C43.4 32.3 42.0 37.2 40.0 40.9C37.9 44.6 35.1 48.7 32.3 52.0C29.5 55.4 26.7 58.0 23.1 60.9C19.5 63.8 14.7 66.9 10.6 69.3C6.4 71.7 2.8 73.3 -1.7 75.0C-6.2 76.7 -11.8 78.4 -16.3 79.6C-20.7 80.7 -23.4 81.3 -28.3 81.9C-33.1 82.4 -42.5 82.0 -45.4 82.7C-48.3 83.4 -45.7 85.4 -45.5 86.0C-45.3 86.6 -44.5 86.0 -44.3 86.3C-44.0 86.5 -44.4 87.4 -44.1 87.4C-43.8 87.5 -42.8 86.6 -42.4 86.7C-42.0 86.8 -43.2 87.6 -41.5 88.0C-39.8 88.4 -37.1 89.1 -32.3 89.3C-27.4 89.4 -18.3 89.5 -12.3 88.9C-6.2 88.2 -1.7 87.3 4.1 85.4C10.0 83.6 17.3 80.4 22.7 77.6C28.1 74.7 32.9 70.9 36.3 68.3C39.6 65.7 40.7 64.4 43.0 62.0C45.2 59.6 47.9 56.5 49.8 53.7C51.8 51.0 53.4 48.1 54.7 45.6C55.9 43.2 56.7 41.1 57.2 39.0C57.8 37.0 58.0 34.9 57.8 33.2C57.6 31.5 57.2 30.2 56.2 28.9Z", x1: 61.9, y1: 37.9, x2: -37.0, y2: 99.6, c1: "#17b0ff", cm: "#006bff", c2: "#003195" },
];

const LOGO_DOTS = [
  { x: 2.0, y: -60.9, r: 8.5, c: "#0085ff" },
  { x: 27.3, y: -69.3, r: 8.3, c: "#005beb" },
  { x: 54.7, y: -68.6, r: 8.2, c: "#0043be" },
  { x: 43.3, y: -21.0, r: 8.5, c: "#009cff" },
  { x: 61.9, y: 1.2, r: 8.5, c: "#007fff" },
  { x: 70.9, y: 29.4, r: 8.3, c: "#0057e4" },
  { x: 70.6, y: 56.7, r: 8.2, c: "#00359f" },
  { x: 22.1, y: 42.6, r: 8.5, c: "#0091ff" },
  { x: 0.4, y: 59.3, r: 8.4, c: "#0077ff" },
  { x: -28.4, y: 67.9, r: 8.3, c: "#0058e6" },
  { x: -57.9, y: 67.4, r: 8.2, c: "#0038a4" },
  { x: -42.6, y: 21.7, r: 8.5, c: "#0095ff" },
  { x: -61.3, y: -0.2, r: 8.4, c: "#007dff" },
  { x: -70.9, y: -28.0, r: 8.3, c: "#004ed3" },
  { x: -69.5, y: -55.6, r: 8.1, c: "#00339a" },
  { x: -20.6, y: -42.9, r: 8.5, c: "#009bff" },
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
      <div className="absolute left-1/2 -top-[2%] h-[min(120vw,860px)] w-[min(120vw,860px)] -translate-x-1/2">
        <div className="absolute inset-[6%] rounded-full bg-[radial-gradient(circle,rgba(30,120,255,0.42),transparent_68%)] blur-2xl" style={{ animation: "glowPulse 8s ease-in-out infinite" }} />
        <svg viewBox="-120 -120 240 240" className="relative h-full w-full opacity-30 sm:opacity-40 lg:opacity-50" style={{ filter: "drop-shadow(0 0 18px rgba(40,150,255,0.5))" }}>
          <defs>
            {LOGO_ARCS.map((a, i) => (
              <linearGradient key={i} id={`logoArc${i}`} gradientUnits="userSpaceOnUse" x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}>
                <stop offset="0" stopColor={a.c1} />
                <stop offset="0.5" stopColor={a.cm} />
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

/* ---------- "Move through Arc" cards: frosted glass, different sizes, a small picture of what each page does ---------- */
function BentoCard({ href, title, text, icon, className = "", children }: { href: string; title: string; text: string; icon: string; className?: string; children?: ReactNode }) {
  return (
    <Link
      href={href}
      className={`group relative flex min-h-[15rem] flex-col overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-white/[0.035] p-6 backdrop-blur-xl transition duration-500 hover:-translate-y-1.5 hover:border-[#2588ff]/50 hover:bg-white/[0.055] hover:shadow-[0_30px_90px_rgba(16,93,255,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#39c4ff] sm:p-7 ${className}`}
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#39c4ff] to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
      <div aria-hidden className="pointer-events-none absolute -bottom-12 -right-12 text-[#2588ff]/[0.06] transition duration-500 group-hover:scale-110 group-hover:text-[#2588ff]/[0.12]">
        <Icon d={icon} size={200} />
      </div>
      <div className="relative flex items-start justify-between">
        {/* the icon is drawn as a glowing line, with no box around it */}
        <div className="text-[#62d4ff] transition duration-500 group-hover:scale-110" style={{ filter: "drop-shadow(0 0 5px rgba(57,196,255,0.95)) drop-shadow(0 0 16px rgba(22,136,245,0.7))" }}>
          <Icon d={icon} size={38} sw={1.5} />
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-400 transition duration-300 group-hover:border-[#2588ff]/60 group-hover:bg-[#2588ff]/20 group-hover:text-white">
          <Icon d={ICON_UP_RIGHT} size={16} sw={2} />
        </span>
      </div>
      <h3 className="relative mt-6 text-2xl font-semibold tracking-tight">{title}</h3>
      <p className="relative mt-2 max-w-sm text-sm leading-6 text-slate-400">{text}</p>
      <div className="relative mt-auto pt-6">{children}</div>
    </Link>
  );
}

const MiniChip = ({ sym }: { sym: Tok }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] py-1 pl-1 pr-2.5 text-sm font-semibold">
    <TokenLogo sym={sym} size={22} />
    {sym}
  </span>
);
const MiniNet = ({ name }: { name: "Arc" | "Ethereum" | "Base" }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] py-1 pl-1 pr-2.5 text-sm font-semibold">
    <NetBadge name={name} size={22} />
    {name}
  </span>
);

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

/** Round network badge: Arc uses your logo file, Ethereum is drawn here, others a colored letter. */
function NetBadge({ name, size = 30 }: { name: "Arc" | "Ethereum" | "Base"; size?: number }) {
  const [failed, setFailed] = useState(false);
  const badge = { width: size, height: size, background: "#101827", border: "1px solid rgba(255,255,255,0.12)" } as CSSProperties;
  if (name === "Arc" && !failed)
    return (
      <span className="relative inline-flex shrink-0 items-center justify-center rounded-full" style={badge}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/arc-logo.png" alt="Arc" onError={() => setFailed(true)} className="rounded-full object-cover" style={{ width: Math.round(size * 0.74), height: Math.round(size * 0.74) }} />
      </span>
    );
  if (name === "Ethereum")
    return (
      <span className="relative inline-flex shrink-0 items-center justify-center rounded-full" style={badge} aria-label="Ethereum">
        <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#8fa2f5" d="M12.056 0 4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
          <path fill="#627eea" d="M11.944 17.97 4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003z" />
        </svg>
      </span>
    );
  const color = name === "Base" ? "#0052FF" : "#12b9ff";
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

/* ---------- Arc network details: everything a wallet asks for when you add a custom network ---------- */
const NETWORK_FIELDS: [string, string][] = [
  ["Network name", "Arc Mainnet"],
  ["RPC URL", ARC.rpc],
  ["Chain ID", String(ARC.chainId)],
  ["Currency symbol", "USDC"],
  ["Block explorer URL", ARC.explorer],
];

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard not available */
    }
  };
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="min-w-0 flex-1 text-left">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-600">{label}</p>
        <p className="mt-1 break-all font-medium tabular-nums text-slate-100">{value}</p>
      </div>
      <button
        onClick={copy}
        aria-label={copied ? `${label} copied` : `Copy ${label}`}
        title={copied ? "Copied" : "Copy"}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:bg-white/[0.08] ${copied ? "text-emerald-300" : "text-slate-400 hover:text-[#8fd4ff]"}`}
      >
        <Icon d={copied ? "m5 12.5 4.5 4.5L19 7.5" : "M9 9h10v10H9zM5 15V5h10"} size={18} sw={copied ? 2.2 : 1.8} />
      </button>
    </div>
  );
}

function NetworkDetails() {
  return (
    <div className="mx-auto w-full max-w-xl text-left">
      <p className="text-xs text-slate-500">Add it as a custom network</p>
      <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
        <NetBadge name="Arc" size={26} />
        Arc network details
      </p>
      <div className="mt-5 divide-y divide-white/[0.12] border-y border-white/[0.12]">
        {NETWORK_FIELDS.map(([k, v]) => (
          <CopyRow key={k} label={k} value={v} />
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">Gas is paid in USDC. Finality takes under 1 second.</p>
    </div>
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
        .reveal-right{transform:translateX(70px)}
        .reveal-left{transform:translateX(-70px)}
        .reveal-visible{opacity:1;transform:none}
        @media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important}.reveal{opacity:1;transform:none;transition:none}.logo-part{animation:none!important}.logo-line{display:none}.logo-spin{animation:none!important}}
      `}</style>

      <SpaceBackground />
      <HeroLogo />

      <div className="relative z-10">
        <Header />

        {/* ---------------- HERO: centered, the logo draws itself behind the headline ---------------- */}
        <section className="relative">
          <div className={`relative flex flex-col items-center pb-16 pt-10 text-center sm:pt-14 lg:pb-24 lg:pt-20 ${CONTAINER}`}>
            <Reveal>
              <span className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-slate-300 backdrop-blur-xl sm:text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Live on Arc Mainnet
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-7 text-[2.9rem] font-bold leading-[1.02] tracking-[-0.04em] sm:text-[4rem] md:text-[5rem] lg:text-[6.2rem] xl:text-[clamp(5rem,6vw,9rem)]">
                One place.
                <br className="sm:hidden" /> <span className={GRAD}>Every move.</span>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">A simple interface for Arc. Send, swap, bridge, and explore assets on Arc Mainnet in one place.</p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Link href="/swap" className={BUTTON}>Start swapping</Link>
                <Link href="/bridge" className={SECONDARY_BUTTON}>Bridge to Arc</Link>
              </div>
            </Reveal>

            <Reveal delay={340} className="mt-14 w-full max-w-3xl">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Under 1 sec", "Final settlement"],
                  ["USDC", "The gas token"],
                  ["EVM", "Wallets you already use"],
                ].map(([v, l]) => (
                  <div key={l} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 backdrop-blur-xl">
                    <p className="text-2xl font-semibold tracking-tight" style={NUM}>{v}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{l}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------------- MOVE THROUGH ARC ---------------- */}
        <section className={`pb-24 pt-6 lg:pb-32 ${CONTAINER}`}>
          <Reveal className="text-center">
            <p className={EYEBROW}>Everything in one place</p>
            <h2 className={H2}>Move through <span className={GRAD}>Arc.</span></h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-500">A focused interface for the actions you use most onchain.</p>
          </Reveal>

          <div className="mx-auto mt-12 grid max-w-7xl gap-4 md:grid-cols-2 lg:grid-cols-12">
            <Reveal className="h-full lg:col-span-5 [&>a]:h-full">
              <BentoCard href="/send" title="Send" text="Move USDC directly to any wallet." icon={ICON_SEND}>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="rounded-full bg-white/[0.07] px-3.5 py-1.5 text-sm font-semibold tabular-nums" style={NUM}>25.00</span>
                  <MiniChip sym="USDC" />
                  <span className="text-sm text-slate-500">to</span>
                  <span className="text-sm tabular-nums text-slate-300" style={NUM}>0x7a3c…f91d</span>
                </div>
              </BentoCard>
            </Reveal>
            <Reveal delay={90} className="h-full lg:col-span-7 [&>a]:h-full">
              <BentoCard href="/swap" title="Swap" text="Exchange USDC, EURC and cirBTC on Arc." icon={ICON_SWAP}>
                <div className="flex flex-wrap items-center gap-2">
                  <MiniChip sym="USDC" />
                  <span className="text-[#55c5ff]"><Icon d={ICON_SWAP} size={16} /></span>
                  <MiniChip sym="EURC" />
                  <MiniChip sym="cirBTC" />
                </div>
              </BentoCard>
            </Reveal>
            <Reveal delay={180} className="h-full lg:col-span-7 [&>a]:h-full">
              <BentoCard href="/bridge" title="Bridge" text="Move USDC between Arc and other networks." icon={ICON_BRIDGE}>
                <div className="flex flex-wrap items-center gap-2.5">
                  <MiniNet name="Ethereum" />
                  <span className="text-sm text-slate-500">to</span>
                  <MiniNet name="Arc" />
                  <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-[#159fff]/10 px-2.5 py-1 text-xs font-semibold text-[#7dd3fc]"><Icon d={ICON_FAST} size={12} sw={2} />Fast</span>
                </div>
              </BentoCard>
            </Reveal>
            <Reveal delay={270} className="h-full lg:col-span-5 [&>a]:h-full">
              <BentoCard href="/activity" title="Activity" text="Follow everything your wallet does on Arc." icon={ICON_ACTIVITY}>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3"><span className="truncate text-slate-400">Swapped USDC for EURC</span><span className="shrink-0 tabular-nums text-emerald-300">+86.41</span></div>
                  <div className="flex items-center justify-between gap-3"><span className="truncate text-slate-400">Sent USDC</span><span className="shrink-0 tabular-nums text-slate-200">−25.00</span></div>
                </div>
              </BentoCard>
            </Reveal>
          </div>
        </section>

        {/* ---------------- SHOWCASE: one block per AlabaamaFi page, on frosted "matte" glass (the stars behind are blurred) ---------------- */}
        <section className="px-3 pb-10 sm:px-6 lg:px-10 lg:pb-16">
          <div className="relative mx-auto max-w-[100rem] overflow-hidden rounded-[2rem] border border-white/[0.07] bg-[#050a16]/45 backdrop-blur-2xl sm:rounded-[2.5rem]" style={{ WebkitBackdropFilter: "blur(32px)", backdropFilter: "blur(32px)" }}>
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02]" />
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.1] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
            <div className="relative px-4 sm:px-8 lg:px-14">
              {SHOWCASE.map((item, i) => (
                <div key={item.kind} className={`grid items-center gap-10 py-12 lg:grid-cols-2 lg:gap-20 lg:py-20 ${i > 0 ? "border-t border-white/[0.06]" : ""}`}>
                  <Reveal className={`${i % 2 ? "lg:order-2" : ""} text-center lg:text-left`}>
                    <p className={EYEBROW}>{`0${i + 1} · ${item.label}`}</p>
                    <h2 className={H2}>{item.pre}<span className={GRAD}>{item.hi}</span>{item.post}</h2>
                    <p className="mx-auto mt-5 max-w-md text-base leading-7 text-slate-400 sm:text-lg lg:mx-0">{item.text}</p>
                  </Reveal>
                  <Reveal delay={120} className={i % 2 ? "lg:order-1" : ""}>
                    <Preview kind={item.kind} />
                  </Reveal>
                </div>
              ))}
            </div>
          </div>
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
            <Reveal className="text-center lg:text-left">
              <p className={EYEBROW}>The network</p>
              <h2 className={H2}>Why Arc?</h2>
              <p className="mx-auto mt-5 max-w-md leading-7 text-slate-400 lg:mx-0">Arc is a USDC-native, EVM-compatible Layer 1 designed around modern onchain finance and payments.</p>
              <div className="mt-8 flex justify-center lg:justify-start">
                <a href={ARC.docs} target="_blank" rel="noreferrer" className={SECONDARY_BUTTON}>Read Arc documentation</a>
              </div>
            </Reveal>
            <div className="grid gap-x-10 gap-y-12 text-center sm:grid-cols-2 sm:text-left">
              {FEATURES.map((f, i) => (
                <Reveal key={f.number} delay={i * 100}>
                  <span className="text-xs tracking-[0.2em] text-[#2588ff]">{f.number}</span>
                  <h3 className="mt-3 text-xl font-semibold">{f.title}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500 sm:mx-0">{f.text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- WALLET SETUP: text comes in from the right, the network details from the left ---------------- */}
        <section className={`pb-28 lg:pb-40 ${CONTAINER}`}>
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <Reveal from="left" delay={100} className="order-2 lg:order-1">
              <NetworkDetails />
            </Reveal>
            <Reveal from="right" className="order-1 text-center lg:order-2 lg:text-left">
              <p className={EYEBROW}>Wallet setup</p>
              <h2 className={H2}>Add Arc to your wallet.</h2>
              <p className="mx-auto mt-5 max-w-md leading-7 text-slate-400 lg:mx-0">Add Arc Mainnet to any EVM wallet in one click. If your wallet asks for the details, copy them from the card.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                <button onClick={addArcToWallet} className={BUTTON}>Add Arc Mainnet</button>
                <a href={ARC.explorer} target="_blank" rel="noreferrer" className={SECONDARY_BUTTON}>Explorer</a>
              </div>
              <p role="status" className="mt-4 min-h-5 text-sm text-slate-500">{walletMsg}</p>
            </Reveal>
          </div>
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

        {/* ---------------- FOOTER (same as the FAQ page) ---------------- */}
        <footer className="border-t border-white/[0.07] bg-[#05080f]/90 backdrop-blur-xl">
          {/* wide screens: copyright on the left, social icons in the center, "Docs | FAQ" on the right.
              Phones: icons, then "Docs | FAQ", then the copyright, all centered. */}
          <div className="grid w-full grid-cols-1 items-center justify-items-center gap-5 px-4 py-8 sm:grid-cols-[1fr_auto_1fr] sm:gap-6 sm:px-6 lg:px-10 2xl:px-16">
            <p className="order-3 text-center text-xs leading-5 text-slate-500 sm:order-1 sm:justify-self-start sm:text-left">© {new Date().getFullYear()} AlabaamaFi. A simple interface for Arc.</p>

            <div className="order-1 flex items-center gap-1 sm:order-2">
              <a href={SOCIAL.discord} target="_blank" rel="noreferrer" aria-label="AlabaamaFi on Discord" title="Discord" className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/[0.07] hover:text-[#7dd3fc]"><DiscordLogo size={FOOTER_SOCIAL_PX} /></a>
              <a href={SOCIAL.x} target="_blank" rel="noreferrer" aria-label="AlabaamaFi on X" title="X" className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/[0.07] hover:text-[#7dd3fc]"><XLogo size={FOOTER_SOCIAL_PX - 2} /></a>
              <a href={SOCIAL.github} target="_blank" rel="noreferrer" aria-label="AlabaamaFi on GitHub" title="GitHub" className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/[0.07] hover:text-[#7dd3fc]"><GitHubLogo size={FOOTER_SOCIAL_PX} /></a>
            </div>

            <nav aria-label="Footer" className="order-2 flex items-center sm:order-3 sm:justify-self-end">
              <Link href="/docs" className="font-medium text-slate-300 transition hover:text-white"><span style={{ display: "block", fontSize: "12px", lineHeight: 1.2, zoom: FOOTER_LINK_TEXT_PX / 12 }}>Docs</span></Link>
              <span aria-hidden className="mx-3 h-3 w-px bg-white/25" />
              <Link href="/faq" className="font-medium text-slate-300 transition hover:text-white"><span style={{ display: "block", fontSize: "12px", lineHeight: 1.2, zoom: FOOTER_LINK_TEXT_PX / 12 }}>FAQ</span></Link>
            </nav>
          </div>
        </footer>
      </div>
    </main>
  );
}
