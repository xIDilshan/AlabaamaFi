import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const apiKey = process.env.CIRCLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Circle API key is not configured.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Circle Swap API configuration is ready.",
      chain: "Arc_Testnet",
      tokenIn: body.tokenIn,
      tokenOut: body.tokenOut,
      amountIn: body.amountIn,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Invalid swap request.",
      },
      { status: 400 }
    );
  }
}