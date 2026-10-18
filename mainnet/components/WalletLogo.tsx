"use client";

/*
  Wallet logos and wallet names. Save as: components/WalletLogo.tsx
  Used by the wallet picker (WalletModal) and by the connected wallet menu (Header).

  Where each logo comes from, in this order:
    1. your own file in mainnet/public/wallets/   (the list RULES below says which file belongs to which wallet)
    2. the logo the wallet sends about itself (installed wallets do this)
    3. @web3icons/react (wallets and exchanges)
    4. a drawn wallet icon, or the first letter of the name
*/

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useConnectors } from "wagmi";
import type { Connector } from "wagmi";

/* ---------------------------------------------------------------------
   THE LOGO LIST
   keys     words that appear in the wallet's name (lower case)
   exact    names that must match exactly (for short names such as "core")
   files    your own logo files in public/wallets/ (tried first)
   wallet   the wallet's name in web3icons (used if there is no file)
   exchange the exchange's name in web3icons (for Binance, Gate)
   strip    true = try to remove the background tile from the web3icons logo (used for Rabby and Keplr).
            If a wallet still shows a tile, put a logo with no background in public/wallets/ (the "files" entry) and it is used first.
   variant  "mono" (default) draws only the wallet's logo in its own color, with no background tile.
            "branded" uses the colors web3icons gives it. If a wallet looks wrong, switch it here.
   glyph    show a drawn wallet icon until the logo file is uploaded
   --------------------------------------------------------------------- */
type Rule = { keys: string[]; exact?: string[]; files?: string[]; wallet?: string[]; exchange?: string[]; variant?: "branded" | "mono"; strip?: boolean; glyph?: boolean; letter: string; color: string };

const RULES: Rule[] = [
  { keys: ["brave"], files: ["/wallets/brave.svg"], letter: "B", color: "#fb542b" },
  { keys: ["okx", "okex"], files: ["/wallets/okx.png"], letter: "O", color: "#111111" },
  { keys: ["coinbase"], files: ["/wallets/coinbase.png"], letter: "C", color: "#0052ff" },
  { keys: ["bitget", "bitkeep"], files: ["/wallets/bitget.png"], letter: "B", color: "#00c8d7" },
  { keys: ["safepal"], files: ["/wallets/safepal.png"], glyph: true, letter: "S", color: "#2b2b2b" },
  { keys: ["ctrl", "xdefi"], files: ["/wallets/ctrl.png"], letter: "C", color: "#2b2b2b" },
  { keys: ["talisman"], files: ["/wallets/talisman.png"], letter: "T", color: "#ff4b4b" },
  { keys: ["uniswap"], files: ["/wallets/uniswap.png"], letter: "U", color: "#ff007a" },
  { keys: ["magic eden", "magiceden"], files: ["/wallets/magiceden.png"], letter: "M", color: "#e42575" },
  { keys: [], exact: ["core", "core wallet"], files: ["/wallets/core.png"], letter: "C", color: "#2a2a2e" },
  { keys: ["math wallet", "mathwallet"], files: ["/wallets/mathwallet.png"], letter: "M", color: "#2b2f33" },
  { keys: ["binance"], exchange: ["binance"], letter: "B", color: "#f0b90b" },
  { keys: ["gate"], exchange: ["gate", "gate-io"], letter: "G", color: "#2354e6" },
  { keys: ["metamask"], wallet: ["metamask"], variant: "branded", letter: "M", color: "#f6851b" },
  { keys: ["walletconnect", "wallet connect"], wallet: ["wallet-connect"], letter: "W", color: "#3b99fc" },
  { keys: ["rabby"], files: ["/wallets/rabby.png"], wallet: ["rabby"], variant: "branded", strip: true, letter: "R", color: "#7084ff" },
  { keys: ["phantom"], wallet: ["phantom"], letter: "P", color: "#ab9ff2" },
  { keys: ["rainbow"], wallet: ["rainbow"], letter: "R", color: "#2563eb" },
  { keys: ["zerion"], wallet: ["zerion"], letter: "Z", color: "#2962ef" },
  { keys: ["trust"], wallet: ["trust"], letter: "T", color: "#3375bb" },
  { keys: ["exodus"], wallet: ["exodus"], letter: "E", color: "#7b3fe4" },
  { keys: ["tokenpocket", "token pocket"], wallet: ["token-pocket"], letter: "T", color: "#2980fe" },
  { keys: ["coin98"], wallet: ["coin98"], letter: "C", color: "#d9b432" },
  { keys: ["enkrypt"], wallet: ["enkrypt"], letter: "E", color: "#7b3fe4" },
  { keys: ["keplr"], files: ["/wallets/keplr.png"], wallet: ["keplr"], variant: "branded", strip: true, letter: "K", color: "#3b82f6" },
  { keys: ["backpack"], wallet: ["backpack"], letter: "B", color: "#e33e3f" },
  { keys: ["browser wallet", "injected"], glyph: true, letter: "B", color: "#1978f5" },
];

