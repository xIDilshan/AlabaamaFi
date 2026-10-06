"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Inter } from "next/font/google";
import Header from "@/components/Header";

// Same brand font as the home page.
const brandFont = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });

/* ---------- Arc mainnet ---------- */
const ARC = {
  chainId: 5042,
  chainIdHex: "0x13b2",
  rpc: "https://rpc.mainnet.arc.io",
  explorer: "https://explorer.arc.io",
};

// USDC on Arc: the native coin (18 decimals) also has an ERC-20 face at this address (6 decimals).
// We send through the ERC-20 interface, so every amount below uses 6 decimals.
const USDC = "0x3600000000000000000000000000000000000000";
const DECIMALS = 6;

const CONTAINER = "w-full px-5 sm:px-8 lg:px-10";

const BUTTON =
  "inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] px-7 py-4 font-semibold text-white shadow-[0_10px_40px_rgba(30,120,255,0.28)] transition duration-300 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_15px_50px_rgba(30,120,255,0.42)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39c4ff] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:brightness-100";

const SECONDARY_BUTTON =
  "inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.045] px-7 py-4 font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:border-[#2f8bff]/40 hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39c4ff]";

/* ---------- BigInt helpers (BigInt() calls instead of 1n literals, so any TS target works) ---------- */
const ZERO = BigInt(0);
const E6 = BigInt(1000000);
const E12 = BigInt("1000000000000");
const FEE_FLOOR = BigInt("20000000000"); // Arc: minimum maxFeePerGas is 20 gwei

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

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

const pad32 = (hex: string) => hex.replace(/^0x/, "").toLowerCase().padStart(64, "0");
const shorten = (s: string, a = 6, b = 4) => (s.length > a + b + 2 ? `${s.slice(0, a)}…${s.slice(-b)}` : s);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ---------- wallet (any injected EVM wallet, EIP-1193) ---------- */
type Eip1193 = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (arg: unknown) => void) => void;
  removeListener?: (event: string, handler: (arg: unknown) => void) => void;
};
const getEth = (): Eip1193 | undefined => (typeof window === "undefined" ? undefined : (window as unknown as { ethereum?: Eip1193 }).ethereum);

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
     {/* change blur-[3px] to make the background more or less blurry */}
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

