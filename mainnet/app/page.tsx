"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Header from "@/components/Header";

/* ---------- Arc Mainnet ---------- */

const ARC = {
  chainId: 5042,
  chainIdHex: "0x13b2",
  rpc: "https://rpc.mainnet.arc.io",
  explorer: "https://explorer.arc.io",
  docs: "https://docs.arc.io",
  x: "https://x.com/arc",
};

/* ---------- Shared styles ---------- */

const CONTAINER =
  "w-full px-5 sm:px-8 lg:px-12 xl:px-[5vw]";

const H2 =
  "text-3xl font-semibold tracking-[-0.035em] sm:text-4xl xl:text-[clamp(2rem,3vw,3.5rem)]";

const BUTTON =
  "rounded-full bg-gradient-to-r from-[#1599ff] via-[#2377ff] to-[#3039e8] px-7 py-3.5 font-semibold text-white shadow-[0_8px_30px_rgba(35,119,255,0.28)] transition duration-200 hover:-translate-y-0.5 hover:brightness-110";

/* ---------- Data ---------- */

const FEATURES = [
  {
    title: "USDC as gas",
    text: "Fees are paid in USDC, keeping transaction costs predictable.",
    icon: "M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  },
  {
    title: "Sub-second finality",
    text: "Arc is designed for fast deterministic settlement.",
    icon: "M13 2 3 14h9l-1 8 10-12h-9l1-8z",
  },
  {
    title: "EVM compatible",
    text: "Use familiar wallets, tools and Solidity-based applications.",
    icon: "m16 18 6-6-6-6M8 6l-6 6 6 6",
  },
  {
    title: "Built for payments",
    text: "Designed around stablecoins, payments and onchain finance.",
    icon: "M2 7h20v12H2zM2 11h20",
  },
];

const NETWORK_ROWS: [string, string][] = [
  ["Network", "Arc Mainnet"],
  ["Chain ID", `${ARC.chainId} (${ARC.chainIdHex})`],
  ["Currency", "USDC"],
  ["RPC", ARC.rpc.replace("https://", "")],
  ["Explorer", ARC.explorer.replace("https://", "")],
];

/* ---------- Icons ---------- */

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

/* ---------- Scroll reveal ---------- */

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
    const element = ref.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -6% 0px",
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${
        shown ? "reveal-in" : ""
      } ${className}`}
      style={{
        ["--delay" as string]: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ---------- Hero orbital artwork ---------- */

function OrbitArt() {
  const CX = 1150;
  const CY = 690;

  const rings = [
    { r: 280, duration: 42, reverse: false },
    { r: 380, duration: 58, reverse: true },
    { r: 500, duration: 76, reverse: false },
    { r: 630, duration: 96, reverse: true },
  ];

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1200 620"
      preserveAspectRatio="xMaxYMax slice"
    >
      <defs>
        <linearGradient
          id="orbit-gradient"
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
            offset="0.58"
            stopColor="#3286ff"
            stopOpacity="0.35"
          />

          <stop
            offset="1"
            stopColor="#6cc8ff"
            stopOpacity="0.9"
          />
        </linearGradient>

        <radialGradient id="planet-gradient">
          <stop
            offset="0"
            stopColor="#3ba0ff"
            stopOpacity="0.95"
          />

          <stop
            offset="0.35"
            stopColor="#1166d8"
            stopOpacity="0.75"
          />

          <stop
            offset="0.72"
            stopColor="#06255b"
            stopOpacity="0.7"
          />

          <stop
            offset="1"
            stopColor="#020408"
            stopOpacity="0"
          />
        </radialGradient>

        <filter
          id="orbit-glow"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
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
      </defs>

      {/* Planet */}

      <circle
        cx="1230"
        cy="640"
        r="310"
        fill="url(#planet-gradient)"
      />

      {/* Large atmospheric glow */}

      <circle
        cx="1230"
        cy="640"
        r="250"
        fill="none"
        stroke="#2d82ff"
        strokeOpacity="0.16"
        strokeWidth="2"
      />

      {/* Orbit rings */}

      {rings.map((ring) => (
        <g key={ring.r}>
          <circle
            cx={CX}
            cy={CY}
            r={ring.r}
            fill="none"
            stroke="url(#orbit-gradient)"
            strokeWidth="1"
            opacity="0.75"
          />

          <circle
            cx={CX}
            cy={CY}
            r={ring.r}
            fill="none"
            stroke="#7dc9ff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="90 910"
            filter="url(#orbit-glow)"
            className="orbit-line"
            style={{
              transformOrigin: `${CX}px ${CY}px`,
              animation: `${
                ring.reverse
                  ? "orbit-reverse"
                  : "orbit"
              } ${ring.duration}s linear infinite`,
            }}
          />
        </g>
      ))}

      {/* Fine sweeping lines */}

      <path
        d="M520 640 Q850 310 1200 80"
        fill="none"
        stroke="#3b82f6"
        strokeOpacity="0.15"
      />

      <path
        d="M690 620 Q930 420 1200 230"
        fill="none"
        stroke="#60a5fa"
        strokeOpacity="0.18"
      />
    </svg>
  );
}

/* ---------- Action card ---------- */

function ActionCard({
  href,
  title,
  text,
  icon,
  children,
  className = "",
}: {
  href: string;
  title: string;
  text: string;
  icon: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-white/[0.025] p-6 transition duration-300 hover:border-[#3185ff]/40 hover:bg-white/[0.045] hover:shadow-[0_0_60px_-25px_rgba(47,139,255,0.7)] ${className}`}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1678ff]/10 text-[#69b7ff]">
        <Icon d={icon} />
      </div>

      <h3 className="mt-5 text-xl font-semibold tracking-tight">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-white/45">
        {text}
      </p>

      {children}

      <div className="mt-6 text-sm font-medium text-[#65b5ff] transition-transform duration-200 group-hover:translate-x-1">
        Open {title.toLowerCase()} →
      </div>
    </Link>
  );
}

