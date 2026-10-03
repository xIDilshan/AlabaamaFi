"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Header from "@/components/Header";

/* =========================================================
   ARC MAINNET
========================================================= */

const ARC = {
  chainId: 5042,
  chainIdHex: "0x13b2",
  rpc: "https://rpc.mainnet.arc.io",
  explorer: "https://explorer.arc.io",
  docs: "https://docs.arc.io",
  x: "https://x.com/arc",
};

const CONTAINER =
  "w-full px-5 sm:px-8 lg:px-12 xl:px-[5vw]";

const BUTTON =
  "inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] px-7 py-3.5 font-semibold text-white shadow-[0_10px_40px_rgba(30,120,255,0.28)] transition duration-300 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_15px_50px_rgba(30,120,255,0.42)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39c4ff]";

const SECONDARY_BUTTON =
  "inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.045] px-7 py-3.5 font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:border-[#2f8bff]/40 hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39c4ff]";

/* =========================================================
   DATA
========================================================= */

const FEATURES = [
  {
    number: "01",
    title: "USDC-native",
    text: "USDC is the native gas token, keeping transaction costs familiar and predictable.",
  },
  {
    number: "02",
    title: "Fast settlement",
    text: "Arc is designed for rapid deterministic finality, making onchain movement feel immediate.",
  },
  {
    number: "03",
    title: "EVM compatible",
    text: "Connect with the wallets, contracts, tools, and infrastructure you already use.",
  },
  {
    number: "04",
    title: "Built for finance",
    text: "A network designed around payments, stablecoins, FX, lending, and tokenized assets.",
  },
];

const ACTIONS = [
  {
    href: "/send",
    number: "01",
    title: "Send",
    text: "Move USDC directly to any wallet.",
    icon: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z",
  },
  {
    href: "/swap",
    number: "02",
    title: "Swap",
    text: "Exchange supported assets on Arc.",
    icon: "M7 4v13m0 0-3-3m3 3 3-3M17 20V7m0 0-3 3m3-3 3 3",
  },
  {
    href: "/bridge",
    number: "03",
    title: "Bridge",
    text: "Move assets between networks.",
    icon: "M3 18c0-6 4-10 9-10s9 4 9 10M3 18h18M8 18v-4M16 18v-4M12 18v-6",
  },
  {
    href: "/activity",
    number: "04",
    title: "Activity",
    text: "Follow your wallet activity onchain.",
    icon: "M3 12h4l3-8 4 16 3-8h4",
  },
];

const USE_CASES = [
  "Payments",
  "Stablecoin FX",
  "eCommerce",
  "Lending",
  "Tokenized assets",
  "Agentic economy",
  "Prediction markets",
];

/* =========================================================
   ICON
========================================================= */

