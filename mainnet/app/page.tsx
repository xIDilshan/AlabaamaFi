"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { Inter, Manrope, Space_Grotesk } from "next/font/google";
import Header from "@/components/Header";

// Brand fonts. Swap Inter if your Header uses a different font. Manrope is used for numbers, like on the other pages.
const brandFont = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });
const manrope = Manrope({ subsets: ["latin"], weight: ["600", "700"], display: "swap" });
// The font of the big headline "One place. Every move." To try another, swap Space_Grotesk for another Google font
// (for example Outfit, Sora, Urbanist, Syne or Plus_Jakarta_Sans) and keep the weights that font has.
const headlineFont = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"], display: "swap" });
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
   HERO EARTH: a dotted globe seen from space. Land is made of small dots; cities glow warm like night lights.
   It turns slowly around its vertical axis. Once, when the page loads, a sunrise comes up on its top edge: a thin line of light grows, is brightest in the middle, then fades away.
   Settings you can change:
===================================================================== */
const EARTH_SECONDS_PER_TURN = 120; // one full turn (smaller = faster)
const EARTH_TILT = 0.35; // how far the north pole leans toward you (radians)
const EARTH_START = -0.35; // which side faces you at the start (radians)
const EARTH_RISE = 0.6; // how much of the planet shows above the bottom of the first screen (0.5 = half of it; bigger = higher)
const EARTH_EXTRA_TOP = 250; // room above the hero for the sunrise light. Must be the same number as the "-top-[250px]" in the hero.
const SUNRISE_STRENGTH = 0.5; // how bright the light gets at its brightest (0 = none, 1 = very bright)
const SUNRISE_DELAY_S = 1.5; // seconds after the page loads before the light starts to rise
const SUNRISE_SECONDS = 14; // how long the light takes to rise and fade away (bigger = slower). It plays once every time the page loads.

