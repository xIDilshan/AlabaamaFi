"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { QRCodeSVG } from "qrcode.react";
import { WalletLogo } from "@/components/WalletLogo";
import { connectSolanaWallet, fetchSolanaWcWallets, SOLANA_WALLET_LINKS, startSolanaWalletConnect, useSolanaWallets, wcDeepLink, type SolSession, type SolWallet, type WcWallet } from "@/lib/solanaWallets";

type SolanaWalletModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSession: (session: SolSession | null) => void;
};

type Tile = { name: string; icon?: string };
type QrView = { name: string; getUrl?: string };

const ERROR_MESSAGE = "Something went wrong. Please try again.";
const FIXED = ["Phantom", "Solflare", "Backpack"];
const isMobileDevice = () => typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const isChromium = () => typeof navigator !== "undefined" && /Chrome|Chromium|Edg\//.test(navigator.userAgent);

const ROW_CLASS =
  "flex min-h-[58px] w-full items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-[#0a0c10] px-3.5 py-2.5 text-left transition-colors duration-200 hover:border-[#2b6cff]/25 hover:bg-[#0d1117] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50";

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-white/30">
    <path d="m9 6 6 6-6 6" />
  </svg>
);

const WalletGlyph = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-white/55">
    <path d="M3 7a2 2 0 0 1 2-2h13v4M3 7v10a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2ZM16.5 14h.01" />
  </svg>
);

const WaveBadge = () => (
  <span aria-hidden="true" className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#3b99fc]/50 text-[#3b99fc]">
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M5 10.5c3.9-3.8 10.1-3.8 14 0M8 13.6c2.2-2.1 5.8-2.1 8 0M10.9 16.6c.7-.6 1.5-.6 2.2 0" />
    </svg>
  </span>
);

function BrowserTiles({ tiles }: { tiles: Tile[] }) {
  return (
    <span aria-hidden className="grid shrink-0 grid-cols-2 grid-rows-2 gap-[2px]" style={{ width: 34, height: 34 }}>
      {tiles.slice(0, 4).map((t) => (
        <span key={t.name} className="flex h-full w-full items-center justify-center rounded-[28%] border border-white/[0.1] bg-[#1b1e25]">
          <WalletLogo name={t.name} icon={t.icon} size={11} />
        </span>
      ))}
    </span>
  );
}

function Row({ name, icon, dot, tiles, disabled, onClick }: { name: string; icon?: string; dot?: boolean; tiles?: Tile[]; disabled?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled} className={ROW_CLASS}>
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center">
          <div className="relative flex">
            {tiles ? <BrowserTiles tiles={tiles} /> : <WalletLogo name={name} icon={icon} size={30} />}
            {dot && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#040506] bg-green-500" />}
          </div>
        </div>
        <p className="truncate text-[15px] font-semibold leading-none">{name}</p>
      </div>
      <Arrow />
    </button>
  );
}

function CardHeader({ left, title, onClose }: { left: ReactNode; title: string; onClose: () => void }) {
  return (
    <div className="mb-4 grid min-h-[40px] grid-cols-[40px_1fr_40px] items-center">
      <div className="flex h-10 w-10 items-center justify-center">{left}</div>
      <h3 className="text-center text-lg font-semibold">{title}</h3>
      <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-base text-white/45 transition hover:bg-white/[0.04] hover:text-white active:scale-95" aria-label="Close wallet card">
        ✕
      </button>
    </div>
  );
}

