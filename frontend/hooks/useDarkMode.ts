"use client";

import { useDarkMode as useDarkModeContext } from "@/context/DarkModeContext";

export function useDarkMode() {
  return useDarkModeContext();
}
