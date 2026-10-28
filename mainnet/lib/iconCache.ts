"use client";

import { useEffect, useLayoutEffect } from "react";

const STORE = "alabaamafi:icons:v1";
const MAX_ENTRIES = 160;
const mem = new Map<string, string>();
let loaded = false;
let saveTimer = 0;

const isSafeSvg = (s: unknown): s is string =>
  typeof s === "string" && s.length > 20 && s.length < 24000 && /^<svg[\s>]/i.test(s) && !/<script|<foreignObject|\son\w+\s*=|javascript:/i.test(s);

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORE);
    if (!raw) return;
    for (const [k, v] of Object.entries(JSON.parse(raw) as Record<string, unknown>)) if (isSafeSvg(v)) mem.set(k, v);
  } catch {
    return;
  }
}

export function getIconSvg(key: string): string | null {
  load();
  return mem.get(key) ?? null;
}

export function putIconSvg(key: string, svg: string) {
  load();
  if (!isSafeSvg(svg) || mem.get(key) === svg) return;
  if (mem.size >= MAX_ENTRIES && !mem.has(key)) return;
  mem.set(key, svg);
  if (typeof window === "undefined") return;
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      window.localStorage.setItem(STORE, JSON.stringify(Object.fromEntries(mem)));
    } catch {
      return;
    }
  }, 600);
}

export const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
