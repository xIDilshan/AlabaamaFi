"use client";

import { useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { arcTestnet } from "@/lib/wagmi";

export default function Home() {
  const [showWallets, setShowWallets] = useState(false);

  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  const handleConnect = (connector: (typeof connectors)[number]) => {
    connect({ connector });
    setShowWallets(false);
  };

  const handleWalletButton = () => {
    if (isConnected) {
      disconnect();
    } else {
      setShowWallets(true);
    }
  };

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
            onClick={handleWalletButton}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            {isConnected ? shortAddress : "Connect Wallet"}
          </button>
        </div>
      </header>

      {/* Wallet Modal */}
      {showWallets && !isConnected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">
                  Connect Wallet
                </h3>

                <p className="mt-1 text-sm text-white/40">
                  Choose a wallet to continue
                </p>
              </div>

              <button
                onClick={() => setShowWallets(false)}
                className="rounded-lg px-3 py-2 text-white/50 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => handleConnect(connector)}
                  disabled={isPending}
                  className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="font-medium">
                    {connector.name}
                  </span>

                  <span className="text-sm text-white/30">
                    →
                  </span>
                </button>
              ))}
            </div>

            <p className="mt-5 text-center text-xs leading-5 text-white/30">
              WalletConnect supports many mobile and desktop wallets.
            </p>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-24 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60">
            Built on Arc Network
          </div>

          <h2 className="text-5xl font-bold tracking-tight sm:text-7xl">
            Simple.
            <br />
            <span className="text-white/40">
              On-chain.
            </span>
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

          <label className="mb-2 block text-sm text-white/50">
            Recipient
          </label>

          <input
            type="text"
            placeholder="0x..."
            className="mb-5 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none transition placeholder:text-white/20 focus:border-white/30"
          />

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

          <button
            disabled={!isConnected}
            className="mt-6 w-full rounded-xl bg-white py-3.5 font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
          >
            {isConnected
              ? "Send USDC"
              : "Connect Wallet First"}
          </button>

          {/* Wrong network warning */}
          {isConnected && chainId !== arcTestnet.id && (
            <button
              onClick={() =>
                switchChain({ chainId: arcTestnet.id })
              }
              className="mt-3 w-full rounded-xl border border-white/10 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Switch to Arc Testnet
            </button>
          )}
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
