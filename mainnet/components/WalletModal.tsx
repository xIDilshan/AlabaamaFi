"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useAccount, useConnect } from "wagmi";
import { WalletLogo } from "@/components/WalletLogo";

type WalletModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type ConnectorItem = ReturnType<typeof useConnect>["connectors"][number];

/* the second card (the QR code): `getUrl` is where "Get wallet" goes (left out for WalletConnect) */
type QrView = { name: string; getUrl?: string };

function getFriendlyErrorMessage(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("user rejected") ||
    lowerMessage.includes("user denied") ||
    lowerMessage.includes("connection reqest reset")
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

/* ---------- where "Get wallet" goes (the Chrome Web Store page; other browsers get the wallet's own site) ---------- */
const GET_WALLET = {
  metamask: {
    chrome: "https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn",
    site: "https://metamask.io/download/",
  },
  binance: {
    chrome: "https://chromewebstore.google.com/detail/binance-wallet/cadiboklkpojfamcoggejbbdjcoiljjk",
    site: "https://www.binance.com/en/web3wallet",
  },
};
const getWalletUrl = (w: keyof typeof GET_WALLET) =>
  typeof navigator !== "undefined" && /Chrome|Chromium|Edg\//.test(navigator.userAgent) ? GET_WALLET[w].chrome : GET_WALLET[w].site;

const isMobileDevice = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(
    navigator.userAgent
  );
};

const ROW_CLASS =
  "flex min-h-[58px] w-full items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-[#0a0c10] px-3.5 py-2.5 text-left transition-colors duration-200 hover:border-[#2b6cff]/25 hover:bg-[#0d1117] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50";

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-white/30">
    <path d="m9 6 6 6-6 6" />
  </svg>
);

/* the header of each card: something small on the left, the title in the middle, the cross on the right (all on one line) */
function CardHeader({ left, title, onClose }: { left: ReactNode; title: string; onClose: () => void }) {
  return (
    <div className="mb-4 grid min-h-[40px] grid-cols-[40px_1fr_40px] items-center">
      <div className="flex h-10 w-10 items-center justify-center">{left}</div>
      <h3 className="text-center text-lg font-semibold">{title}</h3>
      <button
        onClick={onClose}
        className="flex h-10 w-10 items-center justify-center rounded-full text-base text-white/45 transition hover:bg-white/[0.04] hover:text-white active:scale-95"
        aria-label="Close wallet modal"
      >
        ✕
      </button>
    </div>
  );
}

const WalletGlyph = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-white/55">
    <path d="M3 7a2 2 0 0 1 2-2h13v4M3 7v10a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2ZM16.5 14h.01" />
  </svg>
);

/* one wallet row: logo, name, arrow.
   `dot` puts a green availability dot on the top corner of the logo. The logo sits in a fixed 36px box, so every name starts at the same place. */
