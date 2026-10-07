"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";
import { Manrope } from "next/font/google";
import WalletModal from "@/components/WalletModal";

const manrope = Manrope({
  subsets: ["latin"],
  weight: "600",
});

// icons are used in the mobile menu
const navItems = [
  { href: "/", label: "Home", icon: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" },
  { href: "/send", label: "Send", icon: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" },
  { href: "/swap", label: "Swap", icon: "M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4" },
  { href: "/bridge", label: "Bridge", icon: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" },
  { href: "/activity", label: "Activity", icon: "M12 7v5l3 2M3 12a9 9 0 1 0 3-6.7M3 4v4h4" },
];

const connectButton =
  "bg-gradient-to-r from-[#13b8ff] via-[#1688f5] to-[#263be8] text-white shadow-[0_8px_30px_rgba(19,145,255,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_12px_38px_rgba(19,145,255,0.32)] active:translate-y-0";

type HeaderProps = {
  onMenuClick?: () => void;
};

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

  const connectedWallet = React.useMemo(() => {
    if (!connector) {
      return { name: "Browser Wallet", logo: "/wallets/browser.svg" };
    }

    const name = connector.name?.toLowerCase() || "";
    const id = connector.id?.toLowerCase() || "";

    if (name.includes("brave") || id.includes("brave")) {
      return { name: "Brave Wallet", logo: "/wallets/brave.svg" };
    }
    if (name.includes("rabby") || id.includes("rabby")) {
      return { name: "Rabby", logo: "/wallets/rabby.svg" };
    }
    if (name.includes("okx") || name.includes("okex") || id.includes("okx")) {
      return { name: "OKX Wallet", logo: "/wallets/okx.svg" };
    }
    if (name.includes("metamask") || id.includes("metamask") || id === "io.metamask") {
      return { name: "MetaMask", logo: "/wallets/metamask.svg" };
    }
    if (name.includes("coinbase") || name.includes("base") || id.includes("coinbase")) {
      return { name: "Coinbase Wallet", logo: "/wallets/base.svg" };
    }
    if (name.includes("walletconnect") || id.includes("walletconnect")) {
      return { name: "WalletConnect", logo: "/wallets/walletconnect.svg" };
    }
    if (connector.icon) {
      return { name: connector.name || "Browser Wallet", logo: connector.icon };
    }

    return { name: connector.name || "Browser Wallet", logo: "/wallets/browser.svg" };
  }, [connector]);

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

        window.dispatchEvent(new CustomEvent("mobile-menu-state", { detail: false }));
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
    setMobileMenuOpen((current) => {
      const next = !current;
      window.dispatchEvent(new CustomEvent("mobile-menu-state", { detail: next }));
      return next;
    });

    onMenuClick?.();
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    window.dispatchEvent(new CustomEvent("mobile-menu-state", { detail: false }));
  };

  const isActive = (href: string) => {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  };

  return (
    <>
      {/* No background, no border: only the logo, site name, sections and the wallet button show. */}
      <header className="relative z-50">
        {/* MOBILE HEADER */}

        <div className="md:hidden">
          <div className="relative z-50 flex min-h-[68px] items-center justify-between gap-2 px-4 sm:min-h-[74px] sm:px-6">
            {/* LEFT */}

            <button
              onClick={handleMenuToggle}
              className={`flex h-10 w-10 shrink-0 items-center justify-center text-2xl font-bold transition-all duration-200 ${
                mobileMenuOpen ? "text-[#39c4ff]" : "text-white/70 hover:text-white"
              }`}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              <span className={`transition-transform duration-200 ${mobileMenuOpen ? "rotate-90" : "rotate-0"}`}>
                ☰
              </span>
            </button>

            {/* CENTER LOGO */}

            <Link href="/" onClick={closeMobileMenu} className="flex min-w-0 items-center gap-2">
              <img src="/alabaamafi-logo.png" alt="AlabaamaFi" className="h-7 w-7 shrink-0 object-contain" />

              <div className="min-w-0">
                <h1 className="truncate text-sm font-bold leading-tight tracking-tight text-white sm:text-base">
                  Alabaama<span className="text-[#159fff]">Fi</span>
                </h1>
              </div>
            </Link>

            {/* RIGHT WALLET */}

            <button
              onClick={handleWalletClick}
              className={`${manrope.className} flex h-10 max-w-[108px] shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold tracking-normal sm:max-w-none sm:px-4 sm:text-sm ${connectButton}`}
            >
              <span className="truncate">{isConnected ? mobileShortAddress : "Connect"}</span>

              {isConnected && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="shrink-0 text-white/70">
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>

          {/* MOBILE BACKDROP */}

          <div
            className={`fixed inset-x-0 bottom-0 top-[69px] z-40 bg-black/60 transition-all duration-300 sm:top-[75px] ${
              mobileMenuOpen ? "visible opacity-100" : "invisible opacity-0"
            }`}
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          {/* MOBILE MENU: same space-blue look as the website */}

          <div
            className={`absolute left-0 right-0 top-full z-[60] overflow-hidden border-b border-white/[0.08] bg-[linear-gradient(180deg,#041029_0%,#020817_55%,#010205_100%)] shadow-[0_25px_60px_rgba(0,0,0,0.65)] transition-all duration-300 ease-out ${
              mobileMenuOpen ? "visible max-h-[640px] translate-y-0 opacity-100" : "invisible max-h-0 -translate-y-2 opacity-0"
            }`}
          >
            {/* soft blue glow, like the hero */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(22,115,255,0.28),transparent_68%)]"
            />

            <div className="relative px-3 pb-5 pt-3 sm:px-5">
              <nav className="grid gap-1">
                {navItems.map((item) => {
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobileMenu}
                      className="group flex items-center gap-4 rounded-2xl px-3 py-3.5 transition-colors duration-200 hover:bg-white/[0.04]"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center transition-all duration-200 ${
                          active ? "text-[#39c4ff]" : "text-white/45 group-hover:text-white/80"
                        }`}
                        style={active ? { filter: "drop-shadow(0 0 6px rgba(57,196,255,0.95)) drop-shadow(0 0 16px rgba(22,136,245,0.7))" } : undefined}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d={item.icon} />
                        </svg>
                      </span>

                      <span className={`text-base font-semibold tracking-tight ${active ? "text-white" : "text-white/70 group-hover:text-white"}`}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* DESKTOP HEADER */}

        <div className="hidden md:block">
          <div className="flex min-h-[86px] items-center gap-6 px-7 lg:px-10 xl:px-12">
            {/* LOGO */}

            <Link href="/" className="flex shrink-0 items-center gap-3">
              <img src="/alabaamafi-logo.png" alt="AlabaamaFi" className="h-10 w-10 shrink-0 object-contain lg:h-14 lg:w-14" />

              <div className="text-left">
                <h1 className="text-[25px] font-bold leading-none tracking-[-0.035em] lg:text-[29px]">
                  Alabaama<span className="text-[#159fff]">Fi</span>
                </h1>
              </div>
            </Link>

            {/* NAVIGATION */}

            <nav className="ml-auto flex min-w-0 items-center justify-center gap-1 lg:gap-2">
              {navItems.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 lg:px-4 ${
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

            {/* WALLET */}

            <div className="ml-auto shrink-0">
              <button
                onClick={handleWalletClick}
                className={`${manrope.className} flex min-h-[48px] items-center gap-2.5 rounded-full px-5 text-sm font-semibold tracking-normal ${connectButton} lg:px-6`}
              >
                <span>{isConnected ? shortAddress : "Connect Wallet"}</span>

                {isConnected && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-white/70">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CONNECT WALLET MODAL */}

      <WalletModal isOpen={showWallets} onClose={() => setShowWallets(false)} />

      {/* CONNECTED WALLET MENU */}

      {showWalletMenu && isConnected && address && (
        <>
          <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-md" onClick={handleCloseWalletMenu} aria-hidden="true" />

          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div
              className="w-full max-w-sm rounded-3xl border border-white/[0.10] bg-[#080a0d]/[0.98] p-4 shadow-[0_25px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:p-5"
              onClick={(event) => event.stopPropagation()}
            >
              {/* WALLET HEADER */}

              <div className="mb-4 flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.06] p-2">
                    <img src={connectedWallet.logo} alt={`${connectedWallet.name} logo`} className="h-full w-full object-contain" />
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

              {/* WALLET ADDRESS */}

              <div className="mb-3 flex min-h-[48px] items-center justify-center rounded-2xl border border-white/[0.07] bg-black/30 px-4">
                <span className="truncate text-center text-sm font-bold tracking-tight text-white/80" title={address}>
                  {menuAddress}
                </span>
              </div>

              {/* COPY + DISCONNECT */}

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
