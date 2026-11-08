import { useEffect, useState } from "react";

export const SOLANA_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const SOLANA_RPCS = ["https://api.mainnet-beta.solana.com", "https://solana-rpc.publicnode.com"];
export const SOLANA_RPC_PROXY = "/api/solana-rpc";
export const SOLANA_WC_CHAIN = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";

const WC_PROJECT_ID = "6672b2a513af880372a1ca90167637f2";
const WC_METADATA = {
  name: "AlabaamaFi",
  description: "One place to move, manage and explore assets on Arc Network.",
  url: "https://app.alabaamafi.xyz",
  icons: ["https://app.alabaamafi.xyz/alabaamafi-logo.png"],
};

const PUBLIC_SOLANA_HOSTS = /(^|\.)solana\.com$|^solana-rpc\.publicnode\.com$/;

export function installSolanaRpcRedirect() {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __alabaamafiSolanaFetch?: boolean; fetch: typeof fetch };
  if (w.__alabaamafiSolanaFetch) return;
  w.__alabaamafiSolanaFetch = true;
  const original = w.fetch.bind(window);
  w.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const raw = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;
      const target = new URL(raw, window.location.href);
      const method = (init?.method ?? (typeof input === "object" && "method" in input ? (input as Request).method : "GET")).toUpperCase();
      if (method === "POST" && PUBLIC_SOLANA_HOSTS.test(target.hostname)) {
        const proxy = new URL(SOLANA_RPC_PROXY, window.location.href).href;
        return typeof input === "object" && !(input instanceof URL) ? original(new Request(proxy, input as Request)) : original(proxy, init);
      }
    } catch {
      return original(input, init);
    }
    return original(input, init);
  };
}

installSolanaRpcRedirect();

type StdAccount = { address: string; publicKey: Uint8Array; chains?: readonly string[] };
type StdWallet = {
  name: string;
  icon: string;
  chains: readonly string[];
  features: Record<string, unknown>;
  accounts: readonly StdAccount[];
};

export type SolWallet = { name: string; icon?: string; raw: StdWallet };
export type SolSession = {
  name: string;
  icon?: string;
  address: string;
  provider: unknown;
  disconnect: () => Promise<void>;
  stop: () => void;
};

type Web3Like = {
  PublicKey: new (value: string) => unknown;
  Transaction: { from: (bytes: Uint8Array) => unknown };
  VersionedTransaction: { deserialize: (bytes: Uint8Array) => unknown };
};

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function base58Encode(bytes: Uint8Array): string {
  let n = BigInt(0);
  for (const b of bytes) n = n * BigInt(256) + BigInt(b);
  let out = "";
  while (n > BigInt(0)) {
    out = B58[Number(n % BigInt(58))] + out;
    n = n / BigInt(58);
  }
  for (const b of bytes) {
    if (b === 0) out = "1" + out;
    else break;
  }
  return out;
}

export function base58Decode(text: string): Uint8Array {
  let n = BigInt(0);
  for (const ch of text) {
    const i = B58.indexOf(ch);
    if (i < 0) throw new Error("BAD_BASE58");
    n = n * BigInt(58) + BigInt(i);
  }
  const out: number[] = [];
  while (n > BigInt(0)) {
    out.unshift(Number(n % BigInt(256)));
    n = n / BigInt(256);
  }
  for (const ch of text) {
    if (ch === "1") out.unshift(0);
    else break;
  }
  return Uint8Array.from(out);
}

const toBase64 = (bytes: Uint8Array) => {
  let text = "";
  bytes.forEach((b) => {
    text += String.fromCharCode(b);
  });
  return btoa(text);
};
const fromBase64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

const isSolanaWallet = (w: StdWallet) =>
  Array.isArray(w.chains) &&
  w.chains.some((c) => c.startsWith("solana:")) &&
  "standard:connect" in w.features &&
  ("solana:signTransaction" in w.features || "solana:signAndSendTransaction" in w.features);

