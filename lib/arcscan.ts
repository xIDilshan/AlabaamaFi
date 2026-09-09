const ARCSCAN_API = "https://testnet.arcscan.app/api/v2";

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
  const url =
    `${ARCSCAN_API}/addresses/${address}/transactions` +
    `?filter=validated`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `ArcScan API error: ${response.status}`
    );
  }

  const data = await response.json();

  return (data.items || []).map((tx: any) => ({
    hash: tx.hash || "",
    block:
      tx.block_number ??
      tx.block ??
      0,
    timestamp:
      tx.timestamp || "",
    from:
      tx.from?.hash ||
      "",
    to:
      tx.to?.hash ||
      "",
    value:
      tx.value ||
      "0",
    status:
      tx.status ||
      (tx.success === false ? "failed" : "success"),
  }));
}
