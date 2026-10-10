import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ARC_RPC = "https://rpc.mainnet.arc.io";

const ALLOWED_METHODS = new Set([
  "eth_chainId",
  "eth_blockNumber",
  "eth_call",
  "eth_getBalance",
  "eth_getCode",
  "eth_getTransactionCount",
  "eth_getTransactionReceipt",
  "eth_getTransactionByHash",
  "eth_getBlockByNumber",
  "eth_gasPrice",
  "eth_estimateGas",
  "eth_feeHistory",
  "eth_maxPriorityFeePerGas",
]);

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Invalid JSON-RPC request." },
        { status: 400 }
      );
    }

    const rpcRequest = body as {
      jsonrpc?: string;
      method?: string;
      params?: unknown[];
      id?: string | number | null;
    };

    if (
      rpcRequest.jsonrpc !== "2.0" ||
      typeof rpcRequest.method !== "string" ||
      !ALLOWED_METHODS.has(rpcRequest.method)
    ) {
      return NextResponse.json(
        { error: "Unsupported JSON-RPC method." },
        { status: 400 }
      );
    }

    if (
      rpcRequest.params !== undefined &&
      !Array.isArray(rpcRequest.params)
    ) {
      return NextResponse.json(
        { error: "RPC params must be an array." },
        { status: 400 }
      );
    }

    const upstream = await fetch(ARC_RPC, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: rpcRequest.id ?? 1,
        method: rpcRequest.method,
        params: rpcRequest.params ?? [],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    if (!upstream.ok) {
      return NextResponse.json(
        {
          error: `Arc RPC returned HTTP ${upstream.status}.`,
        },
        { status: 502 }
      );
    }

    const result: unknown = await upstream.json();

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown RPC error.";

    return NextResponse.json(
      {
        error: "Unable to connect to Arc Mainnet RPC.",
        details: message.slice(0, 200),
      },
      { status: 502 }
    );
  }
      }
