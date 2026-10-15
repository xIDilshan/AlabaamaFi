"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { Inter } from "next/font/google";

/*
  AlabaamaFi Help Center (FAQ). Save as: app/faq/page.tsx
  Laid out like a help center: search, topic cards, popular questions, contact options.
  It has its own header (it does not use components/Header).
  To add a question, add one object to the FAQ list below.
*/

const brandFont = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });

const X_URL = "https://x.com/Alabaama_Fi";
const DISCORD_URL = "https://discord.gg/NBKHmUfw";

/* ---------- icons ---------- */
const Svg = ({ d, size = 20, sw = 1.8 }: { d: string; size?: number; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const XLogo = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const DiscordLogo = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
  </svg>
);
const I = {
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35",
  back: "M19 12H5M12 19l-7-7 7-7",
  chevron: "m9 6 6 6-6 6",
  down: "m6 9 6 6 6-6",
  book: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20",
};

/* ---------- topics ---------- */
type Cat = "General" | "Wallet and network" | "Send" | "Swap" | "Bridge" | "Activity" | "Fees" | "Security";
const CATS: { id: Cat; blurb: string; icon: string }[] = [
  { id: "General", blurb: "What AlabaamaFi is and how it works", icon: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 16v-4M12 8h.01" },
  { id: "Wallet and network", blurb: "Connect a wallet and add Arc", icon: "M3 7a2 2 0 0 1 2-2h13v4M3 7v10a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2ZM16.5 14h.01" },
  { id: "Send", blurb: "Send USDC to any wallet", icon: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" },
  { id: "Swap", blurb: "Swap USDC, EURC and cirBTC", icon: "M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4" },
  { id: "Bridge", blurb: "Move USDC between networks", icon: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" },
  { id: "Activity", blurb: "Your history on Arc", icon: "M12 7v5l3 2M3 12a9 9 0 1 0 3-6.7M3 4v4h4" },
  { id: "Fees", blurb: "Network fees and costs", icon: "M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
  { id: "Security", blurb: "Stay safe and protect your data", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" },
];

type Q = { cat: Cat; q: string; a: string; popular?: boolean; more?: { label: string; href: string } };
const FAQ: Q[] = [
  /* ---- General ---- */
  { cat: "General", q: "What is AlabaamaFi?", a: "AlabaamaFi is a simple interface for Arc, Circle’s USDC-native Layer 1. You can send USDC, swap USDC, EURC and cirBTC, bridge USDC between Arc and other networks, and see everything your wallet has done on Arc, all in one place.", popular: true, more: { label: "Read the overview", href: "/docs#overview" } },
  { cat: "General", q: "Do I need to create an account?", a: "No. You just connect your own wallet. Your settings and your swap and bridge history are saved in your browser, on your device." },
  { cat: "General", q: "Does AlabaamaFi hold my funds?", a: "No. AlabaamaFi is non-custodial. Every action is signed in your own wallet, and the site never has your private keys or seed phrase.", popular: true },
  { cat: "General", q: "Is this the official site?", a: "The official site is app.alabaamafi.xyz, the official X account is @Alabaama_Fi and the community is on Discord. Bookmark the site and avoid links from messages or ads." },
  { cat: "General", q: "Which pages does AlabaamaFi have?", a: "Home, Send, Swap, Bridge and Activity, plus these Docs and FAQ. Use the menu in the top corner to move between them." },
  { cat: "General", q: "Where can I read the terms of service?", a: "The Terms of Service are in the Docs, at the end of the page.", more: { label: "Open the Terms of Service", href: "/docs#terms" } },

  /* ---- Wallet and network ---- */
  { cat: "Wallet and network", q: "Which wallets work?", a: "Any EVM wallet, for example MetaMask, Rabby, OKX Wallet, Brave Wallet, Coinbase Wallet or a WalletConnect wallet. Use the Connect Wallet button in the top corner.", popular: true },
  { cat: "Wallet and network", q: "How do I add Arc to my wallet?", a: "On the home page, use Add Arc Mainnet. To add it by hand, use: network name Arc Mainnet, RPC URL https://rpc.mainnet.arc.io, chain ID 5042, currency symbol USDC, block explorer https://explorer.arc.io. The home page also has a card with a Copy button for each one.", popular: true, more: { label: "See the network details", href: "/docs#networks" } },
  { cat: "Wallet and network", q: "Why do I need USDC for gas?", a: "On Arc, USDC is the gas token. You pay network fees in USDC, so there is no second token to hold. Keep a little USDC in your wallet for fees." },
  { cat: "Wallet and network", q: "The button says “Switch to Arc Mainnet”. What does that mean?", a: "Your wallet is on a different network. Tap the button and approve the switch in your wallet. On the Bridge page the button names the network you are sending from, for example “Switch to Ethereum”." },
  { cat: "Wallet and network", q: "My balance shows a dash (—). Why?", a: "The balance appears once your wallet is connected and on the right network. If it still shows a dash, switch networks, reconnect the wallet or refresh the page. A busy network provider can also delay it for a moment." },
  { cat: "Wallet and network", q: "Can I use the phone browser?", a: "Yes. Open the site in your phone’s browser and connect with WalletConnect, or open it inside your wallet app’s built-in browser. Every page is made for phones." },

  /* ---- Send ---- */
  { cat: "Send", q: "How do I send USDC?", a: "Open Send, paste the recipient address, enter the amount and tap Send USDC. Confirm in your wallet. When it is final you see Successfully sent, with the amount, the fee and a link to the explorer.", popular: true, more: { label: "Read the Send guide", href: "/docs#send" } },
  { cat: "Send", q: "Can I cancel or reverse a transfer?", a: "No. Blockchain transfers cannot be reversed, and Arc confirms them in under a second. Double-check the address before you confirm." },
  { cat: "Send", q: "Why does it say “Not enough left to cover the network fee”?", a: "The fee is paid in USDC from the same balance. If the amount you enter plus the fee is more than your balance, the page stops you. Lower the amount a little, or use Max, which keeps the fee for you." },
  { cat: "Send", q: "Why can’t I send to the zero address or the USDC contract?", a: "Arc does not allow transfers to the zero address, and sending USDC to the token contract would lose it. The page blocks both to protect you." },
  { cat: "Send", q: "Why was my transfer reverted?", a: "A transfer can be reverted if the sender or the recipient is blocklisted for USDC. Open the transaction in the explorer to see the details." },

  /* ---- Swap ---- */
  { cat: "Swap", q: "Which tokens can I swap?", a: "USDC, EURC and cirBTC on Arc. Swaps run through Circle’s App Kit.", more: { label: "Read the Swap guide", href: "/docs#swap" } },
  { cat: "Swap", q: "What is slippage?", a: "Slippage is how far the price may move against you before the swap is cancelled. Auto uses 0.5% for USDC and EURC, and 1% when cirBTC is involved. In Settings you can pick Custom: 0.1%, 0.5%, 1%, 3%, 5% or your own value.", popular: true },
  { cat: "Swap", q: "What does “Minimum received” mean?", a: "It is the least you will get after slippage. The swap itself enforces it, so you cannot receive less than that amount." },
  { cat: "Swap", q: "Why did my swap stop and say the price moved?", a: "Just before sending, the page asks for a fresh price. If it is more than 0.5% worse than the one you saw, it stops and shows you the new price. Nothing was spent. Review it and tap Swap again." },
  { cat: "Swap", q: "Why is the network fee only an estimate?", a: "The page uses today’s gas price times a typical swap size. Your wallet shows the exact fee when you confirm." },
  { cat: "Swap", q: "The chart or market card says unavailable. What can I do?", a: "Prices and charts come from CoinGecko, which limits how many requests it allows. Wait a minute and try again. Swapping is not affected." },
  { cat: "Swap", q: "Where do I find my swap history?", a: "The History icon on the Swap card lists swaps made on this device. For everything your wallet has done on Arc, use the Activity page." },

  /* ---- Bridge ---- */
  { cat: "Bridge", q: "Which networks can I bridge between?", a: "The ones on bridge.usdc.com that work with an EVM wallet: Arc, Ethereum, Base, Arbitrum, OP Mainnet, Polygon, Avalanche, Unichain, Linea, Codex, HyperEVM, Ink, Monad, Plume, Sei, Sonic, World Chain and XDC. You can bridge from Arc, to Arc, or between two other networks.", popular: true, more: { label: "Read the Bridge guide", href: "/docs#bridge" } },
  { cat: "Bridge", q: "How does the bridge work?", a: "It uses Circle’s CCTP. Your USDC is burned on the first network and the same amount of native USDC is minted on the second one. It is not a wrapped token." },
  { cat: "Bridge", q: "What is Fast transfer?", a: "Fast transfer, the lightning-bolt icon, delivers your USDC in seconds instead of waiting about 15 minutes for the first network to finalize. It adds a small fee, taken from what you receive. It exists only on some source networks. From Arc, Avalanche and Polygon the standard transfer is already fast.", more: { label: "Fast or Standard", href: "/docs#bridge-fast" } },
  { cat: "Bridge", q: "How long does a bridge take?", a: "With Fast, about 8 seconds from most networks and about 20 seconds from Ethereum. Standard takes about 15 to 19 minutes from Ethereum, Base, Arbitrum, OP Mainnet and Unichain, about 8 seconds from Avalanche and Polygon, about 1 second from Arc, and hours from Linea. The quote shows the time for your route.", popular: true },
  { cat: "Bridge", q: "Why do I only confirm on the first network?", a: "Circle’s Forwarding Service delivers the USDC on the receiving network for you, for a small delivery fee that is shown in the quote. Codex, Plume and XDC are not covered, so receiving there needs one extra confirmation in your wallet." },
  { cat: "Bridge", q: "What is slippage on a bridge?", a: "Bridging does not trade tokens, so there is no price to move. Slippage only limits how much the fees may change before the bridge starts. If you would receive more than that much less than quoted, the bridge stops and shows the new amount." },
  { cat: "Bridge", q: "What if a bridge stops halfway?", a: "The progress card marks the step that failed. If your USDC already left the first network, do not send it again. Tap Resume bridge if it appears, or check your wallet activity and the explorer. Keep the page open until a bridge finishes.", more: { label: "If a bridge stops halfway", href: "/docs#bridge-stuck" } },
  { cat: "Bridge", q: "Can I send the bridged USDC to a different address?", a: "Yes. Turn on Send to a different address, enter the address on the receiving network and tick the box that confirms it is correct. USDC sent to a wrong address cannot be recovered." },
  { cat: "Bridge", q: "Why do I need ETH (or another coin) to bridge?", a: "When you bridge from another network, you pay its gas in that network’s coin, such as ETH, POL or AVAX. The page warns you if you have none. From Arc, gas is paid in USDC." },
  { cat: "Bridge", q: "How do I bridge to or from Robinhood Chain?", a: "Pick Robinhood Chain as one of the two networks. Circle’s bridge does not support it, so the page switches to LI.FI, a third-party bridge aggregator. USDC sent there often arrives as USDG, so check the token in the quote, and start with a small amount.", more: { label: "Robinhood Chain routes", href: "/docs#robinhood" } },

  /* ---- Activity ---- */
  { cat: "Activity", q: "What does the Activity page show?", a: "Everything your connected wallet has done on Arc mainnet, newest first: sends, receives, swaps and bridges. It loads older history as you scroll until the very first transaction.", more: { label: "Read the Activity guide", href: "/docs#activity" } },
  { cat: "Activity", q: "Why can’t I see an older transaction yet?", a: "History loads in pages. Scroll down or tap Load more, and it keeps going until it reaches the beginning. A brand-new transaction can take a moment to appear in the explorer." },
  { cat: "Activity", q: "Why is a transaction labelled “Contract interaction”?", a: "The page guesses the type from the data: one token out and another in is a Swap, and USDC burned or minted is a Bridge. Anything it cannot place shows as a contract interaction. Tap the row to open it in the explorer." },
  { cat: "Activity", q: "Does Activity show other networks?", a: "No, only Arc mainnet. For other networks use their own explorers. NFT transfers are not shown." },

  /* ---- Fees ---- */
  { cat: "Fees", q: "What fees do I pay?", a: "The network fee (gas), which is paid in USDC on Arc. When you bridge you may also pay a small Fast fee and a Delivery fee, and swaps are priced into the quoted rate. Every fee is shown before you confirm.", popular: true, more: { label: "See all fees", href: "/docs#fees" } },
  { cat: "Fees", q: "Does AlabaamaFi charge a fee?", a: "AlabaamaFi does not add a fee of its own to sends, swaps or bridges. You pay the network fee, and the swap or bridge service may charge its own fee, which is shown in the quote." },
  { cat: "Fees", q: "Why is the fee in my wallet different from the quote?", a: "Quotes are estimates from the current gas price. Gas prices change second by second, and your wallet shows the exact fee when you confirm. After a Send, the success screen shows the real fee that was paid." },
  { cat: "Fees", q: "How fast does Arc settle?", a: "Arc finalizes transactions in under a second, so when your wallet reports a transaction as done, it is final." },

  /* ---- Security ---- */
  { cat: "Security", q: "Will AlabaamaFi ever ask for my seed phrase?", a: "Never. Not on the site, not in messages and not in replies. If anyone asks for it, it is a scam.", popular: true },
  { cat: "Security", q: "What data does AlabaamaFi store?", a: "Only your settings and your swap and bridge history, in your own browser. There are no accounts. The services behind the site, such as RPC providers, Circle, LI.FI, CoinGecko and the Arc explorer, can see requests like your IP address and wallet address, and everything on a blockchain is public.", more: { label: "Security and privacy", href: "/docs#security" } },
  { cat: "Security", q: "What are token approvals?", a: "Some actions ask your wallet to approve a token, which lets a contract move that token up to the amount you approve. You can review and revoke approvals with a revoke tool." },
  { cat: "Security", q: "How can I stay safe?", a: "Use only app.alabaamafi.xyz, never share your seed phrase, double-check every address, read what your wallet shows before you confirm, and start with a small amount on a new route." },
  { cat: "Security", q: "Where can I get help or report a problem?", a: "Ask in our Discord or message @Alabaama_Fi on X, and include the page, the network and what you saw. Never post your seed phrase, and be careful with private messages from people you do not know." },
];

/* ---------- pieces ---------- */
function SpaceBackground() {
  const { stars, dust } = useMemo(() => {
    let seed = 41;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const r2 = (n: number) => Math.round(n * 100) / 100;
    return {
      stars: Array.from({ length: 120 }, (_, id) => ({ id, x: r2(rnd() * 100), y: r2(rnd() * 100), size: r2(1 + rnd() * 1.8), d: r2(rnd() * 7), t: r2(3 + rnd() * 5) })),
      dust: Array.from({ length: 20 }, (_, id) => ({ id, x: r2(rnd() * 100), y: r2(rnd() * 100), size: r2(1.5 + rnd() * 2), d: r2(rnd() * 14), t: r2(14 + rnd() * 14) })),
    };
  }, []);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#010205_0%,#020a1c_30%,#031126_60%,#010307_100%)]" />
      <div className="absolute left-1/2 top-[6%] h-[60vw] w-[60vw] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(22,115,255,0.22),transparent_68%)] blur-3xl" />
      {stars.map((s) => (
        <span key={s.id} className="absolute rounded-full bg-[#a9dfff]" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, animation: `twinkle ${s.t}s ease-in-out ${s.d}s infinite` }} />
      ))}
      {dust.map((p) => (
        <span key={p.id} className="absolute rounded-full bg-[#6cc4ff]" style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, animation: `floatUp ${p.t}s linear ${p.d}s infinite` }} />
      ))}
    </div>
  );
}

function Item({ item, id, open, onToggle, showCat = false }: { item: Q; id: string; open: boolean; onToggle: () => void; showCat?: boolean }) {
  return (
    <div className={`rounded-2xl border transition-colors ${open ? "border-[#2588ff]/35 bg-white/[0.05]" : "border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.04]"}`}>
      <h3>
        <button onClick={onToggle} aria-expanded={open} aria-controls={`${id}-a`} id={`${id}-q`} className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5 sm:py-[1.1rem]">
          <span className="min-w-0">
            {showCat && <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2588ff]">{item.cat}</span>}
            <span className="block text-[15px] font-semibold leading-6 text-white sm:text-base">{item.q}</span>
          </span>
          <span className={`shrink-0 transition-transform duration-300 ${open ? "rotate-180 text-[#39c4ff]" : "text-slate-500"}`}><Svg d={I.down} size={18} sw={2.2} /></span>
        </button>
      </h3>
      <div id={`${id}-a`} role="region" aria-labelledby={`${id}-q`} className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          <div className="px-4 pb-5 sm:px-5">
            <p className="text-[15px] leading-7 text-slate-300">{item.a}</p>
            {item.more && (
              <Link href={item.more.href} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#65caff] hover:text-white">
                {item.more.label} <Svg d={I.chevron} size={14} sw={2.4} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- page ---------- */
export default function FaqPage() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Cat | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const all = useMemo(() => FAQ.map((f, i) => ({ ...f, id: `q${i}` })), []);
  const searching = query.trim().length > 0;

  const results = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return all.filter((f) => words.every((w) => (f.q + " " + f.a + " " + f.cat).toLowerCase().includes(w)));
  }, [all, query]);

  const popular = useMemo(() => all.filter((f) => f.popular), [all]);
  const inCat = useMemo(() => (cat ? all.filter((f) => f.cat === cat) : []), [all, cat]);
  const count = (c: Cat) => FAQ.filter((f) => f.cat === c).length;

  const pick = (c: Cat | null) => {
    setCat(c);
    setQuery("");
    setOpenId(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));

  const pillLink = "inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-sm font-semibold transition";

  return (
    <div className={`${brandFont.className} relative min-h-screen bg-[#010205] text-white selection:bg-[#167cff]/30`}>
      <style>{`
        @keyframes twinkle{0%,100%{opacity:.12}50%{opacity:.9}}
        @keyframes floatUp{0%{transform:translateY(0);opacity:0}15%{opacity:.7}100%{transform:translateY(-220px);opacity:0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
        .fade-up{opacity:0;animation:fadeUp .8s cubic-bezier(.2,.7,.2,1) forwards;animation-delay:var(--delay,0ms)}
        @media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-delay:0s!important;animation-iteration-count:1!important}.fade-up{opacity:1}}
      `}</style>

      <SpaceBackground />

      {/* ================= HEADER (help-center style) ================= */}
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#010205]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6">
          <button onClick={() => pick(null)} className="flex min-w-0 items-center gap-2.5 text-left" aria-label="AlabaamaFi Help Center home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/alabaamafi-logo.png" alt="" className="h-8 w-8 shrink-0 object-contain" />
            <span className="truncate text-[17px] font-bold tracking-tight">
              Alabaama<span className="text-[#159fff]">Fi</span>
            </span>
            <span className="hidden rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-xs font-semibold text-slate-300 sm:inline">Help Center</span>
          </button>

          <div className="ml-auto flex items-center gap-1.5">
            <Link href="/docs" className={`${pillLink} text-slate-300 hover:bg-white/[0.07] hover:text-white`}>
              <Svg d={I.book} size={16} />
              <span className="hidden sm:inline">Docs</span>
            </Link>
            <a href={DISCORD_URL} target="_blank" rel="noreferrer" className={`${pillLink} border border-white/10 bg-white/[0.045] text-white hover:border-[#2f8bff]/40 hover:bg-white/[0.08]`} aria-label="Join the AlabaamaFi Discord">
              <DiscordLogo size={16} />
              <span className="hidden sm:inline">Discord</span>
            </a>
            <Link href="/" className={`${pillLink} bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] text-white shadow-[0_8px_30px_rgba(30,120,255,0.25)] hover:brightness-110`}>
              <Svg d={I.back} size={16} sw={2.2} />
              <span className="hidden sm:inline">Back to AlabaamaFi</span>
              <span className="sm:hidden">Home</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* ================= HERO + SEARCH ================= */}
        <section className="px-4 pb-10 pt-12 text-center sm:px-6 sm:pb-14 sm:pt-16">
          <div className="fade-up mx-auto max-w-3xl">
            <h1 className="text-[2.2rem] font-bold leading-[1.08] tracking-[-0.035em] sm:text-6xl">
              How can we <span className="bg-gradient-to-r from-[#18bfff] via-[#2588ff] to-[#4262ff] bg-clip-text text-transparent">help?</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-6 text-slate-400 sm:text-lg sm:leading-7">Answers about sending, swapping, bridging and staying safe on Arc.</p>

            <label className="mx-auto mt-8 flex max-w-2xl items-center gap-3 rounded-full border border-white/[0.1] bg-[#050a16]/85 px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl transition focus-within:border-[#2588ff]/60">
              <span className="shrink-0 text-slate-500"><Svg d={I.search} /></span>
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpenId(null);
                }}
                placeholder="Search for answers"
                aria-label="Search for answers"
                className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-600"
              />
              {query && (
                <button onClick={() => setQuery("")} aria-label="Clear search" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-sm text-slate-300 hover:text-white">×</button>
              )}
            </label>

            {!searching && !cat && (
              <div className="mx-auto mt-4 flex max-w-2xl flex-wrap justify-center gap-2 text-sm">
                <span className="text-slate-500">Popular:</span>
                {["slippage", "Fast transfer", "gas", "Robinhood", "seed phrase"].map((w) => (
                  <button key={w} onClick={() => setQuery(w)} className="rounded-full bg-white/[0.06] px-3 py-1 text-slate-300 transition hover:bg-white/[0.11] hover:text-white">{w}</button>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          {/* ================= SEARCH RESULTS ================= */}
          {searching && (
            <section className="mx-auto max-w-3xl">
              <p className="mb-4 px-1 text-sm text-slate-400">
                {results.length} {results.length === 1 ? "result" : "results"} for <span className="font-semibold text-white">“{query.trim()}”</span>
              </p>
              {results.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-5 py-12 text-center">
                  <p className="text-base font-semibold">No answers found</p>
                  <p className="mx-auto mt-1.5 max-w-xs text-sm leading-6 text-slate-500">Try a different word, browse the topics, or ask us in Discord.</p>
                  <button onClick={() => setQuery("")} className="mt-5 rounded-full border border-white/10 bg-white/[0.05] px-5 py-2.5 text-sm font-semibold hover:bg-white/[0.09]">Browse topics</button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {results.map((f) => (
                    <Item key={f.id} id={f.id} item={f} open={openId === f.id} onToggle={() => toggle(f.id)} showCat />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ================= A TOPIC ================= */}
          {!searching && cat && (
            <section className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-12">
              <aside className="lg:sticky lg:top-24 lg:self-start">
                <ul className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
                  {CATS.map((c) => (
                    <li key={c.id} className="shrink-0">
                      <button
                        onClick={() => pick(c.id)}
                        className={`flex w-full items-center gap-2.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition lg:rounded-xl lg:px-3 lg:py-2.5 ${cat === c.id ? "bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] text-white lg:bg-none lg:bg-[#159fff]/[0.14] lg:text-[#7dd3fc]" : "bg-white/[0.05] text-slate-400 hover:text-white lg:bg-transparent lg:hover:bg-white/[0.04]"}`}
                      >
                        <span className="hidden lg:block"><Svg d={c.icon} size={17} /></span>
                        {c.id}
                      </button>
                    </li>
                  ))}
                </ul>
              </aside>

              <div className="min-w-0">
                <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
                  <button onClick={() => pick(null)} className="font-medium text-[#65caff] hover:text-white">Help Center</button>
                  <Svg d={I.chevron} size={14} />
                  <span className="text-slate-300">{cat}</span>
                </nav>
                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{cat}</h2>
                <p className="mt-2 text-slate-400">{CATS.find((c) => c.id === cat)?.blurb}</p>
                <div className="mt-7 space-y-2.5">
                  {inCat.map((f) => (
                    <Item key={f.id} id={f.id} item={f} open={openId === f.id} onToggle={() => toggle(f.id)} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ================= HOME ================= */}
          {!searching && !cat && (
            <>
              <section>
                <h2 className="mb-5 px-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#2588ff]">Browse by topic</h2>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                  {CATS.map((c, i) => (
                    <button
                      key={c.id}
                      onClick={() => pick(c.id)}
                      className="fade-up group flex h-full flex-col items-start rounded-[1.5rem] border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.015] p-4 text-left transition duration-300 hover:-translate-y-1 hover:border-[#2588ff]/50 hover:shadow-[0_24px_70px_rgba(16,93,255,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#39c4ff] sm:p-6"
                      style={{ "--delay": `${i * 50}ms` } as CSSProperties}
                    >
                      <span className="text-[#62d4ff] transition duration-300 group-hover:scale-110" style={{ filter: "drop-shadow(0 0 5px rgba(57,196,255,0.9)) drop-shadow(0 0 14px rgba(22,136,245,0.6))" }}>
                        <Svg d={c.icon} size={30} sw={1.6} />
                      </span>
                      <span className="mt-4 text-base font-semibold tracking-tight sm:text-lg">{c.id}</span>
                      <span className="mt-1 hidden text-sm leading-5 text-slate-400 sm:block">{c.blurb}</span>
                      <span className="mt-3 text-xs font-medium text-slate-500">{count(c.id)} articles</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="mx-auto mt-14 max-w-3xl sm:mt-20">
                <h2 className="mb-5 px-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#2588ff]">Popular questions</h2>
                <div className="space-y-2.5">
                  {popular.map((f) => (
                    <Item key={f.id} id={f.id} item={f} open={openId === f.id} onToggle={() => toggle(f.id)} showCat />
                  ))}
                </div>
              </section>
            </>
          )}

          {/* ================= CONTACT ================= */}
          <section className="mx-auto mt-16 max-w-4xl sm:mt-24">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Still need help?</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400 sm:text-base">Our community and the docs can help with the rest.</p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4">
              <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="group rounded-[1.5rem] border border-white/[0.08] bg-[#050a16]/80 p-5 text-center backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#2588ff]/50 sm:p-6">
                <span className="mx-auto flex h-11 w-11 items-center justify-center text-[#62d4ff]" style={{ filter: "drop-shadow(0 0 6px rgba(57,196,255,0.9))" }}><DiscordLogo size={28} /></span>
                <p className="mt-3 text-base font-semibold">Join our Discord</p>
                <p className="mt-1 text-sm leading-5 text-slate-400">Ask the community and the team.</p>
              </a>
              <Link href="/docs" className="group rounded-[1.5rem] border border-white/[0.08] bg-[#050a16]/80 p-5 text-center backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#2588ff]/50 sm:p-6">
                <span className="mx-auto flex h-11 w-11 items-center justify-center text-[#62d4ff]" style={{ filter: "drop-shadow(0 0 6px rgba(57,196,255,0.9))" }}><Svg d={I.book} size={28} sw={1.6} /></span>
                <p className="mt-3 text-base font-semibold">Read the docs</p>
                <p className="mt-1 text-sm leading-5 text-slate-400">Step-by-step guides for every page.</p>
              </Link>
              <a href={X_URL} target="_blank" rel="noreferrer" className="group rounded-[1.5rem] border border-white/[0.08] bg-[#050a16]/80 p-5 text-center backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#2588ff]/50 sm:p-6">
                <span className="mx-auto flex h-11 w-11 items-center justify-center text-[#62d4ff]" style={{ filter: "drop-shadow(0 0 6px rgba(57,196,255,0.9))" }}><XLogo size={24} /></span>
                <p className="mt-3 text-base font-semibold">Follow on X</p>
                <p className="mt-1 text-sm leading-5 text-slate-400">News and updates from @Alabaama_Fi.</p>
              </a>
            </div>
            <p className="mx-auto mt-8 max-w-md text-center text-xs leading-5 text-slate-600">Nobody from AlabaamaFi will ever ask for your seed phrase or private key.</p>
          </section>

          <div className="mt-14 flex flex-col items-center gap-3 border-t border-white/[0.06] pt-8 text-center text-xs text-slate-600 sm:flex-row sm:justify-between sm:text-left">
            <p>© {new Date().getFullYear()} AlabaamaFi. A simple interface for Arc.</p>
            <nav className="flex flex-wrap justify-center gap-5">
              <Link href="/" className="hover:text-white">AlabaamaFi home</Link>
              <Link href="/docs" className="hover:text-white">Docs</Link>
              <Link href="/docs#terms" className="hover:text-white">Terms of Service</Link>
            </nav>
          </div>
        </div>
      </main>
    </div>
  );
}