const findRule = (name = ""): Rule | undefined => {
  const n = name.toLowerCase().trim();
  return RULES.find((r) => r.exact?.includes(n) || r.keys.some((k) => n.includes(k)));
};

/* ---------- which wallet is behind a browser (injected) connection ---------- */
type AnyProvider = Record<string, unknown> | undefined | null;
export function detectInjectedName(p: AnyProvider): string | null {
  if (!p) return null;
  const f = (k: string) => !!p[k];
  if (f("isBraveWallet")) return "Brave Wallet"; // Brave also says "isMetaMask", so it is checked first
  if (f("isRabby")) return "Rabby";
  if (f("isOkxWallet") || f("isOKExWallet")) return "OKX Wallet";
  if (f("isBitget") || f("isBitKeep") || f("isBitgetWallet")) return "Bitget Wallet";
  if (f("isTrust") || f("isTrustWallet")) return "Trust Wallet";
  if (f("isCoinbaseWallet") || f("isCoinbaseBrowser")) return "Coinbase Wallet";
  if (f("isPhantom")) return "Phantom";
  if (f("isSafePal") || f("isSafePalWallet")) return "SafePal";
  if (f("isCtrl") || f("isXDEFI") || f("isXDEFIWallet")) return "Ctrl Wallet";
  if (f("isTalisman")) return "Talisman";
  if (f("isUniswapWallet")) return "Uniswap Wallet";
  if (f("isMathWallet")) return "MathWallet";
  if (f("isTokenPocket")) return "TokenPocket";
  if (f("isZerion")) return "Zerion";
  if (f("isRainbow")) return "Rainbow";
  if (f("isExodus")) return "Exodus";
  if (f("isBinance") || f("isBinanceWallet")) return "Binance Wallet";
  if (f("isGate") || f("isGateWallet")) return "Gate Wallet";
  if (f("isMetaMask")) return "MetaMask"; // many wallets copy this flag, so it is checked last
  return null;
}

/* wallet-specific names on `window`; if the connection is the very same object, that wallet is the one connected */
const WALLET_GLOBALS: { path: string[]; name: string }[] = [
  { path: ["okxwallet"], name: "OKX Wallet" },
  { path: ["okxwallet", "ethereum"], name: "OKX Wallet" },
  { path: ["phantom", "ethereum"], name: "Phantom" },
  { path: ["trustwallet"], name: "Trust Wallet" },
  { path: ["rabby"], name: "Rabby" },
  { path: ["bitkeep", "ethereum"], name: "Bitget Wallet" },
  { path: ["bitget", "ethereum"], name: "Bitget Wallet" },
  { path: ["coinbaseWalletExtension"], name: "Coinbase Wallet" },
  { path: ["binancew3w", "ethereum"], name: "Binance Wallet" },
  { path: ["xfi", "ethereum"], name: "Ctrl Wallet" },
  { path: ["braveEthereum"], name: "Brave Wallet" },
  { path: ["talismanEth"], name: "Talisman" },
  { path: ["safepalProvider"], name: "SafePal" },
  { path: ["tokenpocket", "ethereum"], name: "TokenPocket" },
];
function nameFromGlobals(p: unknown): string | null {
  if (typeof window === "undefined" || !p) return null;
  for (const g of WALLET_GLOBALS) {
    let v: unknown = window;
    for (const k of g.path) v = (v as Record<string, unknown> | undefined)?.[k];
    if (v && v === p) return g.name;
  }
  return null;
}

/** The real name and logo of the connected wallet.
    A wallet picked from its own row already has its exact name and logo. For the generic "Browser Wallet" connection it looks for the wallet that owns the connection:
    1. the installed wallet whose connection is the very same object, 2. a wallet-specific name on `window`, 3. the small flags the wallet sets about itself.
    For WalletConnect it uses the name the mobile wallet gave. */