function Row({
  name,
  icon,
  dot,
  disabled,
  onClick,
}: {
  name: string;
  icon?: string;
  dot?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const logoSize = name === "Browser Wallet" ? 34 : 30;
  return (
    <button onClick={onClick} disabled={disabled} className={ROW_CLASS}>
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center">
          <div className="relative">
            <WalletLogo name={name} icon={icon} size={logoSize} />

            {dot && (
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#040506] bg-green-500" />
            )}
          </div>
        </div>

        <p className="truncate text-[15px] font-semibold leading-none">{name}</p>
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
    reset,
    error: connectError,
  } = useConnect();

  const [qr, setQr] = useState<QrView | null>(null); // null = the wallet list, otherwise the QR card is shown
  const [uri, setUri] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const binanceConnector = useMemo(() => {
    return connectors.find((connector) => {
      const { name, id } = lower(connector);
      return name.includes("binance") || id.includes("binance");
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
      [walletConnectConnector?.id, coinbaseConnector?.id, metaMaskConnector?.id, binanceConnector?.id, browserConnector?.id].filter(Boolean)
    );

    return connectors.filter((connector) => {
      if (main.has(connector.id)) return false;
      const { name } = lower(connector);
      if (name.includes("coinbase") || name.includes("metamask") || name.includes("binance")) return false;
      return connector.type === "injected";
    });
  }, [connectors, walletConnectConnector, coinbaseConnector, metaMaskConnector, binanceConnector, browserConnector]);

  const hasEthereum =
    typeof window !== "undefined" && !!(window as unknown as { ethereum?: unknown }).ethereum;

  // "Browser Wallet" only appears when the browser really has a wallet
  const showBrowserWallet =
    !!browserConnector &&
    (hasEthereum || installedOthers.length > 0 || !!metaMaskConnector || !!binanceConnector);

  /* WalletConnect gives out its pairing link while it connects; the QR card draws it */
  useEffect(() => {
    if (!walletConnectConnector) return;
    const onMessage = (m: { type: string; data?: unknown }) => {
      if (m?.type === "display_uri" && typeof m.data === "string") setUri(m.data);
    };
    walletConnectConnector.emitter.on("message", onMessage);
    return () => {
      walletConnectConnector.emitter.off("message", onMessage);
    };
  }, [walletConnectConnector]);

  /* start fresh each time the window is opened */
  useEffect(() => {
    if (!isOpen) {
      setQr(null);
      setUri(null);
      setCopied(false);
    }
  }, [isOpen]);

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

  /* slide to the QR card and start the WalletConnect connection (the QR code appears as soon as the link is ready) */
  const showQrCard = (view: QrView) => {
    if (!walletConnectConnector) return;
    reset();
    setUri(null);
    setCopied(false);
    setQr(view);
    connect({ connector: walletConnectConnector }, { onSuccess: () => onClose() });
  };

  const backToList = () => {
    setQr(null);
    setUri(null);
    reset();
  };

  const copyLink = async () => {
    if (!uri) return;
    try {
      await navigator.clipboard.writeText(uri);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
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

    // a computer without MetaMask: slide to the QR card, with "Get wallet" for the Chrome Web Store
    showQrCard({ name: "MetaMask", getUrl: getWalletUrl("metamask") });
  };

  const handleBinanceClick = () => {
    if (binanceConnector) {
      handleConnect(binanceConnector);
      return;
    }
    showQrCard({ name: "Binance Wallet", getUrl: isMobileDevice() ? undefined : getWalletUrl("binance") });
  };

  if (!isOpen || isConnected) {
    return null;
  }

  const mobile = isMobileDevice();
  const hasInstalledGroup = showBrowserWallet || installedOthers.length > 0;
  const showQr = qr !== null;

  /* the two cards sit side by side; the visible one slides in, the other slides out */
  const panelStyle = (visible: boolean, offset: "-100%" | "100%"): CSSProperties => ({
    transform: visible ? "translateX(0)" : `translateX(${offset})`,
    visibility: visible ? "visible" : "hidden",
    transition: `transform .32s cubic-bezier(.32,.72,0,1), visibility 0s linear ${visible ? "0s" : ".32s"}`,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/55 px-3 py-4 backdrop-blur-[2px] sm:px-6 sm:py-8">
      {/* a click on the dim area closes the window */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative my-auto max-h-[calc(100vh-2rem)] w-full max-w-sm overflow-hidden rounded-3xl border border-white/[0.07] bg-[#040506] shadow-2xl shadow-black/60 sm:max-h-[90vh]">
        <div className="grid">
          {/* CARD 1: the wallets */}
          <div className="col-start-1 row-start-1 max-h-[calc(100vh-2rem)] overflow-y-auto p-4 sm:max-h-[90vh] sm:p-5" style={panelStyle(!showQr, "-100%")} aria-hidden={showQr}>
            <CardHeader left={<WalletGlyph />} title="Connect Wallet" onClose={onClose} />

            <div className="space-y-2">
              {/* installed in this browser: the browser wallet and every other installed wallet, above the main wallets */}
              {showBrowserWallet && browserConnector && (
                <Row name="Browser Wallet" dot disabled={isPending} onClick={() => handleConnect(browserConnector)} />
              )}

              {installedOthers.map((connector) => (
                <Row key={connector.uid} name={connector.name} icon={connector.icon} dot disabled={isPending} onClick={() => handleConnect(connector)} />
              ))}

              {hasInstalledGroup && <div className="!my-3 h-px bg-white/[0.07]" />}

              {/* the four main wallets */}
              <Row name="MetaMask" dot={!!metaMaskConnector} disabled={isPending && !showQr} onClick={handleMetaMaskClick} />

              {walletConnectConnector && (
                <Row name="WalletConnect" dot={mobile} onClick={() => showQrCard({ name: "WalletConnect" })} />
              )}

              {coinbaseConnector && (
                <Row name="Coinbase Wallet" dot disabled={isPending} onClick={() => handleConnect(coinbaseConnector)} />
              )}

              {(walletConnectConnector || binanceConnector) && (
                <Row name="Binance Wallet" dot={!!binanceConnector} disabled={isPending && !showQr} onClick={handleBinanceClick} />
              )}
            </div>

            {connectError && !showQr && (
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
                <p className="break-words text-sm font-medium leading-5 text-red-400">
                  {getFriendlyErrorMessage(connectError.message)}
                </p>
              </div>
            )}
          </div>

          {/* CARD 2: the QR code (and "Get wallet") */}
          <div className="col-start-1 row-start-1 max-h-[calc(100vh-2rem)] overflow-y-auto p-4 sm:max-h-[90vh] sm:p-5" style={panelStyle(showQr, "100%")} aria-hidden={!showQr}>
            <CardHeader
              left={
                <button onClick={backToList} aria-label="Back to the wallet list" className="flex h-10 w-10 items-center justify-center rounded-full text-white/55 transition hover:bg-white/[0.04] hover:text-white">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m15 6-6 6 6 6" />
                  </svg>
                </button>
              }
              title={qr?.name ?? ""}
              onClose={onClose}
            />

            <div className="flex flex-col items-center">
              <div className="rounded-2xl bg-white p-3">
                {uri ? (
                  <QRCodeSVG value={uri} size={208} level="M" bgColor="#ffffff" fgColor="#000000" />
                ) : (
                  <div className="h-[208px] w-[208px] animate-pulse rounded-lg bg-black/10" />
                )}
              </div>

              <p className="mt-4 text-center text-sm text-white/50">
                {mobile ? "Open your wallet app to connect" : qr ? `Scan this code with your ${qr.name === "WalletConnect" ? "mobile wallet" : qr.name + " app"}` : ""}
              </p>

              <div className="mt-4 grid w-full gap-2">
                {mobile && (
                  <button
                    onClick={() => uri && (window.location.href = uri)}
                    disabled={!uri}
                    className="flex min-h-[48px] items-center justify-center rounded-2xl bg-gradient-to-r from-[#13b8ff] via-[#1688f5] to-[#263be8] px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                  >
                    Open wallet app
                  </button>
                )}

                <button
                  onClick={copyLink}
                  disabled={!uri}
                  className="flex min-h-[48px] items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 text-sm font-semibold text-white/80 transition hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
                >
                  {copied ? "Copied" : "Copy link"}
                </button>

                {qr?.getUrl && (
                  <a
                    href={qr.getUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-[48px] items-center justify-center rounded-2xl border border-[#2b6cff]/30 bg-[#2b6cff]/10 px-4 text-sm font-semibold text-white transition hover:bg-[#2b6cff]/20"
                  >
                    Get wallet
                  </a>
                )}
              </div>

              {connectError && showQr && (
                <div className="mt-4 w-full rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
                  <p className="break-words text-sm font-medium leading-5 text-red-400">
                    {getFriendlyErrorMessage(connectError.message)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