export default function SolanaWalletModal({ isOpen, onClose, onSession }: SolanaWalletModalProps) {
  const wallets = useSolanaWallets();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [qr, setQr] = useState<QrView | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [wcWallets, setWcWallets] = useState<WcWallet[] | null>(null);
  const [mobileQr, setMobileQr] = useState(false);
  const [search, setSearch] = useState("");
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(
    () => () => {
      cancelRef.current?.();
    },
    []
  );

  const named = (n: string) => wallets.find((w) => w.name.toLowerCase().includes(n.toLowerCase()));
  const others = useMemo(() => wallets.filter((w) => !FIXED.some((n) => w.name.toLowerCase().includes(n.toLowerCase()))), [wallets]);
  const tiles: Tile[] = [...FIXED.map((n) => ({ name: n, icon: named(n)?.icon })), ...others.slice(0, 1).map((w) => ({ name: w.name, icon: w.icon }))];

  const close = () => {
    cancelRef.current?.();
    onClose();
  };

  const connect = async (w: SolWallet) => {
    if (busy) return;
    setBusy(w.name);
    setError("");
    try {
      const session = await connectSolanaWallet(w, onSession);
      onSession(session);
      onClose();
    } catch {
      setError(ERROR_MESSAGE);
    } finally {
      setBusy("");
    }
  };

  const showQr = (view: QrView) => {
    cancelRef.current?.();
    setError("");
    setUri(null);
    setCopied(false);
    setQr(view);
    setMobileQr(false);
    setSearch("");
    setWcWallets(null);
    if (isMobileDevice() && view.name === "WalletConnect") fetchSolanaWcWallets().then(setWcWallets);
    const flow = startSolanaWalletConnect(onSession);
    cancelRef.current = flow.cancel;
    flow.uri.then(setUri);
    flow.session
      .then((session) => {
        onSession(session);
        onClose();
      })
      .catch((e: Error) => {
        if (e?.message !== "CANCELLED") setError(ERROR_MESSAGE);
      });
  };

  const backToList = () => {
    if (mobileQr) {
      setMobileQr(false);
      return;
    }
    cancelRef.current?.();
    cancelRef.current = null;
    setQr(null);
    setUri(null);
    setError("");
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

  const getWallet = (name: string) => {
    const link = SOLANA_WALLET_LINKS[name.toLowerCase()];
    if (!link) return;
    if (isMobileDevice()) window.location.href = link.browse(window.location.href, window.location.origin);
    else showQr({ name, getUrl: isChromium() ? link.chrome : link.site });
  };

  if (!isOpen) return null;

  const hasInstalled = wallets.length > 0;
  const mobile = isMobileDevice();

  const errorBox = error ? (
    <div className="mt-4 w-full rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
      <p className="break-words text-sm font-medium leading-5 text-red-400">{error}</p>
    </div>
  ) : null;

  if (qr && qr.name === "WalletConnect" && mobile && !mobileQr) {
    const q = search.trim().toLowerCase();
    const shown = (wcWallets ?? []).filter((w) => !q || w.name.toLowerCase().includes(q));
    return (
      <div className="fixed inset-0 z-[97] flex items-center justify-center bg-black/55 px-3 py-4 backdrop-blur-[2px]">
        <div className="absolute inset-0" onClick={close} aria-hidden="true" />

        <div className="relative flex max-h-[86vh] w-full max-w-md flex-col overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#141414] p-4 shadow-2xl shadow-black/60" role="dialog" aria-modal="true" aria-label="Choose a Solana wallet">
          <div className="grid grid-cols-[44px_1fr_44px] items-center">
            <button onClick={backToList} aria-label="Back to the wallet list" className="flex h-11 w-11 items-center justify-center rounded-full text-white/55 transition hover:bg-white/[0.05] hover:text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 6-6 6 6 6" />
              </svg>
            </button>
            <h3 className="text-center text-lg font-medium">All Wallets</h3>
            <button onClick={close} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full text-lg text-white/70 transition hover:bg-white/[0.05] hover:text-white">
              ✕
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <label className="flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3.5 text-white/50 focus-within:border-white/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search wallet" aria-label="Search wallet" autoComplete="off" className="min-w-0 flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-white/40" />
            </label>
            <button onClick={() => setMobileQr(true)} aria-label="Show QR code" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2b6cff]/15 text-[#4d8dff] transition hover:bg-[#2b6cff]/25">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <path d="M14 14h3v3h-3zM20 14v.01M14 20h3M20 17v4" />
              </svg>
            </button>
          </div>

          <p className="mt-2 min-h-[16px] px-1 text-xs text-white/40">{uri ? "Solana wallets only" : "Preparing the connection…"}</p>

          <div className="mt-1 min-h-0 flex-1 overflow-y-auto">
            <div className="grid grid-cols-3 gap-2.5 pb-1">
              {wcWallets === null
                ? Array.from({ length: 9 }, (_, i) => <div key={i} className="h-[112px] animate-pulse rounded-2xl bg-white/[0.04]" />)
                : shown.map((w) => (
                    <button
                      key={w.id}
                      disabled={!uri}
                      onClick={() => {
                        if (uri) window.location.href = wcDeepLink(w, uri);
                      }}
                      className="flex min-w-0 flex-col items-center gap-2 rounded-2xl bg-white/[0.05] px-2 pb-3 pt-4 transition hover:bg-white/[0.08] active:scale-[0.98] disabled:opacity-60"
                    >
                      <WalletLogo name={w.name} icon={w.image} size={56} className="!rounded-2xl" />
                      <span className="flex w-full min-w-0 items-center justify-center gap-1.5">
                        <span className="truncate text-[15px] font-medium">{w.name}</span>
                        <WaveBadge />
                      </span>
                    </button>
                  ))}
            </div>
            {wcWallets !== null && shown.length === 0 && <p className="py-8 text-center text-sm text-white/40">No Solana wallet found</p>}
          </div>

          {errorBox}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[97] flex items-center justify-center overflow-y-auto bg-black/55 px-3 py-4 backdrop-blur-[2px] sm:px-6 sm:py-8">
      <div className="absolute inset-0" onClick={close} aria-hidden="true" />

      <div className="relative my-auto w-full max-w-sm overflow-hidden rounded-3xl border border-white/[0.07] bg-[#040506] shadow-2xl shadow-black/60" role="dialog" aria-modal="true" aria-label="Connect a Solana wallet">
        {!qr ? (
          <div className="p-4 sm:p-5">
            <CardHeader left={<WalletGlyph />} title="Connect Wallet" onClose={close} />

            <div className="space-y-2">
              {others.map((w) => (
                <Row key={w.name} name={w.name} icon={w.icon} dot disabled={!!busy} onClick={() => connect(w)} />
              ))}

              {hasInstalled && <Row name="Browser Wallet" dot tiles={tiles} disabled={!!busy} onClick={() => connect(wallets[0])} />}

              {hasInstalled && <div className="!my-3 h-px bg-white/[0.07]" />}

              {FIXED.map((n) => {
                const w = named(n);
                return <Row key={n} name={n} icon={w?.icon} dot={!!w} disabled={!!busy} onClick={() => (w ? connect(w) : getWallet(n))} />;
              })}

              <Row name="WalletConnect" dot={mobile} disabled={!!busy} onClick={() => showQr({ name: "WalletConnect" })} />
            </div>

            {errorBox}
          </div>
        ) : (
          <div className="p-4 sm:p-5">
            <CardHeader
              left={
                <button onClick={backToList} aria-label="Back to the wallet list" className="flex h-10 w-10 items-center justify-center rounded-full text-white/55 transition hover:bg-white/[0.04] hover:text-white">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m15 6-6 6 6 6" />
                  </svg>
                </button>
              }
              title={qr.name}
              onClose={close}
            />

            <div className="flex flex-col items-center">
              <div className="relative rounded-2xl bg-white p-3">
                {uri ? <QRCodeSVG value={uri} size={208} level="H" bgColor="#ffffff" fgColor="#000000" /> : <div className="h-[208px] w-[208px] animate-pulse rounded-lg bg-black/10" />}

                {uri && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="flex h-[54px] w-[54px] items-center justify-center rounded-2xl bg-white">
                      <WalletLogo name={qr.name} size={40} />
                    </div>
                  </div>
                )}
              </div>

              <p className="mt-4 text-center text-sm text-white/50">{qr.name === "WalletConnect" ? "Scan this code with a Solana wallet" : `Scan this code with your ${qr.name} app`}</p>

              <div className="mt-4 grid w-full gap-2">
                <button
                  onClick={copyLink}
                  disabled={!uri}
                  className="flex min-h-[48px] items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 text-sm font-semibold text-white/80 transition hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
                >
                  {copied ? "Copied" : "Copy link"}
                </button>

                {qr.getUrl && (
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

              {errorBox}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
