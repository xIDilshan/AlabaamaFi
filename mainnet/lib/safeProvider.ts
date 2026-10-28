type Fn = (...args: unknown[]) => unknown;
type Bag = Record<string, unknown>;

const FLAGS = [
  "isMetaMask", "isBraveWallet", "isRabby", "isOkxWallet", "isOKExWallet", "isBitget", "isBitKeep", "isBitgetWallet", "isTrust", "isTrustWallet",
  "isCoinbaseWallet", "isCoinbaseBrowser", "isPhantom", "isSafePal", "isSafePalWallet", "isCtrl", "isXDEFI", "isXDEFIWallet", "isTalisman",
  "isUniswapWallet", "isMathWallet", "isTokenPocket", "isZerion", "isRainbow", "isExodus", "isBinance", "isBinanceWallet", "isGate", "isGateWallet",
];

const made = new WeakMap<object, object>();
const facades = new WeakSet<object>();

function read(raw: object, key: string): unknown {
  try {
    const d = Object.getOwnPropertyDescriptor(raw, key);
    if (d && "value" in d) return d.value;
  } catch {
    /* fall through to a normal read */
  }
  try {
    return (raw as Bag)[key];
  } catch {
    return undefined;
  }
}

const method = (raw: object, key: string): Fn | undefined => {
  const v = read(raw, key);
  return typeof v === "function" ? (v as Fn) : undefined;
};

export function safeProvider<T>(provider: T): T {
  if (!provider || typeof provider !== "object") return provider;
  const raw = provider as unknown as object;
  if (facades.has(raw)) return provider;
  const cached = made.get(raw);
  if (cached) return cached as unknown as T;

  const listen = (event: unknown, handler: unknown) => {
    (method(raw, "on") ?? method(raw, "addListener"))?.call(raw, event, handler);
    return facade;
  };
  const unlisten = (event: unknown, handler: unknown) => {
    (method(raw, "removeListener") ?? method(raw, "off"))?.call(raw, event, handler);
    return facade;
  };
  const facade: Bag = {
    request: (args: unknown) => {
      const fn = method(raw, "request");
      if (!fn) throw new Error("This wallet cannot send requests.");
      return fn.call(raw, args);
    },
    on: listen,
    addListener: listen,
    removeListener: unlisten,
    off: unlisten,
  };
  for (const flag of FLAGS) Object.defineProperty(facade, flag, { get: () => read(raw, flag), enumerable: true });
  for (const key of ["chainId", "selectedAddress", "networkVersion"]) Object.defineProperty(facade, key, { get: () => read(raw, key), enumerable: true });
  Object.defineProperty(facade, "__raw", { value: raw });

  facades.add(facade);
  made.set(raw, facade);
  return facade as unknown as T;
}

export const unwrapProvider = <T>(provider: T): T => ((provider as unknown as { __raw?: T })?.__raw ?? provider) as T;
