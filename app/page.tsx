"use client";

import { useEffect, useState } from "react";
import { Manrope } from "next/font/google";
import { useRouter } from "next/navigation";

import Header from "@/components/Header";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["600"],
});

type Section =
  | "send"
  | "swap"
  | "bridge"
  | "activity"
  | "faucet";

export default function Home() {
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  useEffect(() => {
    const handleMenuState = (event: Event) => {
      const customEvent =
        event as CustomEvent<boolean>;

      setMobileMenuOpen(customEvent.detail);
    };

    window.addEventListener(
      "mobile-menu-state",
      handleMenuState
    );

    return () => {
      window.removeEventListener(
        "mobile-menu-state",
        handleMenuState
      );
    };
  }, []);

  const handleNavigation = (section: Section) => {
    const routes: Record<Section, string> = {
      send: "/send",
      swap: "/swap",
      bridge: "/bridge",
      activity: "/activity",
      faucet: "/faucet",
    };

    router.push(routes[section]);
  };

  return (
    <main className="min-h-screen bg-[#030405] text-white">
      <style jsx global>{`
        button {
          font-family: ${manrope.style.fontFamily} !important;
          font-weight: 600 !important;
          letter-spacing: normal !important;
        }

        .quick-access-button {
          font-family: ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif !important;
          font-weight: 700 !important;
          letter-spacing: normal !important;
        }
      `}</style>

      {/* HEADER */}

      <Header />

      {/* CONTENT */}

      <div
        className={`min-w-0 transition-[filter] duration-300 ${
          mobileMenuOpen
            ? "blur-md"
            : "blur-0"
        }`}
      >
        {/* HOME */}

        <section>
          {/* HERO */}

          <div className="relative overflow-hidden border-b border-white/[0.06] bg-[#030507]">
            <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[#14376a]/[0.09] blur-[120px]" />

            <div className="pointer-events-none absolute left-1/2 top-[45%] h-40 w-80 -translate-x-1/2 rounded-full bg-white/[0.015] blur-3xl" />

            <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-16 text-center sm:px-6 sm:pb-24 sm:pt-24 lg:px-10 lg:pb-28 lg:pt-28">
              <div className="mx-auto max-w-5xl">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/30 sm:text-sm">
                  A simple interface for Arc
                </p>

                <h2 className="mx-auto mt-7 max-w-4xl text-center text-[3.7rem] font-black leading-[0.88] tracking-[-0.055em] sm:text-7xl lg:text-[7.5rem]">
                  One place.
                  <br />
                  <span className="text-white/30 tracking-[-0.015em]">
                    Every move.
                  </span>
                </h2>

                <p className="mx-auto mt-8 max-w-2xl text-sm font-medium leading-7 text-white/45 sm:mt-9 sm:text-lg sm:leading-8">
                  Explore, manage and move your digital assets on Arc with a clean and simple DeFi experience built for everyday use.
                </p>

                <div className="mt-9 flex flex-col justify-center gap-3 sm:mt-10 sm:flex-row">
                  <button
                    onClick={() =>
                      handleNavigation("send")
                    }
                    className="min-h-13 w-full rounded-2xl border border-black/[0.08] bg-white px-7 py-4 text-base !font-bold tracking-normal text-black shadow-[0_2px_6px_rgba(0,0,0,0.06),0_10px_28px_rgba(0,0,0,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#fafafa] hover:shadow-[0_4px_10px_rgba(0,0,0,0.08),0_14px_34px_rgba(0,0,0,0.18)] active:translate-y-0 sm:w-auto"
                  >
                    Send Assets
                  </button>

                  <button
                    onClick={() =>
                      handleNavigation("activity")
                    }
                    className="min-h-13 w-full rounded-2xl border border-white/[0.10] bg-white/[0.045] px-7 py-4 text-sm font-black tracking-tight text-white/80 shadow-lg shadow-black/20 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.18] hover:bg-white/[0.08] hover:text-white active:translate-y-0 sm:w-auto"
                  >
                    Check Wallet Activity
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS */}

          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
            <div className="mb-6 text-center sm:mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/25">
                Explore AlabaamaFi
              </p>

              <h3 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Everything in one place
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-6 text-white/30">
                Simple tools for interacting with
                assets and activity on Arc Testnet.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  id: "send" as Section,
                  icon: "↗",
                  title: "Send USDC",
                  text: "Send USDC to another wallet.",
                },
                {
                  id: "swap" as Section,
                  icon: "⇄",
                  title: "Swap Tokens",
                  text: "Swap supported assets on Arc.",
                },
                {
                  id: "bridge" as Section,
                  icon: "⇅",
                  title: "Bridge USDC",
                  text: "Move assets across networks.",
                },
                {
                  id: "activity" as Section,
                  icon: "◷",
                  title: "Wallet Activity",
                  text: "Explore wallet activity and assets.",
                },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    handleNavigation(item.id)
                  }
                  className="quick-access-button group min-w-0 rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#0a0f16] via-[#07090c] to-[#030303] p-6 text-center shadow-lg shadow-black/40 transition-all duration-200 hover:-translate-y-1 hover:border-[#2b6cff]/20 hover:shadow-xl hover:shadow-black/50 active:translate-y-0"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-[#080a0d] text-xl font-bold text-white/65 transition-all group-hover:border-[#2b6cff]/20 group-hover:bg-[#0b1017] group-hover:text-white">
                    {item.icon}
                  </div>

                  <div className="mt-6 flex items-center justify-center gap-2">
                    <h4 className="font-black tracking-tight text-white">
                      {item.title}
                    </h4>
                  </div>

                  <p className="mt-2 text-sm font-medium leading-6 text-white/30">
                    {item.text}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* SILVER DIVIDER */}

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>

          {/* SUPPORTED ASSETS */}

          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
            <div className="p-0">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/25">
                    Supported Assets
                  </p>

                  <h3 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                    Explore assets on Arc
                  </h3>

                  <p className="mt-3 max-w-xl text-sm font-medium leading-7 text-white/30">
                    AlabaamaFi currently displays
                    <br className="sm:hidden" />{" "}
                    USDC, EURC and cirBTC balances
                    <br />
                    <span className="text-white/45">
                      Available on Arc Network
                    </span>
                  </p>
                </div>

                <div className="grid w-full grid-cols-3 gap-4 lg:w-auto lg:min-w-[460px]">
                  <div className="flex min-w-0 items-center gap-2 p-1 sm:gap-3">
                    <img
                      src="/tokens/usdc.svg"
                      alt="USDC"
                      className="h-9 w-9 shrink-0 rounded-full object-contain"
                    />

                    <div className="min-w-0">
                      <p className="truncate font-black">
                        USDC
                      </p>

                      <p className="mt-0.5 hidden text-xs font-medium text-white/25 sm:block">
                        USD Coin
                      </p>
                    </div>
                  </div>

                  <div className="flex min-w-0 items-center gap-2 p-1 sm:gap-3">
                    <img
                      src="/tokens/eurc.svg"
                      alt="EURC"
                      className="h-9 w-9 shrink-0 rounded-full object-contain"
                    />

                    <div className="min-w-0">
                      <p className="truncate font-black">
                        EURC
                      </p>

                      <p className="mt-0.5 hidden text-xs font-medium text-white/25 sm:block">
                        Euro Coin
                      </p>
                    </div>
                  </div>

                  <div className="flex min-w-0 items-center gap-2 p-1 sm:gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                      <img
                        src="/tokens/cirbtc.svg"
                        alt="cirBTC"
                        className="h-9 w-9 rounded-full object-contain"
                        style={{
                          transform: "scale(0.75)",
                        }}
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-black">
                        cirBTC
                      </p>

                      <p className="mt-0.5 hidden text-xs font-medium text-white/25 sm:block">
                        Bitcoin
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ARC NETWORK */}

          <div className="border-y border-white/[0.06] bg-[#030405]">
            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/25">
                  Arc Network
                </p>

                <h3 className="mx-auto mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                  Simple interfaces.
                  <br />
                  Powerful infrastructure.
                </h3>

                <p className="mx-auto mt-5 max-w-2xl text-sm font-medium leading-7 text-white/35 sm:text-base">
                  AlabaamaFi keeps the user experience
                  simple while connecting directly to
                  Arc Testnet infrastructure.
                </p>
              </div>

              <div className="mx-auto mt-10 grid max-w-5xl gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/[0.07] bg-[#07090c] p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-[#0a0d12] text-lg font-black">
                    01
                  </div>

                  <h4 className="mt-5 font-black">
                    Connect
                  </h4>

                  <p className="mt-2 text-sm font-medium leading-6 text-white/30">
                    Connect your preferred EVM
                    wallet.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/[0.07] bg-[#07090c] p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-[#0a0d12] text-lg font-black">
                    02
                  </div>

                  <h4 className="mt-5 font-black">
                    Explore
                  </h4>

                  <p className="mt-2 text-sm font-medium leading-6 text-white/30">
                    Check balances and on-chain
                    activity.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/[0.07] bg-[#07090c] p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-[#0a0d12] text-lg font-black">
                    03
                  </div>

                  <h4 className="mt-5 font-black">
                    Transact
                  </h4>

                  <p className="mt-2 text-sm font-medium leading-6 text-white/30">
                    Send assets directly on Arc.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ARC ECOSYSTEM */}

          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
            <div className="rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#0a0f16] via-[#06080b] to-[#030303] p-6 shadow-xl shadow-black/40 sm:p-8 lg:p-10">
              <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/25">
                    Arc Ecosystem
                  </p>

                  <h3 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                    Stay connected to Arc
                  </h3>

                  <p className="mt-3 max-w-xl text-sm font-medium leading-7 text-white/30">
                    Explore Arc and connect with the
                    community.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-5">
                  <a
                    href="https://www.arc.network/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Arc Network"
                    title="Arc Network"
                    className="flex items-center justify-center text-white/60 transition-all duration-200 hover:-translate-y-0.5 hover:text-white active:translate-y-0"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-6 w-6"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />

                      <path
                        d="M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>

                  <a
                    href="https://x.com/arc"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Arc on X"
                    title="Arc on X"
                    className="flex items-center justify-center text-white/60 transition-all duration-200 hover:-translate-y-0.5 hover:text-white active:translate-y-0"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817-5.962 6.817H1.684l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
                    </svg>
                  </a>

                  <a
                    href="https://discord.gg/buildonarc"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Arc Discord"
                    title="Arc Discord"
                    className="flex items-center justify-center text-white/60 transition-all duration-200 hover:-translate-y-0.5 hover:text-white active:translate-y-0"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-6 w-6"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.444.864-.608 1.249-1.845-.276-3.68-.276-5.486 0-.164-.394-.405-.874-.617-1.249a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.678 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.868 19.868 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028c.461-.63.872-1.295 1.226-1.994a.076.076 0 0 0-.041-.105 13.17 13.17 0 0 1-1.872-.892.077.077 0 0 1 .077-.01c3.927 1.794 8.18 1.794 12.061 0a.074.074 0 0 1 .078.01c.12.099.246.197.373.291a.077.077 0 0 1-.006.128c-.598.353-1.22.65-1.873.892a.077.077 0 0 0-.041.106c.36.698.771 1.364 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.548-13.66a.061.061 0 0 0-.033-.027ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.175 1.095 2.157 2.418 0 1.334-.956 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.419 2.419 2.419 2.419Z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* TESTNET CTA */}

          <div className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-20 lg:px-10">
            <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-[#06080b] p-7 text-center shadow-2xl shadow-black/50 sm:p-10 lg:p-14">
              <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-96 -translate-x-1/2 rounded-full bg-[#173a70]/[0.08] blur-3xl" />

              <div className="relative">
                <div className="text-4xl font-medium leading-none text-white/55">
                  ◌
                </div>

                <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-white/25">
                  Arc Testnet
                </p>

                <h3 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                  Ready to try it?
                </h3>

                <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-7 text-white/30">
                  Get testnet tokens and start
                  exploring AlabaamaFi on Arc.
                </p>

                <button
                  onClick={() =>
                    handleNavigation("faucet")
                  }
                  className="mt-7 min-h-12 rounded-2xl border border-black/[0.08] bg-white px-7 py-3.5 text-sm !font-bold tracking-tight text-black shadow-[0_2px_6px_rgba(0,0,0,0.06),0_10px_28px_rgba(0,0,0,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#fafafa] hover:shadow-[0_4px_10px_rgba(0,0,0,0.08),0_14px_34px_rgba(0,0,0,0.18)] active:translate-y-0"
                >
                  Get Faucet
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER */}

      <footer
        className={`border-t border-white/[0.06] bg-[#030405] transition-[filter] duration-300 ${
          mobileMenuOpen
            ? "blur-md"
            : "blur-0"
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-7 text-center sm:py-8">
          <p className="mt-2 text-sm font-black tracking-tight text-white/80">
            AlabaamaFi
          </p>

          <p className="mt-0.5 text-[11px] font-semibold text-white/25">
            Built on Arc
          </p>
        </div>
      </footer>
    </main>
  );
}
