"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import Header from "@/components/Header";

/*
  AlabaamaFi docs. Save as: app/docs/page.tsx
  Everything written here describes what the site does today. If you change a feature, update its section.
*/

const brandFont = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });
const CONTAINER = "w-full px-4 sm:px-6 md:px-7 lg:px-10 xl:px-12";
const SITE = "https://app.alabaamafi.xyz";
const X_URL = "https://x.com/Alabaama_Fi";

/* ---------- small building blocks ---------- */
const P = ({ children }: { children: ReactNode }) => <p className="mt-4 text-[15px] leading-7 text-slate-300 first:mt-0">{children}</p>;
const H3 = ({ children }: { children: ReactNode }) => <h3 className="mt-8 text-lg font-semibold tracking-tight text-white first:mt-0">{children}</h3>;
const UL = ({ items }: { items: ReactNode[] }) => (
  <ul className="mt-4 space-y-2 text-[15px] leading-7 text-slate-300">
    {items.map((t, i) => (
      <li key={i} className="flex gap-3">
        <span aria-hidden className="mt-[0.7rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#2588ff]" />
        <span>{t}</span>
      </li>
    ))}
  </ul>
);
const Steps = ({ items }: { items: ReactNode[] }) => (
  <ol className="mt-4 space-y-3">
    {items.map((t, i) => (
      <li key={i} className="flex gap-4 text-[15px] leading-7 text-slate-300">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#2588ff]/30 bg-[#0d4fc5]/10 text-xs font-semibold text-[#62c8ff]">{i + 1}</span>
        <span>{t}</span>
      </li>
    ))}
  </ol>
);
const Note = ({ title, children, tone = "info" }: { title: string; children: ReactNode; tone?: "info" | "warn" }) => (
  <div className={`mt-5 rounded-2xl border px-4 py-3.5 text-sm leading-6 ${tone === "warn" ? "border-amber-400/25 bg-amber-400/[0.06] text-amber-100" : "border-[#2588ff]/25 bg-[#0d4fc5]/[0.08] text-slate-200"}`}>
    <p className={`text-[13px] font-semibold ${tone === "warn" ? "text-amber-300" : "text-[#7dd3fc]"}`}>{title}</p>
    <div className="mt-1 text-slate-300">{children}</div>
  </div>
);
const Table = ({ head, rows }: { head: string[]; rows: ReactNode[][] }) => (
  <div className="mt-4 overflow-x-auto rounded-2xl border border-white/[0.07]">
    <table className="w-full min-w-[420px] text-left text-sm">
      <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.14em] text-slate-500">
        <tr>{head.map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-white/[0.06]">
        {rows.map((r, i) => (
          <tr key={i}>{r.map((c, j) => <td key={j} className="px-4 py-3 align-top text-slate-300 [overflow-wrap:anywhere]">{c}</td>)}</tr>
        ))}
      </tbody>
    </table>
  </div>
);
const Code = ({ children }: { children: ReactNode }) => <code className="rounded-md bg-white/[0.07] px-1.5 py-0.5 text-[13px] text-[#9fe0ff] [overflow-wrap:anywhere]">{children}</code>;
const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer" className="font-medium text-[#65caff] underline-offset-4 hover:text-white hover:underline">{children}</a>
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

/* ---------- the sections ---------- */
type Sec = { id: string; title: string; body: ReactNode };

const SECTIONS: Sec[] = [
  {
    id: "overview",
    title: "Overview",
    body: (
      <>
        <P>AlabaamaFi is a simple interface for <A href="https://docs.arc.io">Arc</A>, Circle’s USDC-native, EVM-compatible Layer 1. It puts the things you do most on Arc in one place: <strong className="text-white">Send</strong>, <strong className="text-white">Swap</strong>, <strong className="text-white">Bridge</strong> and <strong className="text-white">Activity</strong>.</P>
        <UL
          items={[
            <><strong className="text-white">Non-custodial.</strong> You connect your own EVM wallet and approve every action in it. AlabaamaFi never holds your funds or your private keys.</>,
            <><strong className="text-white">No account.</strong> There is nothing to sign up for. Your settings and swap and bridge history are kept in your own browser.</>,
            <><strong className="text-white">Clear numbers.</strong> Every page shows what you pay, what you receive and what it costs before you confirm.</>,
          ]}
        />
        <Note title="Official links">The site is <A href={SITE}>{SITE.replace("https://", "")}</A> and the official account is <A href={X_URL}>@Alabaama_Fi</A> on X. Bookmark the site and be careful with look-alike links.</Note>
      </>
    ),
  },
  {
    id: "start",
    title: "Getting started",
    body: (
      <>
        <Steps
          items={[
            <><strong className="text-white">Connect your wallet.</strong> Tap <em>Connect Wallet</em> in the header and choose your wallet. Any EVM wallet works, such as MetaMask, Rabby, OKX Wallet, Brave Wallet, Coinbase Wallet or a WalletConnect wallet.</>,
            <><strong className="text-white">Add Arc Mainnet.</strong> On the home page, use <em>Add Arc Mainnet</em>, or add it by hand with the details in the <a href="#networks" className="font-medium text-[#65caff] hover:text-white">Networks and tokens</a> section. Send and Swap show a <em>Switch to Arc Mainnet</em> button if your wallet is on another network.</>,
            <><strong className="text-white">Get some USDC on Arc.</strong> USDC is Arc’s gas token, so you need a little to do anything. You can bridge it in from another network on the Bridge page, or receive it from someone.</>,
            <><strong className="text-white">Make your move.</strong> Open Send, Swap, Bridge or Activity from the menu.</>,
          ]}
        />
      </>
    ),
  },
  {
    id: "send",
    title: "Send",
    body: (
      <>
        <P>Send USDC to any wallet address on Arc.</P>
        <Steps
          items={[
            <>Paste or type the <strong className="text-white">recipient address</strong>.</>,
            <>Enter the <strong className="text-white">amount</strong>. <em>Max</em> fills your balance minus the network fee.</>,
            <>Tap <strong className="text-white">Send USDC</strong> and confirm in your wallet.</>,
            <>When the transaction is final you see <strong className="text-white">Successfully sent</strong>, with the amount, the recipient, the real fee paid and a link to the explorer.</>,
          ]}
        />
        <H3>What the page checks for you</H3>
        <UL
          items={[
            "The address is valid (0x followed by 40 characters).",
            "It is not the zero address, which Arc does not allow, and not the USDC token contract.",
            "You have enough balance for the amount plus the network fee.",
            "Your wallet is on Arc Mainnet.",
          ]}
        />
        <Note title="Transfers cannot be reversed" tone="warn">Double-check the address before you confirm. If a transfer is reverted, it can be because the sender or the recipient is blocklisted for USDC.</Note>
      </>
    ),
  },
  {
    id: "swap",
    title: "Swap",
    body: (
      <>
        <P>Swap <strong className="text-white">USDC</strong>, <strong className="text-white">EURC</strong> and <strong className="text-white">cirBTC</strong> on Arc. Swaps run through Circle’s App Kit.</P>
        <Steps
          items={[
            <>Pick the two tokens with the token buttons. Picking the token that is on the other side swaps them. The round arrow button flips the pair.</>,
            <>Enter an amount, or use <em>50%</em> or <em>Max</em>. A live price appears a moment after you stop typing.</>,
            <>Review <strong className="text-white">Rate</strong>, <strong className="text-white">Minimum received</strong>, <strong className="text-white">Slippage</strong> and the estimated <strong className="text-white">Network fee</strong>.</>,
            <>Tap <strong className="text-white">Swap</strong> and confirm in your wallet. A pill above the card shows <em>Swapping</em>, then <em>Swap succeeded</em>.</>,
          ]}
        />
        <H3>Slippage and minimum received</H3>
        <P>Slippage is how far the price may move against you before the swap is cancelled. <strong className="text-white">Auto</strong> uses 0.5% for USDC and EURC, and 1% whenever cirBTC is involved. In Settings you can choose <strong className="text-white">Custom</strong> (0.1%, 0.5%, 1%, 3%, 5% or your own value from 0.01% to 50%). <strong className="text-white">Minimum received</strong> is the least you will get; the swap itself enforces it.</P>
        <H3>Extra safety checks</H3>
        <UL
          items={[
            "Just before sending, the page asks for a fresh price. If it is more than 0.5% worse than the one you saw, it stops and shows the new price.",
            "It checks that your wallet account and network have not changed, and blocks double taps.",
            "After sending it waits for the transaction to be confirmed, and shows what you actually received.",
          ]}
        />
        <H3>Prices, charts and history</H3>
        <UL
          items={[
            "Market price, 24h change, market cap and 24h volume come from CoinGecko. They are for information; the swap price comes from the swap service.",
            "On desktop, the chart icon opens a price chart on the left of the card, with ranges 1H, 4H, 1D, 7D, 1M, 3M and 1Y, as a line or as candles. On phones, tap the price card under “You receive”.",
            "The History icon lists swaps made on this device. For everything your wallet has done, use Activity.",
          ]}
        />
        <Note title="The network fee is an estimate">It is today’s gas price times a typical swap size. Your wallet shows the exact fee when you confirm.</Note>
      </>
    ),
  },
  {
    id: "bridge",
    title: "Bridge",
    body: (
      <>
        <P>Move USDC between Arc and other networks, or between two other networks, with <strong className="text-white">Circle’s CCTP</strong>. Your USDC is burned on the first network and the same amount of native USDC is minted on the second one, so it is not a wrapped token.</P>
        <Steps
          items={[
            <>Choose the <strong className="text-white">From</strong> and <strong className="text-white">To</strong> networks. Every network is clickable, Arc too, and the list shows your USDC balance on each. Picking the network that is on the other side swaps them.</>,
            <>Enter the amount. The quote shows <strong className="text-white">Slippage</strong>, <strong className="text-white">Gas fee</strong>, <strong className="text-white">Estimated time</strong> and the fees, and the <em>To</em> box shows what you receive.</>,
            <>If your wallet is on another network, the button reads <strong className="text-white">Switch to …</strong> (the network you are sending from). Tap it, then tap <strong className="text-white">Bridge</strong>.</>,
            <>A card shows the route as a glowing road, one step at a time. When it ends you see <strong className="text-white">Bridge complete</strong>.</>,
          ]}
        />
        <H3>Networks</H3>
        <P>The list matches the networks on <A href="https://bridge.usdc.com">bridge.usdc.com</A> that work with an EVM wallet: Arc, Ethereum, Base, Arbitrum, OP Mainnet, Polygon, Avalanche, Unichain, Linea, Codex, HyperEVM, Ink, Monad, Plume, Sei, Sonic, World Chain and XDC. The list comes from Circle’s own SDK, so it follows Circle’s updates.</P>
        <H3>Fast transfer</H3>
        <P>The lightning-bolt icon next to Settings turns <strong className="text-white">Fast transfer</strong> on or off, and it glows when on. Fast uses Circle’s CCTP Fast Transfer: your USDC arrives in seconds, for a small fee taken from what you receive. With Fast off, the standard transfer waits for the first network to finalize. Fast exists only on some source networks (such as Ethereum, Base, Arbitrum, OP Mainnet, Unichain and Linea). From Arc, Avalanche and Polygon the standard transfer is already fast, and the quote says “Not needed here”.</P>
        <Table
          head={["Sending from", "Fast", "Standard"]}
          rows={[
            ["Ethereum", "about 20 sec", "about 15–19 min"],
            ["Base, Arbitrum, OP Mainnet, Unichain", "about 8 sec", "about 15–19 min"],
            ["Linea", "about 8 sec", "about 6–32 hours"],
            ["Avalanche, Polygon", "not needed", "about 8 sec"],
            ["Arc", "not needed", "about 1 sec"],
          ]}
        />
        <P>These are Circle’s published confirmation times. Wallet confirmations add a little.</P>
        <H3>Why you confirm only once</H3>
        <P>For most networks Circle’s <strong className="text-white">Forwarding Service</strong> delivers the USDC on the receiving network for you, so you only confirm on the network you send from. The price is a small <strong className="text-white">Delivery fee</strong>, shown in the quote and taken from what you receive. Codex, Plume and XDC are not on Circle’s forwarding list, so receiving there needs one extra confirmation in your wallet. The page tells you when that applies.</P>
        <H3>Slippage on a bridge</H3>
        <P>Bridging does not trade tokens, so there is no price to move. Slippage here only limits how much the fees may change before the bridge starts. If you would receive more than this much less than quoted, the bridge stops and shows the new amount. Auto is 0.5%.</P>
        <H3>Send to a different address</H3>
        <P>Turn on <em>Send to a different address</em> to deliver the USDC to someone else’s address on the receiving network. The page rejects invalid addresses and USDC contract addresses, and you must tick a box confirming the address is correct before you can bridge.</P>
        <H3>If a bridge stops halfway</H3>
        <P>The progress card marks the step that failed. If your USDC has already left the first network, <strong className="text-white">do not send it again</strong>. Use <em>Resume bridge</em> when it appears, or check your wallet activity and the explorer. Keep the page open until a bridge finishes.</P>
        <Note title="Bridge history">The History icon lists bridges made on this device. Activity shows everything on Arc from the explorer.</Note>
      </>
    ),
  },
  {
    id: "robinhood",
    title: "Robinhood Chain",
    body: (
      <>
        <P>Circle’s USDC bridge does not support Robinhood Chain. When you pick it as one of the two networks, the Bridge page switches to <strong className="text-white">LI.FI</strong>, a third-party bridge aggregator, with both networks already chosen. Every other pair keeps using Circle’s bridge.</P>
        <UL
          items={[
            "The LI.FI widget connects your wallet by itself, so you may connect once more inside it.",
            "USDC sent to Robinhood Chain often arrives as USDG, a different stablecoin. Check the token you will receive in the quote.",
            "LI.FI routes work differently from Circle’s burn-and-mint: a bridge or relayer delivers your funds. Read the quote, the fees and the time, and start with a small amount.",
            "If a pair does not work in the widget, use the “Open it in Jumper” link under it.",
          ]}
        />
      </>
    ),
  },
  {
    id: "activity",
    title: "Activity",
    body: (
      <>
        <P>Activity lists everything your connected wallet has done on <strong className="text-white">Arc mainnet</strong>, newest first, grouped by day. It reads the official Arc explorer, and loads older history as you scroll until it reaches the very first transaction.</P>
        <UL
          items={[
            "Filters: All, Sent, Received, Swaps and Bridges.",
            "Each row shows an icon, a title, the other address, the time, the amounts (green + for money in) with token logos, and the fee on transactions you made. Tap a row to open it in the explorer.",
            "A red Failed tag marks a transaction that did not succeed.",
            "It refreshes by itself every 30 seconds.",
          ]}
        />
        <Note title="How the types are decided">If you send one token and receive a different one in the same transaction, it is a Swap. USDC that is burned or minted for a bridge shows as Bridge out or Bridge in. Everything else is a Send or a Receive. This is a best guess from the data, so an unusual transaction may show as “Contract interaction”. NFT transfers are not shown.</Note>
      </>
    ),
  },
  {
    id: "fees",
    title: "Fees and finality",
    body: (
      <>
        <UL
          items={[
            <><strong className="text-white">Gas is paid in USDC on Arc.</strong> There is no second token to hold. Arc’s minimum gas price is 20 gwei, and the page uses it as a floor when it estimates a fee.</>,
            <><strong className="text-white">Fast finality.</strong> Arc finalizes transactions in under a second, so one receipt means the transaction is final.</>,
            <><strong className="text-white">AlabaamaFi adds no fee of its own.</strong> You pay the network fee, plus any fee the swap or bridge service charges. These are shown in the quote before you confirm.</>,
            <><strong className="text-white">Bridging from another network</strong> costs gas in that network’s coin (ETH, POL, AVAX and so on). The page warns you if you have none.</>,
          ]}
        />
      </>
    ),
  },
  {
    id: "networks",
    title: "Networks and tokens",
    body: (
      <>
        <H3>Arc Mainnet</H3>
        <Table
          head={["Setting", "Value"]}
          rows={[
            ["Network name", "Arc Mainnet"],
            ["RPC URL", <Code key="r">https://rpc.mainnet.arc.io</Code>],
            ["Chain ID", "5042 (0x13b2)"],
            ["Currency symbol", "USDC"],
            ["Block explorer", <Code key="e">https://explorer.arc.io</Code>],
          ]}
        />
        <H3>Tokens on Arc</H3>
        <Table
          head={["Token", "Contract", "Decimals"]}
          rows={[
            ["USDC", <Code key="u">0x3600000000000000000000000000000000000000</Code>, "6 (ERC-20), 18 as the native coin"],
            ["EURC", <Code key="eu">0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1</Code>, "6"],
            ["cirBTC", <Code key="c">0x171A4217b86A807A64eB94757Db6849fb4bDbAA0</Code>, "8"],
          ]}
        />
        <Note title="Always check addresses">Compare any contract address with the official Arc documentation before you use it.</Note>
      </>
    ),
  },
  {
    id: "security",
    title: "Security and privacy",
    body: (
      <>
        <UL
          items={[
            <><strong className="text-white">Never share your seed phrase or private key.</strong> AlabaamaFi will never ask for them, in the site, in messages or in replies.</>,
            "You approve every action in your own wallet. Read what the wallet shows before you confirm.",
            "Start with a small amount on a new route, and double-check every address. Blockchain transfers cannot be reversed.",
            "Some actions ask your wallet for a token approval. An approval lets a contract move that token up to the approved amount, and you can review or revoke approvals with a revoke tool.",
            "Settings and swap and bridge history are saved in your browser on your device. Clearing your browser data removes them. AlabaamaFi has no accounts and no server-side wallet data.",
            "Like any website, the services behind it, such as RPC providers, Circle, LI.FI, CoinGecko and the Arc explorer, can see requests such as your IP address and wallet address. Everything on a blockchain is public.",
          ]}
        />
        <Note title="Not financial advice" tone="warn">AlabaamaFi is an interface, not an adviser. Using DeFi involves risk, including smart-contract risk, price movement and mistakes. Only use money you are comfortable risking.</Note>
      </>
    ),
  },
  {
    id: "help",
    title: "Help and links",
    body: (
      <>
        <P>Quick answers are in the <Link href="/faq" className="font-medium text-[#65caff] hover:text-white">FAQ</Link>. For anything else, message <A href={X_URL}>@Alabaama_Fi</A> on X.</P>
        <UL
          items={[
            <><A href="https://docs.arc.io">Arc documentation</A></>,
            <><A href="https://explorer.arc.io">Arc explorer</A></>,
            <><A href="https://bridge.usdc.com">Circle USDC Bridge</A></>,
          ]}
        />
      </>
    ),
  },
];

/* ---------- page ---------- */
export default function DocsPage() {
  const [active, setActive] = useState(SECTIONS[0].id);

  /* highlight the section that is on screen */
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <main className={`${brandFont.className} relative min-h-screen overflow-x-hidden bg-[#010205] text-white selection:bg-[#167cff]/30`}>
      <style>{`
        html{scroll-behavior:smooth}
        @keyframes backgroundFloat{0%,100%{transform:translate3d(-50%,0,0) scale(1)}50%{transform:translate3d(-46%,2vw,0) scale(1.08)}}
        @keyframes backgroundFloatReverse{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(5vw,-3vw,0) scale(1.12)}}
        @keyframes twinkle{0%,100%{opacity:.12}50%{opacity:.9}}
        @keyframes floatUp{0%{transform:translateY(0);opacity:0}15%{opacity:.7}100%{transform:translateY(-220px);opacity:0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
        .fade-up{opacity:0;animation:fadeUp .9s cubic-bezier(.2,.7,.2,1) forwards;animation-delay:var(--delay,0ms)}
        @media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{animation-duration:.01ms!important;animation-delay:0s!important;animation-iteration-count:1!important}.fade-up{opacity:1}}
      `}</style>

      <SpaceBackground />

      <div className="relative z-10">
        <Header />

        <section className={`pb-24 pt-8 sm:pt-12 lg:pb-32 lg:pt-14 ${CONTAINER}`}>
          <div className="fade-up mx-auto max-w-3xl text-center">
            <h1 className="text-[2.4rem] font-bold leading-[1.05] tracking-[-0.035em] sm:text-[3.9rem]">
              <span className="bg-gradient-to-r from-[#18bfff] via-[#2588ff] to-[#4262ff] bg-clip-text text-transparent">Docs</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-[15px] leading-6 text-slate-400 sm:mt-4 sm:text-lg sm:leading-7">Everything you need to send, swap, bridge and follow your activity on Arc.</p>
          </div>

          <div className="mx-auto mt-10 grid max-w-6xl gap-8 lg:mt-14 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-12">
            {/* contents */}
            <nav aria-label="Contents" className="fade-up lg:sticky lg:top-8 lg:self-start" style={{ "--delay": "100ms" } as CSSProperties}>
              <p className="mb-3 hidden px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 lg:block">On this page</p>
              <ul className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
                {SECTIONS.map((s) => (
                  <li key={s.id} className="shrink-0">
                    <a
                      href={`#${s.id}`}
                      className={`block rounded-full px-4 py-2 text-sm font-semibold transition lg:rounded-xl lg:px-3 lg:py-2 ${
                        active === s.id ? "bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] text-white lg:bg-none lg:bg-[#159fff]/[0.14] lg:text-[#7dd3fc]" : "bg-white/[0.05] text-slate-400 hover:text-white lg:bg-transparent lg:hover:bg-white/[0.04]"
                      }`}
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* content */}
            <div className="min-w-0 space-y-6">
              {SECTIONS.map((s, i) => (
                <section
                  key={s.id}
                  id={s.id}
                  className="fade-up scroll-mt-24 rounded-[1.75rem] border border-white/[0.08] bg-[#050a16]/80 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:rounded-[2rem] sm:p-8"
                  style={{ "--delay": `${150 + Math.min(i, 4) * 60}ms` } as CSSProperties}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2588ff]">{String(i + 1).padStart(2, "0")}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{s.title}</h2>
                  <div className="mt-5">{s.body}</div>
                </section>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
