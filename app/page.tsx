"use client";

import { useMemo, useState } from "react";

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

/* Wallet logos */
function getWalletLogo(name: string) {
  const walletName = name.toLowerCase();

  if (walletName.includes("brave")) {
    return "/wallets/brave.svg";
  }

  if (walletName.includes("rabby")) {
    return "/wallets/rabby.svg";
  }

  if (
    walletName.includes("okx") ||
    walletName.includes("okex")
  ) {
    return "/wallets/okx.svg";
  }

  if (walletName.includes("metamask")) {
    return "/wallets/metamask.svg";
  }

  if (
    walletName.includes("coinbase") ||
    walletName.includes("base")
  ) {
    return "/wallets/base.svg";
  }

  if (walletName.includes("walletconnect")) {
    return "/wallets/walletconnect.svg";
  }

  if (walletName.includes("browser wallet")) {
    return "/wallets/browser.svg";
  }

  return null;
}

/* User-friendly error messages */
function getFriendlyErrorMessage(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("user rejected") ||
    lowerMessage.includes("user denied") ||
    lowerMessage.includes("connection request reset")
  ) {
    return "Wallet connection rejected. Please try again.";
  }

  if (
    lowerMessage.includes("provider not found") ||
    lowerMessage.includes("provider")
  ) {
    return "Wallet connection failed. Please make sure your wallet is installed and try again.";
  }

  if (
    lowerMessage.includes("insufficient funds") ||
    lowerMessage.includes("insufficient balance")
  ) {
    return "Insufficient USDC balance.";
  }

  if (
    lowerMessage.includes("invalid address") ||
    lowerMessage.includes("invalid recipient")
  ) {
    return "Please enter a valid wallet address.";
  }

  if (
    lowerMessage.includes("user rejected the request") ||
    lowerMessage.includes("transaction rejected")
  ) {
    return "Transaction was rejected. Please try again.";
  }

  if (
    lowerMessage.includes("network") ||
    lowerMessage.includes("chain")
  ) {
    return "Network connection failed. Please try again.";
  }

  if (
    lowerMessage.includes("execution reverted") ||
    lowerMessage.includes("reverted")
  ) {
    return "Transaction could not be completed. Please try again.";
  }

  return "Something went wrong. Please try again.";
}

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

  /*
   * Wallet detection and ordering
   *
   * Desired order:
   *
   * Browser Wallet
   * Detected browser wallet
   * WalletConnect
   * MetaMask
   * Coinbase Wallet
   */

  const walletConnectConnector = useMemo(() => {
    return connectors.find((connector) => {
      const name = connector.name.toLowerCase();
      const id = connector.id.toLowerCase();

      return (
        name.includes("walletconnect") ||
        id.includes("walletconnect")
      );
    });
  }, [connectors]);

  const coinbaseConnector = useMemo(() => {
    return connectors.find((connector) => {
      const name = connector.name.toLowerCase();
      const id = connector.id.toLowerCase();

      return (
        name.includes("coinbase") ||
        name.includes("base") ||
        id.includes("coinbase")
      );
    });
  }, [connectors]);

  const metaMaskConnector = useMemo(() => {
    return connectors.find((connector) => {
      const name = connector.name.toLowerCase();
      const id = connector.id.toLowerCase();

      return (
        name.includes("metamask") ||
        id.includes("metamask") ||
        id === "io.metamask"
      );
    });
  }, [connectors]);

  /*
   * Detect other browser wallets.
   *
   * This intentionally does NOT hardcode Brave/Rabby/OKX
   * as connectors. Wagmi/EIP-6963 provides the detected
   * connectors dynamically.
   */
  const detectedBrowserWallets = useMemo(() => {
    const excludedIds = new Set(
      [
        walletConnectConnector?.id,
        coinbaseConnector?.id,
        metaMaskConnector?.id,
      ].filter(Boolean)
    );

    return connectors.filter((connector) => {
      if (excludedIds.has(connector.id)) {
        return false;
      }

      const name = connector.name.toLowerCase();
      const id = connector.id.toLowerCase();

      /*
       * The generic injected connector should represent
       * Browser Wallet, not a separate wallet.
       */
      if (
        id === "injected" ||
        name === "injected" ||
        name === "browser wallet"
      ) {
        return false;
      }

      /*
       * EIP-6963 injected wallets normally have their own
       * connector identity/name.
       */
      return (
        name.includes("wallet") ||
        name.includes("brave") ||
        name.includes("rabby") ||
        name.includes("okx") ||
        name.includes("metamask") ||
        id.includes(".")
      );
    });
  }, [
    connectors,
    walletConnectConnector,
    coinbaseConnector,
    metaMaskConnector,
  ]);

  const browserConnector = useMemo(() => {
    return connectors.find((connector) => {
      const name = connector.name.toLowerCase();
      const id = connector.id.toLowerCase();

      return (
        id === "injected" ||
        name === "injected" ||
        name === "browser wallet"
      );
    });
  }, [connectors]);

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
      setError("");
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
      setError("Unable to send USDC. Please try again.");
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
              {/* Browser Wallet */}
              {browserConnector && (
                <button
                  onClick={() =>
                    handleConnect(browserConnector)
                  }
                  disabled={isPending}
                  className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src="/wallets/browser.svg"
                        alt=""
                        className="h-8 w-8 rounded-lg object-contain"
                      />

                      {detectedBrowserWallets.length > 0 && (
                        <span
                          className="absolute bottom-0 right-0 h-2.5 w-2.5 translate-x-1/4 translate-y-1/4 rounded-full border-2 border-zinc-950 bg-green-500"
                          title="Wallet available"
                        />
                      )}
                    </div>

                    <div>
                      <p className="font-medium">
                        Browser Wallet
                      </p>

                      <p className="mt-1 text-xs text-white/30">
                        MetaMask and other browser wallets
                      </p>
                    </div>
                  </div>

                  <span className="text-sm text-white/30">
                    →
                  </span>
                </button>
              )}

              {/* Detected browser wallets */}
              {detectedBrowserWallets.map((connector) => {
                const name = connector.name.toLowerCase();

                let displayName = connector.name;
                let logo = connector.icon || null;

                if (name.includes("brave")) {
                  displayName = "Brave Wallet";
                  logo = "/wallets/brave.svg";
                } else if (name.includes("rabby")) {
                  displayName = "Rabby";
                  logo = "/wallets/rabby.svg";
                } else if (
                  name.includes("okx") ||
                  name.includes("okex")
                ) {
                  displayName = "OKX Wallet";
                  logo = "/wallets/okx.svg";
                }

                return (
                  <button
                    key={connector.uid}
                    onClick={() =>
                      handleConnect(connector)
                    }
                    disabled={isPending}
                    className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {logo ? (
                          <img
                            src={logo}
                            alt=""
                            className="h-8 w-8 rounded-lg object-contain"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sm">
                            ◇
                          </div>
                        )}

                        <span
                          className="absolute bottom-0 right-0 h-2.5 w-2.5 translate-x-1/4 translate-y-1/4 rounded-full border-2 border-zinc-950 bg-green-500"
                          title="Wallet available"
                        />
                      </div>

                      <div>
                        <p className="font-medium">
                          {displayName}
                        </p>

                        <p className="mt-1 text-xs text-white/30">
                          Available in your browser
                        </p>
                      </div>
                    </div>

                    <span className="text-sm text-white/30">
                      →
                    </span>
                  </button>
                );
              })}

              {/* WalletConnect */}
              {walletConnectConnector && (
                <button
                  onClick={() =>
                    handleConnect(walletConnectConnector)
                  }
                  disabled={isPending}
                  className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src="/wallets/walletconnect.svg"
                      alt=""
                      className="h-8 w-8 rounded-lg object-contain"
                    />

                    <div>
                      <p className="font-medium">
                        WalletConnect
                      </p>

                      <p className="mt-1 text-xs text-white/30">
                        Scan with a mobile wallet
                      </p>
                    </div>
                  </div>

                  <span className="text-sm text-white/30">
                    →
                  </span>
                </button>
              )}

              {/* MetaMask */}
              {metaMaskConnector && (
                <button
                  onClick={() =>
                    handleConnect(metaMaskConnector)
                  }
                  disabled={isPending}
                  className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src="/wallets/metamask.svg"
                        alt=""
                        className="h-8 w-8 rounded-lg object-contain"
                      />

                      <span
                        className="absolute bottom-0 right-0 h-2.5 w-2.5 translate-x-1/4 translate-y-1/4 rounded-full border-2 border-zinc-950 bg-green-500"
                        title="Wallet available"
                      />
                    </div>

                    <div>
                      <p className="font-medium">
                        MetaMask
                      </p>

                      <p className="mt-1 text-xs text-white/30">
                        Available in your browser
                      </p>
                    </div>
                  </div>

                  <span className="text-sm text-white/30">
                    →
                  </span>
                </button>
              )}

              {/* Coinbase Wallet */}
              {coinbaseConnector && (
                <button
                  onClick={() =>
                    handleConnect(coinbaseConnector)
                  }
                  disabled={isPending}
                  className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src="/wallets/base.svg"
                      alt=""
                      className="h-8 w-8 rounded-lg object-contain"
                    />

                    <div>
                      <p className="font-medium">
                        Coinbase Wallet
                      </p>

                      <p className="mt-1 text-xs text-white/30">
                        Connect with Coinbase Wallet
                      </p>
                    </div>
                  </div>

                  <span className="text-sm text-white/30">
                    →
                  </span>
                </button>
              )}
            </div>

            {/* Connection Error */}
            {connectError && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                <p className="break-words text-sm text-red-400">
                  {getFriendlyErrorMessage(
                    connectError.message
                  )}
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

          {/* General Error */}
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
                {getFriendlyErrorMessage(
                  sendError.message
                )}
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