const toWallet = (w: StdWallet): SolWallet => ({ name: w.name, icon: w.icon, raw: w });

export function useSolanaWallets(): SolWallet[] {
  const [list, setList] = useState<SolWallet[]>([]);
  useEffect(() => {
    let live = true;
    const offs: (() => void)[] = [];
    import("@wallet-standard/app")
      .then(({ getWallets }) => {
        if (!live) return;
        const api = getWallets();
        const read = () => setList((api.get() as unknown as StdWallet[]).filter(isSolanaWallet).map(toWallet));
        read();
        offs.push(api.on("register", read), api.on("unregister", read));
      })
      .catch(() => setList([]));
    return () => {
      live = false;
      offs.forEach((off) => off());
    };
  }, []);
  return list;
}

export function makeProvider(wallet: StdWallet, account: StdAccount, web3: Web3Like) {
  const publicKey = new web3.PublicKey(account.address);
  const chain = account.chains?.includes("solana:mainnet") ? "solana:mainnet" : account.chains?.find((c) => c.startsWith("solana:")) ?? "solana:mainnet";

  type SignInput = { account: StdAccount; transaction: Uint8Array; chain: string; options?: unknown };
  const signFeature = wallet.features["solana:signTransaction"] as { signTransaction: (input: SignInput) => Promise<{ signedTransaction: Uint8Array }[]> } | undefined;
  const sendFeature = wallet.features["solana:signAndSendTransaction"] as { signAndSendTransaction: (input: SignInput) => Promise<{ signature: Uint8Array }[]> } | undefined;
  const messageFeature = wallet.features["solana:signMessage"] as { signMessage: (input: { account: StdAccount; message: Uint8Array }) => Promise<{ signedMessage: Uint8Array; signature: Uint8Array }[]> } | undefined;

  type Tx = { serialize: (options?: unknown) => Uint8Array };
  const toBytes = (tx: unknown) => (tx as Tx).serialize({ requireAllSignatures: false, verifySignatures: false });
  const isVersioned = (tx: unknown) => !!tx && typeof tx === "object" && "version" in (tx as object);

  const signTransaction = async (tx: unknown) => {
    if (!signFeature) throw new Error("This wallet cannot sign transactions.");
    const [out] = await signFeature.signTransaction({ account, transaction: toBytes(tx), chain });
    return isVersioned(tx) ? web3.VersionedTransaction.deserialize(out.signedTransaction) : web3.Transaction.from(out.signedTransaction);
  };
  const signAllTransactions = async (txs: unknown[]) => {
    const done: unknown[] = [];
    for (const tx of txs) done.push(await signTransaction(tx));
    return done;
  };
  const signAndSendTransaction = async (tx: unknown, options?: unknown) => {
    if (!sendFeature) throw new Error("This wallet cannot send transactions.");
    const [out] = await sendFeature.signAndSendTransaction({ account, transaction: toBytes(tx), chain, options });
    return { signature: base58Encode(out.signature) };
  };
  const signMessage = async (message: Uint8Array) => {
    if (!messageFeature) throw new Error("This wallet cannot sign messages.");
    const [out] = await messageFeature.signMessage({ account, message });
    return { signature: out.signature, publicKey };
  };

  const address = account.address;
  const accounts = [{ address, publicKey: account.publicKey }];
  return {
    isWalletStandard: true,
    isConnected: true,
    connected: true,
    publicKey,
    address,
    accounts,
    connect: async () => ({ publicKey, address, accounts }),
    disconnect: async () => undefined,
    getAddress: async () => address,
    signTransaction,
    signAllTransactions,
    signAndSendTransaction,
    signMessage,
    on: () => undefined,
    off: () => undefined,
    removeListener: () => undefined,
  };
}