function Icon({
  d,
  size = 22,
}: {
  d: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

/* =========================================================
   SCROLL REVEAL
========================================================= */

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "reveal-visible" : ""} ${className}`}
      style={
        {
          "--delay": `${delay}ms`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

/* =========================================================
   ANIMATED BACKGROUND
========================================================= */

function AnimatedBackground() {
  const stars = useMemo(() => {
    let seed = 23;

    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };

    return Array.from({ length: 75 }, (_, index) => ({
      id: index,
      x: random() * 1200,
      y: random() * 1100,
      r: 0.5 + random() * 1.5,
      delay: random() * 7,
      duration: 3 + random() * 5,
    }));
  }, []);

  const rings = [
    { radius: 260, duration: 36, reverse: false },
    { radius: 360, duration: 48, reverse: true },
    { radius: 470, duration: 62, reverse: false },
    { radius: 590, duration: 78, reverse: true },
    { radius: 720, duration: 100, reverse: false },
  ];

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Main continuous gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_12%,rgba(20,110,255,0.15),transparent_30%),linear-gradient(180deg,#010205_0%,#020817_25%,#020918_55%,#010307_100%)]" />

      {/* Large atmospheric glow */}
      <div
        className="absolute -right-[22vw] top-[4%] h-[65vw] w-[65vw] rounded-full bg-[radial-gradient(circle,rgba(22,115,255,0.22),rgba(12,58,150,0.08)_35%,transparent_68%)] blur-3xl"
        style={{
          animation: "backgroundFloat 18s ease-in-out infinite",
        }}
      />

      <div
        className="absolute -left-[25vw] top-[38%] h-[55vw] w-[55vw] rounded-full bg-[radial-gradient(circle,rgba(20,90,255,0.12),transparent_68%)] blur-3xl"
        style={{
          animation: "backgroundFloatReverse 24s ease-in-out infinite",
        }}
      />

      <svg
        className="absolute left-0 top-0 h-full w-full"
        viewBox="0 0 1200 1100"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient
            id="orbitGradient"
            x1="0"
            y1="1"
            x2="1"
            y2="0"
          >
            <stop offset="0" stopColor="#1769ff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#278aff" stopOpacity="0.25" />
            <stop offset="1" stopColor="#78d9ff" stopOpacity="0.8" />
          </linearGradient>

          <radialGradient
            id="planetGlow"
            cx="70%"
            cy="20%"
            r="65%"
          >
            <stop offset="0" stopColor="#39aaff" stopOpacity="0.32" />
            <stop offset="0.4" stopColor="#1264ff" stopOpacity="0.1" />
            <stop offset="1" stopColor="#001b55" stopOpacity="0" />
          </radialGradient>

          <filter
            id="blueGlow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur
              stdDeviation="5"
              result="blur"
            />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Planet atmosphere */}
        <circle
          cx="1040"
          cy="250"
          r="500"
          fill="url(#planetGlow)"
          style={{
            animation: "planetPulse 8s ease-in-out infinite",
          }}
        />

        {/* Stars */}
        {stars.map((star) => (
          <circle
            key={star.id}
            cx={star.x}
            cy={star.y}
            r={star.r}
            fill="#a9dfff"
            style={{
              animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
            }}
          />
        ))}

        {/* Orbital rings */}
        {rings.map((ring, index) => (
          <g key={ring.radius}>
            <ellipse
              cx="1050"
              cy="260"
              rx={ring.radius}
              ry={ring.radius * 0.34}
              fill="none"
              stroke="url(#orbitGradient)"
              strokeWidth={index === 0 ? 1.6 : 1}
              opacity={0.45 - index * 0.045}
              style={{
                transformOrigin: "1050px 260px",
                animation: `${
                  ring.reverse ? "orbitReverse" : "orbit"
                } ${ring.duration}s linear infinite`,
              }}
            />

            <ellipse
              cx="1050"
              cy="260"
              rx={ring.radius}
              ry={ring.radius * 0.34}
              fill="none"
              stroke="#70cfff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="65 935"
              opacity="0.65"
              filter="url(#blueGlow)"
              style={{
                transformOrigin: "1050px 260px",
                animation: `${
                  ring.reverse ? "orbitReverse" : "orbit"
                } ${ring.duration}s linear infinite`,
              }}
            />
          </g>
        ))}

        {/* Sweeping lines */}
        {[
          "M 180 500 Q 650 210 1200 90",
          "M 40 760 Q 650 370 1200 170",
          "M 460 1000 Q 850 600 1200 430",
          "M 0 300 Q 360 190 760 0",
        ].map((path, index) => (
          <g key={path}>
            <path
              d={path}
              fill="none"
              stroke="#277aff"
              strokeOpacity="0.12"
              strokeWidth="1"
            />

            <path
              d={path}
              fill="none"
              stroke="#7ddcff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="80 920"
              filter="url(#blueGlow)"
              style={{
                animation: `dashMove ${
                  8 + index * 2
                }s linear ${index * -2}s infinite`,
              }}
            />
          </g>
        ))}

        {/* Expanding ripples */}
        {[0, 3, 6].map((delay) => (
          <circle
            key={delay}
            cx="1050"
            cy="260"
            r="390"
            fill="none"
            stroke="#3e9dff"
            strokeWidth="1"
            opacity="0"
            style={{
              transformOrigin: "1050px 260px",
              animation: `ripple 10s ease-out ${delay}s infinite`,
            }}
          />
        ))}
      </svg>

      {/* Soft horizontal fade */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#010205_0%,rgba(1,2,5,0.72)_35%,rgba(1,2,5,0.25)_70%,rgba(1,2,5,0.1)_100%)]" />

      {/* Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#010205] to-transparent" />
    </div>
  );
}

/* =========================================================
   HERO PLANET
========================================================= */

function PlanetArt() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-[-18%] top-[7%] hidden h-[680px] w-[680px] lg:block xl:h-[800px] xl:w-[800px]"
    >
      <div className="absolute inset-[24%] rounded-full bg-[radial-gradient(circle_at_32%_28%,#68d7ff_0%,#1680ff_18%,#07378f_45%,#020a24_70%,transparent_72%)] shadow-[0_0_100px_rgba(20,120,255,0.32)]" />

      <div className="absolute inset-[19%] rounded-full border border-[#3e9dff]/20" />

      <div
        className="absolute inset-[10%] rounded-full border border-[#318cff]/25"
        style={{
          animation: "planetOrbit 22s linear infinite",
        }}
      />

      <div
        className="absolute inset-[2%] rounded-full border border-[#54baff]/15"
        style={{
          animation: "planetOrbitReverse 30s linear infinite",
        }}
      />

      <div className="absolute inset-[30%] rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(190,240,255,0.75),transparent_8%,rgba(20,100,255,0.15)_40%,transparent_70%)] blur-xl" />

      <div
        className="absolute left-[12%] top-[35%] h-px w-[78%] bg-gradient-to-r from-transparent via-[#65cfff]/60 to-transparent"
        style={{
          transform: "rotate(-18deg)",
          animation: "planetSweep 5s ease-in-out infinite",
        }}
      />
    </div>
  );
}

/* =========================================================
   ACTION CARD
========================================================= */

function ActionCard({
  href,
  number,
  title,
  text,
  icon,
}: {
  href: string;
  number: string;
  title: string;
  text: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[2rem] border border-white/[0.07] bg-white/[0.025] p-7 transition duration-500 hover:-translate-y-1 hover:border-[#2588ff]/40 hover:bg-[#0a1730]/60 hover:shadow-[0_25px_80px_rgba(16,93,255,0.16)]"
    >
      <div className="absolute right-6 top-5 text-xs font-medium tracking-[0.2em] text-white/20">
        {number}
      </div>

      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#3195ff]/20 bg-[#0d4fc5]/10 text-[#62c8ff] transition duration-500 group-hover:scale-110 group-hover:bg-[#1265e5]/20">
        <Icon d={icon} />
      </div>

      <h3 className="mt-7 text-2xl font-semibold tracking-tight">
        {title}
      </h3>

      <p className="mt-2 max-w-xs text-sm leading-6 text-slate-400">
        {text}
      </p>

      <div className="mt-8 flex items-center gap-2 text-sm font-medium text-[#65caff]">
        Open
        <span className="transition duration-300 group-hover:translate-x-1">
          →
        </span>
      </div>

      <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-[#1675ff]/10 blur-3xl transition duration-500 group-hover:bg-[#1675ff]/20" />
    </Link>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [block, setBlock] = useState<number | null>(null);

  const [walletMsg, setWalletMsg] = useState("");

  /* Header mobile menu state */
  useEffect(() => {
    const handleMenuState = (event: Event) => {
      const customEvent =
        event as CustomEvent<boolean>;

      setMobileMenuOpen(customEvent.detail);
    };

    window.addEventListener(
      "mobile-menu-state",
      handleMenuState
    );

    return () =>
      window.removeEventListener(
        "mobile-menu-state",
        handleMenuState
      );
  }, []);

  /* Live Arc block */
  useEffect(() => {
    let active = true;

    const fetchBlock = async () => {
      try {
        const response = await fetch(ARC.rpc, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_blockNumber",
            params: [],
          }),
        });

        const data = await response.json();

        if (active && data?.result) {
          setBlock(parseInt(data.result, 16));
        }
      } catch {
        /* Keep previous value */
      }
    };

    fetchBlock();

    const interval = setInterval(
      fetchBlock,
      5000
    );

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  /* Add Arc to wallet */
  const addArcToWallet = async () => {
    const ethereum = (
      window as Window & {
        ethereum?: {
          request: (args: {
            method: string;
            params?: unknown[];
          }) => Promise<unknown>;
        };
      }
    ).ethereum;

    if (!ethereum) {
      setWalletMsg(
        "No EVM wallet detected."
      );
      return;
    }

    try {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: ARC.chainIdHex,
            chainName: "Arc Mainnet",
            nativeCurrency: {
              name: "USDC",
              symbol: "USDC",
              decimals: 18,
            },
            rpcUrls: [ARC.rpc],
            blockExplorerUrls: [
              ARC.explorer,
            ],
          },
        ],
      });

      setWalletMsg(
        "Arc Mainnet added to your wallet."
      );
    } catch {
      setWalletMsg(
        "The wallet request was cancelled or failed."
      );
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#010205] text-white selection:bg-[#167cff]/30">
      {/* =====================================================
          GLOBAL ANIMATION STYLES
      ===================================================== */}

      <style>{`
        @keyframes backgroundFloat {
          0%,100% {
            transform: translate3d(0,0,0) scale(1);
          }
          50% {
            transform: translate3d(-4vw,2vw,0) scale(1.08);
          }
        }

        @keyframes backgroundFloatReverse {
          0%,100% {
            transform: translate3d(0,0,0) scale(1);
          }
          50% {
            transform: translate3d(5vw,-3vw,0) scale(1.12);
          }
        }

        @keyframes twinkle {
          0%,100% {
            opacity:.12;
          }
          50% {
            opacity:.9;
          }
        }

        @keyframes orbit {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes orbitReverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes dashMove {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: -1000;
          }
        }

        @keyframes ripple {
          0% {
            transform: scale(.25);
            opacity:.55;
          }
          100% {
            transform: scale(1.9);
            opacity:0;
          }
        }

        @keyframes planetPulse {
          0%,100% {
            opacity:.65;
          }
          50% {
            opacity:1;
          }
        }

        @keyframes planetOrbit {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes planetOrbitReverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes planetSweep {
          0%,100% {
            opacity:.1;
            transform:rotate(-18deg) translateX(-20%);
          }
          50% {
            opacity:.8;
            transform:rotate(-18deg) translateX(20%);
          }
        }

        @keyframes pulseDot {
          0%,100% {
            box-shadow:0 0 0 0 rgba(52,211,153,.25);
          }
          50% {
            box-shadow:0 0 0 7px rgba(52,211,153,0);
          }
        }

        @keyframes floatCard {
          0%,100% {
            transform:translateY(0);
          }
          50% {
            transform:translateY(-7px);
          }
        }

        .reveal {
          opacity:0;
          transform:translateY(34px);
          transition:
            opacity .9s cubic-bezier(.2,.7,.2,1),
            transform .9s cubic-bezier(.2,.7,.2,1);
          transition-delay:var(--delay,0ms);
        }

        .reveal-visible {
          opacity:1;
          transform:translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration:.01ms !important;
            animation-iteration-count:1 !important;
            scroll-behavior:auto !important;
          }

          .reveal {
            opacity:1;
            transform:none;
            transition:none;
          }
        }
      `}</style>

      {/* =====================================================
          CONTINUOUS PAGE BACKGROUND
      ===================================================== */}

      <AnimatedBackground />

      <div className="relative z-10">
        {/* ===================================================
            HEADER
        =================================================== */}

        <Header />

        <div
          className={`transition-[filter] duration-500 ${
            mobileMenuOpen
              ? "blur-md"
              : "blur-0"
          }`}
        >
          {/* =================================================
              HERO
          ================================================= */}

          <section className="relative min-h-[620px] overflow-hidden border-t border-white/[0.035] lg:min-h-[720px]">
            <PlanetArt />

            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2588ff]/30 to-transparent"
            />

            <div
              className={`relative mx-auto flex min-h-[620px] max-w-[1800px] items-center ${CONTAINER} lg:min-h-[720px]`}
            >
              <div className="relative z-10 w-full max-w-[950px] py-24 lg:py-28">
                <Reveal>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#2389ff]/30 bg-[#071735]/60 px-4 py-2 text-sm text-[#a9ccff] backdrop-blur-md">
                    <span
                      className="h-2.5 w-2.5 rounded-full bg-emerald-400"
                      style={{
                        animation:
                          "pulseDot 2.2s ease-in-out infinite",
                      }}
                    />
                    Arc Network
                  </div>
                </Reveal>

                <Reveal delay={100}>
                  <h1 className="mt-7 max-w-5xl text-[3.5rem] font-semibold leading-[0.98] tracking-[-0.045em] sm:text-6xl md:text-7xl lg:text-[5.8rem] xl:text-[clamp(5rem,6.4vw,8.5rem)]">
                    One place.
                    <br />
                    <span className="bg-gradient-to-r from-[#18bfff] via-[#2588ff] to-[#4262ff] bg-clip-text text-transparent">
                      Every move.
                    </span>
                  </h1>
                </Reveal>

                <Reveal delay={180}>
                  <p className="mt-7 text-xl font-medium tracking-tight text-slate-300 sm:text-2xl">
                    A simple interface for Arc
                  </p>
                </Reveal>

                <Reveal delay={250}>
                  <p className="mt-5 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
                    Send, swap, bridge, and explore
                    assets on Arc Mainnet through one
                    simple interface.
                  </p>
                </Reveal>

                <Reveal delay={330}>
                  <div className="mt-9 flex flex-wrap gap-3">
                    <Link
                      href="/swap"
                      className={BUTTON}
                    >
                      Start swapping
                    </Link>

                    <Link
                      href="/bridge"
                      className={SECONDARY_BUTTON}
                    >
                      Bridge to Arc
                    </Link>
                  </div>
                </Reveal>

                {/* Network strip */}
                <Reveal delay={420}>
                  <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm">
                    <div>
                      <span className="text-slate-500">
                        Latest block
                      </span>
                      <div className="mt-1 font-medium tabular-nums text-white">
                        {block
                          ? block.toLocaleString()
                          : "Loading…"}
                      </div>
                    </div>

                    <div className="hidden h-8 w-px bg-white/10 sm:block" />

                    <div>
                      <span className="text-slate-500">
                        Chain
                      </span>
                      <div className="mt-1 font-medium text-white">
                        Arc Mainnet
                      </div>
                    </div>

                    <div className="hidden h-8 w-px bg-white/10 sm:block" />

                    <div>
                      <span className="text-slate-500">
                        Gas
                      </span>
                      <div className="mt-1 font-medium text-white">
                        USDC
                      </div>
                    </div>

                    <div className="hidden h-8 w-px bg-white/10 sm:block" />

                    <div>
                      <span className="text-slate-500">
                        Finality
                      </span>
                      <div className="mt-1 font-medium text-white">
                        &lt; 1 sec
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>

            {/* Bottom glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#010205] to-transparent"
            />
          </section>

          {/* =================================================
              INTRO / ACTIONS
          ================================================= */}

          <section className={`${CONTAINER} relative pb-28 pt-12 lg:pb-36`}>
            <Reveal>
              <div className="flex flex-col justify-between gap-6 border-b border-white/[0.06] pb-10 md:flex-row md:items-end">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#4abaff]">
                    Everything in one place
                  </p>

                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl lg:text-5xl">
                    Move through Arc.
                  </h2>
                </div>

                <p className="max-w-md text-sm leading-6 text-slate-500">
                  A focused interface for the actions
                  you use most onchain.
                </p>
              </div>
            </Reveal>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ACTIONS.map((action, index) => (
                <Reveal
                  key={action.title}
                  delay={index * 90}
                >
                  <ActionCard {...action} />
                </Reveal>
              ))}
            </div>
          </section>

          {/* =================================================
              LIVE SWAP PREVIEW
          ================================================= */}

          <section className={`${CONTAINER} pb-28 lg:pb-40`}>
            <Reveal>
              <div className="grid items-center gap-14 lg:grid-cols-[1fr_0.9fr]">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#4abaff]">
                    Onchain, simplified
                  </p>

                  <h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-[-0.035em] sm:text-5xl lg:text-6xl">
                    Your assets.
                    <br />
                    Your moves.
                    <br />
                    <span className="text-slate-500">
                      One interface.
                    </span>
                  </h2>

                  <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
                    AlabaamaFi brings the most common
                    Arc actions into one clean experience
                    without unnecessary complexity.
                  </p>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                      href="/swap"
                      className={BUTTON}
                    >
                      Explore Swap
                    </Link>

                    <Link
                      href="/activity"
                      className={SECONDARY_BUTTON}
                    >
                      View Activity
                    </Link>
                  </div>
                </div>

                {/* Animated swap preview */}
                <div className="relative">
                  <div className="absolute -inset-10 rounded-full bg-[#1675ff]/10 blur-3xl" />

                  <div
                    className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#050a16]/75 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl"
                    style={{
                      animation:
                        "floatCard 7s ease-in-out infinite",
                    }}
                  >
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-5">
                      <div>
                        <p className="text-xs text-slate-500">
                          Swap
                        </p>
                        <p className="mt-1 font-medium">
                          Exchange assets
                        </p>
                      </div>

                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.05] text-slate-400">
                        ↕
                      </span>
                    </div>

                    <div className="mt-5 space-y-2">
                      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.035] p-4">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>You pay</span>
                          <span>Balance</span>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-2xl font-semibold">
                            100
                          </span>

                          <span className="rounded-full bg-white/[0.06] px-4 py-2 text-sm font-medium">
                            USDC
                          </span>
                        </div>
                      </div>

                      <div className="relative z-10 mx-auto -my-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-[#071025] text-[#55c5ff] shadow-lg">
                        ↓
                      </div>

                      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.035] p-4">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>You receive</span>
                          <span>Estimated</span>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-2xl font-semibold">
                            99.8
                          </span>

                          <span className="rounded-full bg-[#0b4c99]/30 px-4 py-2 text-sm font-medium text-[#75d4ff]">
                            EURC
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl bg-gradient-to-r from-[#0d75dc] to-[#3154ee] py-3 text-center text-sm font-semibold shadow-[0_10px_30px_rgba(30,100,255,0.2)]">
                      Preview swap
                    </div>

                    <div className="mt-4 flex justify-between px-1 text-xs text-slate-500">
                      <span>Network fee</span>
                      <span className="text-slate-300">
                        Paid in USDC
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          {/* =================================================
              WHY ARC
          ================================================= */}

          <section className={`${CONTAINER} pb-28 lg:pb-40`}>
            <Reveal>
              <div className="border-y border-white/[0.06] py-16 lg:py-20">
                <div className="grid gap-14 lg:grid-cols-[0.75fr_1.25fr]">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#4abaff]">
                      The network
                    </p>

                    <h2 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
                      Why Arc?
                    </h2>

                    <p className="mt-5 max-w-md leading-7 text-slate-400">
                      Arc is a USDC-native,
                      EVM-compatible Layer 1 designed
                      around modern onchain finance and
                      payments.
                    </p>

                    <a
                      href={ARC.docs}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-[#65caff] transition hover:text-white"
                    >
                      Read Arc documentation
                      <span>↗</span>
                    </a>
                  </div>

                  <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
                    {FEATURES.map(
                      (feature, index) => (
                        <Reveal
                          key={feature.number}
                          delay={index * 100}
                        >
                          <div>
                            <span className="text-xs tracking-[0.2em] text-[#2588ff]">
                              {feature.number}
                            </span>

                            <h3 className="mt-3 text-xl font-semibold">
                              {feature.title}
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                              {feature.text}
                            </p>
                          </div>
                        </Reveal>
                      )
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          {/* =================================================
              NETWORK DETAILS
          ================================================= */}

          <section className={`${CONTAINER} pb-28 lg:pb-40`}>
            <Reveal>
              <div className="grid gap-14 lg:grid-cols-2">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#4abaff]">
                    Connect
                  </p>

                  <h2 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
                    Get on Arc.
                  </h2>

                  <p className="mt-5 max-w-md leading-7 text-slate-400">
                    Add Arc Mainnet directly to your
                    EVM wallet and start exploring.
                  </p>

                  <button
                    onClick={addArcToWallet}
                    className={`${BUTTON} mt-8`}
                  >
                    Add Arc Mainnet
                  </button>

                  <p
                    role="status"
                    className="mt-4 min-h-5 text-sm text-slate-500"
                  >
                    {walletMsg}
                  </p>
                </div>

                <div>
                  <div className="grid grid-cols-2 border-y border-white/[0.07]">
                    <div className="border-b border-r border-white/[0.07] p-5 sm:p-7">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-600">
                        Network
                      </p>
                      <p className="mt-2 font-medium">
                        Arc Mainnet
                      </p>
                    </div>

                    <div className="border-b border-white/[0.07] p-5 sm:p-7">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-600">
                        Chain ID
                      </p>
                      <p className="mt-2 font-medium tabular-nums">
                        {ARC.chainId}
                      </p>
                    </div>

                    <div className="border-r border-white/[0.07] p-5 sm:p-7">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-600">
                        Gas token
                      </p>
                      <p className="mt-2 font-medium">
                        USDC
                      </p>
                    </div>

                    <div className="p-5 sm:p-7">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-600">
                        Finality
                      </p>
                      <p className="mt-2 font-medium">
                        &lt; 1 second
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-5 text-sm">
                    <a
                      href={ARC.explorer}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-500 transition hover:text-[#65caff]"
                    >
                      Explorer ↗
                    </a>

                    <a
                      href={ARC.docs}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-500 transition hover:text-[#65caff]"
                    >
                      RPC Docs ↗
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          {/* =================================================
              USE CASES
          ================================================= */}

          <section className="overflow-hidden pb-28 lg:pb-40">
            <Reveal className={CONTAINER}>
              <div className="border-t border-white/[0.06] pt-16 lg:pt-20">
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#4abaff]">
                  Built for movement
                </p>

                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
                  What Arc enables.
                </h2>
              </div>
            </Reveal>

            <div className="relative mt-10 overflow-hidden">
              <div
                className="flex w-max gap-3"
                style={{
                  animation:
                    "marquee 34s linear infinite",
                }}
              >
                {[
                  ...USE_CASES,
                  ...USE_CASES,
                  ...USE_CASES,
                  ...USE_CASES,
                ].map((item, index) => (
                  <span
                    key={`${item}-${index}`}
                    className="rounded-full border border-white/[0.07] bg-white/[0.025] px-6 py-3 text-sm text-slate-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* =================================================
              FINAL CTA
          ================================================= */}

          <section className={`${CONTAINER} pb-28 lg:pb-40`}>
            <Reveal>
              <div className="relative overflow-hidden border-y border-white/[0.07] py-20 text-center sm:py-28">
                <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1675ff]/10 blur-3xl" />

                <div className="relative">
                  <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#4abaff]">
                    AlabaamaFi
                  </p>

                  <h2 className="mx-auto mt-5 max-w-4xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-7xl">
                    Make your next move
                    <span className="bg-gradient-to-r from-[#18bfff] to-[#4262ff] bg-clip-text text-transparent">
                      {" "}
                      on Arc.
                    </span>
                  </h2>

                  <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-slate-500">
                    One place to move, manage, and
                    explore assets on Arc Network.
                  </p>

                  <div className="mt-9 flex flex-wrap justify-center gap-3">
                    <Link
                      href="/send"
                      className={BUTTON}
                    >
                      Send USDC
                    </Link>

                    <Link
                      href="/swap"
                      className={SECONDARY_BUTTON}
                    >
                      Start swapping
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          {/* =================================================
              FOOTER
          ================================================= */}

          <footer className="border-t border-white/[0.06]">
            <div
              className={`flex flex-col gap-5 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between ${CONTAINER}`}
            >
              <p>
                © {new Date().getFullYear()} AlabaamaFi.
                An independent interface for Arc.
              </p>

              <nav className="flex flex-wrap gap-6">
                <a
                  href={ARC.docs}
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-white"
                >
                  Docs
                </a>

                <a
                  href={ARC.explorer}
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-white"
                >
                  Explorer
                </a>

                <a
                  href={ARC.x}
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-white"
                >
                  Arc on X
                </a>
              </nav>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
