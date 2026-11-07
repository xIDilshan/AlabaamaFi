import { NextResponse } from "next/server";
import { AppKit } from "@circle-fin/app-kit";

export const dynamic = "force-dynamic";

type Chain = {
  chain?: string;
  name?: string;
  type?: string;
  chainId?: number;
  isTestnet?: boolean;
  forwarderSupported?: { source?: boolean; destination?: boolean };
};

const OPERATIONS = ["bridge", "swap", "unifiedBalance", "earn", "borrow"] as const;

export async function GET() {
  const kit = new AppKit() as unknown as { getSupportedChains: (op?: string) => unknown };
  const out: Record<string, unknown> = {};

  for (const op of OPERATIONS) {
    try {
      const list = kit.getSupportedChains(op) as Chain[];
      const mainnet = (Array.isArray(list) ? list : []).filter((c) => !c.isTestnet);
      out[op] = {
        mainnetCount: mainnet.length,
        mainnet: mainnet.map((c) => `${c.chain}${c.type && c.type !== "evm" ? ` [${c.type}]` : ""}${c.forwarderSupported?.destination ? " (forwarder to)" : ""}${c.forwarderSupported?.source ? " (forwarder from)" : ""}`),
      };
    } catch (e) {
      out[op] = { error: String((e as Error)?.message ?? e).slice(0, 200) };
    }
  }

  let version = "unknown";
  try {
    const fs = await import("fs");
    const path = await import("path");
    version = JSON.parse(fs.readFileSync(path.join(process.cwd(), "node_modules/@circle-fin/app-kit/package.json"), "utf8")).version;
  } catch {
    version = "unknown";
  }

  return NextResponse.json({ appKitVersion: version, operations: out }, { headers: { "Cache-Control": "no-store" } });
}
