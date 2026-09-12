"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Manrope } from "next/font/google";

import Header from "@/components/Header";

const manrope = Manrope({
  subsets: ["latin"],
});

export default function Home() {
  const router = useRouter();

  const { address, isConnected, chainId } = useAccount();

  const [showMenu, setShowMenu] = useState(false);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  const navigate = (path: string) => {
    setShowMenu(false);
    router.push(path);
  };

  const openWallet = () => {
    setShowMenu(false);

    window.dispatchEvent(
      new Event("open-wallet-modal")
    );
  };

  return (
    <main
      className={`${manrope.className} min-h-screen bg-[#040506] text-white`}
    >
      {/* HEADER */}
      <Header onMenuClick={() => setShowMenu(true)} />

      {/* MOBILE MENU */}
      {showMenu && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md lg:hidden">
          <div className="absolute right-0 top-0 h-full w-[300px] border-l border-white/[0.08] bg-[#08090b] p-5 shadow-2xl">
            {/* MENU HEADER */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">
                  AlabaamaFi
                </div>

                <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/35">
                  Arc Network
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMenu(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/60 transition hover:bg-white/[0.06] hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* WALLET */}
            <button
              type="button"
              onClick={openWallet}
              className="mb-6 flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-left transition hover:bg-white/[0.06]"
            >
              <div>
                <div className="text-xs text-white/40">
                  Wallet
                </div>

                <div className="mt-1 text-sm font-medium text-white">
                  {isConnected ? shortAddress : "Connect Wallet"}
                </div>
              </div>

              <div
                className={`h-2 w-2 rounded-full ${
                  isConnected
                    ? "bg-emerald-400"
                    : "bg-white/20"
                }`}
              />
            </button>

            {/* NAVIGATION */}
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex w-full items-center rounded-xl px-4 py-3 text-left text-sm text-white transition hover:bg-white/[0.05]"
              >
                Home
              </button>

              <button
                type="button"
                onClick={() => navigate("/send")}
                className="flex w-full items-center rounded-xl px-4 py-3 text-left text-sm text-white/65 transition hover:bg-white/[0.05] hover:text-white"
              >
                Send
              </button>

              <button
                type="button"
                onClick={() => navigate("/swap")}
                className="flex w-full items-center rounded-xl px-4 py-3 text-left text-sm text-white/65 transition hover:bg-white/[0.05] hover:text-white"
              >
                Swap
              </button>

              <button
                type="button"
                onClick={() => navigate("/bridge")}
                className="flex w-full items-center rounded-xl px-4 py-3 text-left text-sm text-white/65 transition hover:bg-white/[0.05] hover:text-white"
              >
                Bridge
              </button>

              <button
                type="button"
                onClick={() => navigate("/activity")}
                className="flex w-full items-center rounded-xl px-4 py-3 text-left text-sm text-white/65 transition hover:bg-white/[0.05] hover:text-white"
              >
                Activity
              </button>

              <button
                type="button"
                onClick={() => navigate("/faucet")}
                className="flex w-full items-center rounded-xl px-4 py-3 text-left text-sm text-white/65 transition hover:bg-white/[0.05] hover:text-white"
              >
                Faucet
              </button>
            </nav>

            {/* NETWORK */}
            <div className="absolute bottom-6 left-5 right-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                Network
              </div>

              <div className="mt-2 flex items-center gap-2 text-sm text-white/70">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Arc Testnet
              </div>

              {isConnected && chainId && (
                <div className="mt-1 text-[10px] text-white/25">
                  Chain ID: {chainId}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* BACKGROUND GLOW */}
        <div className="pointer-events-none absolute left-1/2 top-[-180px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-white/[0.025] blur-[120px]" />

        <div className="relative mx-auto max-w-[1200px] px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:px-10 lg:pt-32">
          {/* TOP LABEL */}
          <div className="mb-7 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-white/45">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Powered by Arc Network
            </div>
          </div>

          {/* TITLE */}
          <div className="mx-auto max-w-[900px] text-center">
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              Simple.
              <br />
              Fast.
              <br />
              <span className="text-white/45">
                Built on Arc.
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-[650px] text-sm leading-7 text-white/45 sm:text-base">
              AlabaamaFi is a simple interface for interacting
              with the Arc Network. Send assets, check wallet
              activity and explore the Arc ecosystem from one
              place.
            </p>
          </div>

          {/* ACTIONS */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("/send")}
              className="w-full rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 sm:w-auto"
            >
              Send Assets
            </button>

            <button
              type="button"
              onClick={() => navigate("/activity")}
              className="w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-7 py-3.5 text-sm font-medium text-white transition hover:bg-white/[0.06] sm:w-auto"
            >
              Check Wallet Activity
            </button>
          </div>

          {/* CONNECTED WALLET */}
          {isConnected && address && (
            <div className="mx-auto mt-8 flex w-fit items-center gap-3 rounded-full border border-emerald-400/10 bg-emerald-400/[0.03] px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />

              <span className="text-xs text-white/50">
                Connected
              </span>

              <span className="font-mono text-xs text-white/80">
                {shortAddress}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="border-y border-white/[0.06] bg-white/[0.015]">
        <div className="mx-auto max-w-[1200px] px-5 py-14 sm:px-8 lg:px-10">
          <div className="mb-8">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
              Explore
            </div>

            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
              Everything you need
            </h2>

            <p className="mt-2 max-w-[600px] text-sm leading-6 text-white/40">
              Access the main Arc tools directly from
              AlabaamaFi.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* SEND */}
            <button
              type="button"
              onClick={() => navigate("/send")}
              className="group rounded-2xl border border-white/[0.07] bg-[#08090b] p-6 text-left transition hover:border-white/[0.13] hover:bg-white/[0.025]"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/70">
                  →
                </div>

                <span className="text-white/20 transition group-hover:translate-x-1 group-hover:text-white/50">
                  ↗
                </span>
              </div>

              <h3 className="mt-6 text-base font-semibold text-white">
                Send
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/40">
                Send USDC and other supported assets on
                Arc Testnet.
              </p>
            </button>

            {/* SWAP */}
            <button
              type="button"
              onClick={() => navigate("/swap")}
              className="group rounded-2xl border border-white/[0.07] bg-[#08090b] p-6 text-left transition hover:border-white/[0.13] hover:bg-white/[0.025]"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/70">
                  ⇄
                </div>

                <span className="text-white/20 transition group-hover:translate-x-1 group-hover:text-white/50">
                  ↗
                </span>
              </div>

              <h3 className="mt-6 text-base font-semibold text-white">
                Swap
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/40">
                Swap supported assets through the Arc
                ecosystem.
              </p>
            </button>

            {/* BRIDGE */}
            <button
              type="button"
              onClick={() => navigate("/bridge")}
              className="group rounded-2xl border border-white/[0.07] bg-[#08090b] p-6 text-left transition hover:border-white/[0.13] hover:bg-white/[0.025]"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/70">
                  ↗
                </div>

                <span className="text-white/20 transition group-hover:translate-x-1 group-hover:text-white/50">
                  ↗
                </span>
              </div>

              <h3 className="mt-6 text-base font-semibold text-white">
                Bridge
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/40">
                Move supported assets between networks.
              </p>
            </button>

            {/* ACTIVITY */}
            <button
              type="button"
              onClick={() => navigate("/activity")}
              className="group rounded-2xl border border-white/[0.07] bg-[#08090b] p-6 text-left transition hover:border-white/[0.13] hover:bg-white/[0.025]"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/70">
                  ◷
                </div>

                <span className="text-white/20 transition group-hover:translate-x-1 group-hover:text-white/50">
                  ↗
                </span>
              </div>

              <h3 className="mt-6 text-base font-semibold text-white">
                Activity
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/40">
                Check transactions, balances and wallet
                activity.
              </p>
            </button>

            {/* FAUCET */}
            <button
              type="button"
              onClick={() => navigate("/faucet")}
              className="group rounded-2xl border border-white/[0.07] bg-[#08090b] p-6 text-left transition hover:border-white/[0.13] hover:bg-white/[0.025]"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/70">
                  +
                </div>

                <span className="text-white/20 transition group-hover:translate-x-1 group-hover:text-white/50">
                  ↗
                </span>
              </div>

              <h3 className="mt-6 text-base font-semibold text-white">
                Faucet
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/40">
                Get testnet assets for experimenting on
                Arc.
              </p>
            </button>

            {/* WALLET ACTIVITY */}
            <button
              type="button"
              onClick={() => navigate("/activity")}
              className="group rounded-2xl border border-white/[0.07] bg-[#08090b] p-6 text-left transition hover:border-white/[0.13] hover:bg-white/[0.025]"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/70">
                  ◌
                </div>

                <span className="text-white/20 transition group-hover:translate-x-1 group-hover:text-white/50">
                  ↗
                </span>
              </div>

              <h3 className="mt-6 text-base font-semibold text-white">
                Wallet Checker
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/40">
                Enter a wallet address and explore its
                activity.
              </p>
            </button>
          </div>
        </div>
      </section>

      {/* NETWORK SECTION */}
      <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
              Arc Testnet
            </div>

            <h2 className="mt-3 max-w-[700px] text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
              Explore the Arc ecosystem.
            </h2>

            <p className="mt-5 max-w-[650px] text-sm leading-7 text-white/40">
              AlabaamaFi provides a simple interface for
              testing and exploring different interactions
              on Arc Testnet.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/activity")}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-3 text-sm text-white transition hover:bg-white/[0.06]"
              >
                Explore Activity
              </button>

              <button
                type="button"
                onClick={() => navigate("/faucet")}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-3 text-sm text-white transition hover:bg-white/[0.06]"
              >
                Get Testnet Assets
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-5">
              <span className="text-sm text-white/40">
                Network
              </span>

              <span className="flex items-center gap-2 text-sm text-white">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Arc Testnet
              </span>
            </div>

            <div className="border-b border-white/[0.06] py-5">
              <div className="text-xs text-white/30">
                Chain ID
              </div>

              <div className="mt-2 font-mono text-sm text-white/70">
                5042002
              </div>
            </div>

            <div className="pt-5">
              <div className="text-xs text-white/30">
                Native Asset
              </div>

              <div className="mt-2 text-sm text-white/70">
                USDC
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <div>
            <div className="text-sm font-semibold text-white">
              AlabaamaFi
            </div>

            <div className="mt-1 text-xs text-white/30">
              Built on Arc Network
            </div>
          </div>

          <div className="text-xs text-white/25">
            Arc Testnet
          </div>
        </div>
      </footer>
    </main>
  );
}
