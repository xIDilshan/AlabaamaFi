import { NextResponse } from "next/server";

/*
  Market data for the Swap page (price, 24h change, market cap, 24h volume, charts).
  Runs on the server, so the CoinGecko key stays secret and answers are cached.
  Key (optional): COINGECKO_API_KEY in .env.local and in Vercel.
*/

const CG = "https://api.coingecko.com/api/v3";
const KEY = process.env.COINGECKO_API_KEY;

// cirBTC on Ethereum. CoinGecko tracks it by this address.
const ETH_CIRBTC = "0x72dfb2e44f59c5ad2bafe84314e5b99a7cd5075e";

const STATS = "vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true";
const DAYS = [1, 7, 30, 90, 365];

async function cg(path: string, revalidate: number) {
  const res = await fetch(`${CG}${path}`, {
    headers: { accept: "application/json", ...(KEY ? { "x-cg-demo-api-key": KEY } : {}) },
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  return res.json();
}

type Raw = { usd?: number; usd_24h_change?: number; usd_market_cap?: number; usd_24h_vol?: number };
const row = (r?: Raw, note?: string) =>
  r && typeof r.usd === "number"
    ? { price: r.usd, change24h: r.usd_24h_change ?? null, marketCap: r.usd_market_cap ?? null, volume24h: r.usd_24h_vol ?? null, ...(note ? { note } : {}) }
    : null;

function downsample<T>(items: T[], max = 140): T[] {
  if (items.length <= max) return items;
  const step = (items.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => items[Math.round(i * step)]);
}

const COIN_ID: Record<string, string> = { USDC: "usd-coin", EURC: "euro-coin" };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  /* ---- charts: line (price) or candle (OHLC) ---- */
  if (type === "chart") {
    const token = searchParams.get("token") ?? "";
    const kind = searchParams.get("kind") === "candle" ? "candle" : "line";
    const days = Number(searchParams.get("days"));
    if (!["USDC", "EURC", "cirBTC"].includes(token) || !DAYS.includes(days)) {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    // cirBTC is backed 1:1 by BTC, so if it has no data of its own we show Bitcoin's.
    const sources: { path: string; note?: string }[] =
      kind === "candle"
        ? token === "cirBTC"
          ? [{ path: `/coins/bitcoin/ohlc?vs_currency=usd&days=${days}`, note: "Bitcoin candles (cirBTC is backed 1:1 by BTC)" }]
          : [{ path: `/coins/${COIN_ID[token]}/ohlc?vs_currency=usd&days=${days}` }]
        : token === "cirBTC"
        ? [
            { path: `/coins/ethereum/contract/${ETH_CIRBTC}/market_chart?vs_currency=usd&days=${days}` },
            { path: `/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`, note: "Bitcoin chart (cirBTC is backed 1:1 by BTC)" },
          ]
        : [{ path: `/coins/${COIN_ID[token]}/market_chart?vs_currency=usd&days=${days}` }];

    for (const s of sources) {
      try {
        const data = await cg(s.path, 300);
        const headers = { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" };
        if (kind === "candle") {
          const candles = downsample(data as [number, number, number, number, number][], 160);
          if (candles.length > 1) return NextResponse.json({ candles, ...(s.note ? { note: s.note } : {}) }, { headers });
        } else {
          const points = downsample((data.prices ?? []) as [number, number][]);
          if (points.length > 1) return NextResponse.json({ points, ...(s.note ? { note: s.note } : {}) }, { headers });
        }
      } catch {
        /* try the next source */
      }
    }
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }

  /* ---- prices ---- */
  const [stables, btc, cir] = await Promise.allSettled([
    cg(`/simple/price?ids=usd-coin,euro-coin&${STATS}`, 60),
    cg(`/simple/price?ids=bitcoin&${STATS}`, 60),
    cg(`/simple/token_price/ethereum?contract_addresses=${ETH_CIRBTC}&${STATS}`, 60),
  ]);

  const s = stables.status === "fulfilled" ? stables.value : {};
  const b = btc.status === "fulfilled" ? btc.value : {};
  const c = cir.status === "fulfilled" ? cir.value : {};

  const cirRow = row(c[ETH_CIRBTC]);
  const btcRow = row(b.bitcoin);
  const prices = {
    USDC: row(s["usd-coin"]),
    EURC: row(s["euro-coin"]),
    // If cirBTC isn't priced yet, use Bitcoin's price (it is backed 1:1 by BTC) without market cap / volume.
    cirBTC: cirRow ?? (btcRow ? { ...btcRow, marketCap: null, volume24h: null, note: "Priced from BTC" } : null),
  };

  return NextResponse.json({ prices, updated: Date.now() }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
