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

  const {
    address,
    isConnected,
    connector,
  } = useAccount();

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

  const menuAddress = address
    ? `${address.slice(0, 10)}...${address.slice(-8)}`
    : "";

  /*
   * Detect the connected wallet and choose
   * the correct logo from /public/wallets/
   */
  const connectedWallet = React.useMemo(() => {
    if (!connector) {
      return {
        name: "Browser Wallet",
        logo: "/wallets/browser.svg",
      };
    }

    const name =
      connector.name?.toLowerCase() || "";

    const id =
      connector.id?.toLowerCase() || "";

    if (
      name.includes("brave") ||
      id.includes("brave")
    ) {
      return {
        name: "Brave Wallet",
        logo: "/wallets/brave.svg",
      };
    }

    if (
      name.includes("rabby") ||
      id.includes("rabby")
    ) {
      return {
        name: "Rabby",
        logo: "/wallets/rabby.svg",
      };
    }

    if (
      name.includes("okx") ||
      name.includes("okex") ||
      id.includes("okx")
    ) {
      return {
        name: "OKX Wallet",
        logo: "/wallets/okx.svg",
      };
    }

    if (
      name.includes("metamask") ||
      id.includes("metamask") ||
      id === "io.metamask"
    ) {
      return {
        name: "MetaMask",
        logo: "/wallets/metamask.svg",
      };
    }

    if (
      name.includes("coinbase") ||
      name.includes("base") ||
      id.includes("coinbase")
    ) {
      return {
        name: "Coinbase Wallet",
        logo: "/wallets/base.svg",
      };
    }

    if (
      name.includes("walletconnect") ||
      id.includes("walletconnect")
    ) {
      return {
        name: "WalletConnect",
        logo: "/wallets/walletconnect.svg",
      };
    }

    /*
     * For another injected/browser wallet,
     * use the connector-provided icon if available.
     */
    if (connector.icon) {
      return {
        name: connector.name || "Browser Wallet",
        logo: connector.icon,
      };
    }

    return {
      name: connector.name || "Browser Wallet",
      logo: "/wallets/browser.svg",
    };
  }, [connector]);

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
        setCopied(false);

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
    if (!address) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        address
      );

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
                className={`flex max-w-[120px] items-center gap-1 truncate rounded-full px-2 py-1.5 text-[10px] !font-black tracking-tight sm:max-w-none sm:gap-2 sm:px-5 sm:py-3 sm:text-xs ${connectGlassButton}`}
              >
                <span className="truncate">
                  {isConnected
                    ? shortAddress
                    : "Connect"}
                </span>

                {isConnected && (
                  <svg
                    width="11"
                    height="11"
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

      {showWalletMenu &&
        isConnected &&
        address && (
          <>
            {/* BACKDROP */}

            <div
              className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-md"
              onClick={handleCloseWalletMenu}
              aria-hidden="true"
            />

            {/* COMPACT MODAL */}

            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
              <div
                className="w-full max-w-sm rounded-3xl border border-white/[0.10] bg-[#080a0d]/[0.98] p-4 shadow-[0_25px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:p-5"
                onClick={(event) =>
                  event.stopPropagation()
                }
              >
                {/* WALLET HEADER */}

                <div className="mb-4 flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-3">

                    {/* WALLET LOGO */}

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.06] p-2">
                      <img
                        src={connectedWallet.logo}
                        alt={`${connectedWallet.name} logo`}
                        className="h-full w-full object-contain"
                      />
                    </div>

                    {/* WALLET NAME */}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">
                        {connectedWallet.name}
                      </p>

                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />

                        <p className="text-[11px] font-medium text-white/35">
                          Connected
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CLOSE */}

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
                  <span
                    className="truncate text-center text-sm font-bold tracking-tight text-white/80"
                    title={address}
                  >
                    {menuAddress}
                  </span>
                </div>

                {/* COPY + DISCONNECT */}

                <div className="grid grid-cols-2 gap-2">

                  {/* COPY */}

                  <button
                    onClick={handleCopyAddress}
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-3 text-sm font-bold text-white/75 transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white active:scale-[0.98]"
                  >
                    {copied ? (
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="shrink-0"
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
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="shrink-0"
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

                    <span>
                      {copied
                        ? "Copied"
                        : "Copy"}
                    </span>
                  </button>

                  {/* DISCONNECT */}

                  <button
                    onClick={handleDisconnect}
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-red-500/[0.12] bg-red-500/[0.045] px-3 text-sm font-bold text-red-400 transition-all duration-200 hover:border-red-500/[0.22] hover:bg-red-500/[0.08] active:scale-[0.98]"
                  >
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="shrink-0"
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

                    <span>
                      Disconnect
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
    </>
  );
}
