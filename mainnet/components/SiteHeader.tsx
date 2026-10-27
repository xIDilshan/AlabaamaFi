"use client";

import Link from "next/link";
import { Inter, Manrope } from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });
const manrope = Manrope({ subsets: ["latin"], weight: ["600", "700"] });

const LAUNCH_URL = "https://app.alabaamafi.xyz/swap";

const launchButton =
  "bg-gradient-to-r from-[#13b8ff] via-[#1688f5] to-[#263be8] text-white shadow-[0_8px_30px_rgba(19,145,255,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_12px_38px_rgba(19,145,255,0.32)] active:translate-y-0";

export default function SiteHeader() {
  return (
    <header className={`${inter.className} relative z-50`}>
      <div className="flex min-h-[68px] items-center justify-between gap-3 px-4 sm:min-h-[74px] sm:px-6 md:min-h-[86px] md:px-7 lg:px-10 xl:px-12">
        <Link href="/" aria-label="AlabaamaFi home" className="flex min-w-0 shrink-0 items-center gap-2.5 md:gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/alabaamafi-logo.svg" alt="" className="h-9 w-9 shrink-0 object-contain md:h-10 md:w-10 lg:h-14 lg:w-14" />
          <span className="text-[19px] font-bold leading-none tracking-[-0.035em] text-white md:text-[25px] lg:text-[29px]">
            Alabaama<span className="text-[#159fff]">Fi</span>
          </span>
        </Link>

        <a
          href={LAUNCH_URL}
          className={`${manrope.className} flex h-10 shrink-0 items-center justify-center rounded-full px-5 text-[15px] font-semibold leading-none tracking-normal md:h-12 md:px-6 md:text-sm ${launchButton}`}
        >
          Launch app
        </a>
      </div>
    </header>
  );
}
