"use client";

import { useMemo } from "react";
import { useAccount, useConnect } from "wagmi";
import { WalletLogo } from "@/components/WalletLogo";

type WalletModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type ConnectorItem = ReturnType<typeof useConnect>["connectors"][number];

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

const ROW_CLASS =
  "flex min-h-[72px] w-full items-center justify-between gap-3 rounded-full border border-white/[0.07] bg-[#060709] px-4 py-3.5 text-left transition-all duration-200 hover:border-[#2b6cff]/18 hover:bg-[#0a0d12] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50";

/* one wallet row. `installed` puts the green dot on the logo, to show the wallet is available in this browser */
function Row({
  name,
  icon,
  sub,
  installed,
  disabled,
  onClick,
}: {
  name: string;
  icon?: string;
  sub: string;
  installed?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} disabled={disabled} className={ROW_CLASS}>
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative shrink-0">
          <WalletLogo name={name} icon={icon} size={32} />

          {installed && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 translate-x-1/4 translate-y-1/4 rounded-full border-2 border-[#040506] bg-green-500" />
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate font-black">{name}</p>

          <p className="mt-1 text-xs font-medium leading-5 text-white/25">
            {sub}
          </p>
        </div>
      </div>

      <span className="shrink-0 text-sm font-bold text-white/25">•</span>
    </button>
  );
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

  const lower = (c: ConnectorItem) => ({
    name: (c.name || "").toLowerCase(),
    id: (c.id || "").toLowerCase(),
  });

  const walletConnectConnector = useMemo(() => {
    return connectors.find((connector) => {
      const { name, id } = lower(connector);
      return name.includes("walletconnect") || id.includes("walletconnect");
    });
  }, [connectors]);

  const coinbaseConnector = useMemo(() => {
    return connectors.find((connector) => {
      const { name, id } = lower(connector);
      return name.includes("coinbase") || id.includes("coinbase");
    });
  }, [connectors]);

  const metaMaskConnector = useMemo(() => {
    return connectors.find((connector) => {
      const { name, id } = lower(connector);
      return name.includes("metamask") || id.includes("metamask") || id === "io.metamask";
    });
  }, [connectors]);

  const browserConnector = useMemo(() => {
    return connectors.find((connector) => {
      const { name, id } = lower(connector);
      return id === "injected" || name === "injected" || name === "browser wallet";
    });
  }, [connectors]);

  /* every other wallet that is installed in this browser (they announce themselves, so wagmi lists each one) */
  const detectedBrowserWallets = useMemo(() => {
    const excluded = new Set(
      [walletConnectConnector?.id, coinbaseConnector?.id, metaMaskConnector?.id, browserConnector?.id].filter(Boolean)
    );

    return connectors.filter((connector) => {
      if (excluded.has(connector.id)) return false;
      return connector.type === "injected";
    });
  }, [connectors, walletConnectConnector, coinbaseConnector, metaMaskConnector, browserConnector]);

  const isDetected = (word: string) =>
    detectedBrowserWallets.some((c) => (c.name || "").toLowerCase().includes(word));

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

  const handleConnect = (connector: ConnectorItem) => {
    connect(
      { connector },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  /* WalletConnect draws its own QR code window, so this window closes first */
  const handleWalletConnect = () => {
    if (!walletConnectConnector) return;
    onClose();
    connect({ connector: walletConnectConnector });
  };

  const handleMetaMaskClick = () => {
    // MetaMask is installed (a computer, or inside the MetaMask app browser): connect right away
    if (metaMaskConnector) {
      handleConnect(metaMaskConnector);
      return;
    }

    // a phone without MetaMask in the browser: open this site inside the MetaMask app
    if (isMobileDevice()) {
      openMetaMaskMobile();
      return;
    }

    openMetaMaskInstall();
  };

  if (!isOpen || isConnected) {
    return null;
  }

  const showBinance = !!walletConnectConnector && !isDetected("binance");
  const showGate = !!walletConnectConnector && !isDetected("gate");

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
          {/* the wallet in this browser (a green dot means at least one wallet is installed) */}
          {browserConnector && (
            <Row
              name="Browser Wallet"
              sub="MetaMask and other browser wallets"
              installed={detectedBrowserWallets.length > 0 || !!metaMaskConnector}
              disabled={isPending}
              onClick={() => handleConnect(browserConnector)}
            />
          )}

          {/* every other wallet installed in this browser */}
          {detectedBrowserWallets.map((connector) => (
            <Row
              key={connector.uid}
              name={connector.name}
              icon={connector.icon}
              sub="Available in your browser"
              installed
              disabled={isPending}
              onClick={() => handleConnect(connector)}
            />
          ))}

          {walletConnectConnector && (
            <Row
              name="WalletConnect"
              sub="Scan the QR code with a mobile wallet"
              disabled={isPending}
              onClick={handleWalletConnect}
            />
          )}

          <Row
            name="MetaMask"
            sub={
              metaMaskConnector
                ? "Available in your browser"
                : isMobileDevice()
                ? "Open in MetaMask"
                : "Install MetaMask"
            }
            installed={!!metaMaskConnector}
            disabled={isPending}
            onClick={handleMetaMaskClick}
          />

          {coinbaseConnector && (
            <Row
              name="Coinbase Wallet"
              sub="Connect with Coinbase Wallet"
              disabled={isPending}
              onClick={() => handleConnect(coinbaseConnector)}
            />
          )}

          {/* exchange wallets: they connect through WalletConnect (unless installed in this browser, then they are listed above) */}
          {(showBinance || showGate) && (
            <p className="px-2 pt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/25">
              Exchange wallets
            </p>
          )}

          {showBinance && (
            <Row
              name="Binance Wallet"
              sub="Connect with the Binance app"
              disabled={isPending}
              onClick={handleWalletConnect}
            />
          )}

          {showGate && (
            <Row
              name="Gate Wallet"
              sub="Connect with the Gate app"
              disabled={isPending}
              onClick={handleWalletConnect}
            />
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
