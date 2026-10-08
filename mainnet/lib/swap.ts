import { createSwapKit } from "@circle-fin/swap-kit";
import { createViemAdapter } from "@circle-fin/adapter-viem-v2";

export const swapKit = createSwapKit({
  adapter: createViemAdapter(),
});
