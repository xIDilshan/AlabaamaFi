"use client";

import { useEffect, useState } from "react";
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

const ACTIONS = [
  { href: "/send", title: "Send", text: "Send USDC to any address. Gas is paid in USDC too.", icon: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" },
  { href: "/swap", title: "Swap", text: "Swap stablecoins onchain with clear pricing.", icon: "M7 4v13m0 0-3-3m3 3 3-3M17 20V7m0 0-3 3m3-3 3 3" },
  { href: "/bridge", title: "Bridge", text: "Move USDC in and out of Arc from other chains.", icon: "M3 18c0-6 4-10 9-10s9 4 9 10M3 18h18M8 18v-4M16 18v-4M12 18v-6" },
  { href: "/activity", title: "Activity", text: "Track every transaction from your wallet.", icon: "M3 12h4l3-8 4 16 3-8h4" },
];

const FEATURES = [
  { title: "USDC as gas", text: "Fees are paid in USDC, so costs stay predictable and dollar-denominated." },
  { title: "Sub-second finality", text: "Blocks settle deterministically in under a second on Malachite BFT consensus." },
  { title: "EVM compatible", text: "Use the wallets, tools, and Solidity contracts you already know." },
  { title: "Built for payments", text: "Designed for payments, stablecoin FX, lending, and tokenized assets." },
];

const NETWORK_ROWS: [string, string][] = [
  ["Network", "Arc Mainnet"],
  ["Chain ID", `${ARC.chainId} (${ARC.chainIdHex})`],
  ["Currency", "USDC"],
  ["RPC", ARC.rpc.replace("https://", "")],
  ["Explorer", ARC.explorer.replace("https://", "")],
];

const USE_CASES = ["Peer-to-peer payments", "eCommerce checkout", "Stablecoin FX", "Agentic economy", "Prediction markets", "Borrow and lend"];

function Icon({ d }: { d: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [block, setBlock] = useState<number | null>(null);
  const [walletMsg, setWalletMsg] = useState("");

  useEffect(() => {
    const handleMenuState = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      setMobileMenuOpen(customEvent.detail);
    };
    window.addEventListener("mobile-menu-state", handleMenuState);
    return () => window.removeEventListener("mobile-menu-state", handleMenuState);
  }, []);

  // Live block height from Arc's public RPC (open CORS, no key needed)
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(ARC.rpc, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] }),
        });
        const json = await res.json();
        if (alive && json?.result) setBlock(parseInt(json.result, 16));
      } catch {
        /* keep last value */
      }
    };
    load();
    const id = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const addArcToWallet = async () => {
    const eth = (window as any).ethereum;
    if (!eth) {
      setWalletMsg("No wallet found. Install an EVM wallet first.");
      return;
    }
    try {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: ARC.chainIdHex,
            chainName: "Arc Mainnet",
            nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
            rpcUrls: [ARC.rpc],
            blockExplorerUrls: [ARC.explorer],
          },
        ],
      });
      setWalletMsg("Arc Mainnet added to your wallet.");
    } catch {
      setWalletMsg("Request was cancelled or failed.");
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020408] text-white">
      <Header />

      <div
        className={`min-w-0 transition-[filter] duration-300 ${
          mobileMenuOpen ? "blur-md" : "blur-0"
        }`}
      >
        {/* ---------------- HERO ---------------- */}
        <section className="relative overflow-hidden border-b border-white/5">
          {/* planet arc, bottom-right */}
          <div aria-hidden className="pointer-events-none absolute -bottom-[38rem] -right-[26rem] h-[52rem] w-[52rem] rounded-full border border-[#2f7bff]/40 bg-[radial-gradient(ellipse_at_30%_20%,rgba(37,99,235,0.55),rgba(10,30,90,0.35)_45%,transparent_70%)] shadow-[0_0_120px_rgba(37,99,235,0.35)] sm:-bottom-[34rem] lg:-bottom-[30rem] lg:-right-[16rem]" />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#020408_35%,transparent_80%)]" />

          <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-16 sm:px-8 sm:pb-32 sm:pt-24 lg:pt-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2f4fbf]/60 bg-[#0a1230]/60 px-4 py-2 text-sm text-[#b9c8ff]">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
              Arc Network
            </div>

            <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              One place. <span className="text-[#2f8bff]">Every move.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-400 sm:text-xl">A simple interface for Arc</p>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-400">
              Send, swap, and bridge USDC on Arc mainnet. Fees are paid in USDC and blocks settle in under a second.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/swap" className="rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#2f8bff] px-7 py-3 font-medium shadow-[0_8px_30px_rgba(37,99,235,0.4)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f8bff]">
                Start swapping
              </Link>
              <Link href="/bridge" className="rounded-full border border-white/15 bg-white/5 px-7 py-3 font-medium transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f8bff]">
                Bridge to Arc
              </Link>
            </div>

            {/* live stats */}
            <dl className="mt-16 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
              {[
                ["Latest block", block ? block.toLocaleString() : "…"],
                ["Chain ID", String(ARC.chainId)],
                ["Gas token", "USDC"],
                ["Finality", "< 1 second"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-sm text-slate-500">{label}</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ---------------- ACTIONS ---------------- */}
        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <h2 className="text-3xl font-semibold tracking-tight">Everything you do on Arc</h2>
          <p className="mt-3 max-w-xl text-slate-400">Pick an action. Connect your wallet when you are ready.</p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ACTIONS.map((a) => (
              <Link key={a.href} href={a.href} className="group rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-6 transition hover:border-[#2f8bff]/60 hover:bg-[#0a1230]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2f8bff]">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1d4ed8]/20 text-[#5fa8ff]">
                  <Icon d={a.icon} />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{a.text}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ---------------- WHY ARC ---------------- */}
        <section className="border-y border-white/5 bg-[#040811]">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">Why Arc</h2>
              <p className="mt-4 max-w-md leading-relaxed text-slate-400">
                Arc is Circle&apos;s EVM-compatible Layer 1 for onchain finance with stablecoins. Public mainnet launched on 16 September 2026.
              </p>
              <a href={ARC.docs} target="_blank" rel="noreferrer" className="mt-6 inline-block text-[#5fa8ff] underline-offset-4 hover:underline">
                Read the Arc docs
              </a>
            </div>
            <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <div key={f.title} className="border-l-2 border-[#2f8bff]/60 pl-4">
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- NETWORK ---------------- */}
        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">Add Arc to your wallet</h2>
              <p className="mt-3 max-w-md text-slate-400">One click adds the mainnet settings to any EVM wallet.</p>
              <button onClick={addArcToWallet} className="mt-6 rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#2f8bff] px-7 py-3 font-medium transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f8bff]">
                Add Arc Mainnet
              </button>
              <p role="status" className="mt-3 min-h-5 text-sm text-slate-400">{walletMsg}</p>
              <p className="mt-4 max-w-md text-sm text-slate-500">
                Need test funds? The <Link href="/faucet" className="text-[#5fa8ff] hover:underline">faucet</Link> dispenses testnet USDC only.
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
              <table className="w-full text-left text-sm">
                <tbody>
                  {NETWORK_ROWS.map(([k, v]) => (
                    <tr key={k} className="border-b border-white/5 last:border-0">
                      <th scope="row" className="whitespace-nowrap px-5 py-4 font-normal text-slate-500">{k}</th>
                      <td className="px-5 py-4 font-medium">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ---------------- USE CASES ---------------- */}
        <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
          <h2 className="text-3xl font-semibold tracking-tight">What people build on Arc</h2>
          <ul className="mt-8 flex flex-wrap gap-3">
            {USE_CASES.map((u) => (
              <li key={u} className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm text-slate-300">
                {u}
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------- FOOTER ---------------- */}
        <footer className="border-t border-white/5">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p>© {new Date().getFullYear()} AlabaamaFi. An independent interface for Arc.</p>
            <nav className="flex gap-6">
              <a href={ARC.docs} target="_blank" rel="noreferrer" className="hover:text-white">Docs</a>
              <a href={ARC.explorer} target="_blank" rel="noreferrer" className="hover:text-white">Explorer</a>
              <a href={ARC.x} target="_blank" rel="noreferrer" className="hover:text-white">Arc on X</a>
            </nav>
          </div>
        </footer>
      </div>
    </main>
  );
}