export async function connectSolanaWallet(w: SolWallet, onChange: (session: SolSession | null) => void): Promise<SolSession> {
  const web3 = (await import("@solana/web3.js")) as unknown as Web3Like;
  const connectFeature = w.raw.features["standard:connect"] as { connect: () => Promise<{ accounts: readonly StdAccount[] }> };
  const result = await connectFeature.connect();
  const pick = (list: readonly StdAccount[]) => list.find((a) => !a.chains || a.chains.some((c) => c.startsWith("solana:"))) ?? list[0];
  const account = pick(result.accounts) ?? pick(w.raw.accounts);
  if (!account) throw new Error("NO_ACCOUNT");

  let current = account.address;
  let off: (() => void) | undefined;
  const build = (a: StdAccount): SolSession => ({
    name: w.name,
    icon: w.icon,
    address: a.address,
    provider: makeProvider(w.raw, a, web3),
    disconnect: async () => {
      const feature = w.raw.features["standard:disconnect"] as { disconnect: () => Promise<void> } | undefined;
      await feature?.disconnect();
    },
    stop: () => off?.(),
  });

  const events = w.raw.features["standard:events"] as { on: (event: string, cb: (p: { accounts?: readonly StdAccount[] }) => void) => () => void } | undefined;
  off = events?.on("change", (p) => {
    if (!p.accounts) return;
    const next = pick(p.accounts);
    if (!next) {
      off?.();
      onChange(null);
      return;
    }
    if (next.address !== current) {
      current = next.address;
      onChange(build(next));
    }
  });
  return build(account);
}

type WcSession = { topic: string; peer?: { metadata?: { name?: string; icons?: string[] } }; namespaces: Record<string, { accounts: string[] }> };
type WcClient = {
  connect: (input: { requiredNamespaces: Record<string, { methods: string[]; chains: string[]; events: string[] }> }) => Promise<{ uri?: string; approval: () => Promise<WcSession> }>;
  request: (input: { topic: string; chainId: string; request: { method: string; params: unknown } }) => Promise<unknown>;
  disconnect: (input: { topic: string; reason: { code: number; message: string } }) => Promise<void>;
  on: (event: string, cb: (e: { topic: string }) => void) => void;
  off: (event: string, cb: (e: { topic: string }) => void) => void;
};

export function makeWalletConnectProvider(client: WcClient, topic: string, address: string, web3: Web3Like & { PublicKey: new (value: string) => unknown }) {
  const publicKey = new web3.PublicKey(address);
  type Tx = { serialize: (options?: unknown) => Uint8Array; addSignature: (key: unknown, signature: Uint8Array) => void };
  const toBytes = (tx: unknown) => (tx as Tx).serialize({ requireAllSignatures: false, verifySignatures: false });
  const isVersioned = (tx: unknown) => !!tx && typeof tx === "object" && "version" in (tx as object);

  const signTransaction = async (tx: unknown) => {
    const result = (await client.request({
      topic,
      chainId: SOLANA_WC_CHAIN,
      request: { method: "solana_signTransaction", params: { transaction: toBase64(toBytes(tx)) } },
    })) as { signature?: string; transaction?: string };
    if (result?.transaction) {
      const bytes = fromBase64(result.transaction);
      return isVersioned(tx) ? web3.VersionedTransaction.deserialize(bytes) : web3.Transaction.from(bytes);
    }
    if (result?.signature) {
      (tx as Tx).addSignature(publicKey, base58Decode(result.signature));
      return tx;
    }
    throw new Error("The wallet did not return a signed transaction.");
  };
  const signAllTransactions = async (txs: unknown[]) => {
    const done: unknown[] = [];
    for (const tx of txs) done.push(await signTransaction(tx));
    return done;
  };
  const signMessage = async (message: Uint8Array) => {
    const result = (await client.request({
      topic,
      chainId: SOLANA_WC_CHAIN,
      request: { method: "solana_signMessage", params: { message: base58Encode(message), pubkey: address } },
    })) as { signature?: string };
    if (!result?.signature) throw new Error("The wallet did not return a signature.");
    return { signature: base58Decode(result.signature), publicKey };
  };

  const accounts = [{ address, publicKey }];
  return {
    isWalletConnect: true,
    isConnected: true,
    connected: true,
    publicKey,
    address,
    accounts,
    connect: async () => ({ publicKey, address, accounts }),
    disconnect: async () => undefined,
    getAddress: async () => address,
    signTransaction,
    signAllTransactions,
    signMessage,
    on: () => undefined,
    off: () => undefined,
    removeListener: () => undefined,
  };
}

