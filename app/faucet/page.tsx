"use client";

import { useState } from "react";
import { Manrope } from "next/font/google";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

import Header from "@/components/Header";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["600"],
});

type Section =
  | "home"
  | "send"
  | "swap"
  | "bridge"
  | "activity"
  | "faucet";

const menuItems: {
  id: Section;
  label: string;
  icon: string;
}[] = [
  {
    id: "home",
    label: "Home",
    icon: "⌂",
  },
  {
    id: "send",
    label: "Send",
    icon: "↗",
  },
  {
    id: "swap",
    label: "Swap",
    icon: "⇄",
  },
  {
    id: "bridge",
    label: "Bridge",
    icon: "⇅",
  },
  {
    id: "activity",
    label: "Activity",
    icon: "◷",
  },
  {
    id: "faucet",
    label: "Faucet",
    icon: "◌",
  },
];

export default function FaucetPage() {
  const router = useRouter();

  const [showMenu, setShowMenu] = useState(false);

  const {
    address,
    isConnected,
  } = useAccount();

  const handleNavigation = (section: Section) => {
    const routes: Record<Section, string> = {
      home: "/",
      send: "/send",
      swap: "/swap",
      bridge: "/bridge",
      activity: "/activity",
      faucet: "/faucet",
    };

    setShowMenu(false);

    router.push(routes[section]);
  };

  const handleWalletButton = () => {
    if (isConnected) {
      return;
    }

    window.dispatchEvent(
      new Event("open-wallet-modal")
    );
  };

  return (
    <main className="min-h-screen bg-[#030405] text-white">
      <style jsx global>{`
        button {
          font-family: ${manrope.style.fontFamily} !important;
          font-weight: 600 !important;
          letter-spacing: normal !important;
        }
      `}</style>

      {/* HEADER */}

      <Header
        onMenuClick={() => setShowMenu(true)}
      />

      {/* MENU */}

      {showMenu && (
        <div className="fixed inset-0 z-40">
          <button
            onClick={() => setShowMenu(false)}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            aria-label="Close menu"
          />

          <aside className="relative z-50 flex min-h-screen w-[min(18rem,88vw)] flex-col border-r border-white/[0.06] bg-[#040506] p-4 shadow-2xl shadow-black/80 sm:p-5">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  AlabaamaFi
                </h2>

                <p className="mt-1 text-xs font-semibold text-white/30">
                  Powered by Arc
                </p>
              </div>

              <button
                onClick={() => setShowMenu(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white/50 transition hover:bg-white/[0.04] hover:text-white active:scale-95"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <nav className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    handleNavigation(item.id)
                  }
                  className={`flex min-h-12 w-full items-center gap-4 rounded-full px-4 py-3.5 text-left transition-all duration-200 active:scale-[0.99] ${
                    item.id === "faucet"
                      ? "border border-black/[0.08] bg-white text-black shadow-[0_2px_6px_rgba(0,0,0,0.06),0_10px_28px_rgba(0,0,0,0.14)]"
                      : "text-white/60 hover:bg-[#0a0d12] hover:text-white"
                  }`}
                >
                  <span className="w-6 shrink-0 text-center text-lg font-bold">
                    {item.icon}
                  </span>

                  <span className="text-sm font-bold">
                    {item.label}
                  </span>
                </button>
              ))}
            </nav>

            <div className="mt-auto pt-8">
              <button
                onClick={handleWalletButton}
                className="w-full rounded-full border border-white/[0.22] bg-gradient-to-br from-white/[0.14] via-white/[0.08] to-white/[0.035] px-4 py-3.5 text-sm !font-black tracking-tight text-white shadow-[0_8px_30px_rgba(255,255,255,0.05),0_10px_35px_rgba(0,0,0,0.32)] backdrop-blur-2xl transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.34] hover:from-white/[0.18] hover:via-white/[0.11] hover:to-white/[0.055] hover:shadow-[0_10px_35px_rgba(255,255,255,0.08),0_18px_45px_rgba(0,0,0,0.42)] active:translate-y-0"
              >
                {isConnected && address
                  ? `${address.slice(0, 6)}...${address.slice(-4)}`
                  : "Connect Wallet"}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* CONTENT */}

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-md text-center">
          <div className="text-4xl font-medium leading-none text-white/55">
            ◌
          </div>

          <h2 className="mt-6 text-3xl font-black sm:text-4xl">
            Faucet
          </h2>

          <p className="mt-4 text-sm font-medium leading-7 text-white/35 sm:text-base">
            Get testnet tokens from the official
            Circle faucet and use them to test
            AlabaamaFi on Arc Testnet.
          </p>

          <a
            href="https://faucet.circle.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 block min-h-13 w-full rounded-full border border-black/[0.08] bg-white py-4 text-sm !font-bold tracking-normal text-black shadow-[0_2px_6px_rgba(0,0,0,0.06),0_10px_28px_rgba(0,0,0,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#fafafa] hover:shadow-[0_4px_10px_rgba(0,0,0,0.08),0_14px_34px_rgba(0,0,0,0.18)] active:translate-y-0"
            style={{
              fontFamily: manrope.style.fontFamily,
            }}
          >
            Get Testnet Tokens
          </a>

          <p className="mt-4 text-xs font-semibold leading-5 text-white/25">
            Opens the official Circle faucet in a
            new tab.
          </p>
        </div>
      </section>
    </main>
  );
}
