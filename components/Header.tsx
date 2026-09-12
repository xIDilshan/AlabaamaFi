"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";
import WalletModal from "@/components/WalletModal";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/send", label: "Send" },
  { href: "/swap", label: "Swap" },
  { href: "/bridge", label: "Bridge" },
  { href: "/activity", label: "Activity" },
  { href: "/faucet", label: "Faucet" },
];

type HeaderProps = {
  onMenuClick: () => void;
};

const connectGlassButton =
  "border border-white/[0.22] bg-gradient-to-br from-white/[0.14] via-white/[0.08] to-white/[0.035] text-white shadow-[0_8px_30px_rgba(255,255,255,0.05),0_10px_35px_rgba(0,0,0,0.32)] backdrop-blur-2xl transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.34] hover:from-white/[0.18] hover:via-white/[0.11] hover:to-white/[0.055] hover:shadow-[0_10px_35px_rgba(255,255,255,0.08),0_18px_45px_rgba(0,0,0,0.42)] active:translate-y-0";

export default function Header({
  onMenuClick,
}: HeaderProps) {
  const pathname = usePathname();

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const [showWallets, setShowWallets] = React.useState(false);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  const handleWalletClick = () => {
    if (isConnected) {
      disconnect();
      return;
    }

    setShowWallets(true);
  };

  return (
    <>
      <header className="border-b border-white/[0.06] bg-[#040506]/95 backdrop-blur-xl">
        {/* MOBILE HEADER */}
        <div className="md:hidden">
          <div className="mx-auto grid min-h-[72px] max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button
                onClick={onMenuClick}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-[#060709] text-lg font-bold text-white/70 transition-all duration-200 hover:border-white/[0.14] hover:bg-[#0a0d12] hover:text-white active:scale-95"
                aria-label="Open menu"
              >
                ☰
              </button>

              <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-white/[0.07] bg-[#060709] px-3 py-2">
                <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-green-500" />

                <span className="text-[11px] font-bold text-white/70 sm:text-xs">
                  Testnet
                </span>
              </div>
            </div>

            <div className="min-w-0 text-center">
              <h1 className="truncate text-sm font-bold sm:text-base">
                AlabaamaFi
              </h1>

              <p className="mt-0.5 text-[9px] font-semibold text-white/30 sm:text-[10px]">
                Powered by Arc
              </p>
            </div>

            <div className="flex min-w-0 items-center justify-end">
              <button
                onClick={handleWalletClick}
                className={`max-w-[155px] truncate rounded-full px-3.5 py-2.5 text-xs !font-black tracking-tight sm:max-w-none sm:px-5 sm:py-3 ${connectGlassButton}`}
              >
                {isConnected ? shortAddress : "Connect Wallet"}
              </button>
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
              <Link href="/" className="text-center">
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
                  {isConnected ? shortAddress : "Connect Wallet"}
                </button>
              </div>
            </div>

            {/* FIRST SILVER LINE */}
            <div className="border-t border-white/[0.10]" />

            {/* DESKTOP NAVIGATION */}
            <nav className="flex min-h-[58px] items-center justify-center gap-2">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-white/[0.10] text-white"
                        : "text-white/45 hover:bg-white/[0.05] hover:text-white/85"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* SECOND SILVER LINE */}
            <div className="border-t border-white/[0.10]" />
          </div>
        </div>
      </header>

      <WalletModal
        isOpen={showWallets}
        onClose={() => setShowWallets(false)}
      />
    </>
  );
}
