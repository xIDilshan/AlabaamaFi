const ARCSCAN_API =
  "https://api-testnet.arc-scan.org/v1";

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
    `${ARCSCAN_API}/address/${address}/activity?limit=50`
  );

  if (!response.ok) {
    throw new Error(
      `Arcscan API error: ${response.status}`
    );
  }

  const data = await response.json();

  const items = data.items || data.activity || [];

  return items.map((tx: any) => ({
    hash:
      tx.tx_hash ||
      tx.hash ||
      "",
    block:
      tx.block_number ||
      tx.block ||
      0,
    timestamp:
      tx.timestamp ||
      tx.time ||
      "",
    from:
      tx.from?.address ||
      tx.from ||
      "",
    to:
      tx.to?.address ||
      tx.to ||
      "",
    value:
      tx.value?.formatted ||
      tx.value?.raw ||
      tx.value ||
      "0",
    status:
      tx.status ||
      "success",
  }));
}