// the land, 1 bit per degree (360 x 180), drawn from simplified continent outlines
const EARTH_MASK =
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA///+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//////+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///////+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////AAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD////////AAAAAAAAAAAAAAAAAAAB/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH//////+AAAAAAAAAAAAAAAAAAf//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/////+AAAAAAAAAAAAAAAAAP///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/////8AAAAAAAAAAAAAAAAB//////+AAAAAAAAAAAAAAAAAAAAH8AAB/gAAH/////8AAAAAAAAAAAAAAAAP///////gAAAAAAAAAAAAAAAAAAP/+AAD//AAD/////4AAAAAAAAAAAAAAAH////////8//4AAAAAAAAH/8AAAAH//gAP//wAD/////4AAAAAAD8AAAAAAAP////////////+AAAAAAAf/////wH/+AD///4AB/////gAAAAAA//4AAAAAAP////////////////gAAD///////+AAAf///+AA////+AAAAAAH///AAAf/4f/////////////////AAH////////////////AAf///wAAAAAAP///8f//////////////////////Dwf/////////////j//wAf//+APgAAAAf///////////////////////////P8f////////////+B//4AP//gA/4AAAB////////////////////////////AAB////////////wAf/wAP/wAAf4AAAD/8//////////////////////////AAD////////////AAB/gAH/wAADgAAAP/7/////////////////////////+AAP///////////8AAABAAD/gAAAAAAAf/H/////////////////////////8AAP///////////4AAHAAAB/AAAAAAAB//H/////////////////////////AAAD///////////wAA/4AAAfAAAAAAAB//D////////////////////////8AAAA//AD///////wAAf/wAAAAAAAAAAB//h///////////////////////wAAAAAf8AA///////wAAf/4AAAAAAAAAYA7/A///////////////////8AD/wAAAAA/wAAH//////4AAf/8AAAAAAAAA8AA+A///////////////////wAB/gAAAAB/AAAB///////AA//+AAAAAAAAA8AO+H///////////////////gAA/gAAAAD4AAAAf//////8A///AAAAAAAAAeAEIH//////////////////+AAA/AAAAAAAAAAAP///////B///gAAAAAAAHGAGD////////////////////gAA+AAAAAAAAAAAP///////h///4AAAAAAAPPAf/////////////////////4AA8AAAAAAAAAAAH///////7///8AAAAAAAPfz//////////////////////4AAYAAAAAAAAAAAD///////////8AAAAAAAAf3//////////////////////8AAAAAAAAAAAAAAB///////////8AAAAAAAAY///////////////////////4AAAAAAAAAAAAAAAf//////////4AAAAAAAAD///////////////////////4AAAAAAAAAAAAAAAf/////////jgAAAAAAAAP///////////////////////4AAAAAAAAAAAAAAAP/////////AAAAAAAAAAH///////////////////////wAAAAAAAAAAAAAAAP/////////gAAAAAAAAAD///////////////////////gAAAAAAAAAAAAAAAP/////////wAAAAAAAAAB/////j//B//////////////AAAAAAAAAAAAAAAAP/////////gAAAAAAAAAB//v/+AP+B/////////////+HAAAAAAAAAAAAAAAf////////8AAAAAAAAAD//xj/8AD+A/////////////8HgAAAAAAAAAAAAAAf////////wAAAAAAAAAP/4Bw/8AB/B/////////////APgAAAAAAAAAAAAAAP////////gAAAAAAAAAH/4Aef8///h////////////8AAAAAAAAAAAAAAAAAP///////+AAAAAAAAAAH/gAPfv///j///////////v4AMAAAAAAAAAAAAAAAP///////8AAAAAAAAAAH/AADPP///h//////////+BwAMAAAAAAAAAAAAAAAH///////4AAAAAAAAAAH/gACHP///g//////////8BwAcAAAAAAAAAAAAAAAH///////4AAAAAAAAAAH/AAAHH///w///////////g4A4AAAAAAAAAAAAAAAD///////4AAAAAAAAAAD8f4ACB9//////////////w8B4AAAAAAAAAAAAAAAB///////wAAAAAAAAAAAx/8AAAA//////////////g4f4AAAAAAAAAAAAAAAB///////gAAAAAAAAAAB//+AAAA//////////////gB+AAAAAAAAAAAAAAAAAf//////AAAAAAAAAAAD//+AAAB//////////////ABAAAAAAAAAAAAAAAAAAH/////+AAAAAAAAAAAH///4AAB//////////////gCAAAAAAAAAAAAAAAAAAH/////8AAAAAAAAAAAP////P/D//////////////gAAAAAAAAAAAAAAAAAAAD/////4AAAAAAAAAAAP//////z//////////////wAAAAAAAAAAAAAAAAAAAB////A8AAAAAAAAAAAP//////7//P///////////wAAAAAAAAAAAAAAAAAAABv//gAcAAAAAAAAAAAf//////7//n///////////gAAAAAAAAAAAAAAAAAAAA3//AAcAAAAAAAAAAB//////////x///////////gAAAAAAAAAAAAAAAAAAAAz/+AAMAAAAAAAAAAD//////////wP//////////AAAAAAAAAAAAAAAAAAAAAZ/+AAEAAAAAAAAAAD//////////4b//////////AAAAAAAAAAAAAAAAAAAAAM/+AAAAAAAAAAAAAH///////////4Af///////+QAAAAAAAAAAAAAAAAAAAAAP+AAAAAAAAAAAAAP///////////8AH///////4gAAAAAAAAAAAAAAAAAAAAAP8AA/AAAAAAAAAAP////////f//+AD///////gAAAAAAAAAAAAAAAAAAAAAAP+AADwAAAAAAAAAf////////P//+AA//+P//8AAAAAAAAAAAAAAAAAAAAAAAP+B4B4AAAAAAAAAf////////v//+AA//4P/+AAAAAAAAAAAAAAAAAAAAAAAAD/B4ABwAAAAAAAAf////////n//8AAf/wH/+AAAAAAAAAAAAAAAAAAAAAAAAB//4AD4AAAAAAAAP////////j//4AAf/gH/+AAAAAAAAAAAAAAAAAAAAAAAAAf/wAAAAAAAAAAAf////////z//gAAf+AD/+AAAAAAAAAAAAAAAAAAAAAAAAAH/wAAAAAAAAAAAf////////5//AAAf8ADf/AAQAAAAAAAAAAAAAAAAAAAAAAAP/AAAAAAAAAAAf////////8/8AAAP4AAf/gAYAAAAAAAAAAAAAAAAAAAAAAAD/AAAAAAAAAAAf////////+/wAAAPwAAf/gA4AAAAAAAAAAAAAAAAAAAAAAAA/gAAAAAAAAAAf//////////AAAAHwAAP/gAcAAAAAAAAAAAAAAAAAAAAAAAAHgAAAAAAAAAAf/////////wAAAAHwAAP/gAAAAAAAAAAAAAAAAAAAAAAAAAAHgBAAAAAAAAAP/////////+YAAADwAAMfAAAAAAAAAAAAAAAAAAAAAAAAAAADwH/8AAAAAAAD//////////4AAADwAAIeAAAAAAAAAAAAAAAAAAAAAAAAAAAA4f/+AAAAAAAD//////////wAAADwAAMMAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///AAAAAAAB//////////wAAABIAAMAAADAAAAAAAAAAAAAAAAAAAAAAAAAH///gAAAAAAA//////////wAAAAMAAOAAAHgAAAAAAAAAAAAAAAAAAAAAAAAA///4AAAAAAAf/////////gAAAAMAADAAIDAAAAAAAAAAAAAAAAAAAAAAAAAA////AAAAAAAP/j///////gAAAAAABDgAeAAAAAAAAAAAAAAAAAAAAAAAAAAA////wAAAAAADAB///////AAAAAAABjwA+AAAAAAAAAAAAAAAAAAAAAAAAAAA////4AAAAAAAAAH/////+AAAAAAAA5wA+AAAAAAAAAAAAAAAAAAAAAAAAAAA////8AAAAAAAAAH/////8AAAAAAAA8wD8AAAAAAAAAAAAAAAAAAAAAAAAAAB////8AAAAAAAAAH/////wAAAAAAAAeQf8AAAAAAAAAAAAAAAAAAAAAAAAAAD////8AAAAAAAAAD/////gAAAAAAAAfAf88AAAAAAAAAAAAAAAAAAAAAAAAAH////8AAAAAAAAAD/////gAAAAAAAAPwf44AAAAAAAAAAAAAAAAAAAAAAAAAD/////wAAAAAAAAD/////AAAAAAAAAH4f54BAAAAAAAAAAAAAAAAAAAAAAAAD/////8AAAAAAAAB////+AAAAAAAAAD8P54AwAAAAAAAAAAAAAAAAAAAAAAAH//////4AAAAAAAB////+AAAAAAAAAB8Bx4A/+AAAAAAAAAAAAAAAAAAAAAAH//////8AAAAAAAA////8AAAAAAAAAAcAA4AP/gAAAAAAAAAAAAAAAAAAAAAH///////AAAAAAAA////8AAAAAAAAAAEAAAAD/4AAAAAAAAAAAAAAAAAAAAAD///////gAAAAAAA////4AAAAAAAAAAD4AAAB/8AAAAAAAAAAAAAAAAAAAAAD///////gAAAAAAAf///8AAAAAAAAAAD/AAAB/+AAAAAAAAAAAAAAAAAAAAAB///////gAAAAAAAf///8AAAAAAAAAAADAAAAf+AAAAAAAAAAAAAAAAAAAAAB///////gAAAAAAAf///8AAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAA///////gAAAAAAAf///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//////AAAAAAAAf///8AAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAf/////+AAAAAAAAf///+AQAAAAAAAAAAAAB8CAAAAAAAAAAAAAAAAAAAAAAAP/////8AAAAAAAA////+AwAAAAAAAAAAAAD8HAAAAAAAAAAAAAAAAAAAAAAAP/////4AAAAAAAA////+BwAAAAAAAAAAABz+HgAAAAAAAAAAAAAAAAAAAAAAH/////4AAAAAAAA////4D4AAAAAAAAAAAD/+HwAAAAAAAAAAAAAAAAAAAAAAB/////4AAAAAAAA////AHwAAAAAAAAAAAH//HwAAAAAAAAAAAAAAAAAAAAAAA/////4AAAAAAAA///+APwAAAAAAAAAAAP///wAAAAAAAAAAAAAAAAAAAAAAAf////4AAAAAAAA///+APwAAAAAAAAAAAP///wAAAAAAAAAAAAAAAAAAAAAAAf////4AAAAAAAAf///APgAAAAAAAAAAAf///4AAAAAAAAAAAAAAAAAAAAAAAf////wAAAAAAAAf///APgAAAAAAAAAAD////+AAAAAAAAAAAAAAAAAAAAAAAf////wAAAAAAAAP///APgAAAAAAAAAAf/////AAAAAAAAAAAAAAAAAAAAAAAf////gAAAAAAAAP///APAAAAAAAAAAB//////AAAAAAAAAAAAAAAAAAAAAAAf///+AAAAAAAAAH//+APAAAAAAAAAAB//////gAAAAAAAAAAAAAAAAAAAAAAf///4AAAAAAAAAH//+AOAAAAAAAAAAB//////4AAAAAAAAAAAAAAAAAAAAAAf///gAAAAAAAAAH//8AAAAAAAAAAAAA//////4AAAAAAAAAAAAAAAAAAAAAAf///AAAAAAAAAAH//4AAAAAAAAAAAAA//////8AAAAAAAAAAAAAAAAAAAAAAf///AAAAAAAAAAD//4AAAAAAAAAAAAA//////8AAAAAAAAAAAAAAAAAAAAAAf///AAAAAAAAAAD//4AAAAAAAAAAAAA//////8AAAAAAAAAAAAAAAAAAAAAAf//+AAAAAAAAAAB//wAAAAAAAAAAAAAf/////8AAAAAAAAAAAAAAAAAAAAAA///8AAAAAAAAAAA//gAAAAAAAAAAAAAf/////4AAAAAAAAAAAAAAAAAAAAAA///4AAAAAAAAAAA//AAAAAAAAAAAAAAf/////4AAAAAAAAAAAAAAAAAAAAAA///wAAAAAAAAAAA/+AAAAAAAAAAAAAAf/gf//wAAAAAAAAAAAAAAAAAAAAAA///wAAAAAAAAAAA/8AAAAAAAAAAAAAAf+AP//wAAAAAAAAAAAAAAAAAAAAAA///gAAAAAAAAAAAeAAAAAAAAAAAAAAAPgAH//gAAAAAAAAAAAAAAAAAAAAAB//+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//gAABAAAAAAAAAAAAAAAAAAB//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/gAABgAAAAAAAAAAAAAAAAAB//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP+AAAB8AAAAAAAAAAAAAAAAAB//gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB8AAAB8AAAAAAAAAAAAAAAAAD/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAD/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAD/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAAADAAAAAAAAAAAAAAAAAAD/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAHAAAAAAAAAAAAAAAAAAD/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAOAAAAAAAAAAAAAAAAAAH/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAAH/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAH+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAH/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