export function useWalletIdentity(connector: Connector | undefined): { name: string; icon?: string } {
  const connectors = useConnectors();
  const connectorsRef = useRef(connectors);
  connectorsRef.current = connectors;
  const [info, setInfo] = useState<{ name: string; icon?: string }>({ name: connector?.name || "Wallet", icon: connector?.icon });

  useEffect(() => {
    let live = true;
    if (!connector) {
      setInfo({ name: "Wallet" });
      return;
    }
    setInfo({ name: connector.name || "Wallet", icon: connector.icon });
    const generic = connector.id === "injected" || /^injected$/i.test(connector.name || "");
    const wc = /walletconnect/i.test(connector.id || "") || /walletconnect/i.test(connector.name || "");
    if (!generic && !wc) return;
    (async () => {
      try {
        const p = (await connector.getProvider()) as AnyProvider & { session?: { peer?: { metadata?: { name?: string; icons?: string[] } } } };
        if (!live) return;
        if (wc) {
          const meta = p?.session?.peer?.metadata;
          if (meta?.name) setInfo({ name: meta.name, icon: meta.icons?.[0] });
          return;
        }
        // 1. an installed wallet that announced this very connection
        for (const c of connectorsRef.current) {
          if (c.type !== "injected" || c.id === "injected") continue;
          try {
            if ((await c.getProvider()) === p) {
              if (live) setInfo({ name: c.name, icon: c.icon });
              return;
            }
          } catch {
            /* try the next one */
          }
        }
        // 2. a wallet-specific name on window, then 3. the wallet's own flags
        const name = nameFromGlobals(p) ?? detectInjectedName(p) ?? "Browser Wallet";
        if (live) setInfo({ name, icon: connector.icon });
      } catch {
        /* keep the name wagmi gave */
      }
    })();
    return () => {
      live = false;
    };
  }, [connector, connectors.length]);

  return info;
}

/* ---------- the logo ---------- */
type IconComp = ComponentType<Record<string, unknown>>;
type IconModule = { WalletIcon: IconComp; ExchangeIcon: IconComp };
let iconsPromise: Promise<IconModule | null> | null = null;
const loadIcons = () => {
  if (!iconsPromise) iconsPromise = import("@web3icons/react/dynamic").then((m) => m as unknown as IconModule).catch(() => null);
  return iconsPromise;
};

/** Hides a background tile: the first shape of the logo, if it covers (almost) the whole drawing and other shapes remain on top of it.
    If the tile and the logo are one single shape there is nothing to separate, and the logo is left as it is. */
function stripBackground(svg: SVGSVGElement) {
  try {
    const vb = svg.viewBox?.baseVal;
    const W = vb && vb.width ? vb.width : 24;
    const H = vb && vb.height ? vb.height : 24;
    const shapes = Array.from(svg.querySelectorAll("rect, circle, ellipse, path, polygon")).filter(
      (el) => !el.closest("defs, clipPath, mask, linearGradient, radialGradient, pattern")
    ) as SVGGraphicsElement[];
    const first = shapes[0];
    if (!first || shapes.length < 2) return;
    const b = first.getBBox();
    if (b.width >= W * 0.88 && b.height >= H * 0.88) first.style.display = "none";
  } catch {
    /* leave the logo as it is */
  }
}

const WalletGlyph = ({ size }: { size: number }) => (
  <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 7a2 2 0 0 1 2-2h13v4M3 7v10a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2ZM16.5 14h.01" />
  </svg>
);

