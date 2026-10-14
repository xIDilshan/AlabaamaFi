import { NextResponse } from "next/server";

/*
  Activity feed for the Activity page: ALL transactions and token transfers of a wallet on Arc mainnet,
  read page by page from Arc's official explorer (Blockscout). The page asks for the next page with the cursors
  this route returns, until the whole history is loaded.
  Place at: app/api/activity/route.ts

  Optional: BLOCKSCOUT_API_KEY (a free Blockscout Pro API key) in .env.local and in Vercel. With a key the
  Blockscout Pro API is used (more reliable); without one the public explorer API is tried.
*/

const KEY = process.env.BLOCKSCOUT_API_KEY;
const BASE = KEY ? "https://api.blockscout.com/5042/api/v2" : "https://explorer.arc.io/api/v2";

const ADDR_RE = /^0x[0-9a-fA-F]{40}$/;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

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
