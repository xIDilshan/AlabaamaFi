"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { Inter } from "next/font/google";

const brandFont = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });

const X_URL = "https://x.com/Alabaama_Fi";
const DISCORD_URL = "https://discord.gg/NBKHmUfw";
const DOCS_URL = "https://docs.alabaamafi.xyz";
const GITHUB_URL = "https://github.com/xIDilshan/AlabaamaFi";

const FOOTER_LINK_TEXT_PX = 11;
const FOOTER_SOCIAL_PX = 20;

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
const GitHubLogo = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12Z" />
  </svg>
);
const I = {
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6 6 18",
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35",
  back: "M19 12H5M12 19l-7-7 7-7",
  chevron: "m9 6 6 6-6 6",
  down: "m6 9 6 6 6-6",
  book: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20",
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z",
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
  { cat: "General", q: "What is AlabaamaFi?", a: "AlabaamaFi is a simple interface for Arc, Circle’s USDC-native Layer 1. You can send USDC, swap USDC, EURC and cirBTC, bridge USDC between Arc and other networks, and see everything your wallet has done on Arc, all in one place.", popular: true, more: { label: "Read the overview", href: `${DOCS_URL}/#overview` } },
  { cat: "General", q: "Do I need to create an account?", a: "No. You just connect your own wallet. Your settings and your swap and bridge history are saved in your browser, on your device." },
  { cat: "General", q: "Does AlabaamaFi hold my funds?", a: "No. AlabaamaFi is non-custodial. Every action is signed in your own wallet, and the site never has your private keys or seed phrase.", popular: true },
  { cat: "General", q: "Is this the official site?", a: "The official site is app.alabaamafi.xyz, the official X account is @Alabaama_Fi and the community is on Discord. Bookmark the site and avoid links from messages or ads." },
  { cat: "General", q: "Which pages does AlabaamaFi have?", a: "Home, Send, Swap, Bridge and Activity, plus these Docs and FAQ. Use the menu in the top corner to move between them." },
  { cat: "General", q: "Where can I read the terms of service?", a: "The Terms of Service are in the Docs, at the end of the page.", more: { label: "Open the Terms of Service", href: `${DOCS_URL}/#terms` } },

  /* ---- Wallet and network ---- */
  { cat: "Wallet and network", q: "Which wallets work?", a: "Any EVM wallet, for example MetaMask, Rabby, OKX Wallet, Brave Wallet, Coinbase Wallet or a WalletConnect wallet. Use the Connect Wallet button in the top corner.", popular: true },
  { cat: "Wallet and network", q: "How do I add Arc to my wallet?", a: "On the home page, use Add Arc Mainnet. To add it by hand, use: network name Arc Mainnet, RPC URL https://rpc.mainnet.arc.io, chain ID 5042, currency symbol USDC, block explorer https://explorer.arc.io. The home page also has a card with a Copy button for each one.", popular: true, more: { label: "See the network details", href: `${DOCS_URL}/#networks` } },
  { cat: "Wallet and network", q: "Why do I need USDC for gas?", a: "On Arc, USDC is the gas token. You pay network fees in USDC, so there is no second token to hold. Keep a little USDC in your wallet for fees." },
  { cat: "Wallet and network", q: "The button says “Switch to Arc Mainnet”. What does that mean?", a: "Your wallet is on a different network. Tap the button and approve the switch in your wallet. On the Bridge page the button names the network you are sending from, for example “Switch to Ethereum”." },
  { cat: "Wallet and network", q: "My balance shows a dash (—). Why?", a: "The balance appears once your wallet is connected and on the right network. If it still shows a dash, switch networks, reconnect the wallet or refresh the page. A busy network provider can also delay it for a moment." },
  { cat: "Wallet and network", q: "Can I use the phone browser?", a: "Yes. Open the site in your phone’s browser and connect with WalletConnect, or open it inside your wallet app’s built-in browser. Every page is made for phones." },

  /* ---- Send ---- */
  { cat: "Send", q: "How do I send USDC?", a: "Open Send, paste the recipient address, enter the amount and tap Send USDC. Confirm in your wallet. When it is final you see Successfully sent, with the amount, the fee and a link to the explorer.", popular: true, more: { label: "Read the Send guide", href: `${DOCS_URL}/#send` } },
  { cat: "Send", q: "Can I cancel or reverse a transfer?", a: "No. Blockchain transfers cannot be reversed, and Arc confirms them in under a second. Double-check the address before you confirm." },
  { cat: "Send", q: "Why does it say “Not enough left to cover the network fee”?", a: "The fee is paid in USDC from the same balance. If the amount you enter plus the fee is more than your balance, the page stops you. Lower the amount a little, or use Max, which keeps the fee for you." },
  { cat: "Send", q: "Why can’t I send to the zero address or the USDC contract?", a: "Arc does not allow transfers to the zero address, and sending USDC to the token contract would lose it. The page blocks both to protect you." },
  { cat: "Send", q: "Why was my transfer reverted?", a: "A transfer can be reverted if the sender or the recipient is blocklisted for USDC. Open the transaction in the explorer to see the details." },

  /* ---- Swap ---- */
  { cat: "Swap", q: "Which tokens can I swap?", a: "USDC, EURC and cirBTC on Arc. Swaps run through Circle’s App Kit.", more: { label: "Read the Swap guide", href: `${DOCS_URL}/#swap` } },
  { cat: "Swap", q: "What is slippage?", a: "Slippage is how far the price may move against you before the swap is cancelled. Auto uses 0.5% for USDC and EURC, and 1% when cirBTC is involved. In Settings you can pick Custom: 0.1%, 0.5%, 1%, 3%, 5% or your own value.", popular: true },
  { cat: "Swap", q: "What does “Minimum received” mean?", a: "It is the least you will get after slippage. The swap itself enforces it, so you cannot receive less than that amount." },
  { cat: "Swap", q: "Why did my swap stop and say the price moved?", a: "Just before sending, the page asks for a fresh price. If it is more than 0.5% worse than the one you saw, it stops and shows you the new price. Nothing was spent. Review it and tap Swap again." },
  { cat: "Swap", q: "Why is the network fee only an estimate?", a: "The page uses today’s gas price times a typical swap size. Your wallet shows the exact fee when you confirm." },
  { cat: "Swap", q: "The chart or market card says unavailable. What can I do?", a: "Prices and charts come from CoinGecko, which limits how many requests it allows. Wait a minute and try again. Swapping is not affected." },
  { cat: "Swap", q: "Where do I find my swap history?", a: "The History icon on the Swap card lists swaps made on this device. For everything your wallet has done on Arc, use the Activity page." },

  /* ---- Bridge ---- */
  { cat: "Bridge", q: "Which networks can I bridge between?", a: "The ones on bridge.usdc.com that work with an EVM wallet: Arc, Ethereum, Base, Arbitrum, OP Mainnet, Polygon, Avalanche, Unichain, Linea, Codex, HyperEVM, Ink, Monad, Plume, Sei, Sonic, World Chain and XDC. You can bridge from Arc, to Arc, or between two other networks. Robinhood Chain is also available, through LI.FI.", popular: true, more: { label: "Read the Bridge guide", href: `${DOCS_URL}/#bridge` } },
  { cat: "Bridge", q: "How does the bridge work?", a: "It uses Circle’s CCTP. Your USDC is burned on the first network and the same amount of native USDC is minted on the second one. It is not a wrapped token." },
  { cat: "Bridge", q: "What is Fast transfer?", a: "Fast transfer, the lightning-bolt icon, delivers your USDC in seconds instead of waiting about 15 minutes for the first network to finalize. It adds a small fee, taken from what you receive. It exists only on some source networks. From Arc, Avalanche and Polygon the standard transfer is already fast.", more: { label: "Fast or Standard", href: `${DOCS_URL}/#bridge-fast` } },
  { cat: "Bridge", q: "How long does a bridge take?", a: "With Fast, about 8 seconds from most networks and about 20 seconds from Ethereum. Standard takes about 15 to 19 minutes from Ethereum, Base, Arbitrum, OP Mainnet and Unichain, about 8 seconds from Avalanche and Polygon, about 1 second from Arc, and hours from Linea. The quote shows the time for your route.", popular: true },
  { cat: "Bridge", q: "Why do I only confirm on the first network?", a: "Circle’s Forwarding Service delivers the USDC on the receiving network for you, for a small delivery fee that is shown in the quote. Codex, Plume and XDC are not covered, so receiving there needs one extra confirmation in your wallet." },
  { cat: "Bridge", q: "What is slippage on a bridge?", a: "Bridging does not trade tokens, so there is no price to move. Slippage only limits how much the fees may change before the bridge starts. If you would receive more than that much less than quoted, the bridge stops and shows the new amount." },
  { cat: "Bridge", q: "What if a bridge stops halfway?", a: "The progress card marks the step that failed. If your USDC already left the first network, do not send it again. Tap Resume bridge if it appears, or check your wallet activity and the explorer. Keep the page open until a bridge finishes.", more: { label: "If a bridge stops halfway", href: `${DOCS_URL}/#bridge-stuck` } },
  { cat: "Bridge", q: "Can I send the bridged USDC to a different address?", a: "Yes. Turn on Send to a different address, enter the address on the receiving network and tick the box that confirms it is correct. USDC sent to a wrong address cannot be recovered." },
  { cat: "Bridge", q: "Why do I need ETH (or another coin) to bridge?", a: "When you bridge from another network, you pay its gas in that network’s coin, such as ETH, POL or AVAX. The page warns you if you have none. From Arc, gas is paid in USDC." },
  { cat: "Bridge", q: "How do I bridge to or from Robinhood Chain?", a: "Pick Robinhood Chain as one of the two networks. Circle’s bridge does not support it, so the page switches to LI.FI, a third-party bridge aggregator. USDC sent there often arrives as USDG, so check the token in the quote, and start with a small amount.", more: { label: "Robinhood Chain routes", href: `${DOCS_URL}/#robinhood` } },
  { cat: "Bridge", q: "Why does Robinhood Chain use a different bridge?", a: "Circle’s USDC bridge only works with networks that Circle has set up for its burn-and-mint transfers, and Robinhood Chain is not one of them. So when you pick Robinhood Chain, AlabaamaFi uses LI.FI, a bridge aggregator, for that route. Every other route still uses Circle’s bridge." },
  { cat: "Bridge", q: "What is LI.FI?", a: "LI.FI is a third-party service that finds a route between two networks and gets your funds there through bridges and relayers. AlabaamaFi shows its widget on the Bridge page for Robinhood Chain routes only. LI.FI shows its own quote, fees and time, and you confirm in your wallet." },
  { cat: "Bridge", q: "Which Robinhood Chain routes can I use?", a: "Pick Robinhood Chain on either side of the Bridge page: Robinhood Chain to Arc, Arc to Robinhood Chain, or Robinhood Chain to and from another network. The widget shows only the routes LI.FI supports.", more: { label: "Robinhood Chain routes", href: `${DOCS_URL}/#robinhood` } },
  { cat: "Bridge", q: "Why did my USDC arrive as USDG on Robinhood Chain?", a: "USDC sent to Robinhood Chain often arrives as USDG, a different stablecoin issued by Paxos. Check the token you will receive in the quote before you confirm. If you need USDC again later, use a route that ends in USDC." },
  { cat: "Bridge", q: "Do I need a special coin for gas on Robinhood Chain?", a: "Robinhood Chain uses ETH for gas. If you bridge out of it, keep a little ETH there for the fee. When you bridge into it, the quote shows what you pay on the source network." },
  { cat: "Bridge", q: "Is a Robinhood Chain route as safe as Circle’s bridge?", a: "It works differently. Circle’s bridge burns and mints native USDC. LI.FI routes use bridges and relayers that deliver your funds, so each has its own risks. Read the quote, the fees and the time, start with a small amount, and only use the site at app.alabaamafi.xyz." },
  { cat: "Bridge", q: "The LI.FI widget does not work for my pair. What can I do?", a: "Try a different token or amount, or switch the two networks. If a pair still fails, use the “Open it in Jumper” link under the widget, which opens LI.FI’s own app with both networks chosen, or ask in our Discord." },

  /* ---- Activity ---- */
  { cat: "Activity", q: "What does the Activity page show?", a: "Everything your connected wallet has done on Arc mainnet, newest first: sends, receives, swaps and bridges. It loads older history as you scroll until the very first transaction.", more: { label: "Read the Activity guide", href: `${DOCS_URL}/#activity` } },
  { cat: "Activity", q: "Why can’t I see an older transaction yet?", a: "History loads in pages. Scroll down or tap Load more, and it keeps going until it reaches the beginning. A brand-new transaction can take a moment to appear in the explorer." },
  { cat: "Activity", q: "Why is a transaction labelled “Contract interaction”?", a: "The page guesses the type from the data: one token out and another in is a Swap, and USDC burned or minted is a Bridge. Anything it cannot place shows as a contract interaction. Tap the row to open it in the explorer." },
  { cat: "Activity", q: "Does Activity show other networks?", a: "No, only Arc mainnet. For other networks use their own explorers. NFT transfers are not shown." },

  /* ---- Fees ---- */
  { cat: "Fees", q: "What fees do I pay?", a: "The network fee (gas), which is paid in USDC on Arc. When you bridge you may also pay a small Fast fee and a Delivery fee, and swaps are priced into the quoted rate. Every fee is shown before you confirm.", popular: true, more: { label: "See all fees", href: `${DOCS_URL}/#fees` } },
  { cat: "Fees", q: "Does AlabaamaFi charge a fee?", a: "AlabaamaFi does not add a fee of its own to sends, swaps or bridges. You pay the network fee, and the swap or bridge service may charge its own fee, which is shown in the quote." },
  { cat: "Fees", q: "Why is the fee in my wallet different from the quote?", a: "Quotes are estimates from the current gas price. Gas prices change second by second, and your wallet shows the exact fee when you confirm. After a Send, the success screen shows the real fee that was paid." },
  { cat: "Fees", q: "How fast does Arc settle?", a: "Arc finalizes transactions in under a second, so when your wallet reports a transaction as done, it is final." },

  /* ---- Security ---- */
  { cat: "Security", q: "Will AlabaamaFi ever ask for my seed phrase?", a: "Never. Not on the site, not in messages and not in replies. If anyone asks for it, it is a scam.", popular: true },
  { cat: "Security", q: "What data does AlabaamaFi store?", a: "Only your settings and your swap and bridge history, in your own browser. There are no accounts. The services behind the site, such as RPC providers, Circle, LI.FI, CoinGecko and the Arc explorer, can see requests like your IP address and wallet address, and everything on a blockchain is public.", more: { label: "Security and privacy", href: `${DOCS_URL}/#security` } },
  { cat: "Security", q: "What are token approvals?", a: "Some actions ask your wallet to approve a token, which lets a contract move that token up to the amount you approve. You can review and revoke approvals with a revoke tool." },
  { cat: "Security", q: "How can I stay safe?", a: "Use only app.alabaamafi.xyz, never share your seed phrase, double-check every address, read what your wallet shows before you confirm, and start with a small amount on a new route." },
  { cat: "Security", q: "Where can I get help or report a problem?", a: "Ask in our Discord or message @Alabaama_Fi on X, and include the page, the network and what you saw. Never post your seed phrase, and be careful with private messages from people you do not know." },
];

