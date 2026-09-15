import {
    createViemAdapterFromProvider,
} from "@circle-fin/adapter-viem-v2";

import { AppKit } from "@circle-fin/app-kit";

import type { EIP1193Provider } from "viem";

export async function createCircleViemAdapter() {
    if (typeof window === "undefined") {
        throw new Error(
            "Circle Viem adapter can only be created in the browser."
        );
    }

    const provider = (
        window as typeof window & {
            ethereum?: EIP1193Provider;
        }
    ).ethereum;

    if (!provider) {
        throw new Error(
            "No browser wallet provider found."
        );
    }

    const kit = new AppKit();

    const supportedChains =
        kit.getSupportedChains("swap");

    const arcTestnet = supportedChains.find(
        (chain) => chain.chain === "Arc_Testnet"
    );

    if (!arcTestnet) {
        throw new Error(
            "Arc Testnet is not available for swaps."
        );
    }

    return createViemAdapterFromProvider({
        provider,
        capabilities: {
            addressContext: "user-controlled",
            supportedChains: [arcTestnet],
        },
    });
}