"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Inter, Manrope } from "next/font/google";
import { useAccount } from "wagmi";
import Header from "@/components/Header";
import { createSwapKitContext, estimate, swap } from "@circle-fin/swap-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";

// Same fonts as the Send page.
const brandFont = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });
const manrope = Manrope({ subsets: ["latin"], weight: ["600", "700"], display: "swap" });

/* ---------- Arc mainnet ---------- */
const ARC = {
  chainId: 5042,
  chainIdHex: "0x13b2",
  rpc: "https://rpc.mainnet.arc.io",
  explorer: "https://explorer.arc.io",
};

// Name of Arc mainnet inside Circle's App Kit.
const SLIPPAGE_BPS = 100; // 1%

/* Arc only swaps USDC <-> EURC here. Both have a 6-decimal ERC-20 interface. */
type Sym = "USDC" | "EURC";
const TOKEN_ADDRESS: Record<Sym, string> = {
  USDC: "0x3600000000000000000000000000000000000000",
  EURC: "0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1",
};
const DECIMALS = 6;
const GAS_BUFFER = BigInt(50000); // keep ~0.05 USDC for gas when swapping USDC

const CONTAINER = "w-full px-5 sm:px-8 lg:px-10";

const BUTTON =
  "inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] px-7 py-4 font-semibold text-white shadow-[0_10px_40px_rgba(30,120,255,0.28)] transition duration-300 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_15px_50px_rgba(30,120,255,0.42)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39c4ff] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:brightness-100";

const SECONDARY_BUTTON =
  "inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.045] px-7 py-4 font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:border-[#2f8bff]/40 hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39c4ff]";

/* ---------- number helpers (BigInt() calls instead of 1n literals, so any TS target works) ---------- */
const ZERO = BigInt(0);
const E6 = BigInt(1000000);

function parseUnits6(value: string): bigint | null {
  const v = value.trim();
  if (!/^\d*\.?\d*$/.test(v) || v === "" || v === ".") return null;
  const [whole = "0", frac = ""] = v.split(".");
  if (frac.length > DECIMALS) return null;
  return BigInt(whole || "0") * E6 + BigInt((frac + "000000").slice(0, DECIMALS) || "0");
}

function formatUnits6(value: bigint, minFrac = 2): string {
  const whole = (value / E6).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  let frac = (value % E6).toString().padStart(DECIMALS, "0").replace(/0+$/, "");
  while (frac.length < minFrac) frac += "0";
  return frac ? `${whole}.${frac}` : whole;
}

/** "12.3456789" -> "12.345678" (up to 6 decimals, at least 2) */
function tidy(value: string, minFrac = 2): string {
  const [w = "0", f = ""] = value.split(".");
  let frac = f.slice(0, DECIMALS).replace(/0+$/, "");
  while (frac.length < minFrac) frac += "0";
  return `${w.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${frac}`;
}

const pad32 = (hex: string) => hex.replace(/^0x/, "").toLowerCase().padStart(64, "0");

/* ---------- wallet provider + Circle App Kit (loaded only in the browser, only when needed) ---------- */
type Eip1193 = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (arg: unknown) => void) => void;
  removeListener?: (event: string, handler: (arg: unknown) => void) => void;
};

type SwapArgs = {
  from: { adapter: unknown; chain: string };
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  config?: { slippageBps?: number; apiKey?: string };
};
type KitLike = {
  estimateSwap: (p: SwapArgs) => Promise<{ estimatedOutput: { amount: string }; stopLimit: { amount: string } }>;
  swap: (p: SwapArgs) => Promise<{ txHash: string; explorerUrl?: string; amountOut?: string; progress?: { status?: string } }>;
};

/* ---------- small UI pieces ---------- */
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

