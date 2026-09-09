const ARCSCAN_API =
  "https://testnet.arcscan.app/api/v2";

export type WalletTransaction = {
  hash: string;
  block: number;
  timestamp: string;
  from: string;
  to: string;
  value: string;
  status: string;
};

export async function getWalletTransactions(
  address: string
): Promise<WalletTransaction[]> {
  const response = await fetch(
    `${ARCSCAN_API}/addresses/${address}/transactions?filter=validated`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch wallet activity.");
  }

  const data = await response.json();

  return (data.items || []).map((tx: any) => ({
    hash: tx.hash,
    block: tx.block,
    timestamp: tx.timestamp,
    from: tx.from?.hash || "",
    to: tx.to?.hash || "",
    value: tx.value || "0",
    status: tx.status || "ok",
  }));
}
