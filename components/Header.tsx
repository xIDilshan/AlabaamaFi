"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";
import WalletModal from "@/components/WalletModal";

const navItems = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/send", label: "Send", icon: "↗" },
  { href: "/swap", label: "Swap", icon: "⇄" },
  { href: "/bridge", label: "Bridge", icon: "⇅" },
  { href: "/activity", label: "Activity", icon: "◷" },
];

type HeaderProps = {
  onMenuClick?: () => void;
};

const connectGlassButton =
  "border border-white/[0.22] bg-gradient-to-br from-white/[0.14] via-white/[0.08] to-white/[0.035] text-white shadow-[0_8px_30px_rgba(255,255,255,0.05),0_10px_35px_rgba(0,0,0,0.32)] backdrop-blur-2xl transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.34] hover:from-white/[0.18] hover:via-white/[0.11] hover:to-white/[0.055] hover:shadow-[0_10px_35px_rgba(255,255,255,0.08),0_18px_45px_rgba(0,0,0,0.42)] active:translate-y-0";

export default function Header({
  onMenuClick,
}: HeaderProps) {
  const pathname = usePathname();

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const [showWallets, setShowWallets] =
    React.useState(false);

  const [showWalletMenu, setShowWalletMenu] =
    React.useState(false);

  const [copied, setCopied] =
    React.useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] =
    React.useState(false);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  React.useEffect(() => {
    const openWalletModal = () => {
      if (!isConnected) {
        setShowWallets(true);
      }
    };

    window.addEventListener(
      "open-wallet-modal",
      openWalletModal
    );

    return () => {
      window.removeEventListener(
        "open-wallet-modal",
        openWalletModal
      );
    };
  }, [isConnected]);

  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        setShowWalletMenu(false);

        window.dispatchEvent(
          new CustomEvent("mobile-menu-state", {
            detail: false,
          })
        );
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
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

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
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

      window.dispatchEvent(
        new CustomEvent("mobile-menu-state", {
          detail: next,
        })
      );

      return next;
    });

    onMenuClick?.();
  };

  const handleNavigation = () => {
    setMobileMenuOpen(false);

    window.dispatchEvent(
      new CustomEvent("mobile-menu-state", {
        detail: false,
      })
    );
  };

  const handleBackdropClick = () => {
    setMobileMenuOpen(false);

    window.dispatchEvent(
      new CustomEvent("mobile-menu-state", {
        detail: false,
      })
    );
  };

  const isActive = (href: string) => {
    return href === "/"
      ? pathname === "/"
      : pathname.startsWith(href);
  };

  return (
    <>
      <header className="relative z-50 border-b border-white/[0.06] bg-[#040506]/95 backdrop-blur-xl">
        {/* MOBILE HEADER */}

        <div className="md:hidden">
          <div className="mx-auto grid min-h-[72px] max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6">
            {/* LEFT */}

            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button
                onClick={handleMenuToggle}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-[#060709] text-lg font-bold text-white/70 transition-all duration-200 ${
                  mobileMenuOpen
                    ? "border-white/[0.18] bg-white/[0.08] text-white"
                    : "border-white/[0.07] hover:border-white/[0.14] hover:bg-[#0a0d12] hover:text-white"
                }`}
                aria-label={
                  mobileMenuOpen
                    ? "Close menu"
                    : "Open menu"
                }
                aria-expanded={mobileMenuOpen}
              >
                <span
                  className={`transition-transform duration-200 ${
                    mobileMenuOpen
                      ? "rotate-90"
                      : "rotate-0"
                  }`}
                >
                  ☰
                </span>
              </button>

              <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-white/[0.07] bg-[#060709] px-3 py-2">
                <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-green-500" />

                <span className="text-[11px] font-bold text-white/70 sm:text-xs">
                  Testnet
                </span>
              </div>
            </div>

            {/* CENTER */}

            <div className="min-w-0 text-center">
              <Link
                href="/"
                onClick={handleNavigation}
              >
                <h1 className="truncate text-sm font-bold sm:text-base">
                  AlabaamaFi
                </h1>

                <p className="mt-0.5 text-[9px] font-semibold text-white/30 sm:text-[10px]">
                  Powered by Arc
                </p>
              </Link>
            </div>

            {/* RIGHT */}

            <div className="flex min-w-0 items-center justify-end">
              <button
                onClick={handleWalletClick}
                className={`flex max-w-[165px] items-center gap-2 truncate rounded-full px-3.5 py-2.5 text-xs !font-black tracking-tight sm:max-w-none sm:px-5 sm:py-3 ${connectGlassButton}`}
              >
                <span className="truncate">
                  {isConnected
                    ? shortAddress
                    : "Connect Wallet"}
                </span>

                {isConnected && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="shrink-0 text-white/55"
                  >
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* MOBILE BACKDROP */}

          <div
            className={`fixed inset-x-0 bottom-0 top-[72px] z-40 bg-black/40 transition-all duration-300 ${
              mobileMenuOpen
                ? "visible opacity-100"
                : "invisible opacity-0"
            }`}
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* MOBILE TOP MENU */}

          <div
            className={`absolute left-0 right-0 top-full z-[60] overflow-hidden border-b border-white/[0.10] bg-[#050608]/[0.98] shadow-[0_20px_45px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-all duration-300 ease-out ${
              mobileMenuOpen
                ? "visible max-h-[520px] translate-y-0 opacity-100"
                : "invisible max-h-0 -translate-y-2 opacity-0"
            }`}
          >
            <div className="mx-auto max-w-[600px] px-4 pb-5 pt-3 sm:px-6">
              <nav className="flex flex-col">
                {navItems.map((item) => {
                  const active = isActive(
                    item.href
                  );

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavigation}
                      className={`my-1 flex min-h-[56px] items-center gap-4 rounded-full border px-5 transition-all duration-200 ${
                        active
                          ? "border-white/[0.13] bg-white/[0.10] text-white"
                          : "border-white/[0.055] bg-white/[0.025] text-white/55 hover:border-white/[0.11] hover:bg-white/[0.06] hover:text-white/90"
                      }`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center text-[20px] font-semibold leading-none">
                        {item.icon}
                      </span>

                      <span className="text-sm font-semibold tracking-tight">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}

                {/* FAUCET */}

                <Link
                  href="/faucet"
                  onClick={handleNavigation}
                  className={`my-1 flex min-h-[56px] items-center gap-4 rounded-full border px-5 transition-all duration-200 ${
                    isActive("/faucet")
                      ? "border-white/[0.13] bg-white/[0.10] text-white"
                      : "border-white/[0.055] bg-white/[0.025] text-white/55 hover:border-white/[0.11] hover:bg-white/[0.06] hover:text-white/90"
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center text-[20px] font-semibold leading-none">
                    <span className="-translate-y-[3px]">
                      ◌
                    </span>
                  </span>

                  <span className="text-sm font-semibold tracking-tight">
                    Faucet
                  </span>
                </Link>
              </nav>
            </div>
          </div>
        </div>

        {/* DESKTOP HEADER */}

        <div className="hidden md:block">
          <div className="mx-auto max-w-[1600px] px-6 lg:px-8">
            {/* TOP ROW */}

            <div className="relative flex min-h-[78px] items-center justify-center">
              {/* NETWORK */}

              <div className="absolute left-0 flex items-center gap-2 rounded-2xl border border-white/[0.07] bg-[#060709] px-3 py-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />

                <span className="text-xs font-bold text-white/70">
                  Testnet
                </span>
              </div>

              {/* LOGO */}

              <Link
                href="/"
                className="text-center"
              >
                <h1 className="text-xl font-bold tracking-tight">
                  AlabaamaFi
                </h1>

                <p className="mt-0.5 text-xs font-semibold text-white/30">
                  Powered by Arc
                </p>
              </Link>

              {/* WALLET */}

              <div className="absolute right-0">
                <button
                  onClick={handleWalletClick}
                  className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm !font-black tracking-tight ${connectGlassButton}`}
                >
                  <span>
                    {isConnected
                      ? shortAddress
                      : "Connect Wallet"}
                  </span>

                  {isConnected && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-white/55"
                    >
                      <path
                        d="M6 9L12 15L18 9"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* FIRST SILVER LINE */}

            <div className="border-t border-white/[0.10]" />

            {/* DESKTOP NAVIGATION */}

            <nav className="flex min-h-[58px] items-center justify-center gap-2">
              {navItems.map((item) => {
                const active = isActive(
                  item.href
                );

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      active
                        ? "bg-white/[0.10] text-white"
                        : "text-white/45 hover:bg-white/[0.05] hover:text-white/85"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <Link
                href="/faucet"
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isActive("/faucet")
                    ? "bg-white/[0.10] text-white"
                    : "text-white/45 hover:bg-white/[0.05] hover:text-white/85"
                }`}
              >
                Faucet
              </Link>
            </nav>

            {/* SECOND SILVER LINE */}

            <div className="border-t border-white/[0.10]" />
          </div>
        </div>
      </header>

      {/* CONNECT WALLET MODAL */}

      <WalletModal
        isOpen={showWallets}
        onClose={() =>
          setShowWallets(false)
        }
      />

      {/* CONNECTED WALLET MENU */}

      {showWalletMenu && isConnected && address && (
        <>
          {/* BACKDROP */}

          <div
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-md"
            onClick={handleCloseWalletMenu}
            aria-hidden="true"
          />

          {/* MODAL */}

          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div
              className="w-full max-w-sm rounded-3xl border border-white/[0.10] bg-[#080a0d]/[0.98] p-5 shadow-[0_25px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:p-6"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              {/* TOP */}

              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.06]">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-white/75"
                    >
                      <path
                        d="M3 7.5C3 6.12 4.12 5 5.5 5H18.5C19.88 5 21 6.12 21 7.5V16.5C21 17.88 19.88 19 18.5 19H5.5C4.12 19 3 17.88 3 16.5V7.5Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                      <path
                        d="M16 12H21"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                      <circle
                        cx="16"
                        cy="12"
                        r="1.2"
                        fill="currentColor"
                      />
                    </svg>
                  </div>

                  <div>
                    <p className="text-base font-bold text-white">
                      Wallet
                    </p>

                    <p className="text-xs font-medium text-white/35">
                      Connected
                    </p>
                  </div>
                </div>

                {/* CLOSE */}

                <button
                  onClick={handleCloseWalletMenu}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.04] text-lg text-white/45 transition hover:bg-white/[0.08] hover:text-white"
                  aria-label="Close wallet menu"
                >
                  ×
                </button>
              </div>

              {/* ADDRESS */}

              <div className="mb-4 rounded-2xl border border-white/[0.07] bg-black/30 p-4">
                <p className="mb-2 text-xs font-semibold text-white/30">
                  Wallet address
                </p>

                <p className="break-all text-sm font-bold leading-6 text-white/80">
                  {address}
                </p>
              </div>

              {/* COPY */}

              <button
                onClick={handleCopyAddress}
                className="flex min-h-[56px] w-full items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 text-left transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.07] active:scale-[0.99]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] text-white/65">
                  {copied ? (
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M5 12.5L9.5 17L19 7.5"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <rect
                        x="9"
                        y="9"
                        width="10"
                        height="10"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M15 9V7C15 5.9 14.1 5 13 5H7C5.9 5 5 5.9 5 7V13C5 14.1 5.9 15 7 15H9"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                    </svg>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-bold text-white/85">
                    {copied
                      ? "Copied"
                      : "Copy address"}
                  </p>

                  <p className="text-xs font-medium text-white/30">
                    {copied
                      ? "Wallet address copied"
                      : "Copy your full wallet address"}
                  </p>
                </div>
              </button>

              {/* DISCONNECT */}

              <button
                onClick={handleDisconnect}
                className="mt-3 flex min-h-[56px] w-full items-center gap-4 rounded-2xl border border-red-500/[0.12] bg-red-500/[0.045] px-4 text-left transition-all duration-200 hover:border-red-500/[0.22] hover:bg-red-500/[0.08] active:scale-[0.99]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/[0.08] text-red-400">
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M10 5H6C4.9 5 4 5.9 4 7V17C4 18.1 4.9 19 6 19H10"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M14 8L18 12L14 16"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 12H18"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-sm font-bold text-red-400">
                    Disconnect
                  </p>

                  <p className="text-xs font-medium text-red-400/45">
                    Disconnect this wallet
                  </p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
