const ARCSCAN_API =
  "https://api-testnet.arc-scan.org/v1";

export type WalletTransaction = {
  hash: string;
  block: number;
  timestamp: string;
  from: string;
  to: string;
  value: string;
  tokenSymbol: string;
  status: string;
};

/*
 * Convert Arcscan amount objects into a
 * human-readable value.
 */
function formatAmount(value: any): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "object") {
    if (
      value.formatted !== undefined &&
      value.formatted !== null
    ) {
      return String(value.formatted);
    }

    if (
      value.amount !== undefined &&
      value.amount !== null
    ) {
      return formatAmount(value.amount);
    }

    if (
      value.raw !== undefined &&
      value.raw !== null
    ) {
      const raw = String(value.raw);

      const decimals = Number(
        value.decimals ?? 18
      );

      if (
        Number.isFinite(decimals) &&
        decimals >= 0
      ) {
        try {
          const divisor = 10 ** decimals;

          return (
            Number(raw) / divisor
          ).toString();
        } catch {
          return raw;
        }
      }

      return raw;
    }

    if (
      value.value !== undefined &&
      value.value !== null
    ) {
      return formatAmount(value.value);
    }
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  return null;
}

/*
 * Find a token amount inside an Activity item.
 */
function findTokenAmount(tx: any): {
  value: string;
  symbol: string;
} | null {
  const candidates = [
    tx.amount,
    tx.token_amount,
    tx.tokenAmount,
    tx.token_transfer,
    tx.tokenTransfer,
    tx.transfer,
    tx.asset,
    tx.token,
    tx.action,
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const symbol =
      candidate.symbol ||
      candidate.token_symbol ||
      candidate.tokenSymbol ||
      candidate.token?.symbol ||
      candidate.asset?.symbol ||
      "";

    const amount =
      candidate.amount ??
      candidate.value ??
      candidate.balance ??
      candidate.quantity ??
      candidate.token?.amount ??
      candidate.asset?.amount ??
      null;

    const formatted =
      formatAmount(amount);

    if (
      formatted !== null &&
      formatted !== "0"
    ) {
      return {
        value: formatted,
        symbol: String(symbol || ""),
      };
    }

    const directFormatted =
      formatAmount(candidate);

    if (
      directFormatted !== null &&
      directFormatted !== "0" &&
      (
        candidate.raw !== undefined ||
        candidate.formatted !== undefined ||
        candidate.decimals !== undefined
      )
    ) {
      return {
        value: directFormatted,
        symbol: String(symbol || ""),
      };
    }
  }

  const arrays = [
    tx.transfers,
    tx.token_transfers,
    tx.tokenTransfers,
    tx.events,
    tx.actions,
  ];

  for (const list of arrays) {
    if (!Array.isArray(list)) {
      continue;
    }

    for (const item of list) {
      const result =
        findTokenAmount(item);

      if (result) {
        return result;
      }
    }
  }

  return null;
}

/*
 * Get native transaction value.
 */
function getNativeValue(tx: any): string {
  const formatted =
    formatAmount(tx.value);

  if (
    formatted !== null &&
    formatted !== "0"
  ) {
    return formatted;
  }

  return "0";
}

/*
 * Convert Arcscan timestamps into a standard
 * ISO timestamp.
 *
 * Supports:
 * - Unix seconds
 * - Unix milliseconds
 * - numeric strings
 * - ISO date strings
 * - nested timestamp objects
 */
function normalizeTimestamp(
  value: any
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  /*
   * Some APIs return timestamp information
   * inside an object.
   */
  if (
    typeof value === "object"
  ) {
    const nested =
      value.timestamp ??
      value.time ??
      value.value ??
      value.seconds ??
      value.unix ??
      value.date;

    if (
      nested !== undefined &&
      nested !== value
    ) {
      return normalizeTimestamp(
        nested
      );
    }

    return "";
  }

  /*
   * Numeric Unix timestamp.
   */
  if (
    typeof value === "number"
  ) {
    const milliseconds =
      value < 100000000000
        ? value * 1000
        : value;

    const date =
      new Date(milliseconds);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    return date.toISOString();
  }

  const stringValue =
    String(value).trim();

  /*
   * Numeric Unix timestamp returned
   * as a string.
   */
  if (
    /^\d+$/.test(stringValue)
  ) {
    const numericValue =
      Number(stringValue);

    const milliseconds =
      numericValue < 100000000000
        ? numericValue * 1000
        : numericValue;

    const date =
      new Date(milliseconds);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    return date.toISOString();
  }

  /*
   * ISO / normal date string.
   */
  const date =
    new Date(stringValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toISOString();
}

export async function getWalletTransactions(
  address: string
): Promise<WalletTransaction[]> {
  const response =
    await fetch(
      `${ARCSCAN_API}/address/${address}/activity?limit=50`
    );

  if (!response.ok) {
    throw new Error(
      `Arcscan API error: ${response.status}`
    );
  }

  const data =
    await response.json();

  const items =
    data.items ||
    data.activity ||
    data.data ||
    [];

  return items.map(
    (tx: any) => {
      const tokenTransfer =
        findTokenAmount(tx);

      const nativeValue =
        getNativeValue(tx);

      const value =
        tokenTransfer?.value ??
        nativeValue;

      const tokenSymbol =
        tokenTransfer?.symbol ||
        tx.symbol ||
        tx.token_symbol ||
        tx.token?.symbol ||
        "";

      const rawTimestamp =
        tx.timestamp ??
        tx.time ??
        tx.block_time ??
        tx.block_timestamp ??
        tx.created_at ??
        "";

      return {
        hash:
          tx.tx_hash ||
          tx.hash ||
          tx.transaction_hash ||
          "",

        block:
          tx.block_number ||
          tx.block ||
          0,

        timestamp:
          normalizeTimestamp(
            rawTimestamp
          ),

        from:
          tx.from?.address ||
          tx.from ||
          tx.sender?.address ||
          tx.sender ||
          "",

        to:
          tx.to?.address ||
          tx.to ||
          tx.receiver?.address ||
          tx.receiver ||
          "",

        value,

        tokenSymbol:
          String(tokenSymbol),

        status:
          tx.status ||
          tx.tx_status ||
          "success",
      };
    }
  );
}
