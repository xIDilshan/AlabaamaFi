"use client";

import { Manrope } from "next/font/google";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

import Header from "@/components/Header";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["600"],
});

type Section =
  | "home"
  | "send"
  | "swap"
  | "bridge"
  | "activity"
  | "faucet";

export default function FaucetPage() {
  const router = useRouter();

  const {
    address,
    isConnected,
  } = useAccount();

  const handleNavigation = (section: Section) => {
    const routes: Record<Section, string> = {
      home: "/",
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
      `}</style>

      {/* HEADER */}

      <Header />

      {/* CONTENT */}

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-md text-center">
          <div className="text-4xl font-medium leading-none text-white/55">
            ◌
          </div>

          <h2 className="mt-6 text-3xl font-black sm:text-4xl">
            Faucet
          </h2>

          <p className="mt-4 text-sm font-medium leading-7 text-white/35 sm:text-base">
            Get testnet tokens from the official
            Circle faucet and use them to test
            AlabaamaFi on Arc Testnet.
          </p>

          <a
            href="https://faucet.circle.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 block min-h-13 w-full rounded-full border border-black/[0.08] bg-white py-4 text-sm !font-bold tracking-normal text-black shadow-[0_2px_6px_rgba(0,0,0,0.06),0_10px_28px_rgba(0,0,0,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#fafafa] hover:shadow-[0_4px_10px_rgba(0,0,0,0.08),0_14px_34px_rgba(0,0,0,0.18)] active:translate-y-0"
            style={{
              fontFamily: manrope.style.fontFamily,
            }}
          >
            Get Testnet Tokens
          </a>

          <p className="mt-4 text-xs font-semibold leading-5 text-white/25">
            Opens the official Circle faucet in a
            new tab.
          </p>
        </div>
      </section>
    </main>
  );
}
