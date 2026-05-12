"use client";

import { ClipboardEvent, KeyboardEvent, useRef } from "react";

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
    <div className="flex justify-center gap-2">
      {chars.map((char, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          disabled={disabled}
          value={char}
          inputMode="numeric"
          maxLength={1}
          onChange={(event) => update(index, event.target.value)}
          onKeyDown={(event) => onKeyDown(index, event)}
          onPaste={onPaste}
          className="h-12 w-12 rounded-lg border-2 border-border text-center text-xl font-bold focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light"
        />
      ))}
    </div>
  );
}