function WalletLogoInner({ name, icon, size = 32, className = "", plain = false }: { name: string; icon?: string; size?: number; className?: string; plain?: boolean }) {
  const rule = useMemo(() => findRule(name), [name]);
  const imgs = useMemo(() => [...(rule?.files ?? []), icon].filter((x): x is string => !!x), [rule, icon]);
  const webKind: "wallet" | "exchange" = rule?.exchange ? "exchange" : "wallet";
  const webNames = useMemo(() => rule?.exchange ?? rule?.wallet ?? [name.toLowerCase()], [rule, name]);

  const [imgIdx, setImgIdx] = useState(0);
  const [mod, setMod] = useState<IconModule | null>(null);
  const [webIdx, setWebIdx] = useState(0);
  const [hasSvg, setHasSvg] = useState(false);
  const holder = useRef<HTMLSpanElement>(null);

  const useImg = imgIdx < imgs.length;
  const webLeft = !!mod && webIdx < webNames.length;

  useEffect(() => {
    setImgIdx(0);
    setWebIdx(0);
  }, [imgs, webNames]);

  useEffect(() => {
    if (useImg) return;
    let live = true;
    loadIcons().then((m) => {
      if (live && m) setMod(m);
    });
    return () => {
      live = false;
    };
  }, [useImg]);

  /* if a logo name is not in the package nothing is drawn; then the next name is tried */
  useEffect(() => {
    const el = holder.current;
    if (!mod || useImg || !el) return;
    const check = () => {
      const svg = el.querySelector("svg");
      if (svg && rule?.strip && !svg.getAttribute("data-stripped")) {
        svg.setAttribute("data-stripped", "1");
        stripBackground(svg as unknown as SVGSVGElement);
      }
      setHasSvg(!!svg);
    };
    check();
    const mo = new MutationObserver(check);
    mo.observe(el, { childList: true, subtree: true });
    const t = setTimeout(() => {
      if (!el.querySelector("svg")) setWebIdx((i) => i + 1);
    }, 700);
    return () => {
      mo.disconnect();
      clearTimeout(t);
    };
  }, [mod, webIdx, useImg, rule]);

  const box = `relative inline-flex shrink-0 items-center justify-center overflow-hidden ${plain ? "rounded-[18%]" : "rounded-lg"} ${className}`;
  if (useImg) {
    return (
      <span className={box} style={{ width: size, height: size }} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={imgs[imgIdx]} src={imgs[imgIdx]} alt="" onError={() => setImgIdx((i) => i + 1)} className="h-full w-full object-contain" />
      </span>
    );
  }
  const Comp = mod ? (webKind === "exchange" ? mod.ExchangeIcon : mod.WalletIcon) : null;
  return (
    <span className={box} style={{ width: size, height: size, background: hasSvg ? "transparent" : rule?.glyph ? "rgba(255,255,255,0.08)" : rule?.color ?? "#1978f5", color: "rgba(255,255,255,0.7)" }} aria-hidden>
      {!hasSvg && (rule?.glyph ? <WalletGlyph size={size} /> : <span className="font-bold text-white" style={{ fontSize: size * 0.45 }}>{(rule?.letter ?? name[0] ?? "W").toUpperCase()}</span>)}
      {Comp && webLeft && (
        <span ref={holder} key={webNames[webIdx]} className="absolute inset-0 flex items-center justify-center [&>svg]:h-full [&>svg]:w-full" style={{ opacity: hasSvg ? 1 : 0, color: rule?.color }}>
          <Comp name={webNames[webIdx]} variant={rule?.variant ?? "mono"} size={size} />
        </span>
      )}
    </span>
  );
}

/* ---------------------------------------------------------------------
   THE BROWSER WALLET ICON
   Four wallet logos (colored icon only), each in its own small box, in a 2x2 grid.
   To change which wallets are shown, edit the four names below.
   --------------------------------------------------------------------- */
const BROWSER_WALLET_LOGOS = ["MetaMask", "Brave Wallet", "Rabby", "Phantom"];

export function BrowserWalletLogo({ size = 32, className = "" }: { size?: number; className?: string }) {
  const gap = Math.max(2, Math.round(size * 0.06)); // the same space between the boxes sideways and up and down
  const tile = (size - gap) / 2; // four boxes of the same size
  return (
    <span
      className={`grid shrink-0 ${className}`}
      style={{ width: size, height: size, gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", columnGap: gap, rowGap: gap }}
      aria-hidden
    >
      {BROWSER_WALLET_LOGOS.map((n) => (
        <span key={n} className="flex h-full w-full items-center justify-center rounded-[28%] border border-white/[0.1] bg-[#1b1e25]">
          <WalletLogoInner name={n} size={Math.round(tile * 0.64)} plain />
        </span>
      ))}
    </span>
  );
}

/** A wallet's logo. A "Browser Wallet" gets the four-logo icon above. */
export function WalletLogo(props: { name: string; icon?: string; size?: number; className?: string }) {
  const n = (props.name || "").toLowerCase().trim();
  if (n === "browser wallet" || n === "injected") return <BrowserWalletLogo size={props.size} className={props.className} />;
  return <WalletLogoInner {...props} />;
}
