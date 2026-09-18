import { NextResponse } from "next/server";

const SYNTHRA_API_BASE =
  "https://trading-api.synthra.org";

const ARC_TESTNET_CHAIN_ID = 5042002;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.SYNTHRA_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Synthra API key is not configured.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    if (body.chainId !== ARC_TESTNET_CHAIN_ID) {
      return NextResponse.json(
        {
          error: "Only Arc Testnet swaps are supported.",
        },
        { status: 400 }
      );
    }

    if (!body.action) {
      return NextResponse.json(
        {
          error: "Swap action is required.",
        },
        { status: 400 }
      );
    }

    const endpoint =
      body.action === "quote"
        ? "/v1/quote"
        : body.action === "swap"
        ? "/v1/swap"
        : null;

    if (!endpoint) {
      return NextResponse.json(
        {
          error: "Invalid swap action.",
        },
        { status: 400 }
      );
    }

    const synthraBody = {
      ...body,
    };

    delete synthraBody.action;

    const response = await fetch(
      `${SYNTHRA_API_BASE}${endpoint}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(synthraBody),
        cache: "no-store",
      }
    );

    const responseText = await response.text();

    let responseData: unknown;

    try {
      responseData = responseText
        ? JSON.parse(responseText)
        : {};
    } catch {
      responseData = {
        error: responseText,
      };
    }

    if (!response.ok) {
      console.error(
        "Synthra API error:",
        response.status,
        responseData
      );

      return NextResponse.json(
        {
          error: "Synthra API request failed.",
          details: responseData,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error(
      "Swap API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Invalid swap request.",
      },
      { status: 500 }
    );
  }
}
