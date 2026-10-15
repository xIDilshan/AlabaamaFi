"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import type { RobinhoodMode } from "@/components/LifiWidget";

/*
  Robinhood Chain routes, powered by LI.FI (embedded LI.FI Widget).
  Save as: app/bridge/robinhood/page.tsx
  Covers: Robinhood Chain to Arc, Arc to Robinhood Chain, Robinhood Chain to other networks, other networks to Robinhood Chain.
*/

const brandFont = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });
const CONTAINER = "w-full px-4 sm:px-8 lg:px-10";

// The widget is heavy and only works in the browser, so it is loaded on the client only.
const LifiWidget = dynamic(() => import("@/components/LifiWidget"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto h-[560px] w-full max-w-[440px] animate-pulse rounded-[2rem] border border-white/[0.08] bg-white/[0.03]" aria-label="Loading the bridge" />
  ),
});

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

const MODES: { id: RobinhoodMode; label: string; hint: string }[] = [
  { id: "to", label: "To Robinhood Chain", hint: "From Arc or any other network into Robinhood Chain" },
  { id: "from", label: "From Robinhood Chain", hint: "From Robinhood Chain to Arc or any other network" },
];

export default function RobinhoodBridgePage() {
  const [mode, setMode] = useState<RobinhoodMode>("to");

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

        <section className={`pb-20 pt-8 sm:pt-12 lg:pb-32 lg:pt-14 ${CONTAINER}`}>
          <div className="fade-up mx-auto max-w-2xl text-center">
            <h1 className="text-[2.4rem] font-bold leading-[1.05] tracking-[-0.035em] sm:text-[3.9rem]">
              Robinhood <span className="bg-gradient-to-r from-[#18bfff] via-[#2588ff] to-[#4262ff] bg-clip-text text-transparent">Routes</span>
            </h1>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-6 text-slate-400 sm:mt-4 sm:text-lg sm:leading-7">Bridge between Robinhood Chain, Arc and other networks. Powered by LI.FI.</p>
          </div>

          {/* direction */}
          <div className="fade-up mx-auto mt-8 w-full max-w-[440px]" style={{ "--delay": "100ms" } as CSSProperties}>
            <div className="grid grid-cols-2 gap-2 rounded-full bg-white/[0.05] p-1" role="tablist" aria-label="Direction">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  role="tab"
                  aria-selected={mode === m.id}
                  onClick={() => setMode(m.id)}
                  className={`rounded-full px-3 py-2.5 text-[13px] font-semibold transition sm:text-sm ${mode === m.id ? "bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] text-white" : "text-slate-400 hover:text-white"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <p className="mt-2 px-1 text-center text-xs text-slate-500">{MODES.find((m) => m.id === mode)?.hint}</p>
          </div>

          {/* the LI.FI widget (it is rebuilt when the direction changes) */}
          <div className="fade-up relative mx-auto mt-6 w-full max-w-[440px]" style={{ "--delay": "200ms" } as CSSProperties}>
            <div className="absolute -inset-10 rounded-full bg-[#1675ff]/10 blur-3xl" />
            <div className="relative">
              <LifiWidget key={mode} mode={mode} />
            </div>
          </div>

          {/* what to know */}
          <div className="fade-up mx-auto mt-8 w-full max-w-[440px] rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 text-xs leading-5 text-slate-400 sm:p-5" style={{ "--delay": "300ms" } as CSSProperties}>
            <p className="text-[13px] font-semibold text-slate-200">Before you bridge</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-4">
              <li>This route is a third-party bridge from LI.FI, not Circle. LI.FI finds the route and a bridge or relayer delivers your funds.</li>
              <li>On Robinhood Chain, USDC from other networks often arrives as USDG, a different stablecoin. Check the token you will receive.</li>
              <li>Read the quote, the fees and the time before you confirm, and start with a small amount.</li>
              <li>AlabaamaFi never holds your funds. Everything is signed in your own wallet.</li>
            </ul>
            <p className="mt-3">
              Moving USDC between Arc and other networks?{" "}
              <Link href="/bridge" className="font-medium text-[#65caff] hover:text-white">Use the Circle USDC bridge</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