// big cities: [latitude, longitude, strength]. The lights gather around them.
const EARTH_CITIES: [number, number, number][] = [
  [40.7, -74, 1],
  [34, -118.2, 0.8],
  [41.9, -87.6, 0.8],
  [29.8, -95.4, 0.6],
  [25.8, -80.2, 0.6],
  [43.7, -79.4, 0.6],
  [19.4, -99.1, 0.9],
  [-23.5, -46.6, 1],
  [-22.9, -43.2, 0.7],
  [-34.6, -58.4, 0.8],
  [4.7, -74.1, 0.6],
  [-12, -77, 0.6],
  [51.5, -0.1, 1],
  [48.9, 2.3, 0.9],
  [52.5, 13.4, 0.7],
  [41.9, 12.5, 0.7],
  [40.4, -3.7, 0.7],
  [50.1, 8.7, 0.7],
  [52.4, 4.9, 0.7],
  [55.8, 37.6, 0.9],
  [59.9, 30.3, 0.6],
  [41, 29, 0.9],
  [30, 31.2, 0.9],
  [6.5, 3.4, 0.8],
  [-26.2, 28, 0.7],
  [-1.3, 36.8, 0.5],
  [-4.3, 15.3, 0.5],
  [33.6, -7.6, 0.5],
  [35.7, 51.4, 0.8],
  [25.2, 55.3, 0.7],
  [24.7, 46.7, 0.6],
  [19.1, 72.9, 1],
  [28.6, 77.2, 1],
  [13, 80.3, 0.7],
  [12.9, 77.6, 0.7],
  [22.6, 88.4, 0.8],
  [23.8, 90.4, 0.8],
  [24.9, 67, 0.8],
  [31.5, 74.3, 0.7],
  [39.9, 116.4, 1],
  [31.2, 121.5, 1],
  [23.1, 113.3, 0.9],
  [22.3, 114.2, 0.8],
  [30.6, 104, 0.7],
  [35.7, 139.7, 1],
  [34.7, 135.5, 0.8],
  [37.6, 127, 0.9],
  [13.7, 100.5, 0.8],
  [10.8, 106.7, 0.7],
  [21, 105.8, 0.6],
  [14.6, 121, 0.8],
  [-6.2, 106.8, 0.9],
  [3.1, 101.7, 0.6],
  [1.3, 103.8, 0.6],
  [-33.9, 151.2, 0.8],
  [-37.8, 145, 0.6],
  [-31.9, 115.9, 0.4],
  [-36.8, 174.8, 0.4],
  [64.1, -21.9, 0.3]
];