function Field({ label, right, children }: { label: string; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 transition focus-within:border-[#2588ff]/60 focus-within:bg-white/[0.05]">
      <div className="flex items-center justify-between gap-3 text-[13px] font-medium text-slate-400">
        <span>{label}</span>
        {right}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

const Pill = ({ onClick, children, disabled }: { onClick: () => void; children: ReactNode; disabled?: boolean }) => (
  <button type="button" onClick={onClick} disabled={disabled} className="inline-flex items-center rounded-full bg-white/[0.07] px-3 py-1 text-xs font-medium text-[#8fd4ff] transition hover:bg-white/[0.12] disabled:opacity-40">
    {children}
  </button>
);

/* ---------- logos ----------
   Put usdc-logo.webp, eurc-logo.png and arc-logo.png in mainnet/public/. If a file is missing, a built-in drawing is shown. */
const LOGO_SRC: Record<string, string> = { Arc: "/arc-logo.png", USDC: "/usdc-logo.webp", EURC: "/eurc-logo.png" };

function Logo({ name, size = 24 }: { name: "Arc" | Sym; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (!failed)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={LOGO_SRC[name]} alt={name} width={size} height={size} onError={() => setFailed(true)} className="shrink-0 rounded-full object-cover" />;

  if (name === "Arc")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" role="img" aria-label="Arc" className="shrink-0">
        <defs>
          <linearGradient id="swapArcBg" x1="3" y1="3" x2="21" y2="21">
            <stop stopColor="#12b9ff" />
            <stop offset="1" stopColor="#273ee8" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="12" fill="url(#swapArcBg)" />
        <path d="M5.5 16.5a7 7 0 0 1 13 0" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="8.2" r="1.3" fill="#fff" />
      </svg>
    );

  // USDC / EURC: blue coin with white arcs and the currency sign
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" role="img" aria-label={name} className="shrink-0">
      <circle cx="12" cy="12" r="12" fill="#2775CA" />
      <path d="M5.64 5.64A9 9 0 0 0 5.64 18.36M18.36 5.64A9 9 0 0 1 18.36 18.36" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      {name === "USDC" ? (
        <path d="M14.4 9.4c0-1-1-1.7-2.4-1.7s-2.4.7-2.4 1.8c0 2.4 4.9 1.1 4.9 3.6 0 1.1-1.1 1.9-2.5 1.9s-2.5-.8-2.5-1.9M12 6.3v1.4M12 16.3v1.4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      ) : (
        <path d="M14.6 8.9a3.2 3.2 0 1 0 0 6.2M8.6 11h4.4M8.6 13h4.4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      )}
    </svg>
  );
}

const TokenChip = ({ sym }: { sym: Sym }) => (
  <span className="flex shrink-0 items-center gap-2 rounded-full bg-white/[0.07] py-1.5 pl-2 pr-4 text-sm font-semibold">
    <Logo name={sym} size={22} />
    {sym}
  </span>
);

const Spinner = () => <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />;

/* Plays once on success: the Swap icon starts at the center of the card, draws in as glowing lines, flies away,
   then a green glowing check mark appears at the top. (Needs a "relative" parent that covers the whole success area.) */
function SuccessAnimation() {
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-32 w-32" style={{ willChange: "transform, opacity", animation: "iconAwayMove .8s cubic-bezier(.5,0,.9,.5) 1.1s forwards, iconAwayFade .8s linear 1.1s forwards" }}>
          <div className="flex h-full w-full items-center justify-center" style={{ opacity: 0, animation: "iconIn .5s ease-out forwards" }}>
            <svg width="84" height="84" viewBox="0 0 24 24" fill="none" stroke="#9fe9ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 4px #39c4ff) drop-shadow(0 0 12px #1978f5)" }}>
              <path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4" pathLength={100} strokeDasharray="100" strokeDashoffset="100" style={{ animation: "iconDraw .8s ease-out forwards" }} />
            </svg>
          </div>
        </div>
      </div>

      <div aria-hidden className="relative mx-auto h-32 w-32">
        <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: 0, willChange: "transform, opacity", animation: "checkPop .55s cubic-bezier(.2,1.3,.3,1) 1.85s forwards" }}>
          <svg width="76" height="76" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 6px rgba(52,211,153,0.9)) drop-shadow(0 0 18px rgba(52,211,153,0.55))" }}>
            <path d="m4.5 12.5 5 5L19.5 6.5" strokeDasharray="24" strokeDashoffset="24" style={{ animation: "checkDraw .45s ease-out 2.05s forwards" }} />
          </svg>
        </div>
      </div>
    </>
  );
}

/* ---------- page ---------- */
type Phase = "idle" | "swapping" | "done" | "failed";

