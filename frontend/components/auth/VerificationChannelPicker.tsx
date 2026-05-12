"use client";

import { Mail, Smartphone } from "lucide-react";

export function VerificationChannelPicker({ selected, onChange }: { selected: "email" | "phone"; onChange: (value: "email" | "phone") => void }) {
  const cards = [
    { value: "email" as const, icon: Mail, title: "Verify by Email", body: "We'll send a code to your email address" },
    { value: "phone" as const, icon: Smartphone, title: "Verify by SMS", body: "We'll send a code to your phone number" },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cards.map((card) => {
        const Icon = card.icon;
        const active = selected === card.value;
        return (
          <button
            type="button"
            key={card.value}
            onClick={() => onChange(card.value)}
            className={`rounded-xl p-5 text-left transition-colors ${active ? "border-2 border-brand bg-brand-light" : "border border-border bg-white hover:border-brand"}`}
          >
            <Icon className="mb-4 h-7 w-7 text-brand" />
            <p className="font-semibold text-ink">{card.title}</p>
            <p className="mt-1 text-sm text-ink-secondary">{card.body}</p>
          </button>
        );
      })}
    </div>
  );
}
