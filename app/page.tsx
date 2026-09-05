"use client";

import { useState } from "react";

export default function Home() {
  const [connected, setConnected] = useState(false);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              AlabaamaFi
            </h1>
            <p className="text-xs text-white/40">
              Powered by Arc
            </p>
          </div>

          <button
            onClick={() => setConnected(!connected)}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            {connected ? "Connected" : "Connect Wallet"}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-24 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60">
            Built on Arc Network
          </div>

          <h2 className="text-5xl font-bold tracking-tight sm:text-7xl">
            Simple.
            <br />
            <span className="text-white/40">On-chain.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/50">
            Send USDC between wallets with a simple and secure
            Web3 experience powered by the Arc Network.
          </p>
        </div>

        {/* Send Card */}
        <div className="mx-auto mt-14 max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-left shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Send USDC
            </h3>

            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/50">
              Testnet
            </span>
          </div>

          {/* Recipient */}
          <label className="mb-2 block text-sm text-white/50">
            Recipient
          </label>

          <input
            type="text"
            placeholder="0x..."
            className="mb-5 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none transition placeholder:text-white/20 focus:border-white/30"
          />

          {/* Amount */}
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm text-white/50">
              Amount
            </label>

            <span className="text-xs text-white/30">
              Balance: 0 USDC
            </span>
          </div>

          <div className="relative">
            <input
              type="number"
              placeholder="0.00"
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 pr-20 text-lg outline-none transition placeholder:text-white/20 focus:border-white/30"
            />

            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-white/50">
              USDC
            </span>
          </div>

          {/* Send button */}
          <button
            disabled={!connected}
            className="mt-6 w-full rounded-xl bg-white py-3.5 font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
          >
            {connected ? "Send USDC" : "Connect Wallet First"}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center">
        <p className="text-sm text-white/30">
          AlabaamaFi • Built on Arc Network
        </p>
      </footer>
    </main>
  );
}
