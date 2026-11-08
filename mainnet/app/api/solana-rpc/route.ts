export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "getAccountInfo",
  "getBalance",
  "getBlockHeight",
  "getEpochInfo",
  "getFeeForMessage",
  "getLatestBlockhash",
  "getMinimumBalanceForRentExemption",
  "getMultipleAccounts",
  "getRecentPrioritizationFees",
  "getSignatureStatuses",
  "getSlot",
  "getTokenAccountBalance",
  "getTokenAccountsByOwner",
  "getTransaction",
  "isBlockhashValid",
  "sendTransaction",
  "simulateTransaction",
]);

const PUBLIC_RPCS = ["https://api.mainnet-beta.solana.com", "https://solana-rpc.publicnode.com"];

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

function originOk(req: Request) {
  const from = req.headers.get("origin") ?? req.headers.get("referer");
  if (!from) return false;
  try {
    const host = new URL(from).hostname;
    return host === "alabaamafi.xyz" || host === "app.alabaamafi.xyz" || host.endsWith(".vercel.app") || host === "localhost";
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!originOk(req)) return reply({ error: "forbidden" }, 403);

  const text = await req.text();
  if (text.length > 200000) return reply({ error: "too large" }, 413);

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return reply({ error: "bad request" }, 400);
  }

  const calls = Array.isArray(body) ? body : [body];
  if (calls.length === 0 || calls.length > 20) return reply({ error: "bad request" }, 400);
  for (const call of calls) {
    const method = call && typeof call === "object" ? (call as { method?: unknown }).method : undefined;
    if (typeof method !== "string" || !ALLOWED.has(method)) return reply({ error: "method not allowed" }, 403);
  }

  const upstreams = [process.env.SOLANA_RPC_URL, ...PUBLIC_RPCS].filter((u): u is string => !!u);
  for (const url of upstreams) {
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: text, signal: AbortSignal.timeout(12000), cache: "no-store" });
      if (!r.ok) continue;
      return new Response(await r.text(), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
    } catch {
      continue;
    }
  }
  return reply({ error: "upstream unavailable" }, 502);
}
