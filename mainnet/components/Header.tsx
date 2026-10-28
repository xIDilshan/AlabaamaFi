g"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";
import { Inter, Manrope } from "next/font/google";
import WalletModal from "@/components/WalletModal";
import { WalletLogo, WalletLogoWarmup, useWalletIdentity } from "@/components/WalletLogo";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const navItems = [
  { href: "/", label: "Home", icon: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" },
  { href: "/send", label: "Send", icon: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" },
  { href: "/swap", label: "Swap", icon: "M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4" },
  { href: "/bridge", label: "Bridge", icon: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" },
  { href: "/activity", label: "Activity", icon: "M12 7v5l3 2M3 12a9 9 0 1 0 3-6.7M3 4v4h4" },
];

const DOCS_URL = "https://docs.alabaamafi.xyz";
const SITE_URL = "https://alabaamafi.xyz";
const APP_URL = "https://app.alabaamafi.xyz";
const APP_PAGES = ["/send", "/swap", "/bridge", "/activity", "/faq"];
const LAUNCH_URL = `${APP_URL}/swap`;
const moreLinks = [
  { href: DOCS_URL, label: "Docs", icon: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" },
  { href: "/faq", label: "FAQ", icon: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" },
];
const X_URL = "https://x.com/Alabaama_Fi";
const DISCORD_URL = "https://discord.gg/NBKHmUfw";
const GITHUB_URL = "https://github.com/xIDilshan/AlabaamaFi";

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

const DOCS_FAQ_TEXT_PX = 13;
const DOCS_FAQ_ICON_PX = 13;
const DOCS_FAQ_TEXT_SHIFT_PX = 0;
const DOCS_FAQ_ICON_SHIFT_PX = 0;
const CONNECT_TEXT_PX = 14;

const socials = [
  { href: X_URL, label: "AlabaamaFi on X", logo: <XLogo size={16} /> },
  { href: DISCORD_URL, label: "AlabaamaFi on Discord", logo: <DiscordLogo size={19} /> },
  { href: GITHUB_URL, label: "AlabaamaFi on GitHub", logo: <GitHubLogo size={19} /> },
];

const connectButton =
  "bg-gradient-to-r from-[#13b8ff] via-[#1688f5] to-[#263be8] text-white shadow-[0_8px_30px_rgba(19,145,255,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_12px_38px_rgba(19,145,255,0.32)] active:translate-y-0";

type HeaderProps = {
  onMenuClick?: () => void;
};

const WalletIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 7a2 2 0 0 1 2-2h13v4M3 7v10a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2ZM16.5 14h.01" />
  </svg>
);

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();

  const { address, isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();

  const [showWallets, setShowWallets] = React.useState(false);
  const [showWalletMenu, setShowWalletMenu] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
  const mobileShortAddress = address ? `${address.slice(0, 4)}...${address.slice(-3)}` : "";
  const menuAddress = address ? `${address.slice(0, 10)}...${address.slice(-8)}` : "";

  const connectedWallet = useWalletIdentity(connector);

  const [where, setWhere] = React.useState<"pending" | "site" | "app" | "other">("pending");

  React.useEffect(() => {
    const host = window.location.hostname;
    setWhere(host === "alabaamafi.xyz" || host === "www.alabaamafi.xyz" ? "site" : host === "app.alabaamafi.xyz" ? "app" : "other");
  }, []);

  const to = (path: string) => {
    if (where === "site" && APP_PAGES.includes(path)) return `${APP_URL}${path}`;
    if (where === "app" && path === "/") return SITE_URL;
    return path;
  };

  React.useEffect(() => {
    const openWalletModal = () => {
      if (!isConnected) {
        setShowWallets(true);
      }
    };

    window.addEventListener("open-wallet-modal", openWalletModal);
    return () => window.removeEventListener("open-wallet-modal", openWalletModal);
  }, [isConnected]);

  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        setShowWalletMenu(false);
        setCopied(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const handleWalletClick = () => {
    if (isConnected) {
      setShowWalletMenu(true);
      return;
    }
    setShowWallets(true);
  };

  const handleCopyAddress = async () => {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setShowWalletMenu(false);
    setCopied(false);
  };

  const handleCloseWalletMenu = () => {
    setShowWalletMenu(false);
    setCopied(false);
  };

  const handleMenuToggle = () => {
    setMobileMenuOpen((current) => !current);
    onMenuClick?.();
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const [dragY, setDragY] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const dragStart = React.useRef<number | null>(null);

  const onHandleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStart.current = e.clientY;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onHandleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;
    setDragY(Math.min(0, e.clientY - dragStart.current));
  };

  const onHandleUp = () => {
    if (dragStart.current === null) return;
    const moved = dragY;
    dragStart.current = null;
    setDragging(false);
    setDragY(0);
    if (moved < -60 || Math.abs(moved) < 6) closeMobileMenu();
  };

  const isActive = (href: string) => {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  };

  return (
    <>
      <header className={`${inter.className} relative z-50`}>
        {/* MOBILE HEADER */}

        <div className="md:hidden">
          <div className="relative z-50 flex min-h-[68px] items-center justify-between gap-2 px-4 sm:min-h-[74px] sm:px-6">

            <div className="flex min-w-0 items-center gap-1">
              <Link href={to("/")} onClick={closeMobileMenu} aria-label="AlabaamaFi home" className="flex h-12 w-9 shrink-0 items-center justify-center">
                <img src="/alabaamafi-logo.svg" alt="AlabaamaFi" className="h-9 w-9 shrink-0 object-contain" />
              </Link>

              <button
                onClick={handleMenuToggle}
                className="flex h-12 w-12 shrink-0 items-center justify-center text-white/80 hover:text-white"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>
            </div>

            {where === "site" ? (
              <a href={LAUNCH_URL} className={`${manrope.className} flex h-9 shrink-0 items-center justify-center rounded-full px-3.5 font-semibold leading-none tracking-normal ${connectButton}`}>
                <span style={{ fontSize: "12px", zoom: CONNECT_TEXT_PX / 12 }}>Launch app</span>
              </a>
            ) : (
              <button
                onClick={handleWalletClick}
                className={`${manrope.className} flex h-9 max-w-[100px] shrink-0 items-center justify-center gap-1 rounded-full px-2.5 text-[9px] font-semibold leading-none tracking-normal sm:max-w-none sm:px-3.5 sm:text-[10px] ${connectButton} ${where === "pending" ? "invisible" : ""}`}
              >
                <span className="truncate" style={{ fontSize: "12px", zoom: CONNECT_TEXT_PX / 12 }}>{isConnected ? mobileShortAddress : "Connect"}</span>

                {isConnected && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="shrink-0 text-white/70">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            )}
          </div>

          <div
            className={`fixed inset-0 z-[70] bg-black/65 transition-opacity duration-300 ${
              mobileMenuOpen ? "visible opacity-100" : "invisible opacity-0"
            }`}
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          {/* MOBILE MENU */}

          <div
            className="fixed left-0 right-0 top-0 z-[80] overflow-hidden rounded-b-[28px] border-x border-b border-white/[0.1] bg-[#080a0d] shadow-[0_25px_80px_rgba(0,0,0,0.65)]"
            style={{
              transform: mobileMenuOpen ? `translateY(${dragY}px)` : "translateY(-105%)",
              visibility: mobileMenuOpen ? "visible" : "hidden",
              transition: dragging
                ? "none"
                : mobileMenuOpen
                ? "transform .45s cubic-bezier(.32,.72,0,1), visibility 0s"
                : "transform .4s cubic-bezier(.32,.72,0,1), visibility 0s linear .4s",
            }}
          >
            <div className="flex min-h-[68px] items-center justify-between gap-2 px-4 sm:min-h-[74px] sm:px-6">
              <Link href={to("/")} onClick={closeMobileMenu} className="flex min-w-0 items-center gap-2">
                <img src="/alabaamafi-logo.svg" alt="AlabaamaFi" className="h-8 w-8 shrink-0 object-contain" />
                <span className="truncate text-sm font-bold leading-tight tracking-tight text-white sm:text-base">
                  Alabaama<span className="text-[#159fff]">Fi</span>
                </span>
              </Link>

              {where === "site" ? (
                <a href={LAUNCH_URL} onClick={closeMobileMenu} className={`${manrope.className} flex h-9 shrink-0 items-center justify-center rounded-full px-3.5 font-semibold leading-none tracking-normal ${connectButton}`}>
                  <span style={{ fontSize: "12px", zoom: CONNECT_TEXT_PX / 12 }}>Launch app</span>
                </a>
              ) : (
                <button
                  onClick={() => {
                    closeMobileMenu();
                    handleWalletClick();
                  }}
                  className={`${manrope.className} flex h-9 max-w-[100px] shrink-0 items-center justify-center gap-1 rounded-full px-2.5 text-[9px] font-semibold leading-none tracking-normal sm:max-w-none sm:px-3.5 sm:text-[10px] ${connectButton} ${where === "pending" ? "invisible" : ""}`}
                >
                  <span className="truncate" style={{ fontSize: "12px", zoom: CONNECT_TEXT_PX / 12 }}>{isConnected ? mobileShortAddress : "Connect"}</span>

                  {isConnected && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="shrink-0 text-white/70">
                      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              )}
            </div>

            <p className="px-6 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30 sm:px-8">Menu</p>
            <nav className="grid gap-0.5 px-3 pb-3 sm:px-5">
              {navItems.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={to(item.href)}
                    onClick={closeMobileMenu}
                    className={`group flex items-center gap-3.5 rounded-2xl px-3 py-2.5 transition-colors duration-200 ${
                      active ? "" : "hover:bg-white/[0.04]"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center transition-[color,transform] duration-200 ${
                        active ? "translate-x-2 text-[#39c4ff]" : "text-white/45 group-hover:text-white/80"
                      }`}
                      style={active ? { filter: "drop-shadow(0 0 6px rgba(57,196,255,0.95)) drop-shadow(0 0 14px rgba(22,136,245,0.7))" } : undefined}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d={item.icon} />
                      </svg>
                    </span>

                    <span className={`text-sm font-semibold tracking-tight transition-transform duration-200 ${active ? "translate-x-2 text-white" : "text-white/70 group-hover:text-white"}`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-2 border-t border-white/[0.06] px-4 pb-1 pt-4 sm:px-6">
              {moreLinks.map((l) => {
                const active = isActive(l.href);
                return (
                  <Link
                    key={l.href}
                    href={to(l.href)}
                    onClick={closeMobileMenu}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-semibold transition ${
                      active ? "border-[#2f8bff]/50 bg-[#159fff]/[0.12] text-white" : "border-white/10 bg-white/[0.045] text-white/75 hover:border-[#2f8bff]/40 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    <svg width={DOCS_FAQ_ICON_PX} height={DOCS_FAQ_ICON_PX} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block", flexShrink: 0, transform: `translateY(${DOCS_FAQ_ICON_SHIFT_PX}px)` }}>
                      <path d={l.icon} />
                    </svg>
                    <span style={{ display: "block", fontSize: "12px", lineHeight: 1, zoom: DOCS_FAQ_TEXT_PX / 12, transform: `translateY(${DOCS_FAQ_TEXT_SHIFT_PX}px)` }}>{l.label}</span>
                  </Link>
                );
              })}

              <div className="ml-auto flex items-center">
                {socials.map((so) => (
                  <a
                    key={so.href}
                    href={so.href}
                    target="_blank"
                    rel="noreferrer"
                    onClick={closeMobileMenu}
                    aria-label={so.label}
                    title={so.label}
                    className="flex h-8 w-8 items-center justify-center text-white/60 transition hover:text-white"
                  >
                    {so.logo}
                  </a>
                ))}
              </div>
            </div>

            <div
              className="flex cursor-grab touch-none select-none justify-center pb-4 pt-3 active:cursor-grabbing"
              onPointerDown={onHandleDown}
              onPointerMove={onHandleMove}
              onPointerUp={onHandleUp}
              onPointerCancel={onHandleUp}
              role="button"
              aria-label="Swipe up to close the menu"
            >
              <span className="h-1.5 w-12 rounded-full bg-white/25" />
            </div>
          </div>
        </div>

        {/* DESKTOP HEADER */}

        <div className="hidden md:block">
          <div className="flex min-h-[86px] items-center gap-6 px-7 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-10 xl:px-12">

            <Link href={to("/")} className="flex shrink-0 items-center gap-3 lg:justify-self-start">
              <img src="/alabaamafi-logo.svg" alt="AlabaamaFi" className="h-10 w-10 shrink-0 object-contain lg:h-14 lg:w-14" />

              <div className="text-left">
                <h1 className="text-[25px] font-bold leading-none tracking-[-0.035em] lg:text-[29px]">
                  Alabaama<span className="text-[#159fff]">Fi</span>
                </h1>
              </div>
            </Link>

            <nav className="ml-auto flex min-w-0 items-center justify-center gap-1 lg:ml-0 lg:gap-2">
              {navItems.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={to(item.href)}
                    style={{ fontWeight: 700 }}
                    className={`${manrope.className} relative rounded-xl px-3.5 py-3 text-sm font-bold transition-all duration-200 lg:px-4 ${
                      active ? "text-[#159fff]" : "text-white/55 hover:text-white"
                    }`}
                  >
                    {item.label}

                    {active && (
                      <span className="absolute bottom-0 left-1/2 h-[2px] w-7 -translate-x-1/2 rounded-full bg-[#159fff] shadow-[0_0_10px_rgba(21,159,255,0.8)]" />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto shrink-0 lg:ml-0 lg:justify-self-end">
              {where === "site" ? (
                <a href={LAUNCH_URL} className={`${manrope.className} flex min-h-[48px] items-center gap-2.5 rounded-full px-5 text-sm font-semibold tracking-normal ${connectButton} lg:px-6`}>
                  <span>Launch app</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </a>
              ) : (
                <button
                  onClick={handleWalletClick}
                  className={`${manrope.className} flex min-h-[48px] items-center gap-2.5 rounded-full px-5 text-sm font-semibold tracking-normal ${connectButton} ${where === "pending" ? "invisible" : ""} lg:px-6`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                    {isConnected && !/^(browser wallet|injected|wallet)$/i.test(connectedWallet.name) ? (
                      <WalletLogo name={connectedWallet.name} icon={connectedWallet.icon} size={24} />
                    ) : (
                      <WalletIcon />
                    )}
                  </span>

                  <span>{isConnected ? shortAddress : "Connect Wallet"}</span>

                  {isConnected && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-white/70">
                      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* CONNECT WALLET MODAL */}

      <WalletModal isOpen={showWallets} onClose={() => setShowWallets(false)} />

      <WalletLogoWarmup />

      {/* CONNECTED WALLET MENU */}

      {showWalletMenu && isConnected && address && (
        <>
          <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-md" onClick={handleCloseWalletMenu} aria-hidden="true" />

          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div
              className="w-full max-w-sm rounded-3xl border border-white/[0.10] bg-[#080a0d]/[0.98] p-4 shadow-[0_25px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:p-5"
              onClick={(event) => event.stopPropagation()}
            >

              <div className="mb-4 flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.06] p-2">
                    <WalletLogo name={connectedWallet.name} icon={connectedWallet.icon} size={26} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{connectedWallet.name}</p>

                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      <p className="text-[11px] font-medium text-white/35">Connected</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCloseWalletMenu}
                  className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.04] text-base text-white/45 transition hover:bg-white/[0.08] hover:text-white"
                  aria-label="Close wallet menu"
                >
                  ×
                </button>
              </div>

              <div className="mb-3 flex min-h-[48px] items-center justify-center rounded-2xl border border-white/[0.07] bg-black/30 px-4">
                <span className="truncate text-center text-sm font-bold tracking-tight text-white/80" title={address}>
                  {menuAddress}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopyAddress}
                  className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-3 text-sm font-bold text-white/75 transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white active:scale-[0.98]"
                >
                  {copied ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="shrink-0">
                      <path d="M5 12.5L9.5 17L19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="shrink-0">
                      <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M15 9V7C15 5.9 14.1 5 13 5H7C5.9 5 5 5.9 5 7V13C5 14.1 5.9 15 7 15H9" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  )}

                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>

                <button
                  onClick={handleDisconnect}
                  className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-red-500/[0.12] bg-red-500/[0.045] px-3 text-sm font-bold text-red-400 transition-all duration-200 hover:border-red-500/[0.22] hover:bg-red-500/[0.08] active:scale-[0.98]"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="shrink-0">
                    <path d="M10 5H6C4.9 5 4 5.9 4 7V17C4 18.1 4.9 19 6 19H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M14 8L18 12L14 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 12H18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>

                  <span>Disconnect</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
