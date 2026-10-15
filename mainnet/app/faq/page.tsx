"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import Header from "@/components/Header";

/*
  AlabaamaFi FAQ. Save as: app/faq/page.tsx
  To add a question, add one line to the FAQ list below: { cat, q, a }.
*/

const brandFont = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });
const CONTAINER = "w-full px-4 sm:px-6 md:px-7 lg:px-10 xl:px-12";
const X_URL = "https://x.com/Alabaama_Fi";

type Cat = "General" | "Wallet and network" | "Send" | "Swap" | "Bridge" | "Activity" | "Security";
const CATS: Cat[] = ["General", "Wallet and network", "Send", "Swap", "Bridge", "Activity", "Security"];

const FAQ: { cat: Cat; q: string; a: string }[] = [
  /* ---- General ---- */
  { cat: "General", q: "What is AlabaamaFi?", a: "AlabaamaFi is a simple interface for Arc, Circle’s USDC-native Layer 1. You can send USDC, swap USDC, EURC and cirBTC, bridge USDC between Arc and other networks, and see everything your wallet has done on Arc, all in one place." },
  { cat: "General", q: "Do I need to create an account?", a: "No. You just connect your own wallet. Your settings and your swap and bridge history are saved in your browser on your device." },
  { cat: "General", q: "Does AlabaamaFi hold my funds?", a: "No. AlabaamaFi is non-custodial. Every action is signed in your own wallet, and the site never has your private keys or seed phrase." },
  { cat: "General", q: "Does AlabaamaFi charge a fee?", a: "AlabaamaFi does not add a fee of its own. You pay the network fee, and the swap or bridge service may charge its own fee. Every fee is shown in the quote before you confirm." },
  { cat: "General", q: "Which wallets work?", a: "Any EVM wallet, for example MetaMask, Rabby, OKX Wallet, Brave Wallet, Coinbase Wallet or a WalletConnect wallet. Use the Connect Wallet button in the header." },
  { cat: "General", q: "Is this the official site?", a: "The official site is app.alabaamafi.xyz and the official account is @Alabaama_Fi on X. Bookmark the site and avoid links from messages or ads." },

  /* ---- Wallet and network ---- */
  { cat: "Wallet and network", q: "How do I add Arc to my wallet?", a: "On the home page, use Add Arc Mainnet. To add it by hand, use these details: network name Arc Mainnet, RPC URL https://rpc.mainnet.arc.io, chain ID 5042, currency symbol USDC, block explorer https://explorer.arc.io. The home page also has a card with a Copy button for each one." },
  { cat: "Wallet and network", q: "Why do I need USDC for gas?", a: "On Arc, USDC is the gas token. You pay network fees in USDC, so there is no second token to hold. Keep a little USDC in your wallet for fees." },
  { cat: "Wallet and network", q: "The button says “Switch to Arc Mainnet”. What does that mean?", a: "Your wallet is on a different network. Tap the button and approve the switch in your wallet. On the Bridge page the button names the network you are sending from, for example “Switch to Ethereum”." },
  { cat: "Wallet and network", q: "My balance shows a dash (—). Why?", a: "The balance appears once your wallet is connected and on the right network. If it still shows a dash, switch networks, reconnect the wallet or refresh the page. A busy network provider can also delay it for a moment." },
  { cat: "Wallet and network", q: "Can I use a different network on the Send and Swap pages?", a: "No. Send and Swap work on Arc Mainnet only. To move USDC from another network to Arc, use the Bridge page." },

  /* ---- Send ---- */
  { cat: "Send", q: "How do I send USDC?", a: "Open Send, paste the recipient address, enter the amount and tap Send USDC. Confirm in your wallet. When it is final you see Successfully sent, with the amount, the fee and a link to the explorer." },
  { cat: "Send", q: "Can I cancel or reverse a transfer?", a: "No. Blockchain transfers cannot be reversed, and Arc confirms them in under a second. Double-check the address before you confirm." },
  { cat: "Send", q: "Why does it say “Not enough left to cover the network fee”?", a: "The fee is paid in USDC from the same balance. If the amount you enter plus the fee is more than your balance, the page stops you. Lower the amount a little, or use Max, which keeps the fee for you." },
  { cat: "Send", q: "Why can’t I send to the zero address or the USDC contract?", a: "Arc does not allow transfers to the zero address, and sending USDC to the token contract would lose it. The page blocks both to protect you." },
  { cat: "Send", q: "Why was my transfer reverted?", a: "A transfer can be reverted if the sender or the recipient is blocklisted for USDC. Open the transaction in the explorer to see the details." },

  /* ---- Swap ---- */
  { cat: "Swap", q: "Which tokens can I swap?", a: "USDC, EURC and cirBTC on Arc. Swaps run through Circle’s App Kit." },
  { cat: "Swap", q: "What is slippage?", a: "Slippage is how far the price may move against you before the swap is cancelled. Auto uses 0.5% for USDC and EURC, and 1% when cirBTC is involved. In Settings you can pick Custom: 0.1%, 0.5%, 1%, 3%, 5% or your own value." },
  { cat: "Swap", q: "What does “Minimum received” mean?", a: "It is the least you will get after slippage. The swap itself enforces it, so you cannot receive less than that amount." },
  { cat: "Swap", q: "Why did my swap stop and say the price moved?", a: "Just before sending, the page asks for a fresh price. If it is more than 0.5% worse than the one you saw, it stops and shows you the new price so you can decide again. Review it and tap Swap again." },
  { cat: "Swap", q: "Why is the network fee only an estimate?", a: "The page uses today’s gas price times a typical swap size. Your wallet shows the exact fee when you confirm." },
  { cat: "Swap", q: "The chart or market card says unavailable. What can I do?", a: "Prices and charts come from CoinGecko, which limits how many requests it allows. Wait a minute and try again. Swapping is not affected." },
  { cat: "Swap", q: "Where do I find my swap history?", a: "The History icon on the Swap card lists swaps made on this device. For everything your wallet has done on Arc, use the Activity page." },

  /* ---- Bridge ---- */
  { cat: "Bridge", q: "Which networks can I bridge between?", a: "The ones on bridge.usdc.com that work with an EVM wallet: Arc, Ethereum, Base, Arbitrum, OP Mainnet, Polygon, Avalanche, Unichain, Linea, Codex, HyperEVM, Ink, Monad, Plume, Sei, Sonic, World Chain and XDC. You can bridge from Arc, to Arc, or between two other networks." },
  { cat: "Bridge", q: "How does the bridge work?", a: "It uses Circle’s CCTP. Your USDC is burned on the first network and the same amount of native USDC is minted on the second one. It is not a wrapped token." },
  { cat: "Bridge", q: "What is Fast transfer?", a: "Fast transfer, the lightning-bolt icon, delivers your USDC in seconds instead of waiting about 15 minutes for the first network to finalize. It adds a small fee, taken from what you receive. It exists only on some source networks. From Arc, Avalanche and Polygon the standard transfer is already fast." },
  { cat: "Bridge", q: "How long does a bridge take?", a: "With Fast, about 8 seconds from most networks and about 20 seconds from Ethereum. Standard takes about 15 to 19 minutes from Ethereum, Base, Arbitrum, OP Mainnet and Unichain, about 8 seconds from Avalanche and Polygon, about 1 second from Arc, and hours from Linea. The quote shows the time for your route." },
  { cat: "Bridge", q: "Why do I only confirm on the first network?", a: "Circle’s Forwarding Service delivers the USDC on the receiving network for you, for a small delivery fee that is shown in the quote. Codex, Plume and XDC are not covered, so receiving there needs one extra confirmation in your wallet." },
  { cat: "Bridge", q: "What is slippage on a bridge?", a: "Bridging does not trade tokens, so there is no price to move. Slippage only limits how much the fees may change before the bridge starts. If you would receive more than that much less than quoted, the bridge stops and shows the new amount." },
  { cat: "Bridge", q: "What if a bridge stops halfway?", a: "The progress card marks the step that failed. If your USDC already left the first network, do not send it again. Tap Resume bridge if it appears, or check your wallet activity and the explorer. Keep the page open until a bridge finishes." },
  { cat: "Bridge", q: "Can I send the bridged USDC to a different address?", a: "Yes. Turn on Send to a different address, enter the address on the receiving network and tick the box that confirms it is correct. USDC sent to a wrong address cannot be recovered." },
  { cat: "Bridge", q: "Why do I need ETH (or another coin) to bridge?", a: "When you bridge from another network, you pay its gas in that network’s coin, such as ETH, POL or AVAX. The page warns you if you have none. From Arc, gas is paid in USDC." },
  { cat: "Bridge", q: "How do I bridge to or from Robinhood Chain?", a: "Pick Robinhood Chain as one of the two networks. Circle’s bridge does not support it, so the page switches to LI.FI, a third-party bridge aggregator. USDC sent there often arrives as USDG, so check the token in the quote, and start with a small amount." },

  /* ---- Activity ---- */
  { cat: "Activity", q: "What does the Activity page show?", a: "Everything your connected wallet has done on Arc mainnet, newest first: sends, receives, swaps and bridges. It loads older history as you scroll until the very first transaction." },
  { cat: "Activity", q: "Why can’t I see an older transaction yet?", a: "History loads in pages. Scroll down or tap Load more, and it keeps going until it reaches the beginning. A brand-new transaction can take a moment to appear in the explorer." },
  { cat: "Activity", q: "Why is a transaction labelled “Contract interaction”?", a: "The page guesses the type from the data: one token out and another in is a Swap, and USDC burned or minted is a Bridge. Anything it cannot place shows as a contract interaction. Tap the row to open it in the explorer." },
  { cat: "Activity", q: "Does Activity show other networks?", a: "No, only Arc mainnet. For other networks use their own explorers. NFT transfers are not shown." },

  /* ---- Security ---- */
  { cat: "Security", q: "Will AlabaamaFi ever ask for my seed phrase?", a: "Never. Not on the site, not in messages and not in replies. If anyone asks for it, it is a scam." },
  { cat: "Security", q: "What data does AlabaamaFi store?", a: "Only your settings and your swap and bridge history, in your own browser. There are no accounts. The services behind the site, such as RPC providers, Circle, LI.FI, CoinGecko and the Arc explorer, can see requests like your IP address and wallet address, and everything on a blockchain is public." },
  { cat: "Security", q: "What are token approvals?", a: "Some actions ask your wallet to approve a token, which lets a contract move that token up to the amount you approve. You can review and revoke approvals with a revoke tool." },
  { cat: "Security", q: "How can I stay safe?", a: "Use only app.alabaamafi.xyz, never share your seed phrase, double-check every address, read what your wallet shows before you confirm, and start with a small amount on a new route." },
  { cat: "Security", q: "Where can I get help or report a problem?", a: "Message @Alabaama_Fi on X, and include the page, the network and what you saw. Never post your seed phrase, and be careful with private messages from people you do not know." },
];

