"use client";

import { useEffect, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  WagmiProvider,
  createConfig,
} from "wagmi";
import {
  http,
} from "wagmi";
import {
  arcMainnet,
  arcTestnet,
} from "@/lib/wagmi";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () => new QueryClient()
  );

  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const isMainnet =
      window.location.hostname ===
      "app.alabaamafi.xyz";

    const activeArcChain = isMainnet
      ? arcMainnet
      : arcTestnet;

    const activeConfig = createConfig({
      chains: [activeArcChain],
      transports: {
        [arcMainnet.id]: http(
          "https://rpc.mainnet.arc.io"
        ),
        [arcTestnet.id]: http(
          "https://rpc.testnet.arc.io"
        ),
      },
      connectors: [],
    });

    setConfig(activeConfig);
  }, []);

  if (!config) {
    return null;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
