import { NextResponse } from "next/server";

/*
  Activity feed for the Activity page: ALL transactions and token transfers of a wallet on Arc mainnet,
  read page by page from Arc's official explorer (Blockscout). The page asks for the next page with the cursors
  this route returns, until the whole history is loaded.
  Place at: app/api/activity/route.ts

  Also: /api/activity?address=0x...&info=1 returns the wallet's USDC, EURC and cirBTC balances and its transaction counts
  (used by the portfolio on the Activity page).

  Optional: BLOCKSCOUT_API_KEY (a free Blockscout Pro API key) in .env.local and in Vercel. With a key the
  Blockscout Pro API is used (more reliable); without one the public explorer API is tried.
*/

const KEY = process.env.BLOCKSCOUT_API_KEY;
const BASE = KEY ? "https://api.blockscout.com/5042/api/v2" : "https://explorer.arc.io/api/v2";

const ADDR_RE = /^0x[0-9a-fA-F]{40}$/;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const RPCS = [
  "https://rpc.mainnet.arc.io",
  "https://rpc.blockdaemon.mainnet.arc.io",
  "https://rpc.drpc.mainnet.arc.io",
  "https://rpc.quicknode.mainnet.arc.io",
];
const TOKEN_ADDR: Record<string, string> = {
  USDC: "0x3600000000000000000000000000000000000000",
  EURC: "0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1",
  cirBTC: "0x171A4217b86A807A64eB94757Db6849fb4bDbAA0",
};

async function rpc(method: string, params: unknown[]): Promise<string> {
  for (const url of RPCS) {
    try {
      const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }), cache: "no-store" });
      if (!r.ok) continue;
      const j = (await r.json()) as { result?: string; error?: unknown };
      if (typeof j.result === "string") return j.result;
    } catch {
      /* try the next endpoint */
    }
  }
  throw new Error("rpc unavailable");
}

async function bs(path: string, qs: string) {
  const parts = [qs, KEY ? `apikey=${encodeURIComponent(KEY)}` : ""].filter(Boolean).join("&");
  const url = `${BASE}${path}${parts ? `?${parts}` : ""}`;
  const res = await fetch(url, { headers: { accept: "application/json" }, next: { revalidate: 15 } });
  if (!res.ok) throw new Error(`explorer ${res.status}`);
  return res.json();
}

/** "1234500" with 6 decimals -> "1.2345" (no floating point) */
function toDecimal(raw: string, decimals: number): string {
  if (!/^\d+$/.test(raw)) return "0";
  const s = raw.replace(/^0+/, "") || "0";
  if (decimals <= 0) return s;
  const p = s.padStart(decimals + 1, "0");
  const whole = p.slice(0, p.length - decimals);
  const frac = p.slice(p.length - decimals).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
}

