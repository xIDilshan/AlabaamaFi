"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleMenuState = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      setMobileMenuOpen(customEvent.detail);
    };

    window.addEventListener("mobile-menu-state", handleMenuState);

    return () => {
      window.removeEventListener("mobile-menu-state", handleMenuState);
    };
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020408] text-white">
      <Header />

      <div
        className={`min-w-0 transition-[filter] duration-300 ${
          mobileMenuOpen ? "blur-md" : "blur-0"
        }`}
      >
        {/* HERO */}

        <section className="relative h-[330px] overflow-hidden border-b border-white/[0.06] bg-[#020408] sm:h-[360px] lg:h-[380px]">
          {/* Background atmosphere */}

          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[35%] top-[-240px] h-[520px] w-[850px] rounded-full bg-[#0757c9]/[0.055] blur-[130px]" />

            <div className="absolute right-[-100px] bottom-[-180px] h-[500px] w-[600px] rounded-full bg-[#0757c9]/[0.08] blur-[100px]" />
          </div>

          {/* Orbital curves */}

          <div className="pointer-events-none absolute -right-[250px] bottom-[-420px] h-[650px] w-[900px] rotate-[-25deg] rounded-[50%] border border-[#1675ff]/20" />

          <div className="pointer-events-none absolute -right-[220px] bottom-[-350px] h-[570px] w-[800px] rotate-[-25deg] rounded-[50%] border border-[#2685ff]/20" />

          <div className="pointer-events-none absolute -right-[170px] bottom-[-290px] h-[490px] w-[700px] rotate-[-25deg] rounded-[50%] border border-[#3b94ff]/15" />

          {/* Planet */}

          <div className="pointer-events-none absolute -bottom-[310px] -right-[120px] h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_34%_27%,#3d9cff_0%,#1670d8_18%,#073a80_40%,#031b40_58%,#020408_74%)] shadow-[0_0_100px_rgba(24,116,255,0.22)] sm:-bottom-[330px] sm:-right-[90px] sm:h-[620px] sm:w-[620px] lg:-bottom-[370px] lg:-right-[70px] lg:h-[700px] lg:w-[700px]" />

          {/* Planet highlight */}

          <div className="pointer-events-none absolute -bottom-[245px] -right-[60px] h-[430px] w-[430px] rounded-full border border-[#5ba5ff]/15 sm:-bottom-[270px] sm:-right-[20px] sm:h-[500px] sm:w-[500px] lg:-bottom-[300px] lg:right-[10px] lg:h-[570px] lg:w-[570px]" />

          {/* Hero content */}

          <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-5 sm:px-8 lg:px-10">
            <div className="max-w-5xl">
              {/* Arc Network */}

              <div className="inline-flex items-center gap-2 rounded-full border border-[#3182ff]/45 bg-[#071326]/75 px-4 py-2 text-sm font-semibold text-[#a9c8ff] backdrop-blur-xl">
                <span className="h-2.5 w-2.5 rounded-full bg-[#18d99a] shadow-[0_0_10px_rgba(24,217,154,0.65)]" />

                <span>Arc Network</span>
              </div>

              {/* Heading */}

              <h1 className="mt-6 whitespace-nowrap text-[2.6rem] font-black leading-none tracking-[-0.055em] sm:text-5xl lg:text-[4.6rem]">
                <span className="text-white">One place. </span>

                <span className="bg-gradient-to-r from-[#36a0ff] via-[#1688ff] to-[#0870ff] bg-clip-text text-transparent">
                  Every move.
                </span>
              </h1>

              {/* Description */}

              <p className="mt-5 text-base font-medium text-white/55 sm:text-lg">
                A simple interface for Arc
              </p>
            </div>
          </div>
        </section>

        {/* NEXT HOME CONTENT */}

        <section className="mx-auto min-h-[420px] max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.015] p-6 sm:p-8">
            <p className="text-sm font-semibold text-white/30">
              More coming below
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
