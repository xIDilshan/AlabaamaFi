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
import { arcTestnet } from "../lib/wagmi";

const USDC_ADDRESS =
  "0x3600000000000000000000000000000000000000";

const USDC_ABI = [
  {
    constant: true,
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
] as const;

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

function friendlyError(error: unknown) {
  if (!error) return "";

  const message =
    error instanceof Error
      ? error.message
      : String(error);

  if (
    message.toLowerCase().includes("user rejected") ||
    message.toLowerCase().includes("user denied")
  ) {
    return "Transaction was rejected.";
  }

  if (
    message.toLowerCase().includes("insufficient funds")
  ) {
    return "Insufficient USDC for this transaction.";
  }

  return message;
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
    data: balance,
    isLoading: balanceLoading,
  } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: arcTestnet.id,
    query: {
      enabled: Boolean(address),
    },
  });

  const {
    writeContract,
    data: txHash,
    isPending: isSending,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

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

      if (
        id === "injected" ||
        name === "injected" ||
        name === "browser wallet"
      ) {
        return false;
      }

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

  const formattedBalance = useMemo(() => {
    if (balance === undefined) return "0.00";

    const value = Number(balance) / 1_000_000;

    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [balance]);

  function handleConnect(connector: (typeof connectors)[number]) {
    setError("");

    connect(
      { connector },
      {
        onSuccess: () => {
          setShowWallets(false);
        },
      }
    );
  }

  function handleWalletButton() {
    if (isConnected) {
      disconnect();
      return;
    }

    setError("");
    setShowWallets(true);
  }

  async function handleSend() {
    setError("");

    if (!isConnected || !address) {
      setError("Please connect your wallet first.");
      return;
    }

    if (chainId !== arcTestnet.id) {
      try {
        await switchChain({
          chainId: arcTestnet.id,
        });
      } catch {
        setError("Please switch to Arc Testnet.");
        return;
      }
    }

    if (!isAddress(recipient)) {
      setError("Please enter a valid wallet address.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    try {
      const parsedAmount = parseUnits(amount, 6);

      writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "transfer",
        args: [recipient, parsedAmount],
        chainId: arcTestnet.id,
      });
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  const displayError =
    error ||
    friendlyError(connectError) ||
    friendlyError(writeError);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-5">
        {/* Header */}
        <header className="flex items-center justify-between py-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              AlabaamaFi
            </h1>

            <p className="text-xs text-white/40">
              Powered by Arc
            </p>
          </div>

          <button
            onClick={handleWalletButton}
            className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-medium transition hover:bg-white/[0.09]"
          >
            {isConnected && address
              ? `${address.slice(0, 6)}...${address.slice(-4)}`
              : "Connect Wallet"}
          </button>
        </header>

        {/* Wallet Modal */}
        {showWallets && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm"
            onClick={() => setShowWallets(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-5 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    Connect Wallet
                  </h2>

                  <p className="mt-1 text-xs text-white/40">
                    Choose a wallet to continue
                  </p>
                </div>

                <button
                  onClick={() => setShowWallets(false)}
                  className="text-xl text-white/40 transition hover:text-white"
                >
                  ×
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
                            title="Browser wallet detected"
                          />
                        )}
                      </div>

                      <div>
                        <p className="font-medium">
                          Browser Wallet
                        </p>

                        <p className="mt-1 text-xs text-white/30">
                          {detectedBrowserWallets.length > 0
                            ? "Available in your browser"
                            : "No browser wallet detected"}
                        </p>
                      </div>
                    </div>

                    <span className="text-sm text-white/30">
                      →
                    </span>
                  </button>
                )}

                {/* Detected Browser Wallets */}
                {detectedBrowserWallets.map((connector) => {
                  const name =
                    connector.name.toLowerCase();

                  let displayName = connector.name;

                  if (name.includes("brave")) {
                    displayName = "Brave Wallet";
                  } else if (name.includes("rabby")) {
                    displayName = "Rabby";
                  } else if (
                    name.includes("okx") ||
                    name.includes("okex")
                  ) {
                    displayName = "OKX Wallet";
                  }

                  const localLogo =
                    getWalletLogo(displayName);

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
                          {localLogo ? (
                            <img
                              src={localLogo}
                              alt=""
                              className="h-8 w-8 rounded-lg object-contain"
                            />
                          ) : connector.icon ? (
                            <img
                              src={connector.icon}
                              alt=""
                              className="h-8 w-8 rounded-lg object-contain"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sm">
                              W
                            </div>
                          )}

                          <span
                            className="absolute bottom-0 right-0 h-2.5 w-2.5 translate-x-1/4 translate-y-1/4 rounded-full border-2 border-zinc-950 bg-green-500"
                            title="Wallet detected"
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
                          Scan with your wallet
                        </p>
                      </div>
                    </div>

                    <span className="text-sm text-white/30">
                      →
                    </span>
                  </button>
                )}

                {/* MetaMask */}
                <button
                  onClick={() =>
                    metaMaskConnector &&
                    handleConnect(metaMaskConnector)
                  }
                  disabled={!metaMaskConnector || isPending}
                  className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src="/wallets/metamask.svg"
                        alt=""
                        className="h-8 w-8 rounded-lg object-contain"
                      />

                      {metaMaskConnector && (
                        <span
                          className="absolute bottom-0 right-0 h-2.5 w-2.5 translate-x-1/4 translate-y-1/4 rounded-full border-2 border-zinc-950 bg-green-500"
                          title="MetaMask available"
                        />
                      )}
                    </div>

                    <div>
                      <p className="font-medium">
                        MetaMask
                      </p>

                      <p className="mt-1 text-xs text-white/30">
                        {metaMaskConnector
                          ? "Available in your browser"
                          : "Not detected"}
                      </p>
                    </div>
                  </div>

                  <span className="text-sm text-white/30">
                    →
                  </span>
                </button>

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
                          Connect with Coinbase
                        </p>
                      </div>
                    </div>

                    <span className="text-sm text-white/30">
                      →
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hero */}
        <section className="flex flex-1 items-center justify-center py-20">
          <div className="w-full max-w-2xl text-center">
            <p className="mb-4 text-sm font-medium text-white/40">
              ARC TESTNET
            </p>

            <h2 className="text-5xl font-semibold tracking-tight sm:text-6xl">
              Simple.
              <br />
              On-chain.
            </h2>

            <p className="mx-auto mt-6 max-w-lg text-base leading-7 text-white/50">
              Send USDC on Arc Testnet with a simple,
              clean interface.
            </p>

            {!isConnected && (
              <button
                onClick={() => setShowWallets(true)}
                className="mt-8 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </section>

        {/* Send Card */}
        <section className="pb-20">
          <div className="mx-auto w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Send USDC
                </h3>

                <p className="mt-1 text-xs text-white/40">
                  Arc Testnet
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-white/30">
                  Balance
                </p>

                <p className="mt-1 text-sm font-medium">
                  {balanceLoading
                    ? "Loading..."
                    : `${formattedBalance} USDC`}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs text-white/40">
                  Recipient
                </label>

                <input
                  value={recipient}
                  onChange={(event) =>
                    setRecipient(event.target.value)
                  }
                  placeholder="0x..."
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none transition placeholder:text-white/20 focus:border-white/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs text-white/40">
                  Amount
                </label>

                <div className="relative">
                  <input
                    value={amount}
                    onChange={(event) =>
                      setAmount(event.target.value)
                    }
                    type="number"
                    min="0"
                    step="0.000001"
                    placeholder="0.00"
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 pr-20 text-sm outline-none transition placeholder:text-white/20 focus:border-white/20"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/40">
                    USDC
                  </span>
                </div>
              </div>

              {displayError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                  {displayError}
                </div>
              )}

              {isConfirmed && txHash && (
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-400">
                  Transaction confirmed.
                </div>
              )}

              <button
                onClick={handleSend}
                disabled={
                  !isConnected ||
                  isSending ||
                  isConfirming
                }
                className="w-full rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {!isConnected
                  ? "Connect Wallet"
                  : isSending
                  ? "Confirm in wallet..."
                  : isConfirming
                  ? "Confirming..."
                  : "Send USDC"}
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-6 text-center text-xs text-white/30">
          Built on Arc Testnet
        </footer>
      </div>
    </main>
  );
    }