export default function SwapPage() {
  // Same wallet state as the header (wagmi).
  const { address, isConnected, connector } = useAccount();
  const account = isConnected && address ? address : null;

  const [provider, setProvider] = useState<Eip1193 | undefined>(undefined);
  const [chainOk, setChainOk] = useState<boolean | null>(null);
  const [balances, setBalances] = useState<Record<Sym, bigint | null>>({ USDC: null, EURC: null });

  const [from, setFrom] = useState<Sym>("USDC");
  const to: Sym = from === "USDC" ? "EURC" : "USDC";
  const [amount, setAmount] = useState("");
  const [flips, setFlips] = useState(0);

  const [quote, setQuote] = useState<{ out: string; min: string } | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState({ paid: "", got: "", url: "" });

  const kitRef = useRef<KitLike | null>(null);
  const adapterRef = useRef<unknown>(null);

  /* the connected wallet's own provider */
  useEffect(() => {
    let live = true;
    setProvider(undefined);
    setChainOk(null);
    if (!connector) return;
    connector.getProvider().then((p) => { if (live) setProvider(p as Eip1193); }).catch(() => {});
    return () => { live = false; };
  }, [connector]);

  /* which network the wallet is on */
  useEffect(() => {
    if (!provider) return;
    const checkChain = (id: unknown) =>
      setChainOk(typeof id === "string" ? id.toLowerCase() === ARC.chainIdHex : typeof id === "number" ? id === ARC.chainId : null);
    provider.request({ method: "eth_chainId" }).then(checkChain).catch(() => {});
    provider.on?.("chainChanged", checkChain);
    return () => provider.removeListener?.("chainChanged", checkChain);
  }, [provider]);

  /* a new wallet or account needs a fresh adapter */
  useEffect(() => {
    adapterRef.current = null;
  }, [provider, account]);

  const getKit = async (): Promise<KitLike> => {
    if (!kitRef.current) {
      const { AppKit } = await import("@circle-fin/app-kit");
      kitRef.current = new AppKit() as unknown as KitLike;
    }
    return kitRef.current;
  };

  const getAdapter = async (): Promise<unknown> => {
    if (!adapterRef.current) {
      const { createViemAdapterFromProvider } = await import("@circle-fin/adapter-viem-v2");
      adapterRef.current = await createViemAdapterFromProvider({ provider: provider as never });
    }
    return adapterRef.current;
  };

  /* balances (ERC-20 face of each token, 6 decimals) */
  const loadBalances = useCallback(async () => {
    if (!provider || !account || !chainOk) return setBalances({ USDC: null, EURC: null });
    const read = async (sym: Sym) => {
      try {
        const res = (await provider.request({ method: "eth_call", params: [{ to: TOKEN_ADDRESS[sym], data: "0x70a08231" + pad32(account) }, "latest"] })) as string;
        return BigInt(res || "0x0");
      } catch {
        return null;
      }
    };
    const [usdc, eurc] = await Promise.all([read("USDC"), read("EURC")]);
    setBalances({ USDC: usdc, EURC: eurc });
  }, [provider, account, chainOk]);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  /* derived */
  const units = parseUnits6(amount);
  const cleanAmount = amount.endsWith(".") ? amount.slice(0, -1) : amount;
  const balance = balances[from];
  const busy = phase === "swapping";
  const ready = !!account && chainOk === true;

  /* live price (Circle swap service), 0.5s after you stop typing */
  useEffect(() => {
    setQuote(null);
    setQuoteError("");
    if (!ready || !units || units <= ZERO) return;
    let live = true;
    setQuoting(true);
    const t = setTimeout(async () => {
      try {
        const kit = await getKit();
        const adapter = await getAdapter();
        const est = await kit.estimateSwap({
          from: { adapter, chain: KIT_CHAIN },
          tokenIn: from,
          tokenOut: to,
          amountIn: cleanAmount,
          config: { slippageBps: SLIPPAGE_BPS, ...(CIRCLE_API_KEY ? { apiKey: CIRCLE_API_KEY } : {}) },
        });
        if (live) setQuote({ out: est.estimatedOutput.amount, min: est.stopLimit.amount });
      } catch (e) {
        if (live) setQuoteError(explain(e, "Couldn't get a price right now."));
      } finally {
        if (live) setQuoting(false);
      }
    }, 500);
    return () => {
      live = false;
      clearTimeout(t);
      setQuoting(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, from, to, cleanAmount, provider, account]);

  /* validation */
  const problem = useMemo((): { text: string; hard: boolean } | null => {
    if (!amount) return { text: "Enter an amount", hard: false };
    if (units === null) return { text: `Use up to ${DECIMALS} decimal places`, hard: true };
    if (units <= ZERO) return { text: "Enter an amount", hard: false };
    if (balance !== null && units > balance) return { text: "Insufficient balance", hard: true };
    if (from === "USDC" && balance !== null && units + GAS_BUFFER > balance) return { text: "Keep a little USDC for the network fee", hard: true };
    return null;
  }, [amount, units, balance, from]);

  /* actions */
  const switchToArc = async () => {
    if (!provider) return;
    try {
      await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: ARC.chainIdHex }] });
    } catch (e) {
      if ((e as { code?: number }).code === 4902) {
        try {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [{ chainId: ARC.chainIdHex, chainName: "Arc Mainnet", nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 }, rpcUrls: [ARC.rpc], blockExplorerUrls: [ARC.explorer] }],
          });
        } catch {
          setMessage("Couldn't add Arc Mainnet to your wallet.");
        }
      } else {
        setMessage("Network switch was cancelled.");
      }
    }
  };

  const flip = () => {
    if (busy) return;
    setFrom(to);
    setFlips((n) => n + 1);
    setMessage("");
  };

  const setMax = () => {
    if (balance === null) return;
    const buffer = from === "USDC" ? GAS_BUFFER : ZERO;
    const max = balance > buffer ? balance - buffer : ZERO;
    setAmount(formatUnits6(max, 0).replace(/,/g, ""));
  };

  const reset = () => {
    setPhase("idle");
    setMessage("");
    setAmount("");
    setQuote(null);
  };

  const swap = async () => {
    if (!provider || !account || problem || !quote) return;
    setPhase("swapping");
    setMessage("");
    try {
      const kit = await getKit();
      const adapter = await getAdapter();
      const result = await kit.swap({
        from: { adapter, chain: KIT_CHAIN },
        tokenIn: from,
        tokenOut: to,
        amountIn: cleanAmount,
        config: { slippageBps: SLIPPAGE_BPS, ...(CIRCLE_API_KEY ? { apiKey: CIRCLE_API_KEY } : {}) },
      });
      const status = result.progress?.status;
      if (status === "FAILED" || status === "NOT_FOUND") {
        setDone((d) => ({ ...d, url: result.explorerUrl ?? `${ARC.explorer}/tx/${result.txHash}` }));
        setMessage("The swap did not complete. Check the explorer for details.");
        setPhase("failed");
        return;
      }
      setDone({
        paid: `${tidy(cleanAmount)} ${from}`,
        got: `${tidy(result.amountOut ?? quote.out)} ${to}`,
        url: result.explorerUrl ?? `${ARC.explorer}/tx/${result.txHash}`,
      });
      setPhase("done");
      loadBalances();
    } catch (e) {
      setMessage(explain(e, "The swap could not be completed."));
      setPhase("failed");
    }
  };

  /* main button */
  let action: { label: ReactNode; onClick: () => void; disabled: boolean };
  if (!account) action = { label: "Connect wallet", onClick: () => {}, disabled: true };
  else if (chainOk === false) action = { label: "Switch to Arc Mainnet", onClick: switchToArc, disabled: false };
  else if (busy) action = { label: <span className="flex items-center gap-3"><Spinner />Swapping</span>, onClick: () => {}, disabled: true };
  else action = { label: "Swap", onClick: swap, disabled: !!problem || !quote || quoting || chainOk === null };

  const amountFont = amount.length > 9 ? "clamp(1.125rem, 4.5vw, 1.25rem)" : amount.length > 6 ? "clamp(1.25rem, 5.2vw, 1.5rem)" : "clamp(1.375rem, 6vw, 1.875rem)";
  const rate = quote && units && Number(cleanAmount) > 0 ? Number(quote.out) / Number(cleanAmount) : null;

  return (
    <main className={`${brandFont.className} relative min-h-screen overflow-x-hidden bg-[#010205] text-white selection:bg-[#167cff]/30`}>
      <style>{`
        @keyframes backgroundFloat{0%,100%{transform:translate3d(-50%,0,0) scale(1)}50%{transform:translate3d(-46%,2vw,0) scale(1.08)}}
        @keyframes backgroundFloatReverse{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(5vw,-3vw,0) scale(1.12)}}
        @keyframes twinkle{0%,100%{opacity:.12}50%{opacity:.9}}
        @keyframes floatUp{0%{transform:translateY(0);opacity:0}15%{opacity:.7}100%{transform:translateY(-220px);opacity:0}}
        @keyframes iconIn{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}
        @keyframes iconAwayMove{from{transform:translate3d(0,0,0) scale(1)}to{transform:translate3d(140px,-140px,0) scale(.55)}}
        @keyframes iconAwayFade{0%,55%{opacity:1}100%{opacity:0}}
        @keyframes iconDraw{to{stroke-dashoffset:0}}
        @keyframes checkPop{0%{opacity:0;transform:scale(.3)}100%{opacity:1;transform:scale(1)}}
        @keyframes checkDraw{to{stroke-dashoffset:0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
        .fade-up{opacity:0;animation:fadeUp .9s cubic-bezier(.2,.7,.2,1) forwards;animation-delay:var(--delay,0ms)}
        @media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-delay:0s!important;animation-iteration-count:1!important}.fade-up{opacity:1}}
      `}</style>

      <SpaceBackground />

      <div className="relative z-10">
        <Header />

        <section className={`pb-24 pt-10 sm:pt-14 lg:pb-32 lg:pt-16 ${CONTAINER}`}>
          {/* title */}
          <div className="fade-up mx-auto max-w-2xl text-center">
            <h1 className="text-[2.5rem] font-bold leading-[1.05] tracking-[-0.035em] sm:text-6xl">
              <span className="bg-gradient-to-r from-[#18bfff] via-[#2588ff] to-[#4262ff] bg-clip-text text-transparent">Swap</span>
            </h1>
            <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-400 sm:text-lg">Swap between USDC and EURC on Arc.</p>
          </div>

          {/* card */}
          <div className="fade-up relative mx-auto mt-10 w-full max-w-lg" style={{ "--delay": "150ms" } as CSSProperties}>
            <div className="absolute -inset-10 rounded-full bg-[#1675ff]/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#050a16]/80 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-7">
              {phase !== "done" && (
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-5">
                  <div>
                    <p className="text-xs text-slate-500">Network</p>
                    <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                      <Logo name="Arc" size={20} />
                      Arc Mainnet
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Slippage</p>
                    <p className="mt-1 text-sm font-semibold tabular-nums">{SLIPPAGE_BPS / 100}%</p>
                  </div>
                </div>
              )}

              {phase === "done" ? (
                /* success */
                <div className="relative py-4 text-center sm:py-6">
                  <SuccessAnimation />
                  <div className="fade-up" style={{ "--delay": "2000ms" } as CSSProperties}>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">Successfully swapped</h2>
                    <dl className="mt-9 space-y-3.5 text-left text-[15px]">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-slate-400">Paid</dt>
                        <dd className="font-semibold tabular-nums">{done.paid}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-slate-400">Received</dt>
                        <dd className="font-semibold tabular-nums">{done.got}</dd>
                      </div>
                    </dl>
                    <div className="mt-11 grid gap-3 sm:grid-cols-2">
                      <a href={done.url} target="_blank" rel="noreferrer" className={SECONDARY_BUTTON}>View on explorer</a>
                      <button onClick={reset} className={BUTTON}>Swap again</button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-5">
                    {/* you pay */}
                    <Field
                      label="You pay"
                      right={
                        <span className="flex items-center gap-2">
                          {ready && balance !== null && <span className="tabular-nums">Balance {formatUnits6(balance)}</span>}
                          {ready && balance !== null && <Pill onClick={setMax} disabled={busy}>Max</Pill>}
                        </span>
                      }
                    >
                      <div className="flex items-center gap-3">
                        <input
                          value={amount}
                          onChange={(e) => {
                            const v = e.target.value.replace(",", ".");
                            if (v === "" || /^\d*\.?\d{0,6}$/.test(v)) setAmount(v);
                          }}
                          disabled={busy}
                          inputMode="decimal"
                          placeholder="0.00"
                          autoComplete="off"
                          aria-label={`Amount of ${from} to swap`}
                          style={{ fontSize: amountFont, fontWeight: 600, lineHeight: 1.1, fontFamily: manrope.style.fontFamily }}
                          className="min-w-0 flex-1 bg-transparent tabular-nums tracking-tight text-white outline-none placeholder:text-slate-700 disabled:opacity-60"
                        />
                        <TokenChip sym={from} />
                      </div>
                    </Field>

                    {/* flip */}
                    <div className="relative z-10 -my-3 flex justify-center">
                      <button
                        type="button"
                        onClick={flip}
                        disabled={busy}
                        aria-label="Switch tokens"
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.1] bg-[#071025] text-[#55c5ff] shadow-lg transition hover:border-[#2f8bff]/50 hover:text-white disabled:opacity-50"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ transition: "transform .4s ease", transform: `rotate(${flips * 180}deg)` }}
                        >
                          <path d="M7 4v13m0 0-3-3m3 3 3-3M17 20V7m0 0-3 3m3-3 3 3" />
                        </svg>
                      </button>
                    </div>

                    {/* you receive */}
                    <Field label="You receive" right={ready && balances[to] !== null ? <span className="tabular-nums">Balance {formatUnits6(balances[to] as bigint)}</span> : undefined}>
                      <div className="flex items-center gap-3">
                        <div
                          className={`min-w-0 flex-1 truncate tabular-nums tracking-tight ${quote ? "text-white" : "text-slate-700"}`}
                          style={{ fontSize: amountFont, fontWeight: 600, lineHeight: 1.1, fontFamily: manrope.style.fontFamily }}
                        >
                          {quote ? tidy(quote.out) : quoting ? "…" : "0.00"}
                        </div>
                        <TokenChip sym={to} />
                      </div>
                    </Field>
                  </div>

                  {/* price info, shown once there's a quote */}
                  {quote && (
                    <dl className="mt-5 space-y-2 px-1 text-sm">
                      {rate !== null && (
                        <div className="flex justify-between">
                          <dt className="text-slate-500">Rate</dt>
                          <dd className="text-slate-300 tabular-nums">1 {from} ≈ {rate.toFixed(4)} {to}</dd>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Minimum received</dt>
                        <dd className="text-slate-300 tabular-nums">{tidy(quote.min)} {to}</dd>
                      </div>
                    </dl>
                  )}

                  <button onClick={action.onClick} disabled={action.disabled} className={`${BUTTON} mt-6`}>
                    {action.label}
                  </button>

                  {/* hints / errors */}
                  <div className="mt-3 min-h-5 text-center text-sm" role="status">
                    {phase === "failed" && message ? (
                      <span className="text-red-300">{message}</span>
                    ) : !busy && ready && problem && amount ? (
                      <span className={problem.hard ? "text-red-300" : "text-slate-500"}>{problem.text}</span>
                    ) : !busy && ready && quoteError ? (
                      <span className="text-red-300">{quoteError}</span>
                    ) : !busy && ready && quoting ? (
                      <span className="text-slate-500">Getting the best price…</span>
                    ) : !busy && message ? (
                      <span className="text-slate-400">{message}</span>
                    ) : null}
                  </div>

                  {phase === "failed" && (
                    <button onClick={() => { setPhase("idle"); setMessage(""); }} className={`${SECONDARY_BUTTON} mt-3`}>Try again</button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* reassurance */}
          <ul className="fade-up mx-auto mt-8 flex max-w-lg flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-500" style={{ "--delay": "300ms" } as CSSProperties}>
            <li>Fees paid in USDC</li>
            <li>Final in under a second</li>
            <li>You always receive at least the minimum shown</li>
          </ul>
        </section>
      </div>
    </main>
  );
}

/** Turns a wallet / SDK error into a short message for the screen. */
function explain(e: unknown, fallback: string): string {
  const err = e as { code?: number | string; message?: string };
  const msg = err?.message ?? "";
  if (err?.code === 4001 || /reject|denied|cancel/i.test(msg)) return "User rejected the transaction";
  if (/INPUT_UNSUPPORTED_ROUTE|331001/i.test(msg)) return "No swap route for this amount right now. Try a different amount.";
  if (/ONCHAIN_SIMULATION_FAILED/i.test(msg)) return "This swap would fail right now. Try a different amount.";
  return msg ? msg.slice(0, 140) : fallback;
}
