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

function formatTokenAmount(
  value: string | number | bigint,
  decimals: number
): string {
  try {
    const raw = BigInt(String(value));
    const zero = BigInt(0);

    if (decimals === 0) {
      return raw.toString();
    }

    const negative = raw < zero;
    const absolute = negative
      ? zero - raw
      : raw;

    const base =
      BigInt(10) ** BigInt(decimals);

    const whole = absolute / base;
    const fraction = absolute % base;

    if (fraction === zero) {
      return `${negative ? "-" : ""}${whole}`;
    }

    const fractionString = fraction
      .toString()
      .padStart(decimals, "0")
      .replace(/0+$/, "");

    return `${negative ? "-" : ""}${whole}.${fractionString}`;
  } catch {
    return String(value);
  }
}

function getTransferAmount(
  transfer: any
): string | null {
  const total = transfer?.total || {};

  const rawValue =
    total.value ??
    transfer?.value ??
    transfer?.amount ??
    null;

  if (
    rawValue === null ||
    rawValue === undefined
  ) {
    return null;
  }

  const decimals = Number(
    total.decimals ??
      transfer?.token?.decimals ??
      transfer?.decimals ??
      18
  );

  if (!Number.isFinite(decimals)) {
    return String(rawValue);
  }

  return formatTokenAmount(
    rawValue,
    decimals
  );
}

async function getTransactionTokenTransfer(
  hash: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `${ARCSCAN_API}/transactions/${hash}/token-transfers`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    const transfers = Array.isArray(data)
      ? data
      : data.items ||
        data.token_transfers ||
        data.transfers ||
        [];

    if (
      !Array.isArray(transfers) ||
      transfers.length === 0
    ) {
      return null;
    }

    for (const transfer of transfers) {
      const amount =
        getTransferAmount(transfer);

      if (
        amount !== null &&
        Number(amount) !== 0
      ) {
        return amount;
      }
    }

    const firstAmount =
      getTransferAmount(transfers[0]);

    return firstAmount;
  } catch {
    return null;
  }
}

export async function getWalletTransactions(
  address: string
): Promise<WalletTransaction[]> {
  const response = await fetch(
    `${ARCSCAN_API}/addresses/${address}/transactions`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch wallet activity."
    );
  }

  const data = await response.json();

  const transactions = Array.isArray(data)
    ? data
    : data.items || [];

  const mappedTransactions =
    await Promise.all(
      transactions.map(async (tx: any) => {
        const hash =
          tx.hash ||
          tx.transaction_hash ||
          "";

        let value = "0";

        const tokenTransferValue =
          hash
            ? await getTransactionTokenTransfer(
                hash
              )
            : null;

        if (
          tokenTransferValue !== null &&
          tokenTransferValue !== undefined
        ) {
          value = tokenTransferValue;
        } else {
          const rawValue =
            tx.value ??
            tx.amount ??
            "0";

          try {
            value = formatTokenAmount(
              rawValue,
              6
            );
          } catch {
            value = String(rawValue);
          }
        }

        return {
          hash,
          block:
            Number(
              tx.block_number ??
                tx.block ??
                0
            ),
          timestamp:
            tx.timestamp ||
            tx.created_at ||
            "",
          from:
            tx.from?.hash ||
            tx.from ||
            "",
          to:
            tx.to?.hash ||
            tx.to ||
            "",
          value,
          status:
            tx.status ||
            tx.result ||
            "ok",
        };
      })
    );

  return mappedTransactions;
}
