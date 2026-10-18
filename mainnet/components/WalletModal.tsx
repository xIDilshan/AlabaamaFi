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
  "flex min-h-[56px] w-full items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-[#0a0c10] px-3.5 py-2.5 text-left transition-colors duration-200 hover:border-[#2b6cff]/25 hover:bg-[#0d1117] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50";

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-white/30">
    <path d="m9 6 6 6-6 6" />
  </svg>
);

/* one wallet row: logo, name, arrow. `installed` puts a green dot on the logo (the wallet is available in this browser) */
function Row({
  name,
  icon,
  installed,
  disabled,
  onClick,
}: {
  name: string;
  icon?: string;
  installed?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} disabled={disabled} className={ROW_CLASS}>
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative shrink-0">
          <WalletLogo name={name} icon={icon} size={30} />

          {installed && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 translate-x-1/4 translate-y-1/4 rounded-full border-2 border-[#040506] bg-green-500" />
          )}
        </div>

        <p className="truncate text-[15px] font-semibold">{name}</p>
      </div>

      <Arrow />
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

  const phantomConnector = useMemo(() => {
    return connectors.find((connector) => {
      const { name, id } = lower(connector);
      return name.includes("phantom") || id.includes("phantom");
    });
  }, [connectors]);

  const browserConnector = useMemo(() => {
    return connectors.find((connector) => {
      const { name, id } = lower(connector);
      return id === "injected" || name === "injected" || name === "browser wallet";
    });
  }, [connectors]);

  /* the wallets installed in this browser that are not one of the four main wallets (they announce themselves, so wagmi lists each one) */
  const installedOthers = useMemo(() => {
    const main = new Set(
      [walletConnectConnector?.id, coinbaseConnector?.id, metaMaskConnector?.id, phantomConnector?.id, browserConnector?.id].filter(Boolean)
    );

    return connectors.filter((connector) => {
      if (main.has(connector.id)) return false;
      const { name } = lower(connector);
      if (name.includes("coinbase") || name.includes("metamask") || name.includes("phantom")) return false;
      return connector.type === "injected";
    });
  }, [connectors, walletConnectConnector, coinbaseConnector, metaMaskConnector, phantomConnector, browserConnector]);

  const hasEthereum =
    typeof window !== "undefined" && !!(window as unknown as { ethereum?: unknown }).ethereum;

  // "Browser Wallet" only appears when the browser really has a wallet
  const showBrowserWallet =
    !!browserConnector &&
    (hasEthereum || installedOthers.length > 0 || !!metaMaskConnector || !!phantomConnector);

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

  const handlePhantomClick = () => {
    if (phantomConnector) {
      handleConnect(phantomConnector);
      return;
    }

    if (isMobileDevice()) {
      // open this site inside the Phantom app
      const url = encodeURIComponent(window.location.href);
      const ref = encodeURIComponent(window.location.origin);
      window.location.href = `https://phantom.app/ul/browse/${url}?ref=${ref}`;
      return;
    }

    window.open("https://phantom.app/download", "_blank", "noopener,noreferrer");
  };

  if (!isOpen || isConnected) {
    return null;
  }

  const hasInstalledGroup = showBrowserWallet || installedOthers.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/90 px-3 py-4 backdrop-blur-sm sm:px-6 sm:py-8">
      <div className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-sm overflow-y-auto rounded-3xl border border-white/[0.07] bg-[#040506] p-4 shadow-2xl shadow-black/80 sm:max-h-[90vh] sm:p-5">
        {/* centered title, close button in the corner */}
        <div className="relative mb-4 flex min-h-[40px] items-center justify-center">
          <h3 className="text-lg font-semibold">
            Connect Wallet
          </h3>

          <button
            onClick={onClose}
            className="absolute right-0 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-base text-white/45 transition hover:bg-white/[0.04] hover:text-white active:scale-95"
            aria-label="Close wallet modal"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2">
          {/* installed in this browser: the browser wallet and every other installed wallet, above the main wallets */}
          {showBrowserWallet && browserConnector && (
            <Row
              name="Browser Wallet"
              installed
              disabled={isPending}
              onClick={() => handleConnect(browserConnector)}
            />
          )}

          {installedOthers.map((connector) => (
            <Row
              key={connector.uid}
              name={connector.name}
              icon={connector.icon}
              installed
              disabled={isPending}
              onClick={() => handleConnect(connector)}
            />
          ))}

          {hasInstalledGroup && <div className="!my-3 h-px bg-white/[0.07]" />}

          {/* the four main wallets */}
          <Row
            name="MetaMask"
            installed={!!metaMaskConnector}
            disabled={isPending}
            onClick={handleMetaMaskClick}
          />

          {walletConnectConnector && (
            <Row
              name="WalletConnect"
              disabled={isPending}
              onClick={handleWalletConnect}
            />
          )}

          {coinbaseConnector && (
            <Row
              name="Coinbase Wallet"
              disabled={isPending}
              onClick={() => handleConnect(coinbaseConnector)}
            />
          )}

          <Row
            name="Phantom"
            installed={!!phantomConnector}
            disabled={isPending}
            onClick={handlePhantomClick}
          />
        </div>

        {connectError && (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
            <p className="break-words text-sm font-medium leading-5 text-red-400">
              {getFriendlyErrorMessage(
                connectError.message
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