/** The page sends back the "next page" cursor it was given. "none" means that feed is finished. */
function parseCursor(raw: string | null): { skip: boolean; qs: string; bad: boolean } {
  if (raw === "none") return { skip: true, qs: "", bad: false };
  if (!raw) return { skip: false, qs: "", bad: false };
  try {
    const o = JSON.parse(raw);
    if (!o || typeof o !== "object" || Array.isArray(o)) return { skip: false, qs: "", bad: true };
    const p = new URLSearchParams();
    let n = 0;
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      if (!/^[a-z_]{1,40}$/i.test(k) || n >= 12) continue;
      if (typeof v === "string" || typeof v === "number") {
        p.set(k, String(v));
        n++;
      }
    }
    return { skip: false, qs: p.toString(), bad: false };
  } catch {
    return { skip: false, qs: "", bad: true };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = (searchParams.get("address") ?? "").trim();
  if (!ADDR_RE.test(address)) return NextResponse.json({ error: "bad address" }, { status: 400 });
  const me = address.toLowerCase();

  /* ---- portfolio info: balances + transaction counts ---- */
  if (searchParams.get("info")) {
    const pad = me.replace(/^0x/, "").padStart(64, "0");
    const [counters, nonce, ...bals] = await Promise.allSettled([
      bs(`/addresses/${address}/counters`, ""),
      rpc("eth_getTransactionCount", [address, "latest"]),
      ...Object.values(TOKEN_ADDR).map((a) => rpc("eth_call", [{ to: a, data: "0x70a08231" + pad }, "latest"])),
    ]);
    const names = Object.keys(TOKEN_ADDR);
    const balances: Record<string, string> = {};
    let ok = false;
    bals.forEach((b, i) => {
      if (b.status === "fulfilled") {
        try {
          balances[names[i]] = BigInt(b.value || "0x0").toString();
          ok = true;
        } catch {
          /* skip */
        }
      }
    });
    const num = (v: unknown) => (v !== undefined && v !== null && /^\d+$/.test(String(v)) ? Number(v) : null);
    const c = counters.status === "fulfilled" ? (counters.value as Any) : null;
    return NextResponse.json(
      {
        balances: ok ? balances : null,
        txCount: num(c?.transactions_count),
        transfersCount: num(c?.token_transfers_count),
        sent: nonce.status === "fulfilled" ? Number(BigInt(nonce.value)) : null,
      },
      { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=60" } }
    );
  }

  const txc = parseCursor(searchParams.get("txc"));
  const trc = parseCursor(searchParams.get("trc"));
  if (txc.bad || trc.bad) return NextResponse.json({ error: "bad cursor" }, { status: 400 });

  let txs: Any = null;
  let transfers: Any = null;
  try {
    [txs, transfers] = await Promise.all([
      txc.skip ? Promise.resolve(null) : bs(`/addresses/${address}/transactions`, txc.qs),
      trc.skip ? Promise.resolve(null) : bs(`/addresses/${address}/token-transfers`, ["type=ERC-20", trc.qs].filter(Boolean).join("&")),
    ]);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "explorer unavailable" }, { status: 502 });
  }

  const outTxs = ((txs?.items ?? []) as Any[])
    .filter((x) => x?.hash)
    .map((x) => {
      const st = String(x.status ?? x.result ?? "").toLowerCase();
      const from = String(x.from?.hash ?? "").toLowerCase();
      return {
        hash: String(x.hash),
        t: Date.parse(x.timestamp) || 0,
        status: st === "error" || st.includes("fail") || st.includes("revert") ? "error" : st === "ok" || st.includes("success") ? "ok" : "pending",
        method: typeof x.method === "string" ? x.method : null,
        from,
        to: String(x.to?.hash ?? "").toLowerCase(),
        value: String(x.value ?? "0"),
        fee: from === me && x.fee?.value ? toDecimal(String(x.fee.value), 18) : null,
      };
    });

  const outTransfers = ((transfers?.items ?? []) as Any[])
    .map((tr) => {
      const hash = String(tr.transaction_hash ?? tr.tx_hash ?? "");
      if (!hash) return null;
      const token = tr.token ?? {};
      const decimals = Number(tr.total?.decimals ?? token.decimals ?? 18);
      const amount = toDecimal(String(tr.total?.value ?? "0"), Number.isFinite(decimals) ? decimals : 18);
      const from = String(tr.from?.hash ?? "").toLowerCase();
      const to = String(tr.to?.hash ?? "").toLowerCase();
      const symbol = String(token.symbol ?? "TOKEN");
      return {
        key: `${hash}:${tr.log_index ?? ""}:${from}:${to}:${amount}:${symbol}`,
        hash,
        t: Date.parse(tr.timestamp) || 0,
        symbol,
        amount,
        from,
        to,
        token: String(token.address_hash ?? token.address ?? "").toLowerCase(),
      };
    })
    .filter(Boolean);

  return NextResponse.json(
    { txs: outTxs, transfers: outTransfers, txNext: txs?.next_page_params ?? null, trNext: transfers?.next_page_params ?? null },
    { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60" } }
  );
}
