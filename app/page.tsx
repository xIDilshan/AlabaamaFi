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
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

function getWalletLogo(name: string, id?: string) {
  const walletName = name.toLowerCase();
  const walletId = id?.toLowerCase() ?? "";

  if (
    walletName.includes("metamask") ||
    walletId.includes("metamask") ||
    walletId === "io.metamask"
  ) {
    return "/wallets/metamask.svg";
  }

  if (
    walletName.includes("brave") ||
    walletId.includes("brave")
  ) {
    return "/wallets/brave.svg";
  }

  if (
    walletName.includes("rabby") ||
    walletId.includes("rabby")
  ) {
    return "/wallets/rabby.svg";
  }

  if (
    walletName.includes("okx") ||
    walletId.includes("okx") ||
    walletId.includes("okex")
  ) {
    return "/wallets/okx.svg";
  }

  if (
    walletName.includes("base") ||
    walletName.includes("coinbase")
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

function WalletLogo({
  name,
  id,
  icon,
  className = "h-7 w-7",
}: {
  name: string;
  id?: string;
  icon?: string;
  className?: string;
}) {
  const localLogo = getWalletLogo(name, id);

  if (localLogo) {
    return (
      <img
        src={localLogo}
        alt={name}
        className={`${className} object-contain`}
        onError={(event) => {
          if (icon) {
            event.currentTarget.src = icon;
          }
        }}
      />
    );
  }

  if (icon) {
    return (
      <img
        src={icon}
        alt={name}
        className={`${className} object-contain`}
      />
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center rounded-full bg-white/10 text-xs text-white/60`}
    >
      W
    </div>
  );
}

export default function Home() {
  const { address, isConnected, chain } = useAccount();

  const {
    connectors,
    connect,
    isPending: isConnecting,
    error: connectError,
  } = useConnect();

  const { disconnect } = useDisconnect();

  const {
    switchChain,
    isPending: isSwitching,
    error: switchError,
  } = useSwitchChain();

  const {
    data: balance,
    refetch: refetchBalance,
  } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: arcTestnet.id,
    query: {
      enabled: !!address,
    },
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

  const [showWallets, setShowWallets] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  /*
   * Generic injected connector always exists in Wagmi.
   * Therefore we DO NOT use it to decide whether a wallet
   * is actually installed.
   */
  const browserConnector = useMemo(() => {
    return connectors.find(
      (connector) => connector.id === "injected"
    );
  }, [connectors]);

  const walletConnectConnector = useMemo(() => {
    return connectors.find(
      (connector) =>
        connector.id === "walletConnect" ||
        connector.name
          .toLowerCase()
          .includes("walletconnect")
    );
  }, [connectors]);

  const baseConnector = useMemo(() => {
    return connectors.find(
      (connector) =>
        connector.id === "coinbaseWalletSDK" ||
        connector.name.toLowerCase().includes("base") ||
        connector.name.toLowerCase().includes("coinbase")
    );
  }, [connectors]);

  /*
   * MetaMask is discovered through EIP-6963.
   */
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
   * These are ACTUALLY discovered browser wallets.
   * The generic "injected" connector is excluded.
   */
  const detectedWallets = useMemo(() => {
    const excludedIds = new Set(
      [
        browserConnector?.id,
        walletConnectConnector?.id,
        baseConnector?.id,
        metaMaskConnector?.id,
      ].filter(Boolean)
    );

    return connectors.filter((connector) => {
      if (excludedIds.has(connector.id)) {
        return false;
      }

      const name = connector.name.toLowerCase();
      const id = connector.id.toLowerCase();

      return (
        name.includes("wallet") ||
        name.includes("brave") ||
        name.includes("rabby") ||
        name.includes("okx") ||
        id.includes(".") ||
        id.includes("wallet")
      );
    });
  }, [
    connectors,
    browserConnector,
    walletConnectConnector,
    baseConnector,
    metaMaskConnector,
  ]);

  /*
   * IMPORTANT:
   * "injected" by itself does NOT mean a wallet exists.
   *
   * Browser Wallet gets a green dot only if an actual
   * EIP-6963 wallet was discovered.
   */
  const browserWalletAvailable =
    !!metaMaskConnector || detectedWallets.length > 0;

  const formattedBalance = useMemo(() => {
    if (balance === undefined) return "0.00";

    const value = Number(balance) / 1_000_000;

    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  }, [balance]);

  const isWrongNetwork =
    isConnected && chain?.id !== arcTestnet.id;

  const handleConnect = async (
    connector: typeof connectors[number]
  ) => {
    try {
      connect({ connector });

      setShowWallets(false);
    } catch {
      // Wagmi handles the connection error.
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleSwitchNetwork = async () => {
    try {
      switchChain({
        chainId: arcTestnet.id,
      });
    } catch {
      // Wagmi handles the error.
    }
  };

  const handleSend = async () => {
    if (!address) return;

    if (!isAddress(recipient)) {
      alert("Please enter a valid recipient address.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (isWrongNetwork) {
      await handleSwitchNetwork();
      return;
    }

    try {
      const value = parseUnits(amount, 6);

      writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "transfer",
        args: [recipient as `0x${string}`, value],
        chainId: arcTestnet.id,
      });
    } catch {
      // Wagmi handles the error.
    }
  };

  const getErrorMessage = () => {
    if (connectError) {
      return connectError.message;
    }

    if (switchError) {
      return switchError.message;
    }

    if (sendError) {
      return sendError.message;
    }

    return null;
  };

  const errorMessage = getErrorMessage();

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              AlabaamaFi
            </h1>

            <p className="text-xs text-white/40">
              Built on Arc
            </p>
          </div>

          {!isConnected ? (
            <button
              onClick={() => setShowWallets(true)}
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Connect Wallet
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-2.5 text-sm font-medium transition hover:bg-white/[0.08]"
            >
              {address
                ? `${address.slice(0, 6)}...${address.slice(-4)}`
                : "Disconnect"}
            </button>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-12 pt-20">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/60">
            Arc Testnet
          </div>

          <h2 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Simple USDC
            <br />
            transfers on Arc.
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-7 text-white/50 sm:text-lg">
            Connect your wallet, check your Arc Testnet USDC
            balance, and send USDC to another wallet.
          </p>
        </div>
      </section>

      {/* Main Card */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        {!isConnected ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <h3 className="text-xl font-semibold">
              Get started
            </h3>

            <p className="mt-2 text-sm text-white/50">
              Connect a wallet to use AlabaamaFi.
            </p>

            <button
              onClick={() => setShowWallets(true)}
              className="mt-6 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Balance */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white/40">
                    Your balance
                  </p>

                  <h3 className="mt-3 text-4xl font-bold">
                    {formattedBalance}

                    <span className="ml-2 text-lg font-medium text-white/40">
                      USDC
                    </span>
                  </h3>
                </div>

                <button
                  onClick={() => refetchBalance()}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 transition hover:bg-white/[0.05]"
                >
                  Refresh
                </button>
              </div>

              <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-white/40">
                  Connected wallet
                </p>

                <p className="mt-2 break-all text-sm text-white/80">
                  {address}
                </p>
              </div>

              {isWrongNetwork && (
                <button
                  onClick={handleSwitchNetwork}
                  disabled={isSwitching}
                  className="mt-5 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
                >
                  {isSwitching
                    ? "Switching..."
                    : "Switch to Arc Testnet"}
                </button>
              )}
            </div>

            {/* Send */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <h3 className="text-xl font-semibold">
                Send USDC
              </h3>

              <p className="mt-2 text-sm text-white/50">
                Send USDC directly on Arc Testnet.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-xs text-white/40">
                    Recipient
                  </label>

                  <input
                    value={recipient}
                    onChange={(e) =>
                      setRecipient(e.target.value)
                    }
                    placeholder="0x..."
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs text-white/40">
                    Amount
                  </label>

                  <input
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value)
                    }
                    type="number"
                    min="0"
                    step="0.000001"
                    placeholder="0.00"
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-white/30"
                  />
                </div>

                <button
                  onClick={handleSend}
                  disabled={
                    isSending ||
                    isConfirming ||
                    isWrongNetwork
                  }
                  className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSending
                    ? "Confirm in wallet..."
                    : isConfirming
                    ? "Confirming transaction..."
                    : isWrongNetwork
                    ? "Switch to Arc Testnet"
                    : "Send USDC"}
                </button>
              </div>

              {isConfirmed && hash && (
                <div className="mt-5 rounded-xl border border-green-400/20 bg-green-400/5 p-4">
                  <p className="text-sm font-medium text-green-400">
                    Transaction confirmed ✓
                  </p>

                  <a
                    href={`https://testnet.arcscan.app/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block text-xs text-white/50 underline"
                  >
                    View on Arcscan
                  </a>
                </div>
              )}

              {errorMessage && (
                <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/5 p-4">
                  <p className="break-words text-xs text-red-300">
                    {errorMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center text-xs text-white/30">
          AlabaamaFi · Arc Testnet
        </div>
      </footer>

      {/* Wallet Modal */}
      {showWallets && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={() => setShowWallets(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b0b0b] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">
                  Connect Wallet
                </h3>

                <p className="mt-1 text-xs text-white/40">
                  Choose how you want to connect
                </p>
              </div>

              <button
                onClick={() => setShowWallets(false)}
                className="rounded-lg px-3 py-2 text-white/40 transition hover:bg-white/5 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {/* Browser Wallet */}
              <button
                onClick={() =>
                  browserConnector &&
                  handleConnect(browserConnector)
                }
                disabled={!browserConnector || isConnecting}
                className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <WalletLogo
                  name="Browser Wallet"
                  id="injected"
                />

                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Browser Wallet
                  </p>

                  <p className="mt-1 text-xs text-white/40">
                    {browserWalletAvailable
                      ? "Available in your browser"
                      : "No browser wallet detected"}
                  </p>
                </div>

                {/* Green only when an actual wallet is detected */}
                {browserWalletAvailable && (
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                )}
              </button>

              {/* WalletConnect */}
              <button
                onClick={() =>
                  walletConnectConnector &&
                  handleConnect(walletConnectConnector)
                }
                disabled={
                  !walletConnectConnector || isConnecting
                }
                className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <WalletLogo
                  name="WalletConnect"
                  id={walletConnectConnector?.id}
                  icon={walletConnectConnector?.icon}
                />

                <div className="flex-1">
                  <p className="text-sm font-medium">
                    WalletConnect
                  </p>

                  <p className="mt-1 text-xs text-white/40">
                    Connect with a mobile wallet
                  </p>
                </div>
              </button>

              {/* Base App */}
              <button
                onClick={() =>
                  baseConnector &&
                  handleConnect(baseConnector)
                }
                disabled={!baseConnector || isConnecting}
                className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <WalletLogo
                  name="Base App"
                  id={baseConnector?.id}
                  icon={baseConnector?.icon}
                />

                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Base App
                  </p>

                  <p className="mt-1 text-xs text-white/40">
                    Coinbase Wallet
                  </p>
                </div>
              </button>

              {/* MetaMask */}
              <button
                onClick={() =>
                  metaMaskConnector &&
                  handleConnect(metaMaskConnector)
                }
                disabled={
                  !metaMaskConnector || isConnecting
                }
                className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <WalletLogo
                  name="MetaMask"
                  id={metaMaskConnector?.id}
                  icon={metaMaskConnector?.icon}
                />

                <div className="flex-1">
                  <p className="text-sm font-medium">
                    MetaMask
                  </p>

                  <p className="mt-1 text-xs text-white/40">
                    {metaMaskConnector
                      ? "Available in your browser"
                      : "Not detected"}
                  </p>
                </div>

                {metaMaskConnector && (
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                )}
              </button>
            </div>

            {/* Detected browser wallets */}
            {detectedWallets.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 px-1 text-xs font-medium text-white/40">
                  Available in your browser
                </p>

                <div className="space-y-2">
                  {detectedWallets.map((connector) => (
                    <button
                      key={connector.id}
                      onClick={() =>
                        handleConnect(connector)
                      }
                      disabled={isConnecting}
                      className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.08] disabled:opacity-60"
                    >
                      <WalletLogo
                        name={connector.name}
                        id={connector.id}
                        icon={connector.icon}
                      />

                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {connector.name}
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                          Available in your browser
                        </p>
                      </div>

                      <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
    }
