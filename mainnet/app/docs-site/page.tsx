"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Inter } from "next/font/google";

const brandFont = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });

const SITE = "https://app.alabaamafi.xyz";
const X_URL = "https://x.com/Alabaama_Fi";
const DISCORD_URL = "https://discord.gg/NBKHmUfw";
const OFFSET = 170;
const ARTICLE_WIDTH = "max-w-none";
const UPDATED = "October 15, 2026";

/* ---------- icons ---------- */
const Svg = ({ d, size = 20, sw = 1.8 }: { d: string; size?: number; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const I = {
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6 6 18",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35",
  back: "M19 12H5M12 19l-7-7 7-7",
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z",
  chevron: "m9 6 6 6-6 6",
  up: "m18 15-6-6-6 6",
};
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

/* ---------- content model ---------- */
type Block =
  | { t: "p"; c: ReactNode }
  | { t: "h3"; id: string; c: string }
  | { t: "ul"; items: ReactNode[] }
  | { t: "steps"; items: ReactNode[] }
  | { t: "note"; title: string; c: ReactNode; tone?: "info" | "warn" | "tip" }
  | { t: "table"; head: string[]; rows: ReactNode[][] }
  | { t: "pages" };
type Sec = { id: string; group: string; title: string; lead: string; kw: string; blocks: Block[] };

const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer" className="font-medium text-[#65caff] underline-offset-4 hover:text-white hover:underline">{children}</a>
);
const L = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link href={href} className="font-medium text-[#65caff] underline-offset-4 hover:text-white hover:underline">{children}</Link>
);
const B = ({ children }: { children: ReactNode }) => <strong className="font-semibold text-white">{children}</strong>;
const PAGE_ICONS = {
  send: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z",
  swap: "M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4",
  bridge: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  activity: "M12 7v5l3 2M3 12a9 9 0 1 0 3-6.7M3 4v4h4",
};
const GlowIcon = ({ d, size = 24 }: { d: string; size?: number }) => (
  <span className="inline-flex text-[#62d4ff]" style={{ filter: "drop-shadow(0 0 5px rgba(57,196,255,0.95)) drop-shadow(0 0 12px rgba(22,136,245,0.6))" }}>
    <Svg d={d} size={size} sw={1.6} />
  </span>
);
const PAGES = [
  { name: "Send", d: PAGE_ICONS.send, href: `${SITE}/send`, text: "Send USDC to any wallet address on Arc." },
  { name: "Swap", d: PAGE_ICONS.swap, href: `${SITE}/swap`, text: "Swap USDC, EURC and cirBTC on Arc with a clear rate and minimum received." },
  { name: "Bridge", d: PAGE_ICONS.bridge, href: `${SITE}/bridge`, text: "Move USDC between Arc and other networks, or between two other networks, with Circle’s CCTP." },
  { name: "Activity", d: PAGE_ICONS.activity, href: `${SITE}/activity`, text: "See everything your wallet has done on Arc, newest first." },
];
const Code = ({ children }: { children: ReactNode }) => <code className="rounded-md bg-white/[0.07] px-1.5 py-0.5 text-[13px] text-[#9fe0ff] [overflow-wrap:anywhere]">{children}</code>;

/* ---------- the guides ---------- */
const SECTIONS: Sec[] = [
  /* ===================== GET STARTED ===================== */
  {
    id: "overview",
    group: "Get started",
    title: "Overview",
    lead: "AlabaamaFi is one place to move, manage and explore assets on Arc Network. Send, swap, bridge and follow your activity, all with your own wallet.",
    kw: "about introduction what is alabaamafi non-custodial",
    blocks: [
      { t: "p", c: <>Arc is Circle’s USDC-native, EVM-compatible Layer 1. AlabaamaFi puts the things you do most on Arc into four clear pages, so you can move money without learning a new tool for each job.</> },
      { t: "h3", id: "what-you-can-do", c: "What you can do" },
      { t: "pages" },
      { t: "h3", id: "how-it-works", c: "How AlabaamaFi works" },
      {
        t: "ul",
        items: [
          <><B>Non-custodial.</B> You connect your own EVM wallet and approve every action in it. AlabaamaFi never holds your funds and never sees your private keys.</>,
          <><B>No account.</B> There is nothing to sign up for. Your settings and your swap and bridge history stay in your own browser.</>,
          <><B>Built on trusted services.</B> Swaps and bridges use Circle’s App Kit, Activity reads Arc’s official explorer, and Robinhood Chain routes use LI.FI.</>,
          <><B>Clear numbers.</B> Every page shows what you pay, what you receive and what it costs before you confirm.</>,
        ],
      },
      { t: "note", title: "Official links", c: <>The site is <A href={SITE}>app.alabaamafi.xyz</A>, the official X account is <A href={X_URL}>@Alabaama_Fi</A> and the community is on <A href={DISCORD_URL}>Discord</A>. Bookmark the site and be careful with look-alike links.</> },
    ],
  },
  {
    id: "quickstart",
    group: "Get started",
    title: "Quickstart",
    lead: "From zero to your first transaction in about five minutes.",
    kw: "start begin first connect wallet add arc network get usdc phone mobile",
    blocks: [
      {
        t: "steps",
        items: [
          <><B>Get a wallet.</B> Any EVM wallet works, for example MetaMask, Rabby, OKX Wallet, Brave Wallet, Coinbase Wallet, or any wallet that supports WalletConnect. Write your seed phrase on paper and keep it offline. Never share it.</>,
          <><B>Open AlabaamaFi and connect.</B> Go to <A href={SITE}>app.alabaamafi.xyz</A> and tap <em>Connect Wallet</em> in the top corner. Choose your wallet and approve the connection.</>,
          <><B>Add Arc Mainnet.</B> On the home page tap <em>Add Arc Mainnet</em>, or enter the details by hand from the <a href="#networks" className="font-medium text-[#65caff] hover:text-white">Networks and tokens</a> section.</>,
          <><B>Get some USDC on Arc.</B> USDC is also Arc’s gas token, so you need a little to do anything. You can bridge it in from another network on the Bridge page, receive it from another wallet, or withdraw it from an exchange that supports Arc (check the network name before you withdraw).</>,
          <><B>Try a small first move.</B> Send a tiny amount to your own second address, or swap one dollar of USDC for EURC, to see how the pages work.</>,
        ],
      },
      { t: "h3", id: "on-a-phone", c: "Using a phone" },
      {
        t: "ul",
        items: [
          "You can open the site in your phone’s normal browser and connect with WalletConnect, or open it inside your wallet app’s built-in browser.",
          "The menu button in the top-left corner opens Home, Send, Swap, Bridge and Activity. The Connect button is on the other side.",
          "Pages are made for phones: big tap targets, bottom-sheet popups, and a market card you can tap on the Swap page.",
        ],
      },
      { t: "note", tone: "tip", title: "Tip", c: "Whenever you try something new, start with a small amount. Once it works, repeat it with the amount you really want." },
    ],
  },
  {
    id: "concepts",
    group: "Get started",
    title: "Key concepts",
    lead: "A few ideas that make the rest of the docs easy to follow.",
    kw: "concepts glossary usdc gas finality decimals slippage cctp approvals hash explorer",
    blocks: [
      { t: "h3", id: "usdc-gas", c: "USDC is the gas token" },
      { t: "p", c: "On most networks you need a separate coin to pay fees. On Arc the fee is paid in USDC, so one balance covers both what you send and what it costs. The page keeps a little USDC aside for the fee when you press Max." },
      { t: "h3", id: "two-faces", c: "USDC has two faces on Arc" },
      { t: "p", c: <>USDC on Arc is the native coin (18 decimals) and also has an ERC-20 interface at <Code>0x3600…0000</Code> (6 decimals). AlabaamaFi uses the ERC-20 interface, so amounts always have up to 6 decimals.</> },
      { t: "h3", id: "finality", c: "Fast finality" },
      { t: "p", c: "Arc finalizes transactions in under a second. When your wallet reports the transaction as done, it is final. There is no waiting for extra confirmations." },
      { t: "h3", id: "slippage", c: "Slippage" },
      { t: "p", c: "In a swap, slippage is how far the price may move against you before the swap is cancelled. In a bridge there is no price to move, so slippage only limits how much the fees may change before the bridge starts." },
      { t: "h3", id: "burn-mint", c: "Burn and mint (CCTP)" },
      { t: "p", c: "Circle’s Cross-Chain Transfer Protocol burns your USDC on the first network and mints the same amount of native USDC on the second one. It is not a wrapped token, and there is no pool that can run dry." },
      { t: "h3", id: "approvals", c: "Approvals" },
      { t: "p", c: "Some actions first ask your wallet to approve a token. An approval lets a contract move that token up to the amount you approve. It is a normal step, but you can review or revoke approvals later with a revoke tool." },
      { t: "h3", id: "hash", c: "Transaction hash and the explorer" },
      { t: "p", c: <>Every transaction has a unique hash. Paste it into the <A href="https://explorer.arc.io">Arc explorer</A> to see its status, fee and details. AlabaamaFi links to it after each action.</> },
    ],
  },

  /* ===================== GUIDES ===================== */
  {
    id: "send",
    group: "Guides",
    title: "Send",
    lead: "Send USDC to any wallet address on Arc.",
    kw: "send transfer pay usdc recipient address max fee paste",
    blocks: [
      { t: "h3", id: "send-before", c: "Before you start" },
      {
        t: "ul",
        items: [
          "Your wallet is connected and on Arc Mainnet. If not, the button reads Switch to Arc Mainnet.",
          "You have enough USDC for the amount plus the network fee.",
          "You have the recipient’s address on Arc. Any EVM address works, but make sure the person or service can actually use that address on Arc. Some exchange deposit addresses do not accept Arc.",
        ],
      },
      { t: "h3", id: "send-steps", c: "Send step by step" },
      {
        t: "steps",
        items: [
          <>Open <L href={`${SITE}/send`}>Send</L>.</>,
          <>Type or paste the <B>recipient address</B>. The <em>Paste</em> button fills it from your clipboard.</>,
          <>Enter the <B>amount</B> in USDC, up to 6 decimals. <em>Max</em> fills your balance minus the network fee.</>,
          <>Check the address one more time, then tap <B>Send USDC</B>.</>,
          <>Confirm in your wallet. The button shows “Confirm in your wallet”, then “Sending USDC”.</>,
          <>When the transaction is final you see <B>Successfully sent</B> with the amount, the recipient, the real fee and a link to the explorer.</>,
        ],
      },
      { t: "h3", id: "send-checks", c: "What the page checks for you" },
      {
        t: "ul",
        items: [
          "The address is valid: 0x followed by 40 characters.",
          "It is not the zero address, which Arc does not allow, and not the USDC token contract, where the money would be lost.",
          "Your balance covers the amount and the fee.",
          "The wallet is on Arc Mainnet.",
        ],
      },
      { t: "h3", id: "send-fee", c: "The fee" },
      { t: "p", c: "The fee is shown in USDC and comes from the same balance. After the transaction, the success screen shows the real fee that was paid (gas used times gas price), not an estimate. If you press Max, the page leaves enough for the fee, or about 0.01 USDC if the fee is not known yet." },
      { t: "note", tone: "warn", title: "Transfers cannot be reversed", c: "Blockchain transfers are final. Double-check the address before you confirm. If a transfer is reverted, one possible reason is that the sender or the recipient is blocklisted for USDC. Open the transaction in the explorer to see the details." },
      { t: "h3", id: "send-tips", c: "Tips" },
      {
        t: "ul",
        items: [
          "Send a small test amount first when paying a new address.",
          "Copy and paste addresses. Never retype them.",
          "Compare the first 6 and the last 4 characters of the address before you confirm.",
        ],
      },
    ],
  },
  {
    id: "swap",
    group: "Guides",
    title: "Swap",
    lead: "Swap USDC, EURC and cirBTC on Arc through Circle’s App Kit.",
    kw: "swap exchange trade usdc eurc cirbtc slippage rate minimum received chart price market history",
    blocks: [
      { t: "h3", id: "swap-before", c: "Before you start" },
      { t: "p", c: "You need your wallet connected on Arc Mainnet and a little USDC for the network fee, even if you are swapping a different token." },
      { t: "h3", id: "swap-steps", c: "Swap step by step" },
      {
        t: "steps",
        items: [
          <>Open <L href={`${SITE}/swap`}>Swap</L>.</>,
          <>Choose the two tokens with the token buttons. If you pick the token that is on the other side, the two swap places. The round arrow button flips the pair.</>,
          <>Enter an amount in <em>You pay</em>, or tap <em>50%</em> or <em>Max</em>. Your balance is shown at the top right of each box.</>,
          <>Wait a moment for the live price. The <em>You receive</em> box fills in and the quote appears.</>,
          <>Review the quote, then tap <B>Swap</B> and confirm in your wallet.</>,
          <>A pill above the card shows <B>Swapping</B> after you confirm, then <B>Swap succeeded</B>. Your balances update.</>,
        ],
      },
      { t: "h3", id: "swap-quote", c: "Reading the quote" },
      {
        t: "table",
        head: ["Line", "What it means"],
        rows: [
          [<B key="1">Rate</B>, "How much you get for one unit of the token you pay."],
          [<B key="2">Minimum received</B>, "The least you will get after slippage. The swap enforces it."],
          [<B key="3">Slippage</B>, "How far the price may move against you before the swap is cancelled."],
          [<B key="4">Network fee</B>, "An estimate of the fee in USDC. Your wallet shows the exact fee."],
          [<B key="5">Dollar values</B>, "The small amounts under each box show the approximate value in dollars."],
        ],
      },
      { t: "h3", id: "swap-slippage", c: "Choosing slippage" },
      {
        t: "ul",
        items: [
          <><B>Auto</B> uses 0.5% for USDC and EURC, and 1% whenever cirBTC is involved, because its price moves more.</>,
          <>Open <em>Settings</em> to choose <B>Custom</B>: 0.1%, 0.5%, 1%, 3%, 5%, or any value from 0.01% to 50%.</>,
          "Too low and the swap may be cancelled when the price wiggles. Too high and you may receive noticeably less than you expect.",
        ],
      },
      { t: "h3", id: "swap-prices", c: "Prices, charts and history" },
      {
        t: "ul",
        items: [
          "Price, 24h change, market cap and 24h volume come from CoinGecko. They are for information only. The swap price comes from the swap service.",
          "On desktop, the chart icon opens a price chart on the left of the swap card, with ranges 1H, 4H, 1D, 7D, 1M, 3M and 1Y, shown as a line or as candles. Hover the chart to read prices.",
          "On phones, tap the small price card under You receive. It opens the chart in front of the card, with an arrow to go back.",
          "The History icon lists swaps made on this device. For everything your wallet has done, use Activity.",
        ],
      },
      { t: "h3", id: "swap-safety", c: "Safety checks built in" },
      {
        t: "ul",
        items: [
          "Just before sending, the page gets a fresh price. If it is more than 0.5% worse than the one you saw, it stops and shows the new price.",
          "It checks that your account and network have not changed, and blocks double taps.",
          "After sending, it waits for the transaction to be confirmed on-chain and shows what you actually received.",
        ],
      },
      { t: "note", title: "If you see “The price moved”", c: "Nothing went wrong and nothing was spent. The price changed while you were deciding. Review the new numbers and tap Swap again." },
    ],
  },
  {
    id: "bridge",
    group: "Guides",
    title: "Bridge",
    lead: "Move USDC between Arc and other networks, or between two other networks, with Circle’s CCTP.",
    kw: "bridge cctp usdc networks fast transfer standard forwarder delivery fee slippage recipient resume progress road ethereum base arbitrum",
    blocks: [
      { t: "h3", id: "bridge-how", c: "How the bridge works" },
      { t: "p", c: "The bridge uses Circle’s CCTP. Your USDC is burned on the first network, Circle confirms it, and the same amount of native USDC is minted on the second network. Fees are taken from the amount you receive or paid in gas, and the page shows them before you start." },
      { t: "h3", id: "bridge-networks", c: "Networks" },
      { t: "p", c: <>The list matches the networks on <A href="https://bridge.usdc.com">bridge.usdc.com</A> that work with an EVM wallet, and it comes from Circle’s own SDK. Every network is clickable on both sides, Arc included, and the picker shows your USDC balance on each.</> },
      {
        t: "table",
        head: ["Network", "Receive without a wallet prompt", "Fast transfer from here"],
        rows: [
          ["Arc", "Yes", "Not needed, already fast"],
          ["Ethereum", "Yes", "Yes"],
          ["Base", "Yes", "Yes"],
          ["Arbitrum", "Yes", "Yes"],
          ["OP Mainnet", "Yes", "Yes"],
          ["Polygon", "Yes", "Not needed, already fast"],
          ["Avalanche", "Yes", "Not needed, already fast"],
          ["Unichain", "Yes", "Yes"],
          ["Linea", "Yes", "Yes"],
          ["World Chain", "Yes", "Yes"],
          ["Ink", "Yes", "Yes"],
          ["Codex", "No, one extra confirmation", "Yes"],
          ["Plume", "No, one extra confirmation", "Yes"],
          ["HyperEVM, Monad, Sei, Sonic", "Yes", "Standard only"],
          ["XDC", "No, one extra confirmation", "Standard only"],
        ],
      },
      { t: "h3", id: "bridge-steps", c: "Bridge step by step" },
      {
        t: "steps",
        items: [
          <>Open <L href={`${SITE}/bridge`}>Bridge</L>.</>,
          <>Choose <B>From</B> and <B>To</B>. For example, Ethereum to Arc. The arrows button between them reverses the direction.</>,
          <>Enter the USDC amount. Your balance on the first network is shown, with <em>50%</em> and <em>Max</em> buttons.</>,
          <>Wait for the quote. The <em>To</em> box shows what you will receive after fees.</>,
          <>If the button says <B>Switch to …</B>, your wallet is on a different network. Tap it to switch to the network you are sending from.</>,
          <>Tap <B>Bridge</B> and confirm each prompt in your wallet.</>,
          <>Watch the progress card. When it ends you see <B>Bridge complete</B> with the amount sent, the amount received and a link to the explorer.</>,
        ],
      },
      { t: "h3", id: "bridge-quote", c: "Reading the quote" },
      {
        t: "table",
        head: ["Line", "What it means"],
        rows: [
          [<B key="1">Slippage</B>, "How much the fees may change before the bridge starts. Auto is 0.5%."],
          [<B key="2">Gas fee</B>, "The network fee on the network you send from. Shown in its coin, with the dollar value in brackets, for example 0.00021 ETH ($0.74). On Arc it is shown in dollars."],
          [<B key="3">Estimated time</B>, "Circle’s published time for your route, in seconds or minutes."],
          [<B key="4">Fast transfer</B>, "On when Fast is turned on and available. Shows its small fee."],
          [<B key="5">Bridge fee</B>, "Shown when Fast is off or not available."],
          [<B key="6">Delivery fee</B>, "The small fee for Circle to deliver the USDC on the receiving network for you."],
          [<B key="7">Recipient</B>, "Shown only if you send to a different address."],
        ],
      },
      { t: "h3", id: "bridge-fast", c: "Fast transfer or Standard" },
      { t: "p", c: <>The lightning-bolt icon next to Settings turns <B>Fast transfer</B> on or off, and glows when it is on. Fast delivers your USDC in seconds, for a small fee taken from what you receive. Standard waits for the first network to finalize. Fast exists only on some source networks, and on Arc, Avalanche and Polygon the standard transfer is already fast.</> },
      {
        t: "table",
        head: ["Sending from", "Fast", "Standard"],
        rows: [
          ["Ethereum", "about 20 sec", "about 15–19 min"],
          ["Base, Arbitrum, OP Mainnet, Unichain", "about 8 sec", "about 15–19 min"],
          ["Linea", "about 8 sec", "about 6–32 hours"],
          ["Avalanche, Polygon", "not needed", "about 8 sec"],
          ["Arc", "not needed", "about 1 sec"],
        ],
      },
      { t: "p", c: "These are Circle’s published confirmation times. Wallet confirmations add a little. If the Fast fee rises above your slippage limit, the transfer falls back to Standard." },
      { t: "h3", id: "bridge-forwarder", c: "Why you confirm only once" },
      { t: "p", c: "For most networks, Circle’s Forwarding Service delivers the USDC on the receiving network for you. You only confirm on the network you send from, and you never switch networks to “claim” anything. The price is a small delivery fee, shown in the quote. Where it is not available, the page tells you that receiving needs one extra confirmation." },
      { t: "h3", id: "bridge-other-address", c: "Send to a different address" },
      { t: "p", c: "Turn on Send to a different address to deliver the USDC to another wallet on the receiving network. The page rejects invalid addresses and USDC contract addresses, and you must tick a box confirming the address is correct before you can bridge. Make sure the owner can use that address on the receiving network." },
      { t: "h3", id: "bridge-progress", c: "The progress card" },
      { t: "p", c: "A card shows the route as a glowing road with four steps. The line lights up as each step finishes." },
      {
        t: "ul",
        items: [
          <><B>Approve</B> lets the bridge contract use your USDC. It is skipped if you already approved enough.</>,
          <><B>Send</B> burns your USDC on the first network.</>,
          <><B>Circle confirms</B> the transfer.</>,
          <><B>Deliver</B>: the USDC is minted on the receiving network, by Circle’s forwarder or with one more confirmation from you.</>,
        ],
      },
      { t: "h3", id: "bridge-stuck", c: "If a bridge stops halfway" },
      { t: "p", c: "A step that fails is marked with a red cross, and the card says whether any USDC has left your wallet. If it has, do not send it again. Tap Resume bridge when it appears, or check your wallet activity and the explorer. Keep the page open until a bridge finishes, especially with Standard transfers." },
      { t: "note", tone: "tip", title: "Tips", c: "You need a little of the first network’s gas coin (ETH, POL, AVAX and so on) to start a bridge, and the page warns you if you have none. Fast costs a little more but is much quicker. The History icon lists bridges made on this device." },
    ],
  },
  {
    id: "robinhood",
    group: "Guides",
    title: "Robinhood Chain routes",
    lead: "Circle’s bridge does not support Robinhood Chain, so those routes use LI.FI.",
    kw: "robinhood chain lifi li.fi jumper usdg bridge aggregator",
    blocks: [
      { t: "p", c: <>When you pick Robinhood Chain as the <em>From</em> or <em>To</em> network on the Bridge page, the card switches from Circle’s bridge to <B>LI.FI</B>, a third-party bridge aggregator, with both networks already chosen. Every other pair keeps using Circle’s bridge.</> },
      { t: "h3", id: "rh-steps", c: "Step by step" },
      {
        t: "steps",
        items: [
          <>On <L href={`${SITE}/bridge`}>Bridge</L>, choose Robinhood Chain on one side and the other network on the other side.</>,
          "Read the note under the networks. It explains that this route is bridged by LI.FI.",
          "Connect your wallet inside the LI.FI widget if it asks. The widget connects wallets by itself.",
          "Choose the token and amount, read the quote, fees and time, and confirm in your wallet.",
        ],
      },
      { t: "h3", id: "rh-know", c: "What to know" },
      {
        t: "ul",
        items: [
          "USDC sent to Robinhood Chain often arrives as USDG, a different stablecoin. Check the token you will receive in the quote.",
          "LI.FI routes work differently from Circle’s burn-and-mint. A bridge or relayer delivers your funds, so read the quote and the fees.",
          "Start with a small amount on a new route.",
          "If a pair does not work in the widget, use the “Open it in Jumper” link under it.",
        ],
      },
    ],
  },
  {
    id: "activity",
    group: "Guides",
    title: "Activity",
    lead: "Everything your wallet has done on Arc mainnet, newest first.",
    kw: "activity history transactions filters sent received swaps bridges explorer",
    blocks: [
      { t: "p", c: <>Open <L href={`${SITE}/activity`}>Activity</L> with your wallet connected. The page reads the official Arc explorer, groups your transactions by day, and loads older history as you scroll until it reaches your very first transaction.</> },
      { t: "h3", id: "activity-rows", c: "Reading a row" },
      {
        t: "ul",
        items: [
          "An icon and a title, such as Sent USDC, Received EURC, Swapped USDC for EURC, Bridge in or Bridge out.",
          "The other address (To or From) and the time.",
          "The amounts: green with a plus for money in, white with a minus for money out, each with its token logo.",
          "The fee, on transactions you made. A red Failed tag marks a transaction that did not succeed.",
          "Tap a row to open the transaction in the explorer.",
        ],
      },
      { t: "h3", id: "activity-filters", c: "Filters and refresh" },
      { t: "p", c: "Use the buttons at the top to show All, Sent, Received, Swaps or Bridges. The list refreshes by itself every 30 seconds, and the refresh button updates it right away." },
      { t: "note", title: "How the types are decided", c: "If you send one token and receive a different one in the same transaction, it is a Swap. USDC that is burned or minted for a bridge shows as Bridge out or Bridge in. Everything else is a Send or a Receive. This is a best guess from the data, so an unusual transaction may show as “Contract interaction”. NFT transfers are not shown." },
    ],
  },

  /* ===================== REFERENCE ===================== */
  {
    id: "fees",
    group: "Reference",
    title: "Fees and finality",
    lead: "What you pay, who gets it, and how fast things settle.",
    kw: "fees gas cost price finality fast delivery fee fast fee network fee",
    blocks: [
      {
        t: "table",
        head: ["Fee", "When", "Who gets it"],
        rows: [
          [<B key="1">Network fee (gas)</B>, "Every transaction. On Arc it is paid in USDC. On other networks it is paid in that network’s coin.", "The network"],
          [<B key="2">Fast fee</B>, "Bridge with Fast transfer turned on.", "Circle’s Fast Transfer service"],
          [<B key="3">Delivery fee</B>, "Bridge to a network where Circle’s Forwarding Service delivers for you.", "Circle’s forwarder"],
          [<B key="4">Swap pricing</B>, "Swaps. Any service fee is already inside the quoted rate and minimum received.", "The swap service"],
          [<B key="5">AlabaamaFi fee</B>, "None. AlabaamaFi does not add a fee of its own.", "Not applicable"],
        ],
      },
      { t: "h3", id: "fees-finality", c: "Finality" },
      { t: "p", c: "Arc finalizes transactions in under a second, so one receipt means the transaction is final. Other networks finalize at their own pace, which is why a Standard bridge from them can take a while." },
      { t: "h3", id: "fees-estimates", c: "Estimates and exact fees" },
      { t: "p", c: "Fees in a quote are estimates from the current gas price. Your wallet shows the exact fee when you confirm, and Send shows the real fee after the transaction is final." },
    ],
  },
  {
    id: "networks",
    group: "Reference",
    title: "Networks and tokens",
    lead: "The details you need to add Arc to a wallet, and the tokens AlabaamaFi supports on it.",
    kw: "arc mainnet rpc chain id 5042 explorer contract usdc eurc cirbtc address add network",
    blocks: [
      { t: "h3", id: "net-arc", c: "Arc Mainnet" },
      {
        t: "table",
        head: ["Setting", "Value"],
        rows: [
          ["Network name", "Arc Mainnet"],
          ["RPC URL", <Code key="r">https://rpc.mainnet.arc.io</Code>],
          ["Chain ID", "5042 (0x13b2)"],
          ["Currency symbol", "USDC"],
          ["Block explorer", <Code key="e">https://explorer.arc.io</Code>],
        ],
      },
      { t: "h3", id: "net-tokens", c: "Tokens on Arc" },
      {
        t: "table",
        head: ["Token", "Contract", "Decimals"],
        rows: [
          ["USDC", <Code key="u">0x3600000000000000000000000000000000000000</Code>, "6 (ERC-20), 18 as the native coin"],
          ["EURC", <Code key="eu">0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1</Code>, "6"],
          ["cirBTC", <Code key="c">0x171A4217b86A807A64eB94757Db6849fb4bDbAA0</Code>, "8"],
        ],
      },
      { t: "note", title: "Always check addresses", c: <>Compare any contract address with the <A href="https://docs.arc.io">official Arc documentation</A> before you use it.</> },
    ],
  },

  /* ===================== SAFETY AND HELP ===================== */
  {
    id: "security",
    group: "Safety and help",
    title: "Security and privacy",
    lead: "How your money and your data are protected, and what you should do too.",
    kw: "security privacy safe scam seed phrase approvals data storage",
    blocks: [
      { t: "h3", id: "sec-you", c: "What you should do" },
      {
        t: "ul",
        items: [
          <><B>Never share your seed phrase or private key.</B> AlabaamaFi will never ask for them, not on the site, not in messages, not in replies.</>,
          "Use only app.alabaamafi.xyz. Check the address bar before you connect a wallet.",
          "Read what your wallet shows before you confirm. It is the final check.",
          "Start with a small amount on every new route, and double-check every address.",
          "Review and revoke token approvals you no longer need, with a revoke tool.",
        ],
      },
      { t: "h3", id: "sec-we", c: "What AlabaamaFi does" },
      {
        t: "ul",
        items: [
          "Is non-custodial. Every action is signed in your wallet, and the site never holds your funds.",
          "Checks your account, network and balance right before sending, and shows what you receive after.",
          "Builds explorer links from the transaction hash and checks that transaction hashes and addresses are valid before using them.",
        ],
      },
      { t: "h3", id: "sec-data", c: "Your data" },
      {
        t: "ul",
        items: [
          "Your settings and your swap and bridge history are saved in your browser, on your device. Clearing browser data removes them.",
          "AlabaamaFi has no accounts and no database of wallet activity.",
          "The services behind the site, such as RPC providers, Circle, LI.FI, CoinGecko and the Arc explorer, can see requests such as your IP address and wallet address. Everything on a blockchain is public.",
        ],
      },
      { t: "note", tone: "warn", title: "Not financial advice", c: "AlabaamaFi is an interface, not an adviser. Using DeFi involves risk, including smart-contract risk, price movement and mistakes. Only use money you are comfortable risking." },
    ],
  },
  {
    id: "troubleshooting",
    group: "Safety and help",
    title: "Troubleshooting",
    lead: "Quick fixes for the most common problems.",
    kw: "troubleshooting problem error fix wallet wrong network balance dash quote stuck pending chart unavailable",
    blocks: [
      {
        t: "table",
        head: ["Problem", "What to try"],
        rows: [
          [<B key="1">Wallet will not connect</B>, "Unlock the wallet, refresh the page, and try again. On a phone, use the wallet’s built-in browser or WalletConnect."],
          [<B key="2">“Switch to …” button</B>, "Your wallet is on another network. Tap the button and approve the switch in your wallet."],
          [<B key="3">Balance shows a dash</B>, "Make sure you are connected and on the right network. Refresh the page or reconnect. A busy network provider can delay it for a moment."],
          [<B key="4">“Not enough left to cover the fee”</B>, "Lower the amount a little, or use Max, which keeps the fee for you."],
          [<B key="5">No quote on Swap or Bridge</B>, "Check the amount and balance, wait a few seconds, and try again. A busy service can fail for a moment."],
          [<B key="6">“The price moved”</B>, "Nothing was spent. Review the new numbers and tap Swap again."],
          [<B key="7">Bridge looks stuck</B>, "Keep the page open. Standard transfers from some networks take 15 minutes or more. If USDC already left, do not resend. Use Resume bridge or check the explorer."],
          [<B key="8">Wallet prompt did not appear</B>, "Open your wallet manually. Some wallets show the request only inside the wallet app."],
          [<B key="9">An old transaction is missing in Activity</B>, "History loads in pages. Scroll down or tap Load more. A brand-new transaction can take a moment to appear."],
          [<B key="10">Chart is unavailable</B>, "Prices and charts come from a service with request limits. Wait a minute and try again. Swapping is not affected."],
        ],
      },
      { t: "p", c: <>Still stuck? Ask in <A href={DISCORD_URL}>Discord</A> and include the page, the network and what you saw.</> },
    ],
  },
  {
    id: "community",
    group: "Safety and help",
    title: "Community and support",
    lead: "Where to ask questions, share feedback and report problems.",
    kw: "community support help discord x twitter contact feedback bug report",
    blocks: [
      {
        t: "ul",
        items: [
          <><B>Discord:</B> <A href={DISCORD_URL}>join the AlabaamaFi server</A> to ask questions and talk with other users.</>,
          <><B>X:</B> follow <A href={X_URL}>@Alabaama_Fi</A> for news.</>,
          <><B>FAQ:</B> quick answers are in the <L href={`${SITE}/faq`}>FAQ</L>.</>,
        ],
      },
      { t: "h3", id: "community-report", c: "How to ask for help" },
      {
        t: "steps",
        items: [
          "Say which page you were on: Send, Swap, Bridge or Activity.",
          "Say which networks and tokens were involved, and the amount.",
          "Describe what you expected and what you saw. A screenshot helps.",
          "Share the transaction hash if there is one. A hash is safe to share.",
        ],
      },
      { t: "note", tone: "warn", title: "Stay safe", c: "Nobody from AlabaamaFi will ever ask for your seed phrase, your private key or a payment to “fix” something. Ignore private messages that do, and only use the links on this page." },
    ],
  },

  /* ===================== LEGAL ===================== */
  {
    id: "terms",
    group: "Legal",
    title: "Terms of Service",
    lead: `Last updated: ${UPDATED}. By using AlabaamaFi you agree to these terms.`,
    kw: "terms of service tos legal conditions liability disclaimer eligibility risks",
    blocks: [
      { t: "h3", id: "tos-1", c: "1. About these terms" },
      { t: "p", c: "These Terms of Service apply to your use of the AlabaamaFi website and interface at app.alabaamafi.xyz (the “Interface”). “We”, “us” and “AlabaamaFi” mean the operators of the Interface. If you do not agree, do not use the Interface." },
      { t: "h3", id: "tos-2", c: "2. What AlabaamaFi is" },
      { t: "p", c: "AlabaamaFi is a non-custodial software interface that helps you prepare transactions for the Arc network and related services. We do not hold, store or control your funds, keys or tokens, and we cannot reverse, cancel or recover a transaction. We are not a bank, an exchange, a broker, a custodian or an adviser." },
      { t: "h3", id: "tos-3", c: "3. Eligibility and lawful use" },
      {
        t: "ul",
        items: [
          "You must be old enough and legally able to enter into these terms where you live.",
          "You must not use the Interface if it is illegal for you to do so, or if you are subject to sanctions or on a restricted list.",
          "You are responsible for following the laws and regulations that apply to you, including tax rules.",
        ],
      },
      { t: "h3", id: "tos-4", c: "4. Your wallet and your responsibilities" },
      {
        t: "ul",
        items: [
          "You are solely responsible for your wallet, seed phrase, private keys and devices. Anyone who has them controls your assets.",
          "You are responsible for checking every address, amount, network and token before you confirm a transaction in your wallet.",
          "Blockchain transactions are final. We cannot undo a transaction sent to a wrong address or on a wrong network.",
          "You are responsible for network fees, which are paid to the network and not to us.",
        ],
      },
      { t: "h3", id: "tos-5", c: "5. Third-party services" },
      { t: "p", c: "The Interface works with third-party services, including the Arc network and its explorer, Circle’s App Kit and CCTP, LI.FI, price data providers, RPC providers and your wallet. We do not control them, and they have their own terms, risks and availability. We are not responsible for their acts, outages, errors, fees or changes." },
      { t: "h3", id: "tos-6", c: "6. Fees" },
      { t: "p", c: "Quotes show the fees we can read, such as network fees, Fast fees and delivery fees. They are estimates and can change. We do not add a fee of our own at this time. We may do so in the future, and we will show it clearly before you confirm." },
      { t: "h3", id: "tos-7", c: "7. Risks" },
      { t: "p", c: "Using blockchain technology is risky. The risks include, without limit:" },
      {
        t: "ul",
        items: [
          "Smart-contract bugs, bridge failures, delays and attacks.",
          "Price movement and slippage, and the loss of value of a token or a stablecoin.",
          "Token issuers or networks freezing, blocklisting or restricting addresses or funds.",
          "Congestion, outages, reorganizations and mistakes by you or by third parties.",
          "Changes in law or regulation that affect a service, a token or your ability to use them.",
        ],
      },
      { t: "p", c: "You use the Interface at your own risk, and only with money you can afford to lose." },
      { t: "h3", id: "tos-8", c: "8. No advice" },
      { t: "p", c: "Nothing in the Interface or its docs is financial, investment, legal or tax advice. Information such as prices, charts, times and fees is provided for convenience and may be incomplete, delayed or wrong." },
      { t: "h3", id: "tos-9", c: "9. Prohibited use" },
      {
        t: "ul",
        items: [
          "Using the Interface for illegal activity, including fraud, money laundering or sanctions evasion.",
          "Interfering with, overloading or attacking the Interface or its services.",
          "Impersonating AlabaamaFi or another person, or running look-alike sites to deceive users.",
          "Using automated tools to abuse the Interface in a way that harms other users or the services behind it.",
        ],
      },
      { t: "h3", id: "tos-10", c: "10. Availability and changes" },
      { t: "p", c: "The Interface is provided on an “as is” and “as available” basis. We may change, limit or stop any feature, network or token at any time, with or without notice, and we may restrict access where needed." },
      { t: "h3", id: "tos-11", c: "11. Disclaimer of warranties" },
      { t: "p", c: "To the fullest extent permitted by law, we make no warranties of any kind, express or implied, including about accuracy, reliability, availability, fitness for a particular purpose and non-infringement. We do not promise that the Interface will be uninterrupted, secure or free of errors." },
      { t: "h3", id: "tos-12", c: "12. Limitation of liability" },
      { t: "p", c: "To the fullest extent permitted by law, AlabaamaFi and its operators, contributors and affiliates will not be liable for any loss of funds, profits, data or opportunity, or for any indirect, incidental, special, consequential or punitive damages, arising from your use of the Interface or from third-party services, even if we were told they were possible." },
      { t: "h3", id: "tos-13", c: "13. Intellectual property" },
      { t: "p", c: "The AlabaamaFi name, logo and the design of the Interface belong to their owners. Names, logos and marks of third parties, such as Arc, Circle, USDC, EURC and LI.FI, belong to their respective owners and are used only to identify them." },
      { t: "h3", id: "tos-14", c: "14. Changes to these terms" },
      { t: "p", c: "We may update these terms from time to time. The updated terms apply from the date shown at the top of this section. If you keep using the Interface after that date, you accept the update." },
      { t: "h3", id: "tos-15", c: "15. Contact" },
      { t: "p", c: <>Questions about these terms? Reach us on <A href={DISCORD_URL}>Discord</A> or <A href={X_URL}>X</A>.</> },
    ],
  },
];

const GROUPS = Array.from(new Set(SECTIONS.map((s) => s.group)));

function resolve(id: string): { sec: string; sub: string | null } | null {
  const sec = SECTIONS.find((s) => s.id === id);
  if (sec) return { sec: sec.id, sub: null };
  const host = SECTIONS.find((s) => s.blocks.some((b) => b.t === "h3" && b.id === id));
  return host ? { sec: host.id, sub: id } : null;
}

/* ---------- tables ---------- */
function TableView({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="mt-5 overflow-x-auto rounded-2xl border border-white/[0.08]">
      <table className="w-full border-collapse text-left text-[13px] sm:text-sm">
        <thead className="bg-white/[0.04] text-[11px] uppercase tracking-[0.1em] text-slate-500 sm:text-xs sm:tracking-[0.12em]">
          <tr>{head.map((h) => <th key={h} className="whitespace-nowrap px-3 py-2.5 font-semibold sm:px-4 sm:py-3">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j} className="break-normal px-3 py-3 align-top leading-6 text-slate-300 sm:px-4 sm:py-3.5">{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PagesTable() {
  return (
    <>
      <div className="mt-5 hidden overflow-x-auto rounded-2xl border border-white/[0.08] sm:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Page</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">What it does</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Open</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {PAGES.map((p) => (
              <tr key={p.name}>
                <td className="px-4 py-4 align-middle font-semibold text-white">{p.name}</td>
                <td className="px-4 py-4 align-middle leading-6 text-slate-300">{p.text}</td>
                <td className="px-4 py-4 align-middle">
                  <Link href={p.href} aria-label={`Open ${p.name}`} className="group inline-flex items-center gap-2.5 font-medium text-[#65caff] hover:text-white">
                    <span className="transition duration-300 group-hover:scale-110"><GlowIcon d={p.d} /></span>
                    <span className="whitespace-nowrap">Open {p.name}</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-white/[0.08] sm:hidden">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead className="bg-white/[0.04] text-[11px] uppercase tracking-[0.1em] text-slate-500">
            <tr>
              <th className="w-16 whitespace-nowrap px-3 py-2.5 text-center font-semibold">Open</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold">What it does</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {PAGES.map((p) => (
              <tr key={p.name}>
                <td className="px-3 py-3.5 text-center align-middle">
                  <Link href={p.href} aria-label={`Open ${p.name}`} className="inline-flex h-10 w-10 items-center justify-center rounded-full transition active:scale-95">
                    <GlowIcon d={p.d} size={26} />
                  </Link>
                </td>
                <td className="px-3 py-3.5 align-middle leading-6 text-slate-300">{p.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ---------- blocks ---------- */
function BlockView({ b }: { b: Block }) {
  switch (b.t) {
    case "p":
      return <p className="mt-4 text-[15px] leading-7 text-slate-300">{b.c}</p>;
    case "h3":
      return (
        <h3 id={b.id} data-sub={b.id} className="mt-10 scroll-mt-40 text-lg font-semibold tracking-tight text-white">
          {b.c}
        </h3>
      );
    case "ul":
      return (
        <ul className="mt-4 space-y-2.5 text-[15px] leading-7 text-slate-300">
          {b.items.map((t, i) => (
            <li key={i} className="flex gap-3">
              <span aria-hidden className="mt-[0.72rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#2588ff]" />
              <span className="min-w-0">{t}</span>
            </li>
          ))}
        </ul>
      );
    case "steps":
      return (
        <ol className="mt-5 space-y-4">
          {b.items.map((t, i) => (
            <li key={i} className="flex gap-4 text-[15px] leading-7 text-slate-300">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 text-xs font-bold text-[#8fe3ff]" style={{ textShadow: "0 0 7px rgba(57,196,255,0.95), 0 0 16px rgba(22,136,245,0.75)" }}>{i + 1}</span>
              <span className="min-w-0">{t}</span>
            </li>
          ))}
        </ol>
      );
    case "note": {
      const tone = b.tone ?? "info";
      const cls = tone === "warn" ? "border-amber-400/25 bg-amber-400/[0.06]" : tone === "tip" ? "border-emerald-400/25 bg-emerald-400/[0.05]" : "border-[#2588ff]/25 bg-[#0d4fc5]/[0.08]";
      const hd = tone === "warn" ? "text-amber-300" : tone === "tip" ? "text-emerald-300" : "text-[#7dd3fc]";
      return (
        <div className={`mt-6 rounded-2xl border px-4 py-4 text-sm leading-6 ${cls}`}>
          <p className={`text-[13px] font-semibold ${hd}`}>{b.title}</p>
          <div className="mt-1 text-slate-300">{b.c}</div>
        </div>
      );
    }
    case "table":
      return <TableView head={b.head} rows={b.rows} />;
    case "pages":
      return <PagesTable />;
  }
}

/* ---------- page ---------- */
type Hit = { id: string; title: string; where: string; kw: string };

export default function DocsPage() {
  const [activeSec, setActiveSec] = useState(SECTIONS[0].id);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState(false);
  const [mSearch, setMSearch] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const deskWrap = useRef<HTMLDivElement>(null);
  const mInput = useRef<HTMLInputElement>(null);

  const idx = Math.max(0, SECTIONS.findIndex((s) => s.id === activeSec));
  const current = SECTIONS[idx];
  const prev = SECTIONS[idx - 1];
  const next = SECTIONS[idx + 1];
  const currentSubs = current.blocks.filter((b): b is Extract<Block, { t: "h3" }> => b.t === "h3");

  const go = useCallback((id: string) => {
    const r = resolve(id);
    if (!r) return;
    setActiveSec(r.sec);
    setActiveSub(r.sub);
    setDrawer(false);
    setMSearch(false);
    setFocus(false);
    setQuery("");
    history.replaceState(null, "", `#${id}`);
    if (r.sub) setTimeout(() => document.getElementById(r.sub as string)?.scrollIntoView({ behavior: "smooth", block: "start" }), 90);
    else window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const apply = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const r = id ? resolve(id) : null;
      if (!r) return;
      setActiveSec(r.sec);
      setActiveSub(r.sub);
      if (r.sub) setTimeout(() => document.getElementById(r.sub as string)?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
      else window.scrollTo({ top: 0 });
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      let sub: string | null = null;
      for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-sub]"))) if (el.getBoundingClientRect().top <= OFFSET) sub = el.id;
      setActiveSub(sub);
      setShowTop(window.scrollY > 900);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [activeSec]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMSearch(false);
        setDrawer(false);
        setFocus(false);
      }
    };
    const onDown = (e: MouseEvent) => {
      if (deskWrap.current && !deskWrap.current.contains(e.target as Node)) setFocus(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);
  useEffect(() => {
    if (mSearch) setTimeout(() => mInput.current?.focus(), 60);
  }, [mSearch]);
  useEffect(() => {
    document.body.style.overflow = drawer || mSearch ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer, mSearch]);

  const index = useMemo<Hit[]>(
    () =>
      SECTIONS.flatMap((s) => [
        { id: s.id, title: s.title, where: s.group, kw: s.kw + " " + s.lead },
        ...s.blocks.filter((b): b is Extract<Block, { t: "h3" }> => b.t === "h3").map((h) => ({ id: h.id, title: h.c, where: s.title, kw: s.kw })),
      ]),
    []
  );
  const typed = query.trim().length > 0;
  const results = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return index.filter((h) => words.every((w) => (h.title + " " + h.where + " " + h.kw).toLowerCase().includes(w))).slice(0, 8);
  }, [query, index]);

  const resultList = () => (
    <ul className="max-h-[60vh] overflow-y-auto p-2">
      {results.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-500">No results. Try another word.</li>}
      {results.map((h) => (
        <li key={h.id}>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => go(h.id)} className="flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-left transition hover:bg-white/[0.06]">
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-semibold">{h.title}</span>
              <span className="block truncate text-xs text-slate-500">{h.where}</span>
            </span>
            <span className="shrink-0 text-slate-600"><Svg d={I.chevron} size={16} /></span>
          </button>
        </li>
      ))}
    </ul>
  );

  const sideList = (onPick: (id: string) => void) => (
    <nav aria-label="Docs sections">
      {GROUPS.map((g) => (
        <div key={g} className="mb-6">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{g}</p>
          <ul className="space-y-0.5">
            {SECTIONS.filter((s) => s.group === g).map((s) => {
              const on = activeSec === s.id;
              return (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onPick(s.id);
                    }}
                    aria-current={on ? "true" : undefined}
                    className={`block rounded-xl px-3 py-2 text-[14px] font-medium transition ${on ? "bg-[#159fff]/[0.14] text-[#7dd3fc]" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"}`}
                  >
                    {s.title}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const iconBtn = "flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/[0.07] hover:text-white";
  const FAQ_ICON = "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01";

  return (
    <div className={`${brandFont.className} min-h-screen bg-[#05080f] text-white selection:bg-[#167cff]/30`}>
      <style>{`
        html{scroll-behavior:smooth}
        @keyframes drawerIn{from{transform:translateX(-100%)}to{transform:none}}
        @keyframes searchGrow{from{width:9.5rem;opacity:.6}to{width:100%;opacity:1}}
        @keyframes sectionIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important}}
      `}</style>

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#05080f]/90 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 md:hidden">
          <Link href={SITE} className="flex min-w-0 items-center gap-2.5" aria-label="AlabaamaFi home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/alabaamafi-logo.svg" alt="" className="h-9 w-9 shrink-0 object-contain" />
            <span className="truncate text-[17px] font-bold tracking-tight">
              Alabaama<span className="text-[#159fff]">Fi</span>
            </span>
          </Link>
          <button onClick={() => setMSearch(true)} className="flex h-10 w-[9.5rem] shrink-0 items-center justify-between rounded-full border border-white/[0.1] bg-white/[0.04] pl-4 pr-3 text-sm text-slate-500 transition hover:bg-white/[0.07]" aria-label="Search the docs">
            <span>Search</span>
            <Svg d={I.search} size={16} />
          </button>
        </div>

        <div className="hidden h-16 w-full items-center gap-4 px-6 md:grid md:grid-cols-[1fr_minmax(0,30rem)_1fr] lg:px-10 2xl:px-16">
          <Link href={SITE} className="flex shrink-0 items-center gap-2.5 justify-self-start" aria-label="AlabaamaFi home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/alabaamafi-logo.svg" alt="" className="h-9 w-9 object-contain" />
            <span className="text-[17px] font-bold tracking-tight">
              Alabaama<span className="text-[#159fff]">Fi</span>
            </span>
            <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-xs font-semibold text-slate-300">Docs</span>
          </Link>

          <div ref={deskWrap} className="relative">
            <label className="flex h-10 items-center gap-3 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 transition focus-within:border-[#2588ff]/60 focus-within:bg-white/[0.06]">
              <span className="shrink-0 text-slate-500"><Svg d={I.search} size={16} /></span>
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setFocus(true);
                }}
                onFocus={() => setFocus(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && results[0]) go(results[0].id);
                }}
                placeholder="Search the docs"
                aria-label="Search the docs"
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
              {query && (
                <button onClick={() => setQuery("")} aria-label="Clear search" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.1] text-xs text-slate-300 hover:text-white">×</button>
              )}
            </label>
            {focus && typed && (
              <div className="absolute left-0 right-0 top-[3.1rem] z-50 overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0b1018] shadow-[0_20px_60px_rgba(0,0,0,0.55)]">{resultList()}</div>
            )}
          </div>

          <div className="flex items-center justify-end">
            <Link href={SITE} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.04] hover:text-white">
              <Svg d={I.home} size={16} /> Home
            </Link>
          </div>
        </div>

        <div className="flex h-12 items-center gap-2 border-t border-white/[0.06] px-3 sm:px-5 lg:hidden">
          <button onClick={() => setDrawer(true)} aria-label="Open the docs menu" aria-expanded={drawer} className={iconBtn}>
            <Svg d={I.menu} />
          </button>
          <p className="min-w-0 flex-1 truncate text-sm text-slate-400">
            <span className="text-slate-600">{current.group}</span>
            <span className="mx-1.5 text-slate-600">/</span>
            <span className="font-medium text-white">{current.title}</span>
          </p>
        </div>
      </header>

      {/* ================= BODY ================= */}
      <div className="flex w-full gap-0 px-4 sm:px-6 lg:px-10 2xl:px-16">
        <aside className="sticky top-[4.75rem] hidden h-[calc(100vh-4.75rem)] w-64 shrink-0 overflow-y-auto py-8 pr-6 lg:block xl:w-72">{sideList(go)}</aside>

        <main className="min-w-0 flex-1 py-8 lg:border-l lg:border-white/[0.07] lg:px-10 lg:py-10 xl:px-14">
          <article key={current.id} className={`mx-auto w-full ${ARTICLE_WIDTH}`} style={{ animation: "sectionIn .25s ease-out both" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2588ff]">{current.group}</p>
            <h1 className="mt-2 text-[1.9rem] font-bold leading-tight tracking-[-0.02em] sm:text-4xl">{current.title}</h1>
            <p className="mt-3 text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">{current.lead}</p>
            <div className="mt-2">
              {current.blocks.map((b, k) => (
                <BlockView key={k} b={b} />
              ))}
            </div>

            <nav aria-label="Previous and next" className="mt-16 grid gap-3 sm:grid-cols-2">
              {prev ? (
                <button onClick={() => go(prev.id)} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-left transition hover:border-[#2588ff]/40 hover:bg-white/[0.05]">
                  <span className="flex items-center gap-1.5 text-xs text-slate-500"><Svg d={I.back} size={13} sw={2.2} /> Previous</span>
                  <span className="mt-1 block font-semibold">{prev.title}</span>
                </button>
              ) : (
                <span className="hidden sm:block" />
              )}
              {next && (
                <button onClick={() => go(next.id)} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-right transition hover:border-[#2588ff]/40 hover:bg-white/[0.05] sm:col-start-2">
                  <span className="flex items-center justify-end gap-1.5 text-xs text-slate-500">Next <Svg d={I.chevron} size={13} sw={2.2} /></span>
                  <span className="mt-1 block font-semibold">{next.title}</span>
                </button>
              )}
            </nav>

            <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 text-center sm:p-8">
              <h2 className="text-xl font-semibold tracking-tight">Ready to try it?</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">Head back to AlabaamaFi, or ask the community if something is unclear.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href={SITE} className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#12b9ff] via-[#1978f5] to-[#273ee8] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(30,120,255,0.28)] transition hover:brightness-110">
                  <Svg d={I.home} size={16} sw={2} /> Back to Home
                </Link>
                <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-6 py-3 text-sm font-semibold text-white transition hover:border-[#2f8bff]/40 hover:bg-white/[0.08]">
                  <DiscordLogo size={16} /> Join Discord
                </a>
                <Link href={`${SITE}/faq`} className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.045] px-6 py-3 text-sm font-semibold text-white transition hover:border-[#2f8bff]/40 hover:bg-white/[0.08]">Read the FAQ</Link>
              </div>
            </div>
            <p className="mt-8 text-center text-xs text-slate-600">© {new Date().getFullYear()} AlabaamaFi. Your orbit for DeFi on Arc.</p>
          </article>
        </main>

        <aside className="sticky top-[4.75rem] hidden h-[calc(100vh-4.75rem)] w-56 shrink-0 overflow-y-auto py-10 pl-2 xl:block">
          {currentSubs.length > 0 && (
            <>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">On this page</p>
              <ul className="space-y-1 border-l border-white/[0.08]">
                {currentSubs.map((h) => (
                  <li key={h.id}>
                    <a
                      href={`#${h.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        go(h.id);
                      }}
                      className={`-ml-px block border-l px-3 py-1.5 text-[13px] leading-5 transition ${activeSub === h.id ? "border-[#159fff] text-[#7dd3fc]" : "border-transparent text-slate-500 hover:text-white"}`}
                    >
                      {h.c}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>
      </div>

      {showTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top" className="fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#0b1018]/90 text-slate-300 shadow-lg backdrop-blur transition hover:text-white">
          <Svg d={I.up} />
        </button>
      )}

      {/* ================= PHONE MENU ================= */}
      {drawer && (
        <div className="fixed inset-0 z-[90] lg:hidden" role="dialog" aria-modal="true" aria-label="Docs menu">
          <div className="absolute inset-0 bg-black/65" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col border-r border-white/[0.1] bg-[#080a0d] shadow-[0_25px_80px_rgba(0,0,0,0.65)]" style={{ animation: "drawerIn .3s cubic-bezier(.2,.8,.2,1) both" }}>
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.07] px-4">
              <span className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/alabaamafi-logo.svg" alt="" className="h-9 w-9 object-contain" />
                <span className="text-base font-bold tracking-tight">Alabaama<span className="text-[#159fff]">Fi</span> <span className="font-medium text-slate-500">Docs</span></span>
              </span>
              <button onClick={() => setDrawer(false)} aria-label="Close menu" className={iconBtn}><Svg d={I.close} /></button>
            </div>
            <Link href={SITE} onClick={() => setDrawer(false)} className="mx-3 mt-3 flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.04] hover:text-white">
              <Svg d={I.home} size={16} /> Home
            </Link>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">{sideList(go)}</div>
          </div>
        </div>
      )}

      {/* ================= PHONE SEARCH ================= */}
      {mSearch && (
        <div className="fixed inset-0 z-[100] md:hidden" role="dialog" aria-modal="true" aria-label="Search the docs">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMSearch(false)} />
          <div className="relative p-3">
            <div className="flex justify-end">
              <div className="flex h-12 w-full items-center gap-3 rounded-full border border-[#2588ff]/50 bg-[#0b1018] pl-5 pr-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)]" style={{ animation: "searchGrow .25s ease-out both" }}>
                <input
                  ref={mInput}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && results[0]) go(results[0].id);
                  }}
                  placeholder="Search the docs"
                  aria-label="Search the docs"
                  className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-500"
                />
                {query ? (
                  <button onClick={() => setQuery("")} aria-label="Clear search" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.1] text-sm text-slate-300">×</button>
                ) : null}
                <span className="shrink-0 text-slate-400"><Svg d={I.search} size={18} /></span>
              </div>
            </div>
            {typed && <div className="mt-2 overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0b1018] shadow-[0_20px_60px_rgba(0,0,0,0.55)]">{resultList()}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