export function startSolanaWalletConnect(onChange: (session: SolSession | null) => void) {
  let cancelled = false;
  let resolveUri: (uri: string) => void = () => undefined;
  const uri = new Promise<string>((resolve) => {
    resolveUri = resolve;
  });

  const session = (async (): Promise<SolSession> => {
    const [signModule, web3] = await Promise.all([import("@walletconnect/sign-client"), import("@solana/web3.js")]);
    type Initable = { init: (options: unknown) => Promise<unknown> };
    const pick = (value: unknown): Initable | undefined => {
      const v = value as { init?: unknown; default?: unknown } | undefined;
      if (v && typeof v.init === "function") return v as Initable;
      return v && v.default ? pick(v.default) : undefined;
    };
    const holder = signModule as unknown as { default?: unknown; SignClient?: unknown };
    const SignClient = pick(holder.default) ?? pick(holder.SignClient) ?? pick(holder);
    if (!SignClient) throw new Error("WC_UNAVAILABLE");
    const client = (await SignClient.init({ projectId: WC_PROJECT_ID, metadata: WC_METADATA, customStoragePrefix: "alabaamafi-solana" })) as unknown as WcClient;
    if (cancelled) throw new Error("CANCELLED");

    const pairing = await client.connect({ requiredNamespaces: { solana: { methods: ["solana_signTransaction", "solana_signMessage"], chains: [SOLANA_WC_CHAIN], events: [] } } });
    if (pairing.uri) resolveUri(pairing.uri);
    const wc = await pairing.approval();

    const hangUp = () => client.disconnect({ topic: wc.topic, reason: { code: 6000, message: "User disconnected." } }).catch(() => undefined);
    if (cancelled) {
      await hangUp();
      throw new Error("CANCELLED");
    }
    const account = wc.namespaces.solana?.accounts?.[0];
    const address = account ? account.split(":").pop() : undefined;
    if (!address) {
      await hangUp();
      throw new Error("NO_ACCOUNT");
    }

    const gone = (e: { topic: string }) => {
      if (e.topic === wc.topic) onChange(null);
    };
    client.on("session_delete", gone);
    client.on("session_expire", gone);

    return {
      name: wc.peer?.metadata?.name || "WalletConnect",
      icon: wc.peer?.metadata?.icons?.[0],
      address,
      provider: makeWalletConnectProvider(client, wc.topic, address, web3 as unknown as Web3Like),
      disconnect: async () => {
        await hangUp();
      },
      stop: () => {
        client.off("session_delete", gone);
        client.off("session_expire", gone);
      },
    };
  })();

  return {
    uri,
    session,
    cancel: () => {
      cancelled = true;
    },
  };
}

async function rpc(method: string, params: unknown[]): Promise<unknown> {
  let last: unknown;
  for (const url of [SOLANA_RPC_PROXY, ...SOLANA_RPCS]) {
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
      if (!r.ok) {
        last = new Error(`HTTP ${r.status}`);
        continue;
      }
      const j = (await r.json()) as { result?: unknown; error?: { message?: string } };
      if (j.error) {
        last = new Error(j.error.message ?? "RPC error");
        continue;
      }
      return j.result;
    } catch (e) {
      last = e;
    }
  }
  throw last instanceof Error ? last : new Error("RPC failed");
}

export async function readSolanaUsdc(owner: string): Promise<bigint | null> {
  try {
    const res = (await rpc("getTokenAccountsByOwner", [owner, { mint: SOLANA_USDC_MINT }, { encoding: "jsonParsed" }])) as {
      value?: { account?: { data?: { parsed?: { info?: { tokenAmount?: { amount?: string } } } } } }[];
    };
    let total = BigInt(0);
    for (const v of res?.value ?? []) {
      const amount = v.account?.data?.parsed?.info?.tokenAmount?.amount;
      if (amount && /^\d+$/.test(amount)) total += BigInt(amount);
    }
    return total;
  } catch {
    return null;
  }
}

