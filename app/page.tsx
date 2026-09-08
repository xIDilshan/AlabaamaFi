"use client";

import { useState } from "react";

import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";

import { isAddress, parseUnits } from "viem";

import { arcTestnet } from "@/lib/wagmi";

const USDC_ADDRESS =
  "0x3600000000000000000000000000000000000000";

const USDC_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [
      {
        name: "account",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "to",
        type: "address",
      },
      {
        name: "value",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
  },
] as const;

export default function Home() {
  const [showWallets, setShowWallets] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const { address, isConnected, chainId } = useAccount();

  const {
    connectors,
    connect,
    isPending,
    error: connectError,
  } = useConnect();

  const { disconnect } = useDisconnect();

  const { switchChain } = useSwitchChain();

  const {
    data: usdcBalance,
    isLoading: isBalanceLoading,
  } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: arcTestnet.id,
  });

  const {
    writeContract,
    data: hash,
    isPending: isSending,
    error: sendError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  const formattedBalance = usdcBalance
    ? (Number(usdcBalance) / 1_000_000).toFixed(2)
    : "0.00";

  const handleConnect = (
    connector: (typeof connectors)[number]
  ) => {
    setError("");

    connect(
      { connector },
      {
        onSuccess: () => {
          setShowWallets(false);
        },
        onError: (error) => {
          setError(error.message);
        },
      }
    );
  };

  const handleWalletButton = () => {
    if (isConnected) {
      disconnect();
      setRecipient("");
      setAmount("");
      setError("");
    } else {
      setShowWallets(true);
    }
  };

  const handleSend = () => {
    setError("");

    if (!isConnected || !address) {
      setError("Please connect your wallet first.");
      return;
    }

    if (chainId !== arcTestnet.id) {
      setError("Please switch to Arc Testnet.");
      return;
    }

    if (!isAddress(recipient)) {
      setError("Please enter a valid wallet address.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid USDC amount.");
      return;
    }

    try {
      const value = parseUnits(amount, 6);

      writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "transfer",
        args: [recipient, value],
        chainId: arcTestnet.id,
      });
    } catch {
      setError("Unable to send USDC.");
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
              {connectors.map((connector) => {
                const connectorName =
                  connector.name.toLowerCase();

                const displayName =
                  connectorName.includes("coinbase")
                    ? "Coinbase Wallet"
                    : connectorName.includes("walletconnect")
                    ? "WalletConnect"
                    : "Browser Wallet";

                return (
                  <button
                    key={connector.uid}
                    onClick={() => handleConnect(connector)}
                    disabled={isPending}
                    className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div>
                      <p className="font-medium">
                        {displayName}
                      </p>

                      {displayName === "Browser Wallet" && (
                        <p className="mt-1 text-xs text-white/30">
                          MetaMask and other browser wallets
                        </p>
                      )}

                      {displayName === "Coinbase Wallet" && (
                        <p className="mt-1 text-xs text-white/30">
                          Connect with Coinbase Wallet
                        </p>
                      )}

                      {displayName === "WalletConnect" && (
                        <p className="mt-1 text-xs text-white/30">
                          Scan with a mobile wallet
                        </p>
                      )}
                    </div>

                    <span className="text-sm text-white/30">
                      →
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Connection Error */}
            {connectError && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                <p className="break-words text-sm text-red-400">
                  {connectError.message}
                </p>
              </div>
            )}

            {/* General Error */}
            {error && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                <p className="break-words text-sm text-red-400">
                  {error}
                </p>
              </div>
            )}

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

          {/* Recipient */}
          <label className="mb-2 block text-sm text-white/50">
            Recipient
          </label>

          <input
            type="text"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="mb-5 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none transition placeholder:text-white/20 focus:border-white/30"
          />

          {/* Amount */}
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm text-white/50">
              Amount
            </label>

            <span className="text-xs text-white/30">
              Balance:{" "}
              {isBalanceLoading
                ? "Loading..."
                : `${formattedBalance} USDC`}
            </span>
          </div>

          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.000001"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 pr-20 text-lg outline-none transition placeholder:text-white/20 focus:border-white/30"
            />

            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-white/50">
              USDC
            </span>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={
              !isConnected ||
              isSending ||
              isConfirming
            }
            className="mt-6 w-full rounded-xl bg-white py-3.5 font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
          >
            {!isConnected
              ? "Connect Wallet First"
              : isSending
              ? "Confirm in Wallet..."
              : isConfirming
              ? "Confirming..."
              : "Send USDC"}
          </button>

          {/* Wrong Network */}
          {isConnected &&
            chainId !== arcTestnet.id && (
              <button
                onClick={() =>
                  switchChain({
                    chainId: arcTestnet.id,
                  })
                }
                className="mt-3 w-full rounded-xl border border-white/10 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Switch to Arc Testnet
              </button>
            )}

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
              <p className="break-words text-sm text-red-400">
                {error}
              </p>
            </div>
          )}

          {/* Transaction Error */}
          {sendError && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
              <p className="break-words text-sm text-red-400">
                {sendError.message}
              </p>
            </div>
          )}

          {/* Transaction Success */}
          {isConfirmed && hash && (
            <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
              <p className="text-sm font-medium text-green-400">
                Transaction confirmed ✓
              </p>

              <a
                href={`https://testnet.arcscan.app/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block text-sm text-white/60 underline transition hover:text-white"
              >
                View on Arc Explorer →
              </a>
            </div>
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
