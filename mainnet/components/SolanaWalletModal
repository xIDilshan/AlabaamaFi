"use client";

import { useMemo, useState } from "react";
import { WalletLogo } from "@/components/WalletLogo";
import { connectSolanaWallet, SOLANA_WALLET_LINKS, useSolanaWallets, type SolSession, type SolWallet } from "@/lib/solanaWallets";

type SolanaWalletModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSession: (session: SolSession | null) => void;
};

type Tile = { name: string; icon?: string };

const ERROR_MESSAGE = "Something went wrong. Please try again.";
const FIXED = ["Phantom", "Solflare", "Backpack"];

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

export default function SolanaWalletModal({ isOpen, onClose, onSession }: SolanaWalletModalProps) {
  const wallets = useSolanaWallets();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const named = (n: string) => wallets.find((w) => w.name.toLowerCase().includes(n.toLowerCase()));
  const others = useMemo(() => wallets.filter((w) => !FIXED.some((n) => w.name.toLowerCase().includes(n.toLowerCase()))), [wallets]);
  const tiles: Tile[] = [...FIXED.map((n) => ({ name: n, icon: named(n)?.icon })), ...others.slice(0, 1).map((w) => ({ name: w.name, icon: w.icon }))];

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

  const getWallet = (name: string) => {
    const link = SOLANA_WALLET_LINKS[name.toLowerCase()];
    if (!link) return;
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) window.location.href = link.browse(window.location.href, window.location.origin);
    else window.open(link.site, "_blank", "noopener,noreferrer");
  };

  if (!isOpen) return null;

  const hasInstalled = wallets.length > 0;

  return (
    <div className="fixed inset-0 z-[97] flex items-center justify-center overflow-y-auto bg-black/55 px-3 py-4 backdrop-blur-[2px] sm:px-6 sm:py-8">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative my-auto w-full max-w-sm overflow-hidden rounded-3xl border border-white/[0.07] bg-[#040506] shadow-2xl shadow-black/60" role="dialog" aria-modal="true" aria-label="Connect a Solana wallet">
        <div className="p-4 sm:p-5">
          <div className="mb-4 grid min-h-[40px] grid-cols-[40px_1fr_40px] items-center">
            <div className="flex h-10 w-10 items-center justify-center">
              <WalletGlyph />
            </div>
            <h3 className="text-center text-lg font-semibold">Connect Wallet</h3>
            <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-base text-white/45 transition hover:bg-white/[0.04] hover:text-white active:scale-95" aria-label="Close wallet card">
              ✕
            </button>
          </div>

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
          </div>

          {error && (
            <div className="mt-4 w-full rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
              <p className="break-words text-sm font-medium leading-5 text-red-400">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
