"use client";

import { ClipboardEvent, KeyboardEvent, useRef } from "react";
import { motion } from "framer-motion";

export function OtpInput({ length = 6, value, onChange, disabled }: { length?: number; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const chars = Array.from({ length }, (_, index) => value[index] || "");

  function update(index: number, char: string) {
    const next = chars.slice();
    next[index] = char.replace(/\D/g, "").slice(-1);
    onChange(next.join(""));
    if (next[index] && index < length - 1) refs.current[index + 1]?.focus();
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !chars[index] && index > 0) refs.current[index - 1]?.focus();
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted);
    refs.current[Math.min(pasted.length, length) - 1]?.focus();
  }

  return (
    <div className="flex justify-center gap-3">
      {chars.map((char, index) => (
        <motion.input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          disabled={disabled}
          value={char}
          initial={{ scale: 1 }}
          animate={char ? { scale: [1, 1.15, 1] } : { scale: 1 }}
          whileFocus={{ scale: 1.05, borderColor: "#1D9E75" }}
          transition={{ duration: 0.2 }}
          inputMode="numeric"
          maxLength={1}
          onChange={(event) => update(index, event.target.value)}
          onKeyDown={(event) => onKeyDown(index, event)}
          onPaste={onPaste}
          className="h-14 w-14 rounded-2xl border-2 border-border text-center text-2xl font-black bg-white shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-white"
        />
      ))}
    </div>
  );
}
