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

const navItems = [
  { href: "/", label: "Home" },
  { href: "/send", label: "Send" },
  { href: "/swap", label: "Swap" },
  { href: "/bridge", label: "Bridge" },
  { href: "/activity", label: "Activity" },
  { href: "/faucet", label: "Faucet" },
];

const connectButton =
  "bg-gradient-to-r from-[#13b8ff] via-[#1688f5] to-[#263be8] text-white shadow-[0_8px_30px_rgba(19,145,255,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_12px_38px_rgba(19,145,255,0.32)] active:translate-y-0";

type HeaderProps = {
  onMenuClick?: () => void;
};

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

  const mobileShortAddress = address
    ? `${address.slice(0, 4)}...${address.slice(-3)}`
    : "";

  const menuAddress = address
    ? `${address.slice(0, 10)}...${address.slice(-8)}`
    : "";

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

    if (connector.icon) {
      return {
        name:
          connector.name || "Browser Wallet",
        logo: connector.icon,
      };
    }

    return {
      name:
        connector.name || "Browser Wallet",
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
    const handleEscape = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        setShowWalletMenu(false);
        setCopied(false);

        window.dispatchEvent(
          new CustomEvent(
            "mobile-menu-state",
            {
              detail: false,
            }
          )
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
        new CustomEvent(
          "mobile-menu-state",
          {
            detail: next,
          }
        )
      );

      return next;
    });

    onMenuClick?.();
  };

  const handleNavigation = () => {
    setMobileMenuOpen(false);

    window.dispatchEvent(
      new CustomEvent(
        "mobile-menu-state",
        {
          detail: false,
        }
      )
    );
  };

  const handleBackdropClick = () => {
    setMobileMenuOpen(false);

    window.dispatchEvent(
      new CustomEvent(
        "mobile-menu-state",
        {
          detail: false,
        }
      )
    );
  };

  const isActive = (href: string) => {
    return href === "/"
      ? pathname === "/"
      : pathname.startsWith(href);
  };

  return (
    <>
      <header className="relative z-50 px-2 pt-2 sm:px-3 sm:pt-3">
        <div className="overflow-visible rounded-[24px] border border-white/[0.10] bg-[#05080e]/95 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:rounded-[28px]">
          {/* MOBILE HEADER */}

          <div className="md:hidden">
            <div className="flex min-h-[68px] items-center justify-between gap-2 px-3 sm:min-h-[74px] sm:px-5">
              {/* LEFT */}

              <button
                onClick={handleMenuToggle}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-lg font-bold transition-all duration-200 ${
                  mobileMenuOpen
                    ? "border-[#159fff]/40 bg-[#159fff]/10 text-white"
                    : "border-white/[0.08] bg-white/[0.035] text-white/65 hover:border-white/[0.15] hover:bg-white/[0.07] hover:text-white"
                }`}
                aria-label={
                  mobileMenuOpen
                    ? "Close menu"
                    : "Open menu"
                }
                aria-expanded={
                  mobileMenuOpen
                }
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

              {/* CENTER LOGO */}

              <Link
                href="/"
                onClick={handleNavigation}
                className="flex min-w-0 items-center gap-2"
              >
                <img
                  src="/alabaamafi-logo.png"
                  alt="AlabaamaFi"
                  className="h-9 w-9 shrink-0 object-contain"
                />

                <div className="min-w-0">
                  <h1 className="truncate text-sm font-bold leading-tight tracking-tight text-white sm:text-base">
                    Alabaama
                    <span className="text-[#159fff]">
                      Fi
                    </span>
                  </h1>

                  <p className="mt-0.5 text-[8px] font-semibold leading-tight text-white/30 sm:text-[9px]">
                    Powered by Arc
                  </p>
                </div>
              </Link>

              {/* RIGHT WALLET */}

              <button
                onClick={handleWalletClick}
                className={`${manrope.className} flex h-10 max-w-[108px] shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold tracking-normal sm:max-w-none sm:px-4 sm:text-sm ${connectButton}`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="shrink-0"
                >
                  <path
                    d="M4 7.5C4 6.67 4.67 6 5.5 6H19C19.55 6 20 6.45 20 7V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V7.5Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />

                  <path
                    d="M4 8V6C4 4.9 4.9 4 6 4H17"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />

                  <path
                    d="M16 13H20"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />

                  <circle
                    cx="16"
                    cy="13"
                    r="0.8"
                    fill="currentColor"
                  />
                </svg>

                <span className="truncate">
                  {isConnected
                    ? mobileShortAddress
                    : "Connect"}
                </span>

                {isConnected && (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="shrink-0 text-white/70"
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

            {/* MOBILE BACKDROP */}

            <div
              className={`fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] transition-all duration-300 ${
                mobileMenuOpen
                  ? "visible opacity-100"
                  : "invisible opacity-0"
              }`}
              onClick={handleBackdropClick}
              aria-hidden="true"
            />

            {/* MOBILE MENU */}

            <div
              className={`absolute left-0 right-0 top-full z-[60] overflow-hidden rounded-b-[24px] border-x border-b border-white/[0.10] bg-[#05080e]/[0.98] shadow-[0_25px_60px_rgba(0,0,0,0.65)] backdrop-blur-2xl transition-all duration-300 ease-out ${
                mobileMenuOpen
                  ? "visible max-h-[620px] translate-y-0 opacity-100"
                  : "invisible max-h-0 -translate-y-2 opacity-0"
              }`}
            >
              <div className="px-3 pb-4 pt-3 sm:px-5 sm:pb-5">
                <nav className="grid gap-2">
                  {navItems.map((item) => {
                    const active =
                      isActive(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={
                          handleNavigation
                        }
                        className={`flex min-h-[52px] items-center justify-between rounded-2xl border px-4 transition-all duration-200 ${
                          active
                            ? "border-[#159fff]/25 bg-[#159fff]/[0.09] text-white"
                            : "border-white/[0.055] bg-white/[0.025] text-white/55 hover:border-white/[0.11] hover:bg-white/[0.06] hover:text-white/90"
                        }`}
                      >
                        <span className="text-sm font-semibold tracking-tight">
                          {item.label}
                        </span>

                        {active && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#159fff] shadow-[0_0_10px_rgba(21,159,255,0.8)]" />
                        )}
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

              <Link
                href="/"
                className="flex shrink-0 items-center gap-3"
              >
                <img
                  src="/alabaamafi-logo.png"
                  alt="AlabaamaFi"
                  className="h-12 w-12 shrink-0 object-contain lg:h-14 lg:w-14"
                />

                <div className="text-left">
                  <h1 className="text-[25px] font-bold leading-none tracking-[-0.035em] lg:text-[29px]">
                    Alabaama
                    <span className="text-[#159fff]">
                      Fi
                    </span>
                  </h1>

                  <p className="mt-1 text-[10px] font-semibold leading-tight text-white/30 lg:text-[11px]">
                    Powered by Arc
                  </p>
                </div>
              </Link>

              {/* NAVIGATION */}

              <nav className="ml-auto flex min-w-0 items-center justify-center gap-1 lg:gap-2">
                {navItems.map((item) => {
                  const active =
                    isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 lg:px-4 ${
                        active
                          ? "text-[#159fff]"
                          : "text-white/55 hover:text-white"
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
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="shrink-0"
                  >
                    <path
                      d="M4 7.5C4 6.67 4.67 6 5.5 6H19C19.55 6 20 6.45 20 7V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V7.5Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />

                    <path
                      d="M4 8V6C4 4.9 4.9 4 6 4H17"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />

                    <path
                      d="M16 13H20"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />

                    <circle
                      cx="16"
                      cy="13"
                      r="0.8"
                      fill="currentColor"
                    />
                  </svg>

                  <span>
                    {isConnected
                      ? shortAddress
                      : "Connect Wallet"}
                  </span>

                  {isConnected && (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-white/70"
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
          </div>
        </div>
      </header>

      {/* CONNECT WALLET MODAL */}

      <WalletModal
        isOpen={showWallets}
        onClose={() => setShowWallets(false)}
      />

      {/* CONNECTED WALLET MENU */}

      {showWalletMenu &&
        isConnected &&
        address && (
          <>
            <div
              className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-md"
              onClick={handleCloseWalletMenu}
              aria-hidden="true"
            />

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
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.06] p-2">
                      <img
                        src={connectedWallet.logo}
                        alt={`${connectedWallet.name} logo`}
                        className="h-full w-full object-contain"
                      />
                    </div>

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

                  <button
                    onClick={
                      handleCloseWalletMenu
                    }
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
                  <button
                    onClick={
                      handleCopyAddress
                    }
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

                  <button
                    onClick={
                      handleDisconnect
                    }
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
