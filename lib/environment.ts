export const isMainnet =
  typeof window !== "undefined" &&
  window.location.hostname === "app.alabaamafi.xyz";

export const isTestnet = !isMainnet;
