import { NextResponse } from "next/server";

/*
  Market data for the Swap page (price, 24h change, market cap, 24h volume, chart).
  Runs on the server, so a key (optional) stays secret and answers are cached for a minute.
  Optional: add COINGECKO_API_KEY (a free "Demo" key) in .env.local and in Vercel to avoid rate limits.
*/

const CG = "https://api.coingecko.com/api/v3";
const KEY = process.env.COINGECKO_API_KEY;

// cirBTC on Ethereum. CoinGecko tracks it by this address.
const ETH_CIRBTC = "0x72dfb2e44f59c5ad2bafe84314e5b99a7cd5075e";

const STATS = "vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true";

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

function downsample(points: [number, number][], max = 120) {
  if (points.length <= max) return points;
  const step = (points.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => points[Math.round(i * step)]);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  /* ---- chart ---- */
  if (type === "chart") {
    const token = searchParams.get("token");
    const days = Number(searchParams.get("days"));
    if (!["USDC", "EURC", "cirBTC"].includes(token ?? "") || ![1, 7, 30].includes(days)) {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }
    const paths: Record<string, string[]> = {
      USDC: [`/coins/usd-coin/market_chart?vs_currency=usd&days=${days}`],
      EURC: [`/coins/euro-coin/market_chart?vs_currency=usd&days=${days}`],
      // cirBTC is backed 1:1 by BTC, so if it has no chart of its own we show Bitcoin's.
      cirBTC: [`/coins/ethereum/contract/${ETH_CIRBTC}/market_chart?vs_currency=usd&days=${days}`, `/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`],
    };
    for (let i = 0; i < paths[token as string].length; i++) {
      try {
        const data = await cg(paths[token as string][i], 300);
        const points = downsample((data.prices ?? []) as [number, number][]);
        if (points.length > 1) {
          return NextResponse.json(
            { points, ...(token === "cirBTC" && i === 1 ? { note: "Bitcoin chart (cirBTC is backed 1:1 by BTC)" } : {}) },
            { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } }
          );
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
