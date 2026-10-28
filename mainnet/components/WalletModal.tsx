g"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useAccount, useConnect } from "wagmi";
import { WalletLogo } from "@/components/WalletLogo";

type WalletModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type ConnectorItem = ReturnType<typeof useConnect>["connectors"][number];

type QrView = { name: string; getUrl?: string };

const ERROR_MESSAGE = "Something went wrong. Please try again.";

const friendlyError = (error: unknown): string => {
  const e = error as { name?: string; code?: number; message?: string; shortMessage?: string } | null;
  const text = `${e?.name ?? ""} ${e?.shortMessage ?? ""} ${e?.message ?? ""}`;
  if (e?.code === 4001 || /user rejected|rejected the request|user denied|user cancel/i.test(text)) return "You cancelled the request in your wallet.";
  if (/ProviderNotFound|provider not found|no provider/i.test(text)) return "No wallet was found in this browser. Open this site inside your wallet's browser, or use WalletConnect.";
  if (e?.code === -32002 || /already pending|already processing|request of type/i.test(text)) return "A request is already open in your wallet. Finish it there, then try again.";
  return ERROR_MESSAGE;
};

/* ---------- get wallet links ---------- */
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

function Row({
  name,
  icon,
  dot,
  installedWallet,
  disabled,
  onClick,
}: {
  name: string;
  icon?: string;
  dot?: boolean;
  installedWallet?: { name: string; icon?: string };
  disabled?: boolean;
  onClick: () => void;
}) {
  const logoSize = name === "Browser Wallet" ? 34 : 30;
  return (
    <button onClick={onClick} disabled={disabled} className={ROW_CLASS}>
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center">
          <div className="relative flex" style={{ width: logoSize, height: logoSize }}>
            <WalletLogo name={name} icon={icon} installed={installedWallet} size={logoSize} />

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

  useEffect(() => {
    if (connectError) console.error("Wallet connection failed:", connectError);
  }, [connectError]);

  const [qr, setQr] = useState<QrView | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [localError, setLocalError] = useState("");

  const listRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const [heights, setHeights] = useState<{ list: number; qr: number } | null>(null);

  const resetRef = useRef(reset);
  const isConnectedRef = useRef(isConnected);
  const isPendingRef = useRef(isPending);
  useEffect(() => {
    resetRef.current = reset;
    isConnectedRef.current = isConnected;
    isPendingRef.current = isPending;
  }, [reset, isConnected, isPending]);

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

  const browserIconWallet = useMemo(() => {
    const usual = ["metamask", "brave", "rabby", "phantom"];
    const all = [...installedOthers, metaMaskConnector, binanceConnector].filter(Boolean) as ConnectorItem[];
    const pick = all.find((c) => !usual.includes((c.name || "").toLowerCase().trim().split(/\s+/)[0])) ?? all[0];
    return pick ? { name: pick.name, icon: pick.icon } : undefined;
  }, [installedOthers, metaMaskConnector, binanceConnector]);

  const hasEthereum =
    typeof window !== "undefined" && !!(window as unknown as { ethereum?: unknown }).ethereum;

  const showBrowserWallet =
    !!browserConnector &&
    (hasEthereum || installedOthers.length > 0 || !!metaMaskConnector || !!binanceConnector);

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

  useEffect(() => {
    setQr(null);
    setUri(null);
    setCopied(false);
    setLocalError("");
    if (isOpen) resetRef.current();
    else setHeights(null);
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || isConnected) return;
    const measure = () => {
      const l = listRef.current?.offsetHeight ?? 0;
      const q = qrRef.current?.offsetHeight ?? 0;
      if (l) setHeights((h) => (h && h.list === l && h.qr === q ? h : { list: l, qr: q }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (listRef.current) ro.observe(listRef.current);
    if (qrRef.current) ro.observe(qrRef.current);
    return () => ro.disconnect();
  }, [isOpen, isConnected]);

  useEffect(() => {
    if (!isOpen) return;
    let timer: number | undefined;
    const onBack = () => {
      if (document.visibilityState !== "visible") return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (isPendingRef.current && !isConnectedRef.current) {
          resetRef.current();
          setLocalError(ERROR_MESSAGE);
        }
      }, 2000);
    };
    document.addEventListener("visibilitychange", onBack);
    window.addEventListener("pageshow", onBack);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onBack);
      window.removeEventListener("pageshow", onBack);
    };
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
    setLocalError("");
    connect(
      { connector },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const showQrCard = (view: QrView) => {
    if (!walletConnectConnector) return;
    reset();
    setLocalError("");
    setUri(null);
    setCopied(false);
    setQr(view);
    connect({ connector: walletConnectConnector }, { onSuccess: () => onClose() });
  };

  const handleBrowserWallet = async () => {
    if (!browserConnector) return;
    const eth = (window as unknown as { ethereum?: unknown }).ethereum;
    if (eth) {
      for (const c of connectors) {
        if (c.type !== "injected" || c.id === "injected") continue;
        try {
          if ((await c.getProvider()) === eth) {
            handleConnect(c);
            return;
          }
        } catch {
          continue;
        }
      }
      handleConnect(browserConnector);
      return;
    }
    const announced = installedOthers[0] ?? metaMaskConnector ?? binanceConnector;
    if (announced) {
      handleConnect(announced);
      return;
    }
    setLocalError(friendlyError({ name: "ProviderNotFoundError" }));
  };

  const openWalletConnectWindow = () => {
    if (!walletConnectConnector) return;
    resetRef.current();
    setLocalError("");
    connect({ connector: walletConnectConnector });
    onClose();
  };

  const backToList = () => {
    setQr(null);
    setUri(null);
    setLocalError("");
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
    if (metaMaskConnector) {
      handleConnect(metaMaskConnector);
      return;
    }

    if (isMobileDevice()) {
      openMetaMaskMobile();
      return;
    }

    showQrCard({ name: "MetaMask", getUrl: getWalletUrl("metamask") });
  };

  const handleBinanceClick = () => {
    if (binanceConnector) {
      handleConnect(binanceConnector);
      return;
    }
    if (isMobileDevice()) {
      openWalletConnectWindow();
      return;
    }
    showQrCard({ name: "Binance Wallet", getUrl: getWalletUrl("binance") });
  };

  if (!isOpen || isConnected) {
    return null;
  }

  const mobile = isMobileDevice();
  const hasInstalledGroup = showBrowserWallet || installedOthers.length > 0;
  const showQr = qr !== null;
  const shownError = connectError ? friendlyError(connectError) : localError;

  const panelStyle = (visible: boolean, offset: "-100%" | "100%"): CSSProperties => ({
    transform: visible ? "translateX(0)" : `translateX(${offset})`,
    visibility: visible ? "visible" : "hidden",
    transition: `transform .32s cubic-bezier(.32,.72,0,1), visibility 0s linear ${visible ? "0s" : ".32s"}`,
  });

  const errorBox = shownError ? (
    <div className="mt-4 w-full rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
      <p className="break-words text-sm font-medium leading-5 text-red-400">{shownError}</p>
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/55 px-3 py-4 backdrop-blur-[2px] sm:px-6 sm:py-8">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div
        className="relative my-auto w-full max-w-sm overflow-hidden rounded-3xl border border-white/[0.07] bg-[#040506] shadow-2xl shadow-black/60"
        style={{
          height: heights ? (showQr ? heights.qr : heights.list) : undefined,
          maxHeight: "calc(100vh - 2rem)",
          transition: heights ? "height .32s cubic-bezier(.32,.72,0,1)" : undefined,
        }}
      >
        {/* ---------- wallet list ---------- */}
        <div className="absolute inset-x-0 top-0 max-h-full overflow-y-auto" style={panelStyle(!showQr, "-100%")} aria-hidden={showQr}>
          <div ref={listRef} className="p-4 sm:p-5">
            <CardHeader left={<WalletGlyph />} title="Connect Wallet" onClose={onClose} />

            <div className="space-y-2">
              {installedOthers.map((connector) => (
                <Row key={connector.uid} name={connector.name} icon={connector.icon} dot disabled={isPending} onClick={() => handleConnect(connector)} />
              ))}

              {showBrowserWallet && browserConnector && (
                <Row name="Browser Wallet" dot installedWallet={browserIconWallet} disabled={isPending} onClick={handleBrowserWallet} />
              )}

              {hasInstalledGroup && <div className="!my-3 h-px bg-white/[0.07]" />}

              <Row name="MetaMask" dot={!!metaMaskConnector} disabled={isPending && !showQr} onClick={handleMetaMaskClick} />

              {walletConnectConnector && (
                <Row name="WalletConnect" dot={mobile} onClick={() => (mobile ? openWalletConnectWindow() : showQrCard({ name: "WalletConnect" }))} />
              )}

              {coinbaseConnector && (
                <Row name="Coinbase Wallet" dot disabled={isPending} onClick={() => handleConnect(coinbaseConnector)} />
              )}

              {(walletConnectConnector || binanceConnector) && (
                <Row name="Binance Wallet" dot={!!binanceConnector} disabled={isPending && !showQr} onClick={handleBinanceClick} />
              )}
            </div>

            {!showQr && errorBox}
          </div>
        </div>

        {/* ---------- QR code ---------- */}
        <div className="absolute inset-x-0 top-0 max-h-full overflow-y-auto" style={panelStyle(showQr, "100%")} aria-hidden={!showQr}>
          <div ref={qrRef} className="p-4 sm:p-5">
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
              <div className="relative rounded-2xl bg-white p-3">
                {uri ? (
                  <QRCodeSVG value={uri} size={208} level="H" bgColor="#ffffff" fgColor="#000000" />
                ) : (
                  <div className="h-[208px] w-[208px] animate-pulse rounded-lg bg-black/10" />
                )}

                {uri && qr && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="flex h-[54px] w-[54px] items-center justify-center rounded-2xl bg-white">
                      <WalletLogo name={qr.name} size={40} />
                    </div>
                  </div>
                )}
              </div>

              <p className="mt-4 text-center text-sm text-white/50">
                {qr ? `Scan this code with your ${qr.name === "WalletConnect" ? "mobile wallet" : qr.name + " app"}` : ""}
              </p>

              <div className="mt-4 grid w-full gap-2">
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

              {showQr && errorBox}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