export async function readSolanaLamports(owner: string): Promise<bigint | null> {
  try {
    const res = (await rpc("getBalance", [owner])) as { value?: number };
    return typeof res?.value === "number" ? BigInt(res.value) : null;
  } catch {
    return null;
  }
}

export const SOLANA_WALLET_LINKS: Record<string, { site: string; chrome: string; browse: (url: string, origin: string) => string }> = {
  phantom: { site: "https://phantom.app/download", chrome: "https://chromewebstore.google.com/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa", browse: (u, o) => `https://phantom.app/ul/browse/${encodeURIComponent(u)}?ref=${encodeURIComponent(o)}` },
  solflare: { site: "https://solflare.com/download", chrome: "https://chromewebstore.google.com/detail/solflare-wallet/bhhhlbepdkbapadjdnnojkbgioiodbic", browse: (u, o) => `https://solflare.com/ul/v1/browse/${encodeURIComponent(u)}?ref=${encodeURIComponent(o)}` },
  backpack: { site: "https://backpack.app/downloads", chrome: "https://chromewebstore.google.com/detail/backpack/aflkmfhebedbjioipglgcbcmnbpgliof", browse: (u, o) => `https://backpack.app/ul/v1/browse/${encodeURIComponent(u)}?ref=${encodeURIComponent(o)}` },
};

export type WcWallet = { id: string; name: string; image?: string; native?: string; universal?: string; fallback?: boolean };

const WC_FALLBACK: WcWallet[] = [
  { id: "phantom", name: "Phantom", native: "phantom://", fallback: true },
  { id: "solflare", name: "Solflare", native: "solflare://", fallback: true },
  { id: "backpack", name: "Backpack", native: "backpack://", fallback: true },
  { id: "trust", name: "Trust Wallet", native: "trust://", fallback: true },
];

export async function fetchSolanaWcWallets(): Promise<WcWallet[]> {
  try {
    type Listing = { id?: string; name?: string; image_id?: string; image_url?: { md?: string; sm?: string; lg?: string }; mobile?: { native?: string; universal?: string } };
    const list: WcWallet[] = [];
    for (let page = 1; page <= 3; page++) {
      const url = `https://explorer-api.walletconnect.com/v3/wallets?projectId=${WC_PROJECT_ID}&chains=${encodeURIComponent(SOLANA_WC_CHAIN)}&entries=100&page=${page}`;
      const r = await fetch(url);
      if (!r.ok) break;
      const j = (await r.json()) as { listings?: Record<string, Listing> };
      const listings = Object.values(j.listings ?? {});
      for (const l of listings) {
        if (!l?.name || (!l.mobile?.native && !l.mobile?.universal)) continue;
        list.push({
          id: l.id ?? l.name,
          name: l.name,
          image: l.image_url?.md || (l.image_id ? `https://explorer-api.walletconnect.com/v3/logo/md/${l.image_id}?projectId=${WC_PROJECT_ID}` : undefined),
          native: l.mobile?.native || undefined,
          universal: l.mobile?.universal || undefined,
        });
      }
      if (listings.length < 100) break;
    }
    return list.length ? list : WC_FALLBACK;
  } catch {
    return WC_FALLBACK;
  }
}

export function wcDeepLink(wallet: WcWallet, uri: string): string {
  const encoded = encodeURIComponent(uri);
  if (wallet.universal) return `${wallet.universal.replace(/\/+$/, "")}/wc?uri=${encoded}`;
  if (wallet.native) {
    let base = wallet.native.includes("://") ? wallet.native : `${wallet.native.replace(/[:/]/g, "")}://`;
    if (!base.endsWith("/")) base += "/";
    return `${base}wc?uri=${encoded}`;
  }
  return uri;
}
