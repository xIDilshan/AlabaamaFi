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
  "getSignaturesForAddress",
  "getBlockTime",
  "getVersion",
  "getHealth",
  "getGenesisHash",
  "getTransactionCount",
  "getTokenSupply",
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

type Attempt = { source: "private" | "public"; status: number | "error" };

async function askSolana(body: string): Promise<{ text: string | null; answeredBy: "private" | "public" | null; failed: Attempt[] }> {
  const servers: { url: string; source: "private" | "public" }[] = [
    ...(process.env.SOLANA_RPC_URL ? [{ url: process.env.SOLANA_RPC_URL, source: "private" as const }] : []),
    ...PUBLIC_RPCS.map((url) => ({ url, source: "public" as const })),
  ];
  const failed: Attempt[] = [];
  for (const server of servers) {
    try {
      const r = await fetch(server.url, { method: "POST", headers: { "Content-Type": "application/json" }, body, signal: AbortSignal.timeout(12000), cache: "no-store" });
      if (!r.ok) {
        failed.push({ source: server.source, status: r.status });
        continue;
      }
      return { text: await r.text(), answeredBy: server.source, failed };
    } catch {
      failed.push({ source: server.source, status: "error" });
    }
  }
  return { text: null, answeredBy: null, failed };
}

export async function GET() {
  const started = Date.now();
  const { text, answeredBy, failed } = await askSolana(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getSlot" }));
  let slot: number | null = null;
  try {
    const result = (JSON.parse(text ?? "null") as { result?: unknown } | null)?.result;
    slot = typeof result === "number" ? result : null;
  } catch {
    slot = null;
  }
  return reply({
    privateRpcUrlSet: !!process.env.SOLANA_RPC_URL,
    working: slot !== null,
    answeredBy,
    slot,
    ms: Date.now() - started,
    failedBefore: failed.map((f) => `${f.source} ${f.status}`),
  });
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

  const { text: answer, failed } = await askSolana(text);
  if (answer !== null) return new Response(answer, { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

  const id = !Array.isArray(body) && body && typeof body === "object" ? (body as { id?: unknown }).id ?? null : null;
  const why = failed.map((f) => `${f.source} ${f.status}`).join(", ");
  return reply({ jsonrpc: "2.0", id, error: { code: -32000, message: `Solana RPC unavailable (${why || "no server"})` } }, 502);
}
