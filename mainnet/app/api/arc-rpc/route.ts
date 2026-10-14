import { NextResponse } from "next/server";

/*
  Read-only relay to Arc's public RPC, so the Bridge page can read Arc balances and gas
  even when the visitor's network blocks Arc's RPC or their wallet is on another network.
  - Only read methods are allowed (no sending of transactions).
  - Only requests coming from your own site are answered.
  Place at: app/api/arc-rpc/route.ts
*/

const UPSTREAMS = [
  "https://rpc.mainnet.arc.io",
  "https://rpc.blockdaemon.mainnet.arc.io",
  "https://rpc.drpc.mainnet.arc.io",
  "https://rpc.quicknode.mainnet.arc.io",
];

const ALLOWED = new Set([
  "eth_call",
  "eth_getBalance",
  "eth_gasPrice",
  "eth_chainId",
  "eth_blockNumber",
  "eth_getTransactionReceipt",
  "eth_getTransactionByHash",
  "eth_estimateGas",
  "eth_feeHistory",
  "eth_maxPriorityFeePerGas",
  "eth_getCode",
  "eth_getTransactionCount",
  "eth_getBlockByNumber",
  "eth_getLogs",
  "net_version",
]);

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin) {
    try {
      if (new URL(origin).host !== host) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    } catch {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const calls = Array.isArray(body) ? body : [body];
  const ok = calls.length > 0 && calls.length <= 20 && calls.every((c) => typeof (c as { method?: unknown })?.method === "string" && ALLOWED.has((c as { method: string }).method));
  if (!ok) return NextResponse.json({ error: "method not allowed" }, { status: 400 });

  for (const url of UPSTREAMS) {
    try {
      const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
      if (r.ok) return new NextResponse(await r.text(), { status: 200, headers: { "content-type": "application/json" } });
    } catch {
      /* try the next endpoint */
    }
  }
  return NextResponse.json({ error: "upstream unavailable" }, { status: 502 });
}
