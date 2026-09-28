"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Header from "@/components/Header";

/* ---------- Arc mainnet constants (source: docs.arc.io/arc/references/rpc-endpoints) ---------- */
const ARC = {
  chainId: 5042,
  chainIdHex: "0x13b2",
  rpc: "https://rpc.mainnet.arc.io",
  explorer: "https://explorer.arc.io",
  docs: "https://docs.arc.io",
  x: "https://x.com/arc",
};

const CONTAINER = "w-full px-5 sm:px-8 lg:px-12 xl:px-[5vw]";
const H2 = "text-3xl font-semibold tracking-tight xl:text-[clamp(1.875rem,2.4vw,3.5rem)]";
const SOFT = "bg-gradient-to-br from-white/[0.05] to-white/[0.01] backdrop-blur-[2px]";
const BTN = "rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#2f8bff] px-7 py-3 font-medium shadow-[0_8px_30px_rgba(37,99,235,0.4)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f8bff]";

const FEATURES = [
  { title: "USDC as gas", text: "Fees are paid in USDC, so costs stay predictable and dollar-denominated.", icon: "M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
  { title: "Sub-second finality", text: "Blocks settle deterministically in under a second on Malachite BFT consensus.", icon: "M13 2 3 14h9l-1 8 10-12h-9l1-8z" },
  { title: "EVM compatible", text: "Use the wallets, tools, and Solidity contracts you already know.", icon: "m16 18 6-6-6-6M8 6l-6 6 6 6" },
  { title: "Built for payments", text: "Designed for payments, stablecoin FX, lending, and tokenized assets.", icon: "M2 7h20v12H2zM2 11h20" },
];

const NETWORK_ROWS: [string, string][] = [
  ["Network", "Arc Mainnet"],
  ["Chain ID", `${ARC.chainId} (${ARC.chainIdHex})`],
  ["Currency", "USDC"],
  ["RPC", ARC.rpc.replace("https://", "")],
  ["Explorer", ARC.explorer.replace("https://", "")],
];

const USE_CASES = ["Peer-to-peer payments", "eCommerce checkout", "Stablecoin FX", "Agentic economy", "Prediction markets", "Borrow and lend"];

/* ---------- helpers ---------- */
function Icon({ d, size = 22 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/** Fades + slides content in when it scrolls into view. */
function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${shown ? "in" : ""} ${className}`} style={{ ["--d" as string]: `${delay}ms` }}>
      {children}
    </div>
  );
}

/** Fixed full-page animated background (same look as the hero): orbits, comets, ripples, stars. */
function BackgroundArt() {
  const stars = useMemo(() => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    return Array.from({ length: 56 }, () => ({ x: rnd() * 1200, y: rnd() * 700, r: 0.7 + rnd() * 1.4, d: rnd() * 6, t: 3 + rnd() * 4 }));
  }, []);

  const main = { cx: 1150, cy: 780, rings: [
    { r: 230, dur: 34, rev: false, len: 170, dots: 2, w: 1.8 },
    { r: 310, dur: 48, rev: true, len: 120, dots: 3, w: 1.3 },
    { r: 400, dur: 62, rev: false, len: 210, dots: 2, w: 1.2 },
    { r: 500, dur: 80, rev: true, len: 100, dots: 3, w: 1 },
    { r: 615, dur: 104, rev: false, len: 150, dots: 2, w: 1 },
    { r: 745, dur: 132, rev: true, len: 110, dots: 3, w: 1 },
  ] };
  const side = { cx: -40, cy: 120, rings: [
    { r: 200, dur: 66, rev: true, len: 120, dots: 2, w: 1 },
    { r: 300, dur: 90, rev: false, len: 90, dots: 2, w: 1 },
    { r: 420, dur: 120, rev: true, len: 130, dots: 3, w: 1 },
  ] };

  const cluster = (c: typeof main, op: number, key: string) => (
    <g key={key} opacity={op}>
      {c.rings.map((o, i) => (
        <g key={o.r}>
          <circle cx={c.cx} cy={c.cy} r={o.r} fill="none" stroke="url(#ringGrad)" strokeWidth={o.w} className="anim" style={{ animation: `breathe ${7 + i}s ease-in-out ${i * 0.8}s infinite` }} />
          <g className="anim" style={{ transformOrigin: `${c.cx}px ${c.cy}px`, animation: `${o.rev ? "spin-rev" : "spin"} ${o.dur}s linear infinite` }}>
            <circle cx={c.cx} cy={c.cy} r={o.r} fill="none" stroke="url(#cometGrad)" strokeWidth={o.w + 1.6} strokeLinecap="round" pathLength={1000} strokeDasharray={`${o.len} ${1000 - o.len}`} filter="url(#glow)" />
            {Array.from({ length: o.dots }).map((_, k) => {
              const ang = Math.PI * (0.52 + k * 0.3 + i * 0.09);
              return <circle key={k} cx={c.cx + o.r * Math.cos(ang)} cy={c.cy - o.r * Math.sin(ang)} r={k % 2 ? 2 : 3.4} fill="#b8e8ff" filter="url(#glow)" />;
            })}
          </g>
        </g>
      ))}
    </g>
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[115vh] min-h-[640px] overflow-hidden [-webkit-mask-image:linear-gradient(to_bottom,#000_55%,transparent)] [mask-image:linear-gradient(to_bottom,#000_55%,transparent)]">
      <div className="absolute inset-0">
        <svg className="h-full w-full" viewBox="0 0 1200 700" preserveAspectRatio="xMaxYMax slice">
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#1d4ed8" stopOpacity="0" />
              <stop offset="0.6" stopColor="#3b82f6" stopOpacity="0.55" />
              <stop offset="1" stopColor="#7dd3fc" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="cometGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#2f8bff" stopOpacity="0" />
              <stop offset="1" stopColor="#c8f0ff" />
            </linearGradient>
            <radialGradient id="core" cx="1150" cy="780" r="760" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#3b82f6" stopOpacity="0.5" />
              <stop offset="0.45" stopColor="#1d4ed8" stopOpacity="0.16" />
              <stop offset="1" stopColor="#1d4ed8" stopOpacity="0" />
            </radialGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <circle cx="1150" cy="780" r="760" fill="url(#core)" className="anim" style={{ animation: "glowpulse 8s ease-in-out infinite" }} />

          {stars.map((st, i) => (
            <circle key={i} cx={st.x} cy={st.y} r={st.r} fill="#bfe3ff" className="anim" style={{ animation: `twinkle ${st.t}s ease-in-out ${st.d}s infinite` }} />
          ))}

          {/* ripples expanding from the core */}
          {[0, 3, 6].map((delay) => (
            <circle key={delay} cx="1150" cy="780" r="800" fill="none" stroke="#5fb0ff" strokeWidth="1.2" vectorEffect="non-scaling-stroke" className="anim" style={{ transformOrigin: "1150px 780px", animation: `ripple 9s ease-out ${delay}s infinite` }} />
          ))}

          {["M 300 780 Q 800 330 1200 60", "M 520 790 Q 930 470 1200 230", "M 0 380 Q 350 260 700 0", "M 700 800 Q 1000 640 1200 470"].map((d, i) => (
            <g key={d}>
              <path d={d} fill="none" stroke="#2f6bff" strokeOpacity="0.16" />
              <path d={d} fill="none" stroke="#9bdcff" strokeWidth="1.8" strokeLinecap="round" pathLength={1000} strokeDasharray="90 910" filter="url(#glow)" className="anim" style={{ animation: `dash ${7 + i * 3}s linear ${i * -2.5}s infinite` }} />
            </g>
          ))}

          {cluster(main, 1, "main")}
          {cluster(side, 0.45, "side")}
        </svg>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(2,4,8,0.72),rgba(2,4,8,0.3)_55%,transparent)]" />
      </div>
    </div>
  );
}

function ActionCard({ href, title, text, icon, className = "", children }: { href: string; title: string; text: string; icon: string; className?: string; children?: ReactNode }) {
  return (
    <Link href={href} className={`group relative flex flex-col overflow-hidden rounded-3xl p-7 transition duration-300 hover:bg-[#2f8bff]/10 hover:shadow-[0_0_60px_-10px_rgba(47,139,255,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2f8bff] ${SOFT} ${className}`}>
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1d4ed8]/40 to-[#38bdf8]/20 text-[#7dc0ff]">
        <Icon d={icon} />
      </span>
      <h3 className="mt-5 text-xl font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-400">{text}</p>
      {children}
      <span className="mt-auto pt-6 text-sm text-[#7dc0ff] transition group-hover:translate-x-1">Open {title.toLowerCase()} →</span>
    </Link>
  );
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletMsg, setWalletMsg] = useState("");

  useEffect(() => {
    const handleMenuState = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      setMobileMenuOpen(customEvent.detail);
    };
    window.addEventListener("mobile-menu-state", handleMenuState);
    return () => window.removeEventListener("mobile-menu-state", handleMenuState);
  }, []);

  const addArcToWallet = async () => {
    const eth = (window as any).ethereum;
    if (!eth) return setWalletMsg("No wallet found. Install an EVM wallet first.");
    try {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [{ chainId: ARC.chainIdHex, chainName: "Arc Mainnet", nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 }, rpcUrls: [ARC.rpc], blockExplorerUrls: [ARC.explorer] }],
      });
      setWalletMsg("Arc Mainnet added to your wallet.");
    } catch {
      setWalletMsg("Request was cancelled or failed.");
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#020408] text-white">
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes spin-rev{to{transform:rotate(-360deg)}}
        @keyframes dash{from{stroke-dashoffset:0}to{stroke-dashoffset:-1000}}
        @keyframes drift{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(4vw,-3vw,0) scale(1.15)}}
        @keyframes twinkle{0%,100%{opacity:.15}50%{opacity:.95}}
        @keyframes breathe{0%,100%{opacity:.45}50%{opacity:1}}
        @keyframes glowpulse{0%,100%{opacity:.65}50%{opacity:1}}
        @keyframes ripple{0%{transform:scale(.12);opacity:.7}100%{transform:scale(1);opacity:0}}
        @keyframes marquee{to{transform:translateX(-50%)}}
        .reveal{opacity:0;transform:translateY(32px);transition:opacity .9s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1);transition-delay:var(--d,0ms)}
        .reveal.in{opacity:1;transform:none}
        @media (prefers-reduced-motion:reduce){.reveal{opacity:1;transform:none;transition:none}.anim,.blob,.marquee{animation:none!important}}
      `}</style>

      {/* one continuous page gradient (scrolls with the page, no fixed layers) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#020408_0%,#04102b_22%,#041333_45%,#030d24_70%,#020408_100%)]" />
        <div className="blob absolute -left-[15vw] top-[38%] h-[45vw] w-[45vw] rounded-full bg-[radial-gradient(closest-side,rgba(37,99,235,0.22),transparent)] blur-2xl" style={{ animation: "drift 22s ease-in-out infinite" }} />
        <div className="blob absolute -right-[12vw] top-[62%] h-[42vw] w-[42vw] rounded-full bg-[radial-gradient(closest-side,rgba(56,189,248,0.16),transparent)] blur-2xl" style={{ animation: "drift 28s ease-in-out infinite reverse" }} />
      </div>

      <BackgroundArt />

      <div className="relative z-10">
        <Header />

        <div className={`min-w-0 transition-[filter] duration-300 ${mobileMenuOpen ? "blur-md" : "blur-0"}`}>
          {/* ---------------- HERO ---------------- */}
          <section className={`relative pb-24 pt-20 sm:pb-32 sm:pt-28 lg:pt-32 xl:pb-[9vw] xl:pt-[8vw] ${CONTAINER}`}>
            <Reveal>
              <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl xl:text-[clamp(4.5rem,6.2vw,9rem)]">
                One place. <span className="bg-gradient-to-r from-[#2f8bff] to-[#5fd0ff] bg-clip-text text-transparent">Every move.</span>
              </h1>
            </Reveal>
            <Reveal delay={140}>
              <p className="mt-5 max-w-xl text-lg text-slate-300 sm:text-xl xl:max-w-[50vw] xl:text-[clamp(1.25rem,1.8vw,2.5rem)]">A simple interface for Arc</p>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-400 xl:max-w-[40vw] xl:text-[clamp(1rem,1.2vw,1.75rem)]">
                Send, swap, and bridge USDC on Arc mainnet. Fees are paid in USDC and blocks settle in under a second.
              </p>
            </Reveal>
            <Reveal delay={280}>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/swap" className={BTN}>Start swapping</Link>
                <Link href="/bridge" className="rounded-full bg-white/[0.07] px-7 py-3 font-medium transition hover:bg-white/[0.12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f8bff]">Bridge to Arc</Link>
              </div>
            </Reveal>
          </section>

          {/* ---------------- ACTIONS ---------------- */}
          <section className={`pb-20 xl:pb-[6vw] ${CONTAINER}`}>
            <Reveal>
              <h2 className={H2}>Everything you do on Arc</h2>
              <p className="mt-3 max-w-xl text-slate-400">Pick an action. Connect your wallet when you are ready.</p>
            </Reveal>

            <div className="mt-12 grid gap-4 lg:grid-cols-3">
              <Reveal className="lg:col-span-2 lg:row-span-2 [&>a]:h-full">
                <ActionCard href="/swap" title="Swap" text="Swap stablecoins onchain with clear pricing and USDC gas." icon="M7 4v13m0 0-3-3m3 3 3-3M17 20V7m0 0-3 3m3-3 3 3" className="min-h-[24rem]">
                  <div aria-hidden className="mt-8 max-w-md space-y-2 rounded-2xl bg-[#050b1c]/70 p-4 shadow-[0_0_80px_-20px_rgba(47,139,255,0.6)]">
                    <div className="flex items-center justify-between rounded-xl bg-white/[0.05] px-4 py-3"><span className="text-sm text-slate-400">You pay</span><span className="font-semibold">USDC</span></div>
                    <div className="mx-auto -my-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#0a1a4a] text-[#7dc0ff]">↓</div>
                    <div className="flex items-center justify-between rounded-xl bg-white/[0.05] px-4 py-3"><span className="text-sm text-slate-400">You receive</span><span className="font-semibold">EURC</span></div>
                    <div className="rounded-xl bg-gradient-to-r from-[#1d4ed8] to-[#2f8bff] py-3 text-center text-sm font-medium">Preview</div>
                  </div>
                </ActionCard>
              </Reveal>
              <Reveal delay={120} className="[&>a]:h-full">
                <ActionCard href="/send" title="Send" text="Send USDC to any address. Gas is paid in USDC too." icon="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </Reveal>
              <Reveal delay={240} className="[&>a]:h-full">
                <ActionCard href="/bridge" title="Bridge" text="Move USDC in and out of Arc from other chains." icon="M3 18c0-6 4-10 9-10s9 4 9 10M3 18h18M8 18v-4M16 18v-4M12 18v-6" />
              </Reveal>
              <Reveal delay={120} className="lg:col-span-3 [&>a]:h-full">
                <ActionCard href="/activity" title="Activity" text="Track every transaction from your wallet in one list." icon="M3 12h4l3-8 4 16 3-8h4" />
              </Reveal>
            </div>
          </section>

          {/* ---------------- WHY ARC ---------------- */}
          <section className={`pb-20 xl:pb-[6vw] ${CONTAINER}`}>
            <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr]">
              <Reveal>
                <h2 className={H2}>Why Arc</h2>
                <p className="mt-4 max-w-md leading-relaxed text-slate-400">Arc is Circle&apos;s EVM-compatible Layer 1 for onchain finance with stablecoins. Public mainnet launched on 16 September 2026.</p>
                <a href={ARC.docs} target="_blank" rel="noreferrer" className="mt-6 inline-block text-[#7dc0ff] underline-offset-4 hover:underline">Read the Arc docs</a>
              </Reveal>
              <div className="grid gap-8 sm:grid-cols-2">
                {FEATURES.map((f, i) => (
                  <Reveal key={f.title} delay={i * 110}>
                    <div className="flex gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2f8bff]/15 text-[#7dc0ff]"><Icon d={f.icon} size={20} /></span>
                      <div>
                        <h3 className="font-semibold">{f.title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{f.text}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ---------------- NETWORK ---------------- */}
          <section className={`pb-20 xl:pb-[6vw] ${CONTAINER}`}>
            <div className="grid gap-10 lg:grid-cols-2">
              <Reveal>
                <h2 className={H2}>Add Arc to your wallet</h2>
                <p className="mt-3 max-w-md text-slate-400">One click adds the mainnet settings to any EVM wallet.</p>
                <button onClick={addArcToWallet} className={`mt-6 ${BTN}`}>Add Arc Mainnet</button>
                <p role="status" className="mt-3 min-h-5 text-sm text-slate-400">{walletMsg}</p>
              </Reveal>
              <Reveal delay={150}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <tbody>
                      {NETWORK_ROWS.map(([k, v]) => (
                        <tr key={k} className="border-b border-white/10 last:border-0">
                          <th scope="row" className="whitespace-nowrap py-4 pr-6 font-normal text-slate-500">{k}</th>
                          <td className="py-4 font-medium">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ---------------- USE CASES ---------------- */}
          <section className="overflow-hidden pb-20 xl:pb-[6vw]">
            <Reveal className={CONTAINER}><h2 className={H2}>What people build on Arc</h2></Reveal>
            <Reveal delay={150}>
              <div className="marquee mt-8 flex w-max gap-3" style={{ animation: "marquee 40s linear infinite" }}>
                {[...USE_CASES, ...USE_CASES, ...USE_CASES, ...USE_CASES].map((u, i) => (
                  <span key={i} className="whitespace-nowrap rounded-full bg-[#2f6bff]/10 px-6 py-3 text-sm text-slate-200">{u}</span>
                ))}
              </div>
            </Reveal>
          </section>

          {/* ---------------- CTA ---------------- */}
          <section className={`pb-24 xl:pb-[7vw] ${CONTAINER}`}>
            <Reveal>
              <div className="py-10 text-center sm:py-16">
                <h2 className={H2}>Ready to move on Arc?</h2>
                <p className="mx-auto mt-3 max-w-md text-slate-300">Connect your wallet and make your first transfer.</p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Link href="/send" className={BTN}>Send USDC</Link>
                  <Link href="/swap" className="rounded-full bg-white/[0.07] px-7 py-3 font-medium transition hover:bg-white/[0.12]">Swap</Link>
                </div>
              </div>
            </Reveal>
          </section>

          {/* ---------------- FOOTER ---------------- */}
          <footer>
            <div className={`flex flex-col gap-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between ${CONTAINER}`}>
              <p>© {new Date().getFullYear()} AlabaamaFi. An independent interface for Arc.</p>
              <nav className="flex gap-6">
                <a href={ARC.docs} target="_blank" rel="noreferrer" className="hover:text-white">Docs</a>
                <a href={ARC.explorer} target="_blank" rel="noreferrer" className="hover:text-white">Explorer</a>
                <a href={ARC.x} target="_blank" rel="noreferrer" className="hover:text-white">Arc on X</a>
              </nav>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