const Chev = ({ open }: { open: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transition: "transform .3s ease", transform: open ? "rotate(180deg)" : "none" }}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

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

function Item({ q, a, open, onToggle, id }: { q: string; a: string; open: boolean; onToggle: () => void; id: string }) {
  return (
    <div className={`rounded-2xl border transition-colors ${open ? "border-[#2588ff]/35 bg-white/[0.05]" : "border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.04]"}`}>
      <h3>
        <button onClick={onToggle} aria-expanded={open} aria-controls={`${id}-a`} id={`${id}-q`} className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5">
          <span className="text-[15px] font-semibold leading-6 text-white sm:text-base">{q}</span>
          <span className={`shrink-0 ${open ? "text-[#39c4ff]" : "text-slate-500"}`}><Chev open={open} /></span>
        </button>
      </h3>
      <div id={`${id}-a`} role="region" aria-labelledby={`${id}-q`} className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          <p className="px-4 pb-5 text-[15px] leading-7 text-slate-300 sm:px-5">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function FaqPage() {
  const [cat, setCat] = useState<"All" | Cat>("All");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useMemo(() => {
    const t = query.trim().toLowerCase();
    return FAQ.map((f, i) => ({ ...f, id: `faq-${i}` })).filter((f) => (cat === "All" || f.cat === cat) && (!t || f.q.toLowerCase().includes(t) || f.a.toLowerCase().includes(t)));
  }, [cat, query]);

  const groups = useMemo(() => CATS.map((c) => ({ cat: c, items: list.filter((f) => f.cat === c) })).filter((g) => g.items.length), [list]);

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

        <section className={`pb-24 pt-8 sm:pt-12 lg:pb-32 lg:pt-14 ${CONTAINER}`}>
          <div className="fade-up mx-auto max-w-3xl text-center">
            <h1 className="text-[2.4rem] font-bold leading-[1.05] tracking-[-0.035em] sm:text-[3.9rem]">
              <span className="bg-gradient-to-r from-[#18bfff] via-[#2588ff] to-[#4262ff] bg-clip-text text-transparent">FAQ</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-[15px] leading-6 text-slate-400 sm:mt-4 sm:text-lg sm:leading-7">Quick answers about sending, swapping, bridging and staying safe on Arc.</p>
          </div>

          <div className="fade-up mx-auto mt-10 max-w-3xl" style={{ "--delay": "120ms" } as CSSProperties}>
            {/* search */}
            <label className="flex items-center gap-3 rounded-full border border-white/[0.08] bg-[#050a16]/80 px-5 py-3.5 backdrop-blur-xl focus-within:border-[#2588ff]/60">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-slate-500" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the FAQ" aria-label="Search the FAQ" className="min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-slate-600" />
              {query && (
                <button onClick={() => setQuery("")} aria-label="Clear search" className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.08] text-sm text-slate-400 hover:text-white">×</button>
              )}
            </label>

            {/* categories */}
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {(["All", ...CATS] as ("All" | Cat)[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${cat === c ? "bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] text-white" : "bg-white/[0.05] text-slate-400 hover:bg-white/[0.09] hover:text-white"}`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* questions */}
            <div className="mt-8 space-y-9">
              {groups.length === 0 && (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-5 py-12 text-center">
                  <p className="text-base font-semibold">No answers found</p>
                  <p className="mx-auto mt-1.5 max-w-xs text-sm leading-6 text-slate-500">Try a different word, or ask us on X.</p>
                </div>
              )}
              {groups.map((g) => (
                <section key={g.cat}>
                  <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#2588ff]">{g.cat}</h2>
                  <div className="space-y-2.5">
                    {g.items.map((f) => (
                      <Item key={f.id} id={f.id} q={f.q} a={f.a} open={openId === f.id} onToggle={() => setOpenId(openId === f.id ? null : f.id)} />
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* still need help */}
            <div className="mt-12 rounded-[1.75rem] border border-white/[0.08] bg-[#050a16]/80 p-6 text-center backdrop-blur-xl sm:p-8">
              <h2 className="text-xl font-semibold tracking-tight">Still need help?</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">The docs explain every page in detail. For anything else, message us on X.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/docs" className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] px-7 py-3.5 font-semibold text-white shadow-[0_10px_40px_rgba(30,120,255,0.28)] transition duration-300 hover:-translate-y-0.5 hover:brightness-110">Read the docs</Link>
                <a href={X_URL} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.045] px-7 py-3.5 font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:border-[#2f8bff]/40 hover:bg-white/[0.08]">Message us on X</a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
