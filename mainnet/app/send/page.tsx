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
const EYEBROW = "text-sm font-medium uppercase tracking-[0.22em] text-[#4abaff]";

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

const Pill = ({ onClick, children, disabled }: { onClick: () => void; children: ReactNode; disabled?: boolean }) => (
  <button type="button" onClick={onClick} disabled={disabled} className="rounded-full bg-white/[0.07] px-3 py-1 text-xs font-medium text-[#8fd4ff] transition hover:bg-white/[0.12] disabled:opacity-40">
    {children}
  </button>
);

/* ---------- logos ----------
   To use the official artwork: put the files in mainnet/public/ and set the paths below,
   e.g. ARC_LOGO_SRC = "/arc-logo.svg". Leave them empty to use the built-in drawings. */
const ARC_LOGO_SRC = "" as string;
const USDC_LOGO_SRC = "" as string;

function UsdcLogo({ size = 24 }: { size?: number }) {
  if (USDC_LOGO_SRC)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={USDC_LOGO_SRC} alt="USDC" width={size} height={size} className="shrink-0 rounded-full" />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" role="img" aria-label="USDC" className="shrink-0">
      <circle cx="12" cy="12" r="12" fill="#2775CA" />
      <path d="M5.64 5.64A9 9 0 0 0 5.64 18.36M18.36 5.64A9 9 0 0 1 18.36 18.36" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M14.4 9.4c0-1-1-1.7-2.4-1.7s-2.4.7-2.4 1.8c0 2.4 4.9 1.1 4.9 3.6 0 1.1-1.1 1.9-2.5 1.9s-2.5-.8-2.5-1.9M12 6.3v1.4M12 16.3v1.4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ArcLogo({ size = 24 }: { size?: number }) {
  if (ARC_LOGO_SRC)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={ARC_LOGO_SRC} alt="Arc" width={size} height={size} className="shrink-0 rounded-full" />;
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

const Spinner = () => <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />;

/* ---------- page ---------- */
type Phase = "idle" | "signing" | "pending" | "done" | "failed";

export default function SendPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [hasWallet, setHasWallet] = useState(true);
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
    if (!eth) {
      setHasWallet(false);
      return;
    }
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
    if (!amount) return { text: "Enter an amount", hard: false };
    if (units === null) return { text: `Use up to ${DECIMALS} decimal places`, hard: true };
    if (units <= ZERO) return { text: "Enter an amount above 0", hard: false };
    if (balance !== null && units > balance) return { text: "Amount is more than your balance", hard: true };
    if (balance !== null && fee !== null && units + fee > balance) return { text: "Not enough left to cover the network fee", hard: true };
    return null;
  }, [to, toValid, amount, units, balance, fee]);

  /* actions */
  const connect = async () => {
    const eth = getEth();
    if (!eth) return;
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
  if (!hasWallet) action = { label: "No EVM wallet detected", onClick: () => {}, disabled: true };
  else if (!account) action = { label: "Connect wallet", onClick: connect, disabled: false };
  else if (chainOk === false) action = { label: "Switch to Arc Mainnet", onClick: switchToArc, disabled: false };
  else if (phase === "signing")
    action = { label: <span className="flex items-center gap-3"><Spinner />Confirm in your wallet</span>, onClick: () => {}, disabled: true };
  else if (phase === "pending")
    action = { label: <span className="flex items-center gap-3"><Spinner />Finalizing on Arc</span>, onClick: () => {}, disabled: true };
  else action = { label: "Send USDC", onClick: send, disabled: !!problem || chainOk === null };

  const ready = !!account && chainOk === true;

  return (
    <main className={`${brandFont.className} relative min-h-screen overflow-x-hidden bg-[#010205] text-white selection:bg-[#167cff]/30`}>
      <style>{`
        @keyframes backgroundFloat{0%,100%{transform:translate3d(-50%,0,0) scale(1)}50%{transform:translate3d(-46%,2vw,0) scale(1.08)}}
        @keyframes backgroundFloatReverse{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(5vw,-3vw,0) scale(1.12)}}
        @keyframes twinkle{0%,100%{opacity:.12}50%{opacity:.9}}
        @keyframes floatUp{0%{transform:translateY(0);opacity:0}15%{opacity:.7}100%{transform:translateY(-220px);opacity:0}}
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
              <div className="mb-5 flex justify-center -space-x-3" aria-hidden>
                <span className="rounded-full ring-4 ring-[#020a1c]"><ArcLogo size={48} /></span>
                <span className="rounded-full ring-4 ring-[#020a1c]"><UsdcLogo size={48} /></span>
              </div>
              <p className={EYEBROW}>Send</p>
              <h1 className="mt-4 text-[2.5rem] font-bold leading-[1.05] tracking-[-0.035em] sm:text-6xl">
                Send <span className="bg-gradient-to-r from-[#18bfff] via-[#2588ff] to-[#4262ff] bg-clip-text text-transparent">USDC.</span>
              </h1>
              <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-400 sm:text-lg">Move USDC to any wallet on Arc. Network fees are paid in USDC too.</p>
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
                      <span className={`h-2 w-2 rounded-full ${chainOk ? "bg-emerald-400 shadow-[0_0_10px_#34d399]" : "bg-slate-600"}`} />
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Wallet</p>
                    <p className="mt-1 text-sm font-medium tabular-nums">{account ? shorten(account) : "Not connected"}</p>
                  </div>
                </div>

                {phase === "done" ? (
                  /* success */
                  <div className="py-8 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
                    </div>
                    <h2 className="mt-5 flex items-center justify-center gap-2.5 text-2xl font-semibold tracking-tight">
                      Sent {sentSummary.amount} <UsdcLogo size={26} /> USDC
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">To {shorten(sentSummary.to, 8, 6)}</p>
                    <p className="mt-1 text-xs text-slate-600">Final on Arc · {shorten(txHash, 10, 8)}</p>
                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                      <a href={`${ARC.explorer}/tx/${txHash}`} target="_blank" rel="noreferrer" className={SECONDARY_BUTTON}>View on explorer</a>
                      <button onClick={reset} className={BUTTON}>Send another</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mt-5 space-y-3">
                      <Field label="Recipient" invalid={!!to && !toValid} right={<Pill onClick={paste} disabled={busy}>Paste</Pill>}>
                        <input
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                          disabled={busy}
                          placeholder="0x…"
                          spellCheck={false}
                          autoComplete="off"
                          autoCapitalize="off"
                          aria-label="Recipient address"
                          className="w-full bg-transparent text-base font-medium text-white outline-none placeholder:text-slate-600 disabled:opacity-60"
                        />
                      </Field>

                      <Field
                        label="Amount"
                        right={
                          <span className="flex items-center gap-2">
                            {ready && balance !== null && <span>Balance {formatUnits6(balance)}</span>}
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
                            aria-label="Amount in USDC"
                            className="min-w-0 flex-1 bg-transparent text-3xl font-semibold tabular-nums text-white outline-none placeholder:text-slate-700 disabled:opacity-60"
                          />
                          <span className="flex shrink-0 items-center gap-2 rounded-full bg-white/[0.07] py-1.5 pl-2 pr-4 text-sm font-semibold"><UsdcLogo size={22} />USDC</span>
                        </div>
                      </Field>
                    </div>

                    {/* summary */}
                    <dl className="mt-5 space-y-2 px-1 text-sm">
                      <div className="flex items-center justify-between">
                        <dt className="text-slate-500">Asset</dt>
                        <dd className="flex items-center gap-2 text-slate-300"><UsdcLogo size={16} />USDC on Arc</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Network fee</dt>
                        <dd className="text-slate-300">{fee !== null ? `≈ ${formatUnits6(fee, 3)} USDC` : "Paid in USDC"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Finality</dt>
                        <dd className="text-slate-300">Under 1 second</dd>
                      </div>
                    </dl>

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