function Field({ label, right, children, invalid }: { label: string; right?: ReactNode; children: ReactNode; invalid?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-white/[0.035] p-4 transition focus-within:border-[#2588ff]/60 focus-within:bg-white/[0.05] ${invalid ? "border-red-400/40" : "border-white/[0.07]"}`}>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{label}</span>
        {right}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

const Pill = ({ onClick, children, disabled, icon }: { onClick: () => void; children: ReactNode; disabled?: boolean; icon?: ReactNode }) => (
  <button type="button" onClick={onClick} disabled={disabled} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3 py-1 text-xs font-medium text-[#8fd4ff] transition hover:bg-white/[0.12] disabled:opacity-40">
    {icon}
    {children}
  </button>
);

const PasteIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  </svg>
);

/* ---------- logos ----------
   Put usdc-logo.webp and arc-logo.png in mainnet/public/. If a file is missing, a built-in drawing is shown instead. */
const ARC_LOGO_SRC = "/arc-logo.png" as string;
const USDC_LOGO_SRC = "/usdc-logo.webp" as string;

function UsdcLogo({ size = 24 }: { size?: number }) {
  const [failed, setFailed] = useState(false);
  if (USDC_LOGO_SRC && !failed)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={USDC_LOGO_SRC} alt="USDC" width={size} height={size} onError={() => setFailed(true)} className="shrink-0 rounded-full object-cover" />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" role="img" aria-label="USDC" className="shrink-0">
      <circle cx="12" cy="12" r="12" fill="#2775CA" />
      <path d="M5.64 5.64A9 9 0 0 0 5.64 18.36M18.36 5.64A9 9 0 0 1 18.36 18.36" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M14.4 9.4c0-1-1-1.7-2.4-1.7s-2.4.7-2.4 1.8c0 2.4 4.9 1.1 4.9 3.6 0 1.1-1.1 1.9-2.5 1.9s-2.5-.8-2.5-1.9M12 6.3v1.4M12 16.3v1.4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ArcLogo({ size = 24 }: { size?: number }) {
  const [failed, setFailed] = useState(false);
  if (ARC_LOGO_SRC && !failed)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={ARC_LOGO_SRC} alt="Arc" width={size} height={size} onError={() => setFailed(true)} className="shrink-0 rounded-full object-cover" />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" role="img" aria-label="Arc" className="shrink-0">
      <defs>
        <linearGradient id="arcLogoBg" x1="3" y1="3" x2="21" y2="21">
          <stop stopColor="#12b9ff" />
          <stop offset="1" stopColor="#273ee8" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="12" fill="url(#arcLogoBg)" />
      <path d="M5.5 16.5a7 7 0 0 1 13 0" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <path d="M8.6 17a3.7 3.7 0 0 1 6.8 0" stroke="#fff" strokeOpacity=".6" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="8.2" r="1.3" fill="#fff" />
    </svg>
  );
}

/* Plays once on success: glowing rings spin, the Send icon appears, flies away, then the check mark draws in. */
function SendSuccessAnimation() {
  return (
    <div className="relative mx-auto h-32 w-32" aria-hidden>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 128 128" fill="none" style={{ filter: "drop-shadow(0 0 8px rgba(57,196,255,0.7))" }}>
        <defs>
          <linearGradient id="sendRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#12b9ff" />
            <stop offset="1" stopColor="#7d6bff" />
          </linearGradient>
        </defs>
        <circle cx="64" cy="64" r="48" stroke="url(#sendRing)" strokeOpacity=".28" />
        <circle cx="64" cy="64" r="58" stroke="url(#sendRing)" strokeOpacity=".16" />
        <g style={{ transformOrigin: "64px 64px", animation: "spinCW 2.4s linear infinite" }}>
          <circle cx="64" cy="64" r="48" stroke="#8fe6ff" strokeWidth="2.5" strokeLinecap="round" pathLength={1000} strokeDasharray="260 740" />
        </g>
        <g style={{ transformOrigin: "64px 64px", animation: "spinCCW 3.6s linear infinite" }}>
          <circle cx="64" cy="64" r="58" stroke="#4aa8ff" strokeWidth="1.8" strokeLinecap="round" pathLength={1000} strokeDasharray="180 820" />
        </g>
      </svg>

      {/* flight trail (runs along the up-right direction) */}
      <div className="absolute left-1/2 top-1/2 h-0 w-0" style={{ transform: "rotate(-45deg)" }}>
        <span className="absolute right-0 -top-px block h-[2px] w-28 bg-gradient-to-r from-transparent via-[#7ddcff] to-[#d5f6ff] shadow-[0_0_12px_2px_rgba(90,200,255,0.8)]" style={{ transformOrigin: "right center", opacity: 0, animation: "planeTrail 2.3s cubic-bezier(.4,0,.2,1) forwards" }} />
      </div>

      {/* the Send icon, same tile as the home page cards */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: 0, animation: "planeFly 2.3s cubic-bezier(.4,0,.2,1) forwards" }}>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#12b9ff] via-[#1978f5] to-[#273ee8] text-white shadow-[0_0_30px_rgba(40,160,255,0.7)]">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
        </div>
      </div>

      {/* check mark */}
      <span className="absolute inset-0 m-auto h-16 w-16 rounded-full border border-emerald-300/60" style={{ opacity: 0, animation: "checkRipple 1.1s ease-out 1.75s forwards" }} />
      <div className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300 shadow-[0_0_40px_rgba(52,211,153,0.4)] ring-1 ring-emerald-400/50" style={{ opacity: 0, animation: "checkPop .6s cubic-bezier(.2,1.4,.3,1) 1.75s forwards" }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12 5 5 9-10" strokeDasharray="24" strokeDashoffset="24" style={{ animation: "checkDraw .5s ease-out 2.05s forwards" }} />
        </svg>
      </div>
    </div>
  );
}

const Spinner = () => <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />;

/* ---------- page ---------- */
type Phase = "idle" | "signing" | "pending" | "done" | "failed";

export default function SendPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [account, setAccount] = useState<string | null>(null);
  const [chainOk, setChainOk] = useState<boolean | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [fee, setFee] = useState<bigint | null>(null); // in 6-decimal USDC units, rounded up

  const [phase, setPhase] = useState<Phase>("idle");
  const [txHash, setTxHash] = useState("");
  const [message, setMessage] = useState("");
  const [sentSummary, setSentSummary] = useState({ amount: "", to: "" });

  /* header mobile menu blur */
  useEffect(() => {
    const onMenu = (e: Event) => setMobileMenuOpen((e as CustomEvent<boolean>).detail);
    window.addEventListener("mobile-menu-state", onMenu);
    return () => window.removeEventListener("mobile-menu-state", onMenu);
  }, []);

  /* wallet state */
  useEffect(() => {
    const eth = getEth();
    if (!eth) return;
    const checkChain = (id: unknown) => setChainOk(typeof id === "string" && id.toLowerCase() === ARC.chainIdHex);
    const onAccounts = (accts: unknown) => setAccount((accts as string[] | undefined)?.[0] ?? null);

    eth.request({ method: "eth_accounts" }).then(onAccounts).catch(() => {});
    eth.request({ method: "eth_chainId" }).then(checkChain).catch(() => {});
    eth.on?.("accountsChanged", onAccounts);
    eth.on?.("chainChanged", checkChain);
    return () => {
      eth.removeListener?.("accountsChanged", onAccounts);
      eth.removeListener?.("chainChanged", checkChain);
    };
  }, []);

  /* USDC balance (ERC-20 face, 6 decimals) */
  const loadBalance = useCallback(async () => {
    const eth = getEth();
    if (!eth || !account || !chainOk) return setBalance(null);
    try {
      const res = (await eth.request({
        method: "eth_call",
        params: [{ to: USDC, data: "0x70a08231" + pad32(account) }, "latest"],
      })) as string;
      setBalance(BigInt(res || "0x0"));
    } catch {
      setBalance(null);
    }
  }, [account, chainOk]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  /* derived values */
  const to = recipient.trim();
  const toValid = ADDRESS_RE.test(to);
  const units = parseUnits6(amount);
  const busy = phase === "signing" || phase === "pending";

  /* network fee estimate (gas is paid in USDC) */
  useEffect(() => {
    setFee(null);
    const eth = getEth();
    if (!eth || !account || !chainOk || !toValid || !units || units <= ZERO) return;
    let live = true;
    const t = setTimeout(async () => {
      try {
        const data = "0xa9059cbb" + pad32(to) + units.toString(16).padStart(64, "0");
        const [gas, price] = await Promise.all([
          eth.request({ method: "eth_estimateGas", params: [{ from: account, to: USDC, data }] }),
          eth.request({ method: "eth_gasPrice" }),
        ]);
        let p = BigInt(price as string);
        if (p < FEE_FLOOR) p = FEE_FLOOR;
        const wei = BigInt(gas as string) * p; // 18-decimal native USDC
        if (live) setFee((wei + E12 - BigInt(1)) / E12);
      } catch {
        /* leave fee unknown */
      }
    }, 400);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [account, chainOk, to, toValid, units]);

  /* validation */
  const problem = useMemo((): { text: string; hard: boolean } | null => {
    if (!to) return { text: "Enter a recipient address", hard: false };
    if (!toValid) return { text: "That doesn't look like a valid address", hard: true };
    if (/^0x0{40}$/i.test(to)) return { text: "Arc doesn't allow transfers to the zero address", hard: true };
    if (to.toLowerCase() === USDC) return { text: "Don't send USDC to the token contract", hard: true };
    if (!amount) return { text: "Enter an amount above 0", hard: false };
    if (units === null) return { text: `Use up to ${DECIMALS} decimal places`, hard: true };
    if (units <= ZERO) return { text: "Enter an amount above 0", hard: false };
    if (balance !== null && units > balance) return { text: "Insufficient balance", hard: true };
    if (balance !== null && fee !== null && units + fee > balance) return { text: "Not enough left to cover the network fee", hard: true };
    return null;
  }, [to, toValid, amount, units, balance, fee]);

  /* actions */
  const connect = async () => {
    const eth = getEth();
    if (!eth) {
      setMessage("No EVM wallet found. Install a wallet such as MetaMask, then reload this page.");
      return;
    }
    try {
      const a = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      setAccount(a?.[0] ?? null);
      setChainOk(((await eth.request({ method: "eth_chainId" })) as string).toLowerCase() === ARC.chainIdHex);
    } catch {
      setMessage("Wallet connection was cancelled.");
    }
  };

  const switchToArc = async () => {
    const eth = getEth();
    if (!eth) return;
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: ARC.chainIdHex }] });
    } catch (e) {
      if ((e as { code?: number }).code === 4902) {
        try {
          await eth.request({
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

  const setMax = () => {
    if (balance === null) return;
    const buffer = fee ?? BigInt(10000); // keep ~0.01 USDC for gas if the fee isn't known yet
    const max = balance > buffer ? balance - buffer : ZERO;
    setAmount(formatUnits6(max, 0).replace(/,/g, ""));
  };

  const paste = async () => {
    try {
      setRecipient((await navigator.clipboard.readText()).trim());
    } catch {
      /* clipboard blocked */
    }
  };

  const reset = () => {
    setPhase("idle");
    setTxHash("");
    setMessage("");
    setAmount("");
    setRecipient("");
  };

  const send = async () => {
    const eth = getEth();
    if (!eth || !account || problem || !units) return;
    setPhase("signing");
    setMessage("");
    try {
      const data = "0xa9059cbb" + pad32(to) + units.toString(16).padStart(64, "0");
      const hash = (await eth.request({ method: "eth_sendTransaction", params: [{ from: account, to: USDC, data }] })) as string;
      setTxHash(hash);
      setSentSummary({ amount: formatUnits6(units), to });
      setPhase("pending");

      // Arc has deterministic finality: one receipt = final, no confirmation counting.
      for (let i = 0; i < 120; i++) {
        const receipt = (await eth.request({ method: "eth_getTransactionReceipt", params: [hash] })) as { status?: string } | null;
        if (receipt) {
          if (receipt.status === "0x1") {
            setPhase("done");
            loadBalance();
          } else {
            setMessage("The transaction was reverted. This can happen if the sender or recipient is blocklisted for USDC.");
            setPhase("failed");
          }
          return;
        }
        await sleep(1000);
      }
      setMessage("No result yet. Check the explorer for the final status.");
      setPhase("failed");
    } catch (e) {
      const err = e as { code?: number; message?: string };
      setMessage(err.code === 4001 ? "You cancelled the transaction in your wallet." : err.message?.slice(0, 160) || "The transaction could not be sent.");
      setPhase("failed");
    }
  };

  /* main button */
  let action: { label: ReactNode; onClick: () => void; disabled: boolean };
  if (!account) action = { label: "Connect wallet", onClick: connect, disabled: false };
  else if (chainOk === false) action = { label: "Switch to Arc Mainnet", onClick: switchToArc, disabled: false };
  else if (phase === "signing")
    action = { label: <span className="flex items-center gap-3"><Spinner />Confirm in your wallet</span>, onClick: () => {}, disabled: true };
  else if (phase === "pending")
    action = { label: <span className="flex items-center gap-3"><Spinner />Sending USDC</span>, onClick: () => {}, disabled: true };
  else action = { label: "Send USDC", onClick: send, disabled: !!problem || chainOk === null };

  const ready = !!account && chainOk === true;

  return (
    <main className={`${brandFont.className} relative min-h-screen overflow-x-hidden bg-[#010205] text-white selection:bg-[#167cff]/30`}>
      <style>{`
        @keyframes backgroundFloat{0%,100%{transform:translate3d(-50%,0,0) scale(1)}50%{transform:translate3d(-46%,2vw,0) scale(1.08)}}
        @keyframes backgroundFloatReverse{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(5vw,-3vw,0) scale(1.12)}}
        @keyframes twinkle{0%,100%{opacity:.12}50%{opacity:.9}}
        @keyframes floatUp{0%{transform:translateY(0);opacity:0}15%{opacity:.7}100%{transform:translateY(-220px);opacity:0}}
        @keyframes spinCW{to{transform:rotate(360deg)}}
        @keyframes spinCCW{to{transform:rotate(-360deg)}}
        @keyframes planeFly{0%{opacity:0;transform:translate(-10px,16px) scale(.4)}22%{opacity:1;transform:translate(0,0) scale(1)}45%{opacity:1;transform:translate(0,-5px) scale(1.08)}75%{opacity:1;transform:translate(62px,-62px) scale(.8)}100%{opacity:0;transform:translate(120px,-120px) scale(.3)}}
        @keyframes planeTrail{0%,40%{opacity:0;transform:translateX(0) scaleX(.2)}55%{opacity:1;transform:translateX(10px) scaleX(1)}78%{opacity:1;transform:translateX(88px) scaleX(1)}100%{opacity:0;transform:translateX(150px) scaleX(.3)}}
        @keyframes checkPop{0%{opacity:0;transform:scale(.3)}100%{opacity:1;transform:scale(1)}}
        @keyframes checkDraw{to{stroke-dashoffset:0}}
        @keyframes checkRipple{0%{opacity:.7;transform:scale(1)}100%{opacity:0;transform:scale(1.9)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
        .fade-up{opacity:0;animation:fadeUp .9s cubic-bezier(.2,.7,.2,1) forwards;animation-delay:var(--delay,0ms)}
        @media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important}.fade-up{opacity:1}}
      `}</style>

      <SpaceBackground />

      <div className="relative z-10">
        <Header />

        <div className={`transition-[filter] duration-500 ${mobileMenuOpen ? "blur-md" : "blur-0"}`}>
          <section className={`pb-24 pt-10 sm:pt-14 lg:pb-32 lg:pt-16 ${CONTAINER}`}>
            {/* title */}
            <div className="fade-up mx-auto max-w-2xl text-center">
              <h1 className="text-[2.5rem] font-bold leading-[1.05] tracking-[-0.035em] sm:text-6xl">
                Send <span className="bg-gradient-to-r from-[#18bfff] via-[#2588ff] to-[#4262ff] bg-clip-text text-transparent">USDC</span>
              </h1>
              <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-400 sm:text-lg">Move USDC to any wallet on Arc.</p>
            </div>

            {/* card */}
            <div className="fade-up relative mx-auto mt-10 w-full max-w-lg" style={{ "--delay": "150ms" } as CSSProperties}>
              <div className="absolute -inset-10 rounded-full bg-[#1675ff]/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#050a16]/80 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-7">
                {/* top bar */}
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-5">
                  <div>
                    <p className="text-xs text-slate-500">Network</p>
                    <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                      <ArcLogo size={20} />
                      Arc Mainnet
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Balance</p>
                    <p className="mt-1 text-sm font-semibold tabular-nums">
                      {ready && balance !== null ? `${formatUnits6(balance)} USDC` : "—"}
                    </p>
                  </div>
                </div>

                {phase === "done" ? (
                  /* success */
                  <div className="py-8 text-center">
                    <SendSuccessAnimation />
                    <div className="fade-up" style={{ "--delay": "1600ms" } as CSSProperties}>
                    <h2 className="mt-2 flex items-center justify-center gap-2.5 text-2xl font-semibold tracking-tight">
                      Sent {sentSummary.amount} <UsdcLogo size={26} /> USDC
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">To {shorten(sentSummary.to, 8, 6)}</p>
                    <p className="mt-1 text-xs text-slate-500">Tx hash · {shorten(txHash, 10, 8)}</p>
                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                      <a href={`${ARC.explorer}/tx/${txHash}`} target="_blank" rel="noreferrer" className={SECONDARY_BUTTON}>View on explorer</a>
                      <button onClick={reset} className={BUTTON}>Send another</button>
                    </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mt-5 space-y-3">
                      <Field label="Recipient" invalid={!!to && !toValid} right={<Pill onClick={paste} disabled={busy} icon={<PasteIcon />}>Paste</Pill>}>
                        <input
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                          disabled={busy}
                          placeholder="0x…"
                          spellCheck={false}
                          autoComplete="off"
                          autoCapitalize="off"
                          aria-label="Recipient address"
                          className="w-full bg-transparent text-lg font-semibold tracking-tight text-white outline-none placeholder:font-normal placeholder:text-slate-600 disabled:opacity-60"
                        />
                      </Field>

                      <Field
                        label="Amount"
                        right={ready && balance !== null ? <Pill onClick={setMax} disabled={busy}>Max</Pill> : undefined}
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
                            aria-label="Amount in USDC"
                            className="min-w-0 flex-1 bg-transparent text-4xl font-bold tabular-nums tracking-tight text-white outline-none placeholder:font-semibold placeholder:text-slate-700 disabled:opacity-60 sm:text-5xl"
                          />
                          <span className="flex shrink-0 items-center gap-2 rounded-full bg-white/[0.07] py-1.5 pl-2 pr-4 text-sm font-semibold"><UsdcLogo size={22} />USDC</span>
                        </div>
                      </Field>
                    </div>


                    <button onClick={action.onClick} disabled={action.disabled} className={`${BUTTON} mt-6`}>
                      {action.label}
                    </button>

                    {/* hints / errors */}
                    <div className="mt-3 min-h-5 text-center text-sm" role="status">
                      {phase === "failed" && message ? (
                        <span className="text-red-300">{message}</span>
                      ) : phase === "pending" ? (
                        <a href={`${ARC.explorer}/tx/${txHash}`} target="_blank" rel="noreferrer" className="text-[#65caff] hover:text-white">View on explorer</a>
                      ) : ready && problem && (to || amount) ? (
                        <span className={problem.hard ? "text-red-300" : "text-slate-500"}>{problem.text}</span>
                      ) : message ? (
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
              <li>Transfers can&apos;t be reversed, so double-check the address</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
