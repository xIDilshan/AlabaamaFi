"use client";

import { useMemo } from "react";
import { useAccount, useConnect } from "wagmi";

type WalletModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

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

  return "Something went wrong. Please try again.";
}

export default function WalletModal({
  isOpen,
  onClose,
}: WalletModalProps) {
  const { isConnected } = useAccount();

  const {
    connectors,
    connect,
    isPending,
    error: connectError,
  } = useConnect();

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

  const isMobileDevice = () => {
    if (typeof window === "undefined") {
      return false;
    }

    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(
      navigator.userAgent
    );
  };

  const openMetaMaskMobile = () => {
    if (typeof window === "undefined") {
      return;
    }

    const currentUrl =
      window.location.host +
      window.location.pathname +
      window.location.search;

    const metamaskUrl =
      `https://metamask.app.link/dapp/${currentUrl}`;

    window.location.href = metamaskUrl;
  };

  const openMetaMaskInstall = () => {
    window.open(
      "https://metamask.io/download/",
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleConnect = (
    connector: (typeof connectors)[number]
  ) => {
    connect(
      { connector },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const handleMetaMaskClick = () => {
    if (isMobileDevice()) {
      openMetaMaskMobile();
      return;
    }

    if (metaMaskConnector) {
      handleConnect(metaMaskConnector);
      return;
    }

    openMetaMaskInstall();
  };

  if (!isOpen || isConnected) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/90 px-3 py-4 backdrop-blur-sm sm:px-6 sm:py-8">
      <div className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-sm overflow-y-auto rounded-3xl border border-white/[0.07] bg-[#040506] p-4 shadow-2xl shadow-black/80 sm:max-h-[90vh] sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4 sm:mb-6">
          <div className="min-w-0">
            <h3 className="text-xl font-black">
              Connect Wallet
            </h3>

            <p className="mt-1 text-sm font-medium text-white/35">
              Choose a wallet to continue
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white/45 transition hover:bg-white/[0.04] hover:text-white active:scale-95"
            aria-label="Close wallet modal"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {browserConnector && (
            <button
              onClick={() =>
                handleConnect(browserConnector)
              }
              disabled={isPending}
              className="flex min-h-[72px] w-full items-center justify-between gap-3 rounded-full border border-white/[0.07] bg-[#060709] px-4 py-3.5 text-left transition-all duration-200 hover:border-[#2b6cff]/18 hover:bg-[#0a0d12] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative shrink-0">
                  <img
                    src="/wallets/browser.svg"
                    alt=""
                    className="h-8 w-8 rounded-lg object-contain"
                  />

                  {detectedBrowserWallets.length > 0 && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 translate-x-1/4 translate-y-1/4 rounded-full border-2 border-[#040506] bg-green-500" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="font-black">
                    Browser Wallet
                  </p>

                  <p className="mt-1 text-xs font-medium leading-5 text-white/25">
                    MetaMask and other browser wallets
                  </p>
                </div>
              </div>

              <span className="shrink-0 text-sm font-bold text-white/25">
                •
              </span>
            </button>
          )}

          {detectedBrowserWallets.map((connector) => {
            const name =
              connector.name.toLowerCase();

            let displayName =
              connector.name;

            let logo =
              connector.icon || null;

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
                className="flex min-h-[72px] w-full items-center justify-between gap-3 rounded-full border border-white/[0.07] bg-[#060709] px-4 py-3.5 text-left transition-all duration-200 hover:border-[#2b6cff]/18 hover:bg-[#0a0d12] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative shrink-0">
                    {logo ? (
                      <img
                        src={logo}
                        alt=""
                        className="h-8 w-8 rounded-lg object-contain"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0b1017] text-sm font-bold">
                        ◇
                      </div>
                    )}

                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 translate-x-1/4 translate-y-1/4 rounded-full border-2 border-[#040506] bg-green-500" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-black">
                      {displayName}
                    </p>

                    <p className="mt-1 text-xs font-medium leading-5 text-white/25">
                      Available in your browser
                    </p>
                  </div>
                </div>

                <span className="shrink-0 text-sm font-bold text-white/25">
                  •
                </span>
              </button>
            );
          })}

          {walletConnectConnector && (
            <button
              onClick={() =>
                handleConnect(
                  walletConnectConnector
                )
              }
              disabled={isPending}
              className="flex min-h-[72px] w-full items-center justify-between gap-3 rounded-full border border-white/[0.07] bg-[#060709] px-4 py-3.5 text-left transition-all duration-200 hover:border-[#2b6cff]/18 hover:bg-[#0a0d12] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src="/wallets/walletconnect.svg"
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-lg object-contain"
                />

                <div className="min-w-0">
                  <p className="font-black">
                    WalletConnect
                  </p>

                  <p className="mt-1 text-xs font-medium leading-5 text-white/25">
                    Scan with a mobile wallet
                  </p>
                </div>
              </div>

              <span className="shrink-0 text-sm font-bold text-white/25">
                •
              </span>
            </button>
          )}

          <button
            onClick={handleMetaMaskClick}
            disabled={isPending}
            className="flex min-h-[72px] w-full items-center justify-between gap-3 rounded-full border border-white/[0.07] bg-[#060709] px-4 py-3.5 text-left transition-all duration-200 hover:border-[#2b6cff]/18 hover:bg-[#0a0d12] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative shrink-0">
                <img
                  src="/wallets/metamask.svg"
                  alt=""
                  className="h-8 w-8 rounded-lg object-contain"
                />

                {metaMaskConnector && (
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 translate-x-1/4 translate-y-1/4 rounded-full border-2 border-[#040506] bg-green-500" />
                )}
              </div>

              <div className="min-w-0">
                <p className="font-black">
                  MetaMask
                </p>

                <p className="mt-1 text-xs font-medium leading-5 text-white/25">
                  {isMobileDevice()
                    ? "Open in MetaMask"
                    : metaMaskConnector
                    ? "Available in your browser"
                    : "Install MetaMask"}
                </p>
              </div>
            </div>

            <span className="shrink-0 text-sm font-bold text-white/25">
              •
            </span>
          </button>

          {coinbaseConnector && (
            <button
              onClick={() =>
                handleConnect(
                  coinbaseConnector
                )
              }
              disabled={isPending}
              className="flex min-h-[72px] w-full items-center justify-between gap-3 rounded-full border border-white/[0.07] bg-[#060709] px-4 py-3.5 text-left transition-all duration-200 hover:border-[#2b6cff]/18 hover:bg-[#0a0d12] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src="/wallets/base.svg"
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-lg object-contain"
                />

                <div className="min-w-0">
                  <p className="font-black">
                    Coinbase Wallet
                  </p>

                  <p className="mt-1 text-xs font-medium leading-5 text-white/25">
                    Connect with Coinbase Wallet
                  </p>
                </div>
              </div>

              <span className="shrink-0 text-sm font-bold text-white/25">
                •
              </span>
            </button>
          )}
        </div>

        {connectError && (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
            <p className="break-words text-sm font-semibold leading-5 text-red-400">
              {getFriendlyErrorMessage(
                connectError.message
              )}
            </p>
          </div>
        )}

        <p className="mt-5 text-center text-xs font-medium leading-5 text-white/25">
          WalletConnect supports many mobile and desktop wallets.
        </p>
      </div>
    </div>
  );
}
