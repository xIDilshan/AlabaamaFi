import { NextResponse } from "next/server";

/*
  Activity feed for the Activity page: a wallet's recent transactions and token transfers on Arc mainnet,
  read from Arc's official explorer (Blockscout) and grouped into sends, receives, swaps and bridges.
  Place at: app/api/activity/route.ts

  Optional: BLOCKSCOUT_API_KEY (a free Blockscout Pro API key) in .env.local and in Vercel. With a key the
  Blockscout Pro API is used (more reliable); without one the public explorer API is tried.
*/

const KEY = process.env.BLOCKSCOUT_API_KEY;
const BASE = KEY ? "https://api.blockscout.com/5042/api/v2" : "https://explorer.arc.io/api/v2";

const ADDR_RE = /^0x[0-9a-fA-F]{40}$/;
const ZERO = "0x0000000000000000000000000000000000000000";
const USDC_ERC20 = "0x3600000000000000000000000000000000000000";

async function bs(path: string) {
  const sep = path.includes("?") ? "&" : "?";
  const url = `${BASE}${path}${KEY ? `${sep}apikey=${encodeURIComponent(KEY)}` : ""}`;
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

type Leg = { symbol: string; amount: string; dir: "in" | "out" };
type Ev = {
  hash: string;
  t: number;
  status: "ok" | "error" | "pending";
  type: "send" | "receive" | "swap" | "bridge-out" | "bridge-in" | "contract";
  legs: Leg[];
  peer?: string;
  fee?: string;
  method?: string;
  minted?: boolean;
};
type Work = Ev & { nFrom: string; nTo: string; nValue: string; usdcKeys: Set<string> };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = (searchParams.get("address") ?? "").trim();
  if (!ADDR_RE.test(address)) return NextResponse.json({ error: "bad address" }, { status: 400 });
  const me = address.toLowerCase();

  let txs: Any;
  let transfers: Any;
  try {
    [txs, transfers] = await Promise.all([bs(`/addresses/${address}/transactions`), bs(`/addresses/${address}/token-transfers?type=ERC-20`)]);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "explorer unavailable" }, { status: 502 });
  }

  const map = new Map<string, Work>();
  const get = (hash: string, t: number): Work => {
    let ev = map.get(hash);
    if (!ev) {
      ev = { hash, t, status: "ok", type: "contract", legs: [], nFrom: "", nTo: "", nValue: "0", usdcKeys: new Set() };
      map.set(hash, ev);
    }
    if (t && !ev.t) ev.t = t;
    return ev;
  };

  /* transactions (gas, status, plain USDC sends) */
  for (const x of (txs?.items ?? []) as Any[]) {
    if (!x?.hash) continue;
    const ev = get(String(x.hash), Date.parse(x.timestamp) || 0);
    const st = String(x.status ?? x.result ?? "").toLowerCase();
    ev.status = st === "error" || st.includes("fail") || st.includes("revert") ? "error" : st === "ok" || st.includes("success") ? "ok" : "pending";
    ev.method = typeof x.method === "string" ? x.method : undefined;
    ev.nFrom = String(x.from?.hash ?? "").toLowerCase();
    ev.nTo = String(x.to?.hash ?? "").toLowerCase();
    ev.nValue = String(x.value ?? "0");
    if (ev.nFrom === me && x.fee?.value) ev.fee = toDecimal(String(x.fee.value), 18);
  }

  /* token transfers (USDC, EURC, cirBTC, ...) */
  for (const tr of (transfers?.items ?? []) as Any[]) {
    const hash = String(tr.transaction_hash ?? tr.tx_hash ?? "");
    if (!hash) continue;
    const ev = get(hash, Date.parse(tr.timestamp) || 0);
    const token = tr.token ?? {};
    const symbol = String(token.symbol ?? "TOKEN");
    const decimals = Number(tr.total?.decimals ?? token.decimals ?? 18);
    const amount = toDecimal(String(tr.total?.value ?? "0"), Number.isFinite(decimals) ? decimals : 18);
    const from = String(tr.from?.hash ?? "").toLowerCase();
    const to = String(tr.to?.hash ?? "").toLowerCase();
    if (from === me && to === me) continue;
    const dir: "in" | "out" | null = from === me ? "out" : to === me ? "in" : null;
    if (!dir) continue;
    ev.legs.push({ symbol, amount, dir });
    ev.peer = ev.peer ?? (dir === "out" ? to : from);
    if (dir === "in" && from === ZERO) ev.minted = true;
    const tokenAddr = String(token.address_hash ?? token.address ?? "").toLowerCase();
    if (tokenAddr === USDC_ERC20) ev.usdcKeys.add(`${dir}:${amount}`);
  }

  /* plain USDC transfers (Arc's gas coin) that have no token-transfer record */
  for (const ev of map.values()) {
    if (!/^[1-9]\d*$/.test(ev.nValue)) continue;
    const amount = toDecimal(ev.nValue, 18);
    if (ev.nFrom === me && ev.nTo !== me && !ev.usdcKeys.has(`out:${amount}`)) {
      ev.legs.push({ symbol: "USDC", amount, dir: "out" });
      ev.peer = ev.peer ?? ev.nTo;
    } else if (ev.nTo === me && ev.nFrom !== me && !ev.usdcKeys.has(`in:${amount}`)) {
      ev.legs.push({ symbol: "USDC", amount, dir: "in" });
      ev.peer = ev.peer ?? ev.nFrom;
    }
  }

  /* what kind of activity is it? */
  const events: Ev[] = [];
  for (const w of map.values()) {
    const outs = w.legs.filter((l) => l.dir === "out");
    const ins = w.legs.filter((l) => l.dir === "in");
    const m = (w.method ?? "").toLowerCase();
    let type: Ev["type"] = "contract";
    if (/depositforburn|burn/.test(m) && outs.length) type = "bridge-out";
    else if (/receivemessage|mint/.test(m) && ins.length) type = "bridge-in";
    else if (outs.length && ins.length && outs.some((o) => ins.some((i) => i.symbol !== o.symbol))) type = "swap";
    else if (ins.length && w.minted && !outs.length) type = "bridge-in";
    else if (outs.length && !ins.length) type = "send";
    else if (ins.length && !outs.length) type = "receive";
    else if (outs.length && ins.length) type = "send";
    if (type === "contract" && !w.method && !w.legs.length) continue; // nothing useful to show
    const { nFrom, nTo, nValue, usdcKeys, ...ev } = w;
    void nFrom; void nTo; void nValue; void usdcKeys;
    events.push({ ...ev, type });
  }
  events.sort((a, b) => b.t - a.t);

  return NextResponse.json({ events: events.slice(0, 60), updated: Date.now() }, { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60" } });
}