function HeroEarth() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // read the land mask
    const bin = atob(EARTH_MASK);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const isLand = (lat: number, lon: number) => {
      const row = Math.min(179, Math.max(0, Math.floor(90 - lat)));
      const col = Math.min(359, Math.max(0, Math.floor(lon + 180)));
      const i = row * 360 + col;
      return ((bytes[i >> 3] >> (7 - (i & 7))) & 1) === 1;
    };

    // one dot for every land spot, spaced evenly over the sphere
    type Dot = { lonR: number; sinLat: number; cosLat: number; light: number; lit: boolean; phase: number };
    const dots: Dot[] = [];
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const STEP = 1.7;
    const D2R = Math.PI / 180;
    for (let lat = -58; lat <= 84; lat += STEP) {
      const cl = Math.cos(lat * D2R);
      const n = Math.max(1, Math.round((360 * cl) / STEP));
      const off = rnd();
      for (let j = 0; j < n; j++) {
        const lon = -180 + ((j + off) / n) * 360;
        if (!isLand(lat, lon)) continue;
        let light = 0;
        for (const [clat, clon, st] of EARTH_CITIES) {
          let dl = Math.abs(lon - clon);
          if (dl > 180) dl = 360 - dl;
          const dx = dl * cl;
          const dy = lat - clat;
          light += st * Math.exp(-(dx * dx + dy * dy) / (2 * 4.6 * 4.6));
        }
        light = Math.min(1, light);
        dots.push({ lonR: lon * D2R, sinLat: Math.sin(lat * D2R), cosLat: cl, light, lit: rnd() < Math.min(0.9, light * 1.25), phase: rnd() * 6.283 });
      }
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cT = Math.cos(EARTH_TILT);
    const sT = Math.sin(EARTH_TILT);
    let w = 0;
    let h = 0;
    let dprNow = 1;
    let textBottom = 0; // where the hero text ends, counted from the top of the hero

    // finds where the hero text ends (the buttons), so on tall screens the planet can come up close under the text
    const measureText = () => {
      const section = canvas.closest("section") as HTMLElement | null;
      const el = section?.querySelector("[data-hero-text]") as HTMLElement | null;
      if (!section || !el) {
        textBottom = 0;
        return;
      }
      let y = 0;
      let n: HTMLElement | null = el;
      while (n && n !== section) {
        y += n.offsetTop;
        n = n.offsetParent as HTMLElement | null;
      }
      textBottom = y + el.offsetHeight;
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      dprNow = dpr;
      w = Math.max(2, Math.round(r.width * dpr));
      h = Math.max(2, Math.round(r.height * dpr));
      canvas.width = w;
      canvas.height = h;
      measureText();
    };

    const t0 = performance.now(); // the moment the page (this component) loaded
    const draw = (ms: number) => {
      const t = (ms - t0) / 1000;
      // where the planet is: it is sized and placed from the size of the hero (not the width of the screen), so it looks right on every screen
      const cssW = w / dprNow;
      const heroH = h / dprNow - EARTH_EXTRA_TOP; // the canvas also covers EARTH_EXTRA_TOP above the hero
      const narrow = cssW < 640;
      const cap = narrow ? 0.5 : EARTH_RISE;
      const xf = narrow ? 0.18 : 0.38 + 0.22 * Math.min(1, Math.max(0, (cssW - 1400) / 1000)); // very wide screens: the planet comes in a little from the right
      let Rc = Math.min(heroH * 0.95, cssW * (narrow ? 0.5 : 0.42), Math.max(640, cssW * 0.3));
      // tall screens: if the text ends far above the planet, make the planet bigger and bring it up under the text
      const wantTop = textBottom + 70;
      if (textBottom > 0 && heroH - cap * 2 * Rc > wantTop + 80) {
        Rc = Math.min((heroH - wantTop) / (2 * cap), cssW * 0.75);
      }
      Rc = Math.min(Rc, (heroH - 30) / (2 * cap)); // the top of the planet stays at least 30px below the top of the hero
      Rc = Math.max(Rc, 120);
      const R = Rc * dprNow;
      const cx = (cssW - Rc * xf) * dprNow;
      const cy = (EARTH_EXTRA_TOP + heroH - cap * 2 * Rc + Rc) * dprNow;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;

      // the soft glow around the planet (its atmosphere)
      const halo = ctx.createRadialGradient(cx, cy, R * 0.94, cx, cy, R * 1.28);
      halo.addColorStop(0, "rgba(90,170,255,0.50)");
      halo.addColorStop(0.16, "rgba(50,120,255,0.26)");
      halo.addColorStop(0.5, "rgba(30,80,220,0.09)");
      halo.addColorStop(1, "rgba(20,60,200,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.28, 0, Math.PI * 2);
      ctx.fill();

      // the dark body of the planet
      const body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.45, R * 0.05, cx, cy, R);
      body.addColorStop(0, "#0b2160");
      body.addColorStop(0.55, "#06133c");
      body.addColorStop(1, "#02071c");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // the land dots and the city lights, turning around the vertical axis
      const rot = (reduce ? 0 : (t * Math.PI * 2) / EARTH_SECONDS_PER_TURN) + EARTH_START;
      const dotR = Math.max(1, R * 0.0042);
      for (const d of dots) {
        const a = d.lonR + rot;
        const x0 = d.cosLat * Math.sin(a);
        const y0 = d.sinLat;
        const z0 = d.cosLat * Math.cos(a);
        const y1 = y0 * cT - z0 * sT;
        const z1 = y0 * sT + z0 * cT;
        if (z1 < 0.03) continue; // on the far side
        const fade = Math.pow(z1, 0.45);
        const px = cx + R * x0;
        const py = cy - R * y1;
        const r = dotR * (0.55 + 0.6 * z1);
        if (d.lit) {
          const tw = reduce ? 1 : 0.8 + 0.2 * Math.sin(t * 1.6 + d.phase);
          const al = Math.min(1, (0.4 + 0.6 * d.light) * fade) * tw;
          ctx.globalAlpha = al * 0.1;
          ctx.fillStyle = "#ffbe6e";
          ctx.beginPath();
          ctx.arc(px, py, r * 2.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = al;
          ctx.fillStyle = "#ffe0a8";
          ctx.beginPath();
          ctx.arc(px, py, r * 1.1, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.globalAlpha = 0.25 + 0.3 * fade;
          ctx.fillStyle = "#468cff";
          ctx.beginPath();
          ctx.arc(px, py, r * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // the edge of the planet (always a little visible, soft)
      const rim = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
      rim.addColorStop(0, "rgba(150,200,255,0.42)");
      rim.addColorStop(0.45, "rgba(70,140,255,0.24)");
      rim.addColorStop(1, "rgba(40,100,255,0.08)");
      ctx.strokeStyle = rim;
      ctx.lineWidth = Math.max(1.2, R * 0.004);
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      // THE SUNRISE: once after the page loads, light comes up on the top edge as the planet turns.
      // The line grows from a short bright spot, is longest and brightest at the middle of the show, then shrinks and fades away.
      const p = Math.min(1, Math.max(0, (t - SUNRISE_DELAY_S) / SUNRISE_SECONDS));
      const I = reduce ? 0.3 : Math.pow(Math.sin(Math.PI * p), 2); // 0 -> 1 -> 0, smooth
      if (I > 0.003) {
        const K = SUNRISE_STRENGTH;
        const a = -Math.PI / 2 + (reduce ? 0 : -0.2 + 0.4 * p); // slides a little to the right while the planet turns
        const hw = 0.1 + 0.72 * I; // half the length of the lit edge (radians)
        ctx.globalCompositeOperation = "lighter";
        ctx.lineCap = "butt";
        // the haze and the line follow the curve of the planet: thin at the ends, brightest in the middle
        const LAYERS: [number, number][] = [
          [R * 0.1, 0.06],
          [R * 0.04, 0.13],
          [R * 0.014, 0.26],
          [R * 0.005, 0.7],
        ];
        // (checked this way so TypeScript does not treat the other branch as impossible)
        const hasConic = typeof (ctx as unknown as { createConicGradient?: unknown }).createConicGradient === "function";
        if (hasConic) {
          const f = Math.min(0.999, hw / Math.PI); // the lit part, as a fraction of the whole circle
          for (const [lw, al] of LAYERS) {
            const g = ctx.createConicGradient(a - hw, cx, cy);
            const N = 24;
            for (let k = 0; k <= N; k++) {
              const u = (k / N) * 2 - 1;
              const wgt = Math.pow(1 - Math.abs(u), 2.2);
              g.addColorStop((k / N) * f, `rgba(190,228,255,${(al * wgt * I * K).toFixed(3)})`);
            }
            g.addColorStop(Math.min(1, f + 0.0001), "rgba(190,228,255,0)");
            g.addColorStop(1, "rgba(190,228,255,0)");
            ctx.strokeStyle = g;
            ctx.lineWidth = lw;
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, Math.PI * 2);
            ctx.stroke();
          }
        } else {
          // older browsers: the same thing in small pieces
          const M = 56;
          for (let i = 0; i < M; i++) {
            const u = ((i + 0.5) / M) * 2 - 1;
            const wgt = Math.pow(1 - Math.abs(u), 2.2);
            const ang = a + u * hw;
            const half = hw / M;
            for (const [lw, al] of LAYERS) {
              ctx.lineWidth = lw;
              ctx.strokeStyle = `rgba(190,228,255,${(al * wgt * I * K).toFixed(3)})`;
              ctx.beginPath();
              ctx.arc(cx, cy, R, ang - half, ang + half);
              ctx.stroke();
            }
          }
        }
        const gx = cx + R * Math.cos(a);
        const gy = cy + R * Math.sin(a);
        // a small, soft flare right at the sun
        ctx.save();
        ctx.translate(gx, gy);
        ctx.scale(2.4, 0.38);
        const rr = R * 0.13 * (0.55 + 0.75 * I);
        const flat = ctx.createRadialGradient(0, 0, 0, 0, 0, rr);
        flat.addColorStop(0, `rgba(240,250,255,${(0.7 * I * K).toFixed(3)})`);
        flat.addColorStop(0.3, `rgba(150,212,255,${(0.35 * I * K).toFixed(3)})`);
        flat.addColorStop(1, "rgba(60,140,255,0)");
        ctx.fillStyle = flat;
        ctx.beginPath();
        ctx.arc(0, 0, rr, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // the bright center
        const rb = R * 0.1 * (0.5 + I);
        const bloom = ctx.createRadialGradient(gx, gy, 0, gx, gy, rb);
        bloom.addColorStop(0, `rgba(255,255,255,${(0.9 * I * K).toFixed(3)})`);
        bloom.addColorStop(1, "rgba(150,210,255,0)");
        ctx.fillStyle = bloom;
        ctx.beginPath();
        ctx.arc(gx, gy, rb, 0, Math.PI * 2);
        ctx.fill();
        // soft light rising above the horizon
        ctx.save();
        ctx.translate(gx, gy);
        ctx.scale(1, 1.8);
        const ru = R * 0.2 * (0.6 + 0.6 * I);
        const up = ctx.createRadialGradient(0, 0, 0, 0, 0, ru);
        up.addColorStop(0, `rgba(130,200,255,${(0.32 * I * K).toFixed(3)})`);
        up.addColorStop(1, "rgba(80,160,255,0)");
        ctx.fillStyle = up;
        ctx.beginPath();
        ctx.arc(0, 0, ru, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.globalCompositeOperation = "source-over";
      }
    };

    let raf = 0;
    let visible = true;
    resize();
    if (reduce) {
      draw(0);
    } else {
      const loop = (ms: number) => {
        if (visible) draw(ms);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) draw(0);
    });
    ro.observe(canvas);
    document.fonts?.ready.then(measureText);
    const tm = window.setTimeout(measureText, 800);
    // no drawing while it is off the screen
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(tm);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="h-full w-full" />;
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
        <Icon d={copied ? "m5 12.5 4.5 4.5L19 7.5" : "M11 9h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2ZM15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"} size={18} sw={copied ? 2.2 : 1.8} />
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

      <div className="relative z-10">
        <Header />

        {/* ---------------- HERO: left aligned, one big line, a glowing Earth at the bottom right ----------------
            On computers the hero fills the first screen, so nothing below it shows until you scroll. */}
        <section className="relative md:min-h-[calc(100svh-86px)]">
          {/* the Earth: its size and place come from the size of the hero (see HeroEarth). It starts EARTH_EXTRA_TOP above the hero, so the sunrise has room. */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-[250px] bottom-0 z-0 [-webkit-mask-image:linear-gradient(to_bottom,#000_calc(100%-170px),transparent)] [mask-image:linear-gradient(to_bottom,#000_calc(100%-170px),transparent)]">
            <HeroEarth />
          </div>

          <div className={`relative z-10 flex min-h-[640px] items-start md:min-h-0 ${CONTAINER}`}>
            <div className="w-full pb-14 pt-8 text-left sm:pt-12 lg:pt-14">
              <Reveal>
                <h1 className={`${headlineFont.className} text-[2.6rem] font-bold leading-[1.06] tracking-[-0.035em] sm:text-[3.6rem] md:text-[4.4rem] lg:text-[5.2rem] xl:whitespace-nowrap xl:text-[clamp(3.8rem,4.7vw,8rem)]`}>
                  <span className="bg-gradient-to-b from-white to-[#d9e0f5] bg-clip-text text-transparent">One place.</span>{" "}
                  <br className="xl:hidden" />
                  <span className={GRAD}>Every move.</span>
                </h1>
              </Reveal>

              <Reveal delay={180}>
                <p className="mt-6 text-xl font-normal tracking-tight text-[#aab2d5] sm:text-2xl">A simple interface for Arc</p>
                <p className="mt-4 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">Send, swap, bridge, and explore assets on Arc Mainnet through one simple interface.</p>
              </Reveal>

              <Reveal delay={270}>
                <div data-hero-text className="mt-9 flex flex-wrap gap-3">
                  <Link href="/swap" className={BUTTON}>Start swapping</Link>
                  <Link href="/bridge" className={SECONDARY_BUTTON}>Bridge to Arc</Link>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------------- SHOWCASE: one block per AlabaamaFi page, on frosted "matte" glass (the stars behind are blurred) ---------------- */}
        <section className="relative pb-10 lg:pb-16">
          <div
            className="relative overflow-hidden bg-[#050a16]/20 [-webkit-mask-image:linear-gradient(to_bottom,transparent,#000_6%,#000_94%,transparent)] [mask-image:linear-gradient(to_bottom,transparent,#000_6%,#000_94%,transparent)]"
            style={{ WebkitBackdropFilter: "blur(6px)", backdropFilter: "blur(6px)" }}
          >
            {/* a very fine grain, for the matte feel */}
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
            <div className={`relative ${CONTAINER}`}>
              {SHOWCASE.map((item, i) => (
                <div key={item.kind} className="grid items-center gap-10 py-12 lg:grid-cols-2 lg:gap-20 lg:py-20">
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