/* ---------- Home ---------- */

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [block, setBlock] = useState<number | null>(
    null
  );

  const [walletMsg, setWalletMsg] = useState("");

  /* Mobile menu blur */

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

    return () => {
      window.removeEventListener(
        "mobile-menu-state",
        handleMenuState
      );
    };
  }, []);

  /* Live Arc block */

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
          setBlock(parseInt(json.result, 16));
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

  /* Add Arc Mainnet */

  const addArcToWallet = async () => {
    const ethereum = (
      window as any
    ).ethereum;

    if (!ethereum) {
      setWalletMsg(
        "No wallet found. Install an EVM wallet first."
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
            blockExplorerUrls: [ARC.explorer],
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
    <main className="relative min-h-screen overflow-x-hidden bg-[#020408] text-white">
      <style>{`
        @keyframes orbit {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes orbit-reverse {
          to {
            transform: rotate(-360deg);
          }
        }

        @keyframes hero-glow {
          0%, 100% {
            transform: scale(1);
            opacity: .7;
          }

          50% {
            transform: scale(1.08);
            opacity: 1;
          }
        }

        .reveal {
          opacity: 0;
          transform: translateY(24px);
          transition:
            opacity .8s cubic-bezier(.2,.7,.2,1),
            transform .8s cubic-bezier(.2,.7,.2,1);
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

          .orbit-line {
            animation: none !important;
          }
        }
      `}</style>

      {/* Continuous page background */}

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_12%,rgba(19,91,210,0.10),transparent_30%),linear-gradient(180deg,#020408_0%,#020711_42%,#02050b_100%)]" />

        <div className="absolute left-1/2 top-[38rem] h-[35rem] w-[70rem] -translate-x-1/2 rounded-full bg-[#0757c9]/[0.045] blur-[140px]" />
      </div>

      <div className="relative z-10">
        <Header />

        <div
          className={`min-w-0 transition-[filter] duration-300 ${
            mobileMenuOpen
              ? "blur-md"
              : "blur-0"
          }`}
        >
          {/* ================= HERO ================= */}

          <section className="relative overflow-hidden border-b border-white/[0.07]">
            <OrbitArt />

            {/* Left fade so text stays readable */}

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#020408_0%,#020408_30%,rgba(2,4,8,0.72)_52%,rgba(2,4,8,0.18)_78%,transparent_100%)]"
            />

            {/* Bottom fade */}

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#020408] to-transparent"
            />

            <div
              className={`relative ${CONTAINER} pb-20 pt-14 sm:pb-24 sm:pt-20 lg:pb-28 lg:pt-24`}
            >
              <div className="max-w-6xl">
                <Reveal>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#3182ff]/45 bg-[#071326]/75 px-4 py-2 text-sm font-medium text-[#b5d0ff] backdrop-blur-xl">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#18d99a] shadow-[0_0_12px_rgba(24,217,154,0.7)]" />

                    <span>Arc Network</span>
                  </div>
                </Reveal>

                <Reveal delay={100}>
                  <h1 className="mt-7 max-w-5xl text-[3.4rem] font-black leading-[0.92] tracking-[-0.06em] sm:text-6xl md:text-7xl lg:text-[5.8rem] xl:text-[6.8rem]">
                    <span className="text-white">
                      One place.
                    </span>{" "}
                    <span className="bg-gradient-to-r from-[#3195ff] via-[#1783ff] to-[#65c8ff] bg-clip-text text-transparent">
                      Every move.
                    </span>
                  </h1>
                </Reveal>

                <Reveal delay={180}>
                  <p className="mt-6 max-w-xl text-lg font-medium leading-8 text-white/55 sm:text-xl">
                    A simple interface for Arc
                  </p>

                  <p className="mt-4 max-w-xl text-sm leading-7 text-white/35 sm:text-base">
                    Send, swap and bridge assets on
                    Arc mainnet through one clean
                    interface.
                  </p>
                </Reveal>

                <Reveal delay={280}>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                      href="/swap"
                      className={BUTTON}
                    >
                      Start swapping
                    </Link>

                    <Link
                      href="/send"
                      className="rounded-full border border-white/[0.13] bg-white/[0.04] px-7 py-3.5 font-semibold text-white/80 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[#3185ff]/40 hover:bg-white/[0.07] hover:text-white"
                    >
                      Send USDC
                    </Link>
                  </div>
                </Reveal>

                <Reveal delay={360}>
                  <div className="mt-12 flex flex-wrap gap-x-10 gap-y-5 border-t border-white/[0.07] pt-6 sm:mt-14">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-white/25">
                        Latest block
                      </p>

                      <p className="mt-1 text-base font-semibold tabular-nums text-white/80">
                        {block
                          ? block.toLocaleString()
                          : "…"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-white/25">
                        Chain ID
                      </p>

                      <p className="mt-1 text-base font-semibold text-white/80">
                        {ARC.chainId}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-white/25">
                        Gas
                      </p>

                      <p className="mt-1 text-base font-semibold text-white/80">
                        USDC
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-white/25">
                        Finality
                      </p>

                      <p className="mt-1 text-base font-semibold text-white/80">
                        &lt; 1 sec
                      </p>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          {/* ================= ACTIONS ================= */}

          <section
            className={`${CONTAINER} border-b border-white/[0.06] py-16 sm:py-20 lg:py-24`}
          >
            <Reveal>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5dafff]">
                    Explore
                  </p>

                  <h2 className={`${H2} mt-2`}>
                    Everything you need
                  </h2>
                </div>

                <p className="max-w-sm text-sm leading-6 text-white/35">
                  Move and manage assets on Arc
                  without leaving the interface.
                </p>
              </div>
            </Reveal>

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              <Reveal className="lg:col-span-2">
                <ActionCard
                  href="/swap"
                  title="Swap"
                  text="Swap stablecoins onchain with clear pricing and USDC gas."
                  icon="M7 4v13m0 0-3-3m3 3 3-3M17 20V7m0 0-3 3m3-3 3 3"
                  className="min-h-[20rem]"
                >
                  <div className="mt-7 max-w-md rounded-2xl border border-white/[0.07] bg-[#030814]/80 p-3">
                    <div className="flex items-center justify-between rounded-xl bg-white/[0.035] px-4 py-3">
                      <span className="text-xs text-white/35">
                        You pay
                      </span>

                      <span className="text-sm font-semibold">
                        USDC
                      </span>
                    </div>

                    <div className="mx-auto -my-1 flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.08] bg-[#071326] text-xs text-[#69b7ff]">
                      ↓
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-white/[0.035] px-4 py-3">
                      <span className="text-xs text-white/35">
                        You receive
                      </span>

                      <span className="text-sm font-semibold">
                        EURC
                      </span>
                    </div>
                  </div>
                </ActionCard>
              </Reveal>

              <Reveal delay={100}>
                <ActionCard
                  href="/send"
                  title="Send"
                  text="Send USDC to any address while paying gas in USDC."
                  icon="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"
                  className="h-full min-h-[15rem]"
                />
              </Reveal>

              <Reveal delay={180}>
                <ActionCard
                  href="/bridge"
                  title="Bridge"
                  text="Move USDC between Arc and supported networks."
                  icon="M3 18c0-6 4-10 9-10s9 4 9 10M3 18h18M8 18v-4M16 18v-4M12 18v-6"
                  className="h-full min-h-[15rem]"
                />
              </Reveal>

              <Reveal
                delay={260}
                className="lg:col-span-1"
              >
                <ActionCard
                  href="/activity"
                  title="Activity"
                  text="Track your wallet transactions in one place."
                  icon="M3 12h4l3-8 4 16 3-8h4"
                  className="h-full min-h-[15rem]"
                />
              </Reveal>
            </div>
          </section>

          {/* ================= WHY ARC ================= */}

          <section
            className={`${CONTAINER} border-b border-white/[0.06] py-16 sm:py-20 lg:py-24`}
          >
            <Reveal>
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5dafff]">
                  The network
                </p>

                <h2 className={`${H2} mt-2`}>
                  Built around stablecoins
                </h2>

                <p className="mt-5 max-w-xl text-sm leading-7 text-white/40 sm:text-base">
                  Arc is an EVM-compatible Layer 1
                  designed for fast onchain finance,
                  stablecoin payments and real-world
                  applications.
                </p>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature, index) => (
                <Reveal
                  key={feature.title}
                  delay={index * 80}
                >
                  <div className="border-l border-white/[0.08] pl-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1678ff]/10 text-[#69b7ff]">
                      <Icon
                        d={feature.icon}
                        size={19}
                      />
                    </div>

                    <h3 className="mt-5 text-base font-semibold">
                      {feature.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-white/35">
                      {feature.text}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ================= NETWORK ================= */}

          <section
            className={`${CONTAINER} border-b border-white/[0.06] py-16 sm:py-20 lg:py-24`}
          >
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <Reveal>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5dafff]">
                  Mainnet
                </p>

                <h2 className={`${H2} mt-2`}>
                  Add Arc to your wallet
                </h2>

                <p className="mt-4 max-w-md text-sm leading-7 text-white/40 sm:text-base">
                  Add the Arc Mainnet network
                  configuration directly to your
                  EVM wallet.
                </p>

                <button
                  type="button"
                  onClick={addArcToWallet}
                  className={`mt-7 ${BUTTON}`}
                >
                  Add Arc Mainnet
                </button>

                <p
                  role="status"
                  className="mt-3 min-h-5 text-sm text-white/40"
                >
                  {walletMsg}
                </p>
              </Reveal>

              <Reveal delay={120}>
                <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                  <table className="w-full text-left text-sm">
                    <tbody>
                      {NETWORK_ROWS.map(
                        ([key, value]) => (
                          <tr
                            key={key}
                            className="border-b border-white/[0.06] last:border-0"
                          >
                            <th
                              scope="row"
                              className="whitespace-nowrap px-5 py-4 font-normal text-white/30 sm:px-6"
                            >
                              {key}
                            </th>

                            <td className="px-5 py-4 font-medium text-white/75 sm:px-6">
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

          {/* ================= SIMPLE CTA ================= */}

          <section
            className={`${CONTAINER} py-16 sm:py-20 lg:py-24`}
          >
            <Reveal>
              <div className="relative overflow-hidden rounded-[1.75rem] border border-[#267cff]/25 bg-gradient-to-r from-[#07142c] via-[#061024] to-[#07142c] px-7 py-12 sm:px-12 sm:py-14">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#1478ff]/15 blur-3xl"
                />

                <div className="relative flex flex-col justify-between gap-8 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5dafff]">
                      AlabaamaFi
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                      One place. Every move.
                    </h2>

                    <p className="mt-2 text-sm text-white/35">
                      Explore Arc through a simple
                      interface.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/send"
                      className={BUTTON}
                    >
                      Send USDC
                    </Link>

                    <Link
                      href="/activity"
                      className="rounded-full border border-white/[0.12] bg-white/[0.04] px-7 py-3.5 font-semibold text-white/75 transition hover:bg-white/[0.07] hover:text-white"
                    >
                      Activity
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          {/* ================= FOOTER ================= */}

          <footer className="border-t border-white/[0.06]">
            <div
              className={`${CONTAINER} flex flex-col gap-4 py-7 text-sm text-white/30 sm:flex-row sm:items-center sm:justify-between`}
            >
              <p>
                © {new Date().getFullYear()}{" "}
                AlabaamaFi. An independent interface
                for Arc.
              </p>

              <nav className="flex gap-6">
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
