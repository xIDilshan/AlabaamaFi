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
      disconnect();
      return;
    }

    setShowWallets(true);
  };

  const handleMenuToggle = () => {
    setMobileMenuOpen((current) => !current);
    onMenuClick?.();
  };

  const handleNavigation = () => {
    setMobileMenuOpen(false);
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
                className={`max-w-[155px] truncate rounded-full px-3.5 py-2.5 text-xs !font-black tracking-tight sm:max-w-none sm:px-5 sm:py-3 ${connectGlassButton}`}
              >
                {isConnected
                  ? shortAddress
                  : "Connect Wallet"}
              </button>
            </div>
          </div>

          {/* MOBILE BACKDROP */}

          <div
            className={`fixed inset-x-0 bottom-0 top-[72px] z-40 bg-black/45 backdrop-blur-md transition-all duration-300 ${
              mobileMenuOpen
                ? "visible opacity-100"
                : "invisible opacity-0"
            }`}
            onClick={() =>
              setMobileMenuOpen(false)
            }
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
                  className={`rounded-full px-5 py-3 text-sm !font-black tracking-tight ${connectGlassButton}`}
                >
                  {isConnected
                    ? shortAddress
                    : "Connect Wallet"}
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

      <WalletModal
        isOpen={showWallets}
        onClose={() =>
          setShowWallets(false)
        }
      />
    </>
  );
}
