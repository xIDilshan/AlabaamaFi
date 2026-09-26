"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Header from "@/components/Header";

type Section = "send" | "activity";

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
      activity: "/activity",
    };

    router.push(routes[section]);
  };

  return (
    <main className="min-h-screen bg-[#020408] text-white">
      <Header />

      <div
        className={`min-w-0 transition-[filter] duration-300 ${
          mobileMenuOpen
            ? "blur-md"
            : "blur-0"
        }`}
      >
        {/* HERO */}

        <section className="relative isolate min-h-[calc(100vh-72px)] overflow-hidden border-b border-white/[0.06] bg-[#020408]">
          {/* Background glow */}

          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-[-180px] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[#0757c9]/[0.10] blur-[130px]" />

            <div className="absolute right-[-180px] top-[20%] h-[520px] w-[520px] rounded-full bg-[#1267e8]/[0.12] blur-[120px]" />

            <div className="absolute left-[10%] top-[45%] h-[300px] w-[500px] rounded-full bg-[#073b86]/[0.06] blur-[120px]" />
          </div>

          {/* Orbital lines */}

          <div className="pointer-events-none absolute right-[-220px] top-[42%] hidden h-[620px] w-[620px] rounded-full border border-[#1b6cff]/20 lg:block" />

          <div className="pointer-events-none absolute right-[-180px] top-[46%] hidden h-[520px] w-[520px] rounded-full border border-[#2580ff]/20 lg:block" />

          <div className="pointer-events-none absolute right-[-120px] top-[51%] hidden h-[400px] w-[400px] rounded-full border border-[#3b8cff]/20 lg:block" />

          {/* Blue planet */}

          <div className="pointer-events-none absolute bottom-[-260px] right-[-100px] hidden h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#2c8cff_0%,#0b4ca8_22%,#03132e_55%,#020408_72%)] shadow-[0_0_100px_rgba(28,111,255,0.25)] lg:block" />

          <div className="pointer-events-none absolute bottom-[-190px] right-[-20px] hidden h-[480px] w-[480px] rounded-full border border-[#4a9aff]/20 lg:block" />

          {/* Hero content */}

          <div className="relative mx-auto flex min-h-[calc(100vh-72px)] max-w-7xl items-center px-5 py-20 sm:px-6 sm:py-24 lg:px-10 lg:py-28">
            <div className="max-w-4xl">
              {/* Network pill */}

              <div className="inline-flex items-center gap-2 rounded-full border border-[#3182ff]/45 bg-[#071326]/80 px-4 py-2 text-sm font-semibold text-[#a9c8ff] shadow-[0_0_30px_rgba(32,112,255,0.08)] backdrop-blur-xl">
                <span className="h-2.5 w-2.5 rounded-full bg-[#18d99a] shadow-[0_0_10px_rgba(24,217,154,0.65)]" />

                <span>Arc Network</span>
              </div>

              {/* Heading */}

              <h1 className="mt-7 max-w-4xl text-[3.6rem] font-black leading-[0.9] tracking-[-0.055em] sm:text-7xl lg:text-[6.8rem]">
                <span className="block text-white">
                  One place.
                </span>

                <span className="mt-2 block bg-gradient-to-r from-[#ffffff] via-[#2994ff] to-[#0870ff] bg-clip-text text-transparent">
                  Every move.
                </span>
              </h1>

              {/* Description */}

              <p className="mt-7 max-w-2xl text-base font-medium leading-7 text-white/45 sm:mt-8 sm:text-lg sm:leading-8">
                Explore, manage and move your digital
                assets on Arc with a clean and simple
                DeFi experience built for everyday use.
              </p>

              {/* Actions */}

              <div className="mt-9 flex flex-col gap-3 sm:mt-10 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    handleNavigation("send")
                  }
                  className="min-h-13 w-full rounded-2xl bg-white px-7 py-4 text-base font-bold text-black shadow-[0_4px_20px_rgba(255,255,255,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#f5f8ff] hover:shadow-[0_8px_30px_rgba(255,255,255,0.12)] active:translate-y-0 sm:w-auto"
                >
                  Send Assets
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleNavigation("activity")
                  }
                  className="min-h-13 w-full rounded-2xl border border-white/[0.12] bg-white/[0.045] px-7 py-4 text-sm font-bold text-white/80 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-[#287cff]/40 hover:bg-[#0a1424]/80 hover:text-white active:translate-y-0 sm:w-auto"
                >
                  Check Wallet Activity
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER */}

      <footer
        className={`border-t border-white/[0.06] bg-[#020408] transition-[filter] duration-300 ${
          mobileMenuOpen
            ? "blur-md"
            : "blur-0"
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-7 text-center sm:py-8">
          <p className="text-sm font-black tracking-tight text-white/80">
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
