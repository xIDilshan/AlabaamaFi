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

/* =========================================================
   DESIGN
   ========================================================= */

const CONTAINER =
  "w-full px-5 sm:px-8 lg:px-12 xl:px-[5vw]";

const H2 =
  "text-3xl font-semibold tracking-tight sm:text-4xl xl:text-[clamp(2rem,2.8vw,3.75rem)]";

const BTN =
  "rounded-full bg-gradient-to-r from-[#168cff] via-[#2385f5] to-[#3047e8] px-7 py-3 font-medium shadow-[0_8px_35px_rgba(37,99,235,0.35)] transition duration-300 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_12px_45px_rgba(37,99,235,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f8bff]";

const SOFT =
  "border border-white/[0.07] bg-white/[0.025] backdrop-blur-sm";

/* =========================================================
   DATA
   ========================================================= */

const FEATURES = [
  {
    title: "USDC as gas",
    text: "Fees are paid in USDC, keeping transaction costs predictable and dollar-denominated.",
    icon: "M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  },
  {
    title: "Sub-second finality",
    text: "Transactions settle deterministically in under a second on Arc's consensus layer.",
    icon: "M13 2 3 14h9l-1 8 10-12h-9l1-8z",
  },
  {
    title: "EVM compatible",
    text: "Use familiar wallets, developer tools, smart contracts and Solidity workflows.",
    icon: "m16 18 6-6-6-6M8 6l-6 6 6 6",
  },
  {
    title: "Built for payments",
    text: "Designed for payments, stablecoin FX, lending and tokenized assets.",
    icon: "M2 7h20v12H2zM2 11h20",
  },
];

const NETWORK_ROWS: [string, string][] = [
  ["Network", "Arc Mainnet"],
  ["Chain ID", `${ARC.chainId} (${ARC.chainIdHex})`],
  ["Gas token", "USDC"],
  ["RPC", ARC.rpc.replace("https://", "")],
  ["Explorer", ARC.explorer.replace("https://", "")],
];

const USE_CASES = [
  "Peer-to-peer payments",
  "eCommerce checkout",
  "Stablecoin FX",
  "Agentic economy",
  "Prediction markets",
  "Borrow and lend",
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
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;

    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -7% 0px",
      }
    );

    io.observe(el);

    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${shown ? "reveal-in" : ""} ${className}`}
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
   FULL PAGE BACKGROUND ART
   =========================================================
   IMPORTANT:
   This is intentionally rendered once at the page level,
   outside the individual sections.
   ========================================================= */

function BackgroundArt() {
  const stars = useMemo(() => {
    let seed = 19;

    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };

    return Array.from({ length: 85 }, () => ({
      x: random() * 1200,
      y: random() * 1500,
      r: 0.5 + random() * 1.5,
      delay: random() * 7,
      duration: 3 + random() * 5,
    }));
  }, []);

  const rings = [
    {
      r: 220,
      duration: 35,
      reverse: false,
      dash: 150,
      dots: 2,
    },
    {
      r: 310,
      duration: 49,
      reverse: true,
      dash: 120,
      dots: 3,
    },
    {
      r: 410,
      duration: 65,
      reverse: false,
      dash: 190,
      dots: 2,
    },
    {
      r: 520,
      duration: 84,
      reverse: true,
      dash: 105,
      dots: 3,
    },
    {
      r: 650,
      duration: 108,
      reverse: false,
      dash: 150,
      dots: 2,
    },
    {
      r: 780,
      duration: 135,
      reverse: true,
      dash: 115,
      dots: 3,
    },
  ];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {/* Base atmosphere */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#010308_0%,#020713_20%,#03102a_43%,#020b20_68%,#010308_100%)]" />

      {/* Large blue light sources */}
      <div
        className="absolute left-[-20vw] top-[18%] h-[55vw] w-[55vw] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(29,78,216,0.18), transparent 68%)",
          animation: "ambient-drift 22s ease-in-out infinite",
        }}
      />

      <div
        className="absolute right-[-18vw] top-[25%] h-[60vw] w-[60vw] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(14,165,233,0.13), transparent 67%)",
          animation: "ambient-drift-reverse 28s ease-in-out infinite",
        }}
      />

      <div
        className="absolute left-[25%] top-[62%] h-[45vw] w-[45vw] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(37,99,235,0.10), transparent 70%)",
          animation: "ambient-pulse 12s ease-in-out infinite",
        }}
      />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1200 1500"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient
            id="pageRingGradient"
            x1="0"
            y1="1"
            x2="1"
            y2="0"
          >
            <stop
              offset="0"
              stopColor="#1d4ed8"
              stopOpacity="0"
            />
            <stop
              offset="0.45"
              stopColor="#2f8bff"
              stopOpacity="0.16"
            />
            <stop
              offset="0.75"
              stopColor="#60a5fa"
              stopOpacity="0.48"
            />
            <stop
              offset="1"
              stopColor="#9bdcff"
              stopOpacity="0.85"
            />
          </linearGradient>

          <linearGradient
            id="pageCometGradient"
            x1="0"
            y1="0"
            x2="1"
            y2="0"
          >
            <stop
              offset="0"
              stopColor="#2f8bff"
              stopOpacity="0"
            />
            <stop
              offset="1"
              stopColor="#b9e8ff"
              stopOpacity="0.9"
            />
          </linearGradient>

          <radialGradient
            id="planetGlow"
            cx="960"
            cy="420"
            r="720"
            gradientUnits="userSpaceOnUse"
          >
            <stop
              offset="0"
              stopColor="#3b82f6"
              stopOpacity="0.35"
            />
            <stop
              offset="0.4"
              stopColor="#2563eb"
              stopOpacity="0.13"
            />
            <stop
              offset="1"
              stopColor="#2563eb"
              stopOpacity="0"
            />
          </radialGradient>

          <filter
            id="pageGlow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur
              stdDeviation="4"
              result="blur"
            />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter
            id="largeGlow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur
              stdDeviation="24"
              result="blur"
            />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Main planetary glow */}
        <circle
          cx="1080"
          cy="410"
          r="700"
          fill="url(#planetGlow)"
          style={{
            animation:
              "planet-glow 9s ease-in-out infinite",
          }}
        />

        {/* Stars */}
        {stars.map((star, index) => (
          <circle
            key={index}
            cx={star.x}
            cy={star.y}
            r={star.r}
            fill="#bfe8ff"
            style={{
              animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
            }}
          />
        ))}

        {/* Main orbital system */}
        <g>
          {rings.map((ring, index) => (
            <g key={ring.r}>
              <circle
                cx="1080"
                cy="410"
                r={ring.r}
                fill="none"
                stroke="url(#pageRingGradient)"
                strokeWidth={index === 0 ? 1.7 : 1}
                opacity={0.65}
                style={{
                  animation: `ring-breathe ${
                    6 + index
                  }s ease-in-out ${index * 0.5}s infinite`,
                }}
              />

              <g
                style={{
                  transformOrigin: "1080px 410px",
                  animation: `${
                    ring.reverse
                      ? "orbit-reverse"
                      : "orbit"
                  } ${ring.duration}s linear infinite`,
                }}
              >
                <circle
                  cx="1080"
                  cy="410"
                  r={ring.r}
                  fill="none"
                  stroke="url(#pageCometGradient)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  pathLength="1000"
                  strokeDasharray={`${ring.dash} ${
                    1000 - ring.dash
                  }`}
                  filter="url(#pageGlow)"
                />

                {Array.from({
                  length: ring.dots,
                }).map((_, dotIndex) => {
                  const angle =
                    Math.PI *
                    (0.48 +
                      dotIndex * 0.32 +
                      index * 0.08);

                  return (
                    <circle
                      key={dotIndex}
                      cx={
                        1080 +
                        ring.r * Math.cos(angle)
                      }
                      cy={
                        410 +
                        ring.r *
                          Math.sin(angle)
                      }
                      r={
                        dotIndex % 2 === 0
                          ? 3.3
                          : 2
                      }
                      fill="#bcecff"
                      filter="url(#pageGlow)"
                    />
                  );
                })}
              </g>
            </g>
          ))}
        </g>

        {/* Expanding energy ripples */}
        {[0, 3, 6].map((delay) => (
          <circle
            key={delay}
            cx="1080"
            cy="410"
            r="720"
            fill="none"
            stroke="#5fb0ff"
            strokeWidth="1"
            opacity="0.35"
            style={{
              transformOrigin: "1080px 410px",
              animation: `ripple 10s ease-out ${delay}s infinite`,
            }}
          />
        ))}

        {/* Long sweeping paths */}
        {[
          "M 120 610 Q 620 190 1200 40",
          "M 0 980 Q 500 530 1200 250",
          "M 260 1250 Q 730 760 1200 560",
          "M 0 410 Q 390 250 850 0",
          "M 430 1500 Q 760 1000 1200 850",
        ].map((path, index) => (
          <g key={path}>
            <path
              d={path}
              fill="none"
              stroke="#2f6bff"
              strokeOpacity="0.11"
            />

            <path
              d={path}
              fill="none"
              stroke="#8bd7ff"
              strokeWidth="1.6"
              strokeLinecap="round"
              pathLength="1000"
              strokeDasharray="85 915"
              filter="url(#pageGlow)"
              style={{
                animation: `path-dash ${
                  8 + index * 2.5
                }s linear ${index * -2}s infinite`,
              }}
            />
          </g>
        ))}

        {/* Large planet-like glow / edge */}
        <circle
          cx="1170"
          cy="570"
          r="245"
          fill="none"
          stroke="#2f8bff"
          strokeWidth="2"
          opacity="0.16"
          filter="url(#largeGlow)"
        />

        <circle
          cx="1170"
          cy="570"
          r="210"
          fill="none"
          stroke="#58b8ff"
          strokeWidth="1"
          opacity="0.2"
        />
      </svg>

      {/* Soft content readability gradient */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(1,3,8,0.94)_0%,rgba(1,3,8,0.68)_36%,rgba(1,3,8,0.28)_72%,rgba(1,3,8,0.45)_100%)]" />

      {/* Vertical fade */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(1,3,8,0.05)_0%,transparent_35%,rgba(1,3,8,0.2)_70%,rgba(1,3,8,0.75)_100%)]" />
    </div>
  );
}

/* =========================================================
   ACTION CARD
   ========================================================= */

function ActionCard({
  href,
  title,
  text,
  icon,
  className = "",
  children,
}: {
  href: string;
  title: string;
  text: string;
  icon: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex min-h-[17rem] flex-col overflow-hidden rounded-[2rem] border border-white/[0.07] bg-white/[0.025] p-7 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-[#2f8bff]/35 hover:bg-[#2f8bff]/[0.055] hover:shadow-[0_20px_80px_-25px_rgba(47,139,255,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2f8bff] ${className}`}
    >
      {/* Hover glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#2f8bff]/10 blur-3xl opacity-0 transition duration-500 group-hover:opacity-100"
      />

      <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1d4ed8]/35 to-[#38bdf8]/10 text-[#8acbff] ring-1 ring-white/[0.06]">
        <Icon d={icon} />
      </span>

      <h3 className="relative mt-5 text-xl font-semibold tracking-tight">
        {title}
      </h3>

      <p className="relative mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
        {text}
      </p>

      {children}

      <span className="relative mt-auto pt-7 text-sm text-[#83c8ff] transition duration-300 group-hover:translate-x-1">
        Open {title.toLowerCase()} →
      </span>
    </Link>
  );
}

/* =========================================================
   HOME
   ========================================================= */

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [block, setBlock] = useState<number | null>(
    null
  );

  const [walletMsg, setWalletMsg] = useState("");

  /* -------------------------------------------------------
     Mobile menu blur state
     ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     Live Arc block
     ------------------------------------------------------- */

  useEffect(() => {
    let alive = true;

    const loadBlock = async () => {
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

        const json = await response.json();

        if (alive && json?.result) {
          setBlock(
            parseInt(json.result, 16)
          );
        }
      } catch {
        /* Keep previous value */
      }
    };

    loadBlock();

    const interval = setInterval(
      loadBlock,
      5000
    );

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  /* -------------------------------------------------------
     Add Arc Mainnet to wallet
     ------------------------------------------------------- */

  const addArcToWallet = async () => {
    const eth = (window as any).ethereum;

    if (!eth) {
      setWalletMsg(
        "No wallet found. Install an EVM wallet first."
      );
      return;
    }

    try {
      await eth.request({
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
        "Request was cancelled or failed."
      );
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#010308] text-white">
      {/* =====================================================
          GLOBAL ANIMATION STYLES
          ===================================================== */}

      <style>{`
        @keyframes orbit {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes orbit-reverse {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(-360deg);
          }
        }

        @keyframes path-dash {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: -1000;
          }
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 0.12;
          }
          50% {
            opacity: 0.9;
          }
        }

        @keyframes ring-breathe {
          0%, 100% {
            opacity: 0.35;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes ripple {
          0% {
            transform: scale(0.08);
            opacity: 0.55;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }

        @keyframes planet-glow {
          0%, 100% {
            opacity: 0.55;
          }
          50% {
            opacity: 0.95;
          }
        }

        @keyframes ambient-drift {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(5vw, -3vw, 0) scale(1.12);
          }
        }

        @keyframes ambient-drift-reverse {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(-4vw, 3vw, 0) scale(1.1);
          }
        }

        @keyframes ambient-pulse {
          0%, 100% {
            opacity: 0.45;
            transform: scale(0.95);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.08);
          }
        }

        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        .reveal {
          opacity: 0;
          transform: translateY(34px);
          transition:
            opacity 0.9s cubic-bezier(.2,.7,.2,1),
            transform 0.9s cubic-bezier(.2,.7,.2,1);
          transition-delay: var(--delay, 0ms);
        }

        .reveal-in {
          opacity: 1;
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          .reveal {
            opacity: 1;
            transform: none;
            transition: none;
          }

          svg *,
          .marquee,
          .ambient-drift,
          .ambient-drift-reverse {
            animation: none !important;
          }
        }
      `}</style>

      {/* =====================================================
          ONE CONTINUOUS BACKGROUND
          IMPORTANT:
          This is outside all page sections.
          ===================================================== */}

      <BackgroundArt />

      {/* =====================================================
          PAGE CONTENT
          ===================================================== */}

      <div className="relative z-10">
        <Header />

        <div
          className={`min-w-0 transition-[filter] duration-300 ${
            mobileMenuOpen
              ? "blur-md"
              : "blur-0"
          }`}
        >
          {/* =================================================
              HERO
              ================================================= */}

          <section
            className={`relative overflow-hidden border-b border-white/[0.045] ${CONTAINER}`}
          >
            <div className="relative min-h-[570px] py-20 sm:min-h-[620px] sm:py-24 lg:min-h-[650px] lg:py-28 xl:min-h-[680px] xl:py-[7vw]">
              {/* Local hero lighting */}
              <div
                aria-hidden
                className="pointer-events-none absolute -right-20 top-20 h-[420px] w-[420px] rounded-full bg-[#168cff]/10 blur-[100px]"
              />

              <div className="relative z-10 max-w-5xl">
                <Reveal>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#2f6bff]/35 bg-[#07142e]/50 px-4 py-2 text-sm text-[#b8d1ff] backdrop-blur-md">
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_14px_#34d399]" />
                    Arc Network
                  </div>
                </Reveal>

                <Reveal delay={120}>
                  <h1 className="mt-7 max-w-6xl text-5xl font-semibold leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl xl:text-[clamp(4.5rem,7vw,8.5rem)]">
                    One place.{" "}
                    <span className="bg-gradient-to-r from-[#168cff] via-[#2f8bff] to-[#72d7ff] bg-clip-text text-transparent">
                      Every move.
                    </span>
                  </h1>
                </Reveal>

                <Reveal delay={220}>
                  <p className="mt-7 text-xl text-slate-300 sm:text-2xl">
                    A simple interface for Arc
                  </p>

                  <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
                    Send, swap and bridge USDC on Arc
                    mainnet. Move assets through a
                    fast, stablecoin-native network
                    built for onchain finance.
                  </p>
                </Reveal>

                <Reveal delay={330}>
                  <div className="mt-9 flex flex-wrap gap-3">
                    <Link
                      href="/swap"
                      className={BTN}
                    >
                      Start swapping
                    </Link>

                    <Link
                      href="/bridge"
                      className="rounded-full border border-white/[0.1] bg-white/[0.035] px-7 py-3 font-medium backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#2f8bff]/35 hover:bg-[#2f8bff]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2f8bff]"
                    >
                      Bridge to Arc
                    </Link>
                  </div>
                </Reveal>

                {/* Live network stats */}
                <Reveal delay={430}>
                  <div className="mt-16 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-7 sm:grid-cols-4">
                    {[
                      [
                        "Latest block",
                        block
                          ? block.toLocaleString()
                          : "…",
                      ],
                      [
                        "Chain ID",
                        String(ARC.chainId),
                      ],
                      ["Gas token", "USDC"],
                      ["Finality", "< 1 sec"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="relative"
                      >
                        <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                          {label}
                        </div>

                        <div className="mt-2 text-xl font-semibold tabular-nums text-slate-100">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          {/* =================================================
              ACTIONS
              ================================================= */}

          <section
            className={`relative py-24 sm:py-28 xl:py-[7vw] ${CONTAINER}`}
          >
            <Reveal>
              <div className="max-w-3xl">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#62baff]">
                  Your onchain toolkit
                </p>

                <h2 className={`mt-3 ${H2}`}>
                  Everything you do on Arc
                </h2>

                <p className="mt-4 max-w-xl text-slate-400">
                  Move assets, exchange stablecoins,
                  bridge liquidity and keep track of
                  every transaction from one interface.
                </p>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-4 lg:grid-cols-3">
              {/* Swap */}
              <Reveal className="lg:col-span-2 lg:row-span-2">
                <ActionCard
                  href="/swap"
                  title="Swap"
                  text="Exchange stablecoins onchain with clear pricing and USDC gas."
                  icon="M7 4v13m0 0-3-3m3 3 3-3M17 20V7m0 0-3 3m3-3 3 3"
                  className="min-h-[30rem]"
                >
                  <div
                    aria-hidden
                    className="mt-9 max-w-md rounded-2xl border border-white/[0.06] bg-[#020713]/65 p-4 shadow-[0_25px_90px_-30px_rgba(47,139,255,0.65)]"
                  >
                    <div className="flex items-center justify-between rounded-xl bg-white/[0.045] px-4 py-3">
                      <span className="text-sm text-slate-500">
                        You pay
                      </span>

                      <span className="font-semibold">
                        USDC
                      </span>
                    </div>

                    <div className="mx-auto -my-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-[#07142e] text-[#7dc8ff]">
                      ↓
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-white/[0.045] px-4 py-3">
                      <span className="text-sm text-slate-500">
                        You receive
                      </span>

                      <span className="font-semibold">
                        EURC
                      </span>
                    </div>

                    <div className="mt-3 rounded-xl bg-gradient-to-r from-[#1d4ed8] to-[#2f8bff] py-3 text-center text-sm font-medium shadow-[0_8px_25px_rgba(47,139,255,0.25)]">
                      Preview swap
                    </div>
                  </div>
                </ActionCard>
              </Reveal>

              {/* Send */}
              <Reveal delay={120}>
                <ActionCard
                  href="/send"
                  title="Send"
                  text="Send USDC to any address while paying gas in USDC."
                  icon="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"
                />
              </Reveal>

              {/* Bridge */}
              <Reveal delay={220}>
                <ActionCard
                  href="/bridge"
                  title="Bridge"
                  text="Move USDC in and out of Arc from supported networks."
                  icon="M3 18c0-6 4-10 9-10s9 4 9 10M3 18h18M8 18v-4M16 18v-4M12 18v-6"
                />
              </Reveal>

              {/* Activity */}
              <Reveal
                delay={120}
                className="lg:col-span-3"
              >
                <ActionCard
                  href="/activity"
                  title="Activity"
                  text="Track wallet transactions and follow your onchain activity in one place."
                  icon="M3 12h4l3-8 4 16 3-8h4"
                  className="min-h-[14rem]"
                >
                  <div
                    aria-hidden
                    className="mt-7 hidden max-w-xl items-end gap-1 sm:flex"
                  >
                    {[28, 48, 35, 64, 44, 78, 52, 91, 61, 74, 47, 86].map(
                      (height, index) => (
                        <span
                          key={index}
                          className="w-1.5 rounded-full bg-gradient-to-t from-[#1d4ed8] to-[#63c9ff] opacity-60 transition-all duration-500 group-hover:opacity-100"
                          style={{
                            height: `${height}px`,
                          }}
                        />
                      )
                    )}
                  </div>
                </ActionCard>
              </Reveal>
            </div>
          </section>

          {/* =================================================
              ARC INTRO
              ================================================= */}

          <section
            className={`relative py-24 sm:py-28 xl:py-[7vw] ${CONTAINER}`}
          >
            <div className="grid gap-14 lg:grid-cols-[0.85fr_1.5fr] lg:items-start">
              <Reveal>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#62baff]">
                  The network
                </p>

                <h2 className={`mt-3 ${H2}`}>
                  Built around
                  <br />
                  stablecoins.
                </h2>

                <p className="mt-6 max-w-md leading-relaxed text-slate-400">
                  Arc is an EVM-compatible Layer 1
                  designed for onchain finance and
                  stablecoin-powered applications.
                </p>

                <a
                  href={ARC.docs}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-7 inline-flex items-center gap-2 text-sm text-[#82caff] underline-offset-4 transition hover:text-white hover:underline"
                >
                  Explore Arc docs
                  <span>↗</span>
                </a>
              </Reveal>

              <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
                {FEATURES.map((feature, index) => (
                  <Reveal
                    key={feature.title}
                    delay={index * 100}
                  >
                    <div className="group">
                      <div className="flex gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#2f8bff]/15 bg-[#2f8bff]/[0.07] text-[#82caff] transition duration-300 group-hover:border-[#2f8bff]/35 group-hover:bg-[#2f8bff]/15">
                          <Icon
                            d={feature.icon}
                            size={20}
                          />
                        </span>

                        <div>
                          <h3 className="font-semibold">
                            {feature.title}
                          </h3>

                          <p className="mt-2 text-sm leading-relaxed text-slate-400">
                            {feature.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* =================================================
              NETWORK
              ================================================= */}

          <section
            className={`relative py-24 sm:py-28 xl:py-[7vw] ${CONTAINER}`}
          >
            <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
              <Reveal>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#62baff]">
                  Connect
                </p>

                <h2 className={`mt-3 ${H2}`}>
                  Add Arc
                  <br />
                  to your wallet.
                </h2>

                <p className="mt-5 max-w-md text-slate-400">
                  Add Arc Mainnet directly to your
                  EVM wallet using the official network
                  configuration.
                </p>

                <button
                  onClick={addArcToWallet}
                  className={`mt-7 ${BTN}`}
                >
                  Add Arc Mainnet
                </button>

                <p
                  role="status"
                  className="mt-4 min-h-5 text-sm text-slate-400"
                >
                  {walletMsg}
                </p>
              </Reveal>

              <Reveal delay={150}>
                <div
                  className={`overflow-hidden rounded-[2rem] ${SOFT}`}
                >
                  <div className="border-b border-white/[0.06] px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          Arc Mainnet
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Network configuration
                        </p>
                      </div>

                      <span className="flex items-center gap-2 rounded-full bg-emerald-400/[0.08] px-3 py-1.5 text-xs text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                        Live
                      </span>
                    </div>
                  </div>

                  <table className="w-full text-left text-sm">
                    <tbody>
                      {NETWORK_ROWS.map(
                        ([key, value]) => (
                          <tr
                            key={key}
                            className="border-b border-white/[0.045] last:border-0"
                          >
                            <th
                              scope="row"
                              className="whitespace-nowrap px-6 py-4 font-normal text-slate-500"
                            >
                              {key}
                            </th>

                            <td className="px-6 py-4 font-medium text-slate-200">
                              {value}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </Reveal>
            </div>
          </section>

          {/* =================================================
              USE CASES
              ================================================= */}

          <section className="relative overflow-hidden py-24 sm:py-28 xl:py-[7vw]">
            <Reveal className={CONTAINER}>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#62baff]">
                Possibilities
              </p>

              <h2 className={`mt-3 ${H2}`}>
                What can move on Arc?
              </h2>
            </Reveal>

            <Reveal delay={150}>
              <div className="relative mt-10 overflow-hidden">
                <div
                  className="flex w-max gap-3"
                  style={{
                    animation:
                      "marquee 42s linear infinite",
                  }}
                >
                  {[
                    ...USE_CASES,
                    ...USE_CASES,
                    ...USE_CASES,
                    ...USE_CASES,
                  ].map((useCase, index) => (
                    <span
                      key={index}
                      className="whitespace-nowrap rounded-full border border-[#2f8bff]/15 bg-[#07142e]/45 px-6 py-3 text-sm text-slate-300 backdrop-blur-sm transition hover:border-[#2f8bff]/35 hover:bg-[#2f8bff]/10"
                    >
                      {useCase}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </section>

          {/* =================================================
              FINAL CTA
              ================================================= */}

          <section
            className={`relative py-24 sm:py-32 xl:py-[8vw] ${CONTAINER}`}
          >
            <Reveal>
              <div className="relative overflow-hidden rounded-[2.5rem] border border-[#2f8bff]/20 bg-gradient-to-br from-[#0a1a4a]/35 via-[#061126]/20 to-transparent px-7 py-16 text-center sm:px-12 sm:py-24">
                {/* CTA light */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#168cff]/10 blur-[90px]"
                />

                <div className="relative">
                  <p className="text-sm uppercase tracking-[0.2em] text-[#62baff]">
                    Start moving
                  </p>

                  <h2
                    className={`mt-3 ${H2}`}
                  >
                    Ready to move on Arc?
                  </h2>

                  <p className="mx-auto mt-5 max-w-lg text-slate-400">
                    Connect your wallet and make
                    your first move through
                    AlabaamaFi.
                  </p>

                  <div className="mt-9 flex flex-wrap justify-center gap-3">
                    <Link
                      href="/send"
                      className={BTN}
                    >
                      Send USDC
                    </Link>

                    <Link
                      href="/swap"
                      className="rounded-full border border-white/[0.1] bg-white/[0.035] px-7 py-3 font-medium backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#2f8bff]/35 hover:bg-[#2f8bff]/10"
                    >
                      Swap
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          {/* =================================================
              FOOTER
              ================================================= */}

          <footer className="relative border-t border-white/[0.045]">
            <div
              className={`flex flex-col gap-5 py-9 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between ${CONTAINER}`}
            >
              <p>
                © {new Date().getFullYear()}{" "}
                AlabaamaFi. An independent interface
                for Arc.
              </p>

              <nav className="flex flex-wrap gap-x-6 gap-y-3">
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