/* ---------- pieces ---------- */
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
  const [focus, setFocus] = useState(false);
  const [menu, setMenu] = useState(false);

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

  const iconBtn = "flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/[0.07] hover:text-white";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);

  const topicList = (onPick: (c: Cat | null) => void) => (
    <nav aria-label="Topics">
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Topics</p>
      <ul className="space-y-0.5">
        <li>
          <button onClick={() => onPick(null)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-slate-400 transition hover:bg-white/[0.04] hover:text-white">
            <Svg d={I.grid} size={18} />
            <span className="flex-1">All topics</span>
          </button>
        </li>
        {CATS.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => onPick(c.id)}
              aria-current={cat === c.id ? "true" : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium transition ${cat === c.id ? "bg-[#159fff]/[0.14] text-[#7dd3fc]" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"}`}
            >
              <Svg d={c.icon} size={18} />
              <span className="flex-1">{c.id}</span>
              <span className="text-xs text-slate-600">{count(c.id)}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <div className={`${brandFont.className} flex min-h-screen flex-col overflow-x-hidden bg-[#05080f] text-white selection:bg-[#167cff]/30`}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
        @keyframes drawerIn{from{transform:translateX(-100%)}to{transform:none}}
        .fade-up{opacity:0;animation:fadeUp .8s cubic-bezier(.2,.7,.2,1) forwards;animation-delay:var(--delay,0ms)}
        @media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-delay:0s!important;animation-iteration-count:1!important}.fade-up{opacity:1}}
      `}</style>

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#05080f]/90 backdrop-blur-xl">
        <div className="flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-10 2xl:px-16">
          <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="AlabaamaFi home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/alabaamafi-logo.png" alt="" className="h-8 w-8 shrink-0 object-contain" />
            <span className="truncate text-[17px] font-bold tracking-tight">
              Alabaama<span className="text-[#159fff]">Fi</span>
            </span>
            <span className="hidden rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-xs font-semibold text-slate-300 sm:inline">Help Center</span>
          </Link>

          <Link href="/" className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.04] hover:text-white">
            <Svg d={I.home} size={17} /> Home
          </Link>
        </div>
      </header>

      {focus && <div className="fixed inset-0 z-[60] bg-black/65 md:hidden" onClick={() => setFocus(false)} aria-hidden="true" />}

      <main className="flex-1">
        {/* ================= HERO + SEARCH ================= */}
        <section className="px-4 pb-10 pt-12 text-center sm:px-6 sm:pb-14 sm:pt-16">
          <div className="fade-up mx-auto max-w-3xl">
            <h1 className="text-[2.2rem] font-bold leading-[1.08] tracking-[-0.035em] sm:text-6xl">
              How can we <span className="bg-gradient-to-r from-[#18bfff] via-[#2588ff] to-[#4262ff] bg-clip-text text-transparent">help?</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-6 text-slate-400 sm:text-lg sm:leading-7">Answers about sending, swapping, bridging and staying safe on Arc.</p>

            <div className="relative z-[70] mx-auto mt-8 max-w-2xl">
              <label className={`flex items-center gap-3 rounded-full border bg-[#0a1018] px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition duration-200 ${focus ? "scale-[1.03] border-[#2588ff]/60 md:scale-100" : "border-white/[0.1]"} focus-within:border-[#2588ff]/60`}>
                <span className="shrink-0 text-slate-500"><Svg d={I.search} /></span>
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setOpenId(null);
                  }}
                  onFocus={() => setFocus(true)}
                  onBlur={() => setFocus(false)}
                  placeholder="Search for answers"
                  aria-label="Search for answers"
                  className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-600"
                />
                {query && (
                  <button onMouseDown={(e) => e.preventDefault()} onClick={() => setQuery("")} aria-label="Clear search" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-sm text-slate-300 hover:text-white">×</button>
                )}
              </label>
            </div>
          </div>
        </section>

        <div className="w-full px-4 pb-24 sm:px-6 lg:px-10 2xl:px-16">
          {/* ================= SEARCH RESULTS ================= */}
          {searching && (
            <section className="w-full">
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
                <div className="grid items-start gap-2.5 lg:grid-cols-2">
                  {results.map((f) => (
                    <Item key={f.id} id={f.id} item={f} open={openId === f.id} onToggle={() => toggle(f.id)} showCat />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ================= A TOPIC ================= */}
          {!searching && cat && (
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-12">
              <aside className="hidden min-w-0 lg:sticky lg:top-24 lg:block lg:self-start">{topicList(pick)}</aside>

              <div className="min-w-0">
                <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-slate-500">
                  <button onClick={() => setMenu(true)} aria-label="Open the topics menu" aria-expanded={menu} className={`${iconBtn} -ml-2.5 shrink-0 lg:hidden`}>
                    <Svg d={I.menu} />
                  </button>
                  <button onClick={() => pick(null)} className="font-medium text-[#65caff] hover:text-white">Help Center</button>
                  <Svg d={I.chevron} size={14} />
                  <span className="truncate text-slate-300">{cat}</span>
                </nav>
                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{cat}</h2>
                <p className="mt-2 text-slate-400">{CATS.find((c) => c.id === cat)?.blurb}</p>
                <div className="mt-7 grid items-start gap-2.5 xl:grid-cols-2">
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
                <div className="grid grid-cols-1 gap-3 min-[460px]:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                  {CATS.map((c, i) => (
                    <button
                      key={c.id}
                      onClick={() => pick(c.id)}
                      className="fade-up group flex h-full min-w-0 flex-col items-start rounded-[1.5rem] border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.015] p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-[#2588ff]/50 hover:shadow-[0_24px_70px_rgba(16,93,255,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#39c4ff] sm:p-6"
                      style={{ "--delay": `${i * 50}ms` } as CSSProperties}
                    >
                      <span className="flex items-center gap-3">
                        <span className="shrink-0 text-[#62d4ff] transition duration-300 group-hover:scale-110" style={{ filter: "drop-shadow(0 0 5px rgba(57,196,255,0.9)) drop-shadow(0 0 14px rgba(22,136,245,0.6))" }}>
                          <Svg d={c.icon} size={26} sw={1.6} />
                        </span>
                        <span className="text-base font-semibold tracking-tight sm:text-lg">{c.id}</span>
                      </span>
                      <span className="mt-3 text-sm leading-5 text-slate-400">{c.blurb}</span>
                      <span className="mt-3 text-xs font-medium text-slate-500">{count(c.id)} articles</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="mt-14 sm:mt-20">
                <h2 className="mb-5 px-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#2588ff]">Popular questions</h2>
                <div className="grid items-start gap-2.5 lg:grid-cols-2">
                  {popular.map((f) => (
                    <Item key={f.id} id={f.id} item={f} open={openId === f.id} onToggle={() => toggle(f.id)} showCat />
                  ))}
                </div>
              </section>
            </>
          )}

          {/* ================= CONTACT ================= */}
          <section className="mt-16 sm:mt-24">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Still need help?</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400 sm:text-base">Our community and the docs can help with the rest.</p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4">
              <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="group rounded-[1.5rem] border border-white/[0.08] bg-white/[0.03] p-5 text-center transition hover:-translate-y-1 hover:border-[#2588ff]/50 sm:p-6">
                <span className="mx-auto flex h-11 w-11 items-center justify-center text-[#62d4ff]" style={{ filter: "drop-shadow(0 0 6px rgba(57,196,255,0.9))" }}><DiscordLogo size={28} /></span>
                <p className="mt-3 text-base font-semibold">Join our Discord</p>
                <p className="mt-1 text-sm leading-5 text-slate-400">Ask the community and the team.</p>
              </a>
              <Link href={DOCS_URL} className="group rounded-[1.5rem] border border-white/[0.08] bg-white/[0.03] p-5 text-center transition hover:-translate-y-1 hover:border-[#2588ff]/50 sm:p-6">
                <span className="mx-auto flex h-11 w-11 items-center justify-center text-[#62d4ff]" style={{ filter: "drop-shadow(0 0 6px rgba(57,196,255,0.9))" }}><Svg d={I.book} size={28} sw={1.6} /></span>
                <p className="mt-3 text-base font-semibold">Read the docs</p>
                <p className="mt-1 text-sm leading-5 text-slate-400">Step-by-step guides for every page.</p>
              </Link>
              <a href={X_URL} target="_blank" rel="noreferrer" className="group rounded-[1.5rem] border border-white/[0.08] bg-white/[0.03] p-5 text-center transition hover:-translate-y-1 hover:border-[#2588ff]/50 sm:p-6">
                <span className="mx-auto flex h-11 w-11 items-center justify-center text-[#62d4ff]" style={{ filter: "drop-shadow(0 0 6px rgba(57,196,255,0.9))" }}><XLogo size={24} /></span>
                <p className="mt-3 text-base font-semibold">Follow on X</p>
                <p className="mt-1 text-sm leading-5 text-slate-400">News and updates from @Alabaama_Fi.</p>
              </a>
            </div>
            <p className="mx-auto mt-8 max-w-md text-center text-xs leading-5 text-slate-600">Nobody from AlabaamaFi will ever ask for your seed phrase or private key.</p>
          </section>
        </div>
      </main>

      {/* ================= PHONE TOPICS MENU ================= */}
      {menu && (
        <div className="fixed inset-0 z-[90] lg:hidden" role="dialog" aria-modal="true" aria-label="Help Center topics">
          <div className="absolute inset-0 bg-black/65" onClick={() => setMenu(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col border-r border-white/[0.1] bg-[#080a0d] shadow-[0_25px_80px_rgba(0,0,0,0.65)]" style={{ animation: "drawerIn .3s cubic-bezier(.2,.8,.2,1) both" }}>
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.07] px-4">
              <span className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/alabaamafi-logo.png" alt="" className="h-8 w-8 object-contain" />
                <span className="text-base font-bold tracking-tight">Alabaama<span className="text-[#159fff]">Fi</span> <span className="font-medium text-slate-500">Help</span></span>
              </span>
              <button onClick={() => setMenu(false)} aria-label="Close menu" className={iconBtn}><Svg d={I.close} /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
              {topicList((c) => {
                pick(c);
                setMenu(false);
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-white/[0.07] bg-[#05080f]/90 backdrop-blur-xl">

        <div className="grid w-full grid-cols-1 items-center justify-items-center gap-5 px-4 py-8 sm:grid-cols-[1fr_auto_1fr] sm:gap-6 sm:px-6 lg:px-10 2xl:px-16">
          <p className="order-3 text-center text-xs leading-5 text-slate-500 sm:order-1 sm:justify-self-start sm:text-left">© {new Date().getFullYear()} AlabaamaFi. A simple interface for Arc.</p>

          <div className="order-1 flex items-center gap-1 sm:order-2">
            <a href={DISCORD_URL} target="_blank" rel="noreferrer" aria-label="AlabaamaFi on Discord" title="Discord" className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/[0.07] hover:text-[#7dd3fc]"><DiscordLogo size={FOOTER_SOCIAL_PX} /></a>
            <a href={X_URL} target="_blank" rel="noreferrer" aria-label="AlabaamaFi on X" title="X" className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/[0.07] hover:text-[#7dd3fc]"><XLogo size={FOOTER_SOCIAL_PX - 2} /></a>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label="AlabaamaFi on GitHub" title="GitHub" className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/[0.07] hover:text-[#7dd3fc]"><GitHubLogo size={FOOTER_SOCIAL_PX} /></a>
          </div>

          <nav aria-label="Footer" className="order-2 flex items-center sm:order-3 sm:justify-self-end">
            <Link href={DOCS_URL} className="font-medium text-slate-300 transition hover:text-white"><span style={{ display: "block", fontSize: "12px", lineHeight: 1.2, zoom: FOOTER_LINK_TEXT_PX / 12 }}>Docs</span></Link>
            <span aria-hidden className="mx-3 h-3 w-px bg-white/25" />
            <Link href="/faq" className="font-medium text-slate-300 transition hover:text-white"><span style={{ display: "block", fontSize: "12px", lineHeight: 1.2, zoom: FOOTER_LINK_TEXT_PX / 12 }}>FAQ</span></Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
