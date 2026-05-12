"use client";

import { useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { cn } from "@/lib/utils";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  confirmVariant = "primary",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: "danger" | "primary";
}) {
  const [loading, setLoading] = useState(false);
  async function confirm() {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  }
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-ink-secondary">{description}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold">
          Cancel
        </button>
        <button
          onClick={confirm}
          disabled={loading}
          className={cn("rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60", confirmVariant === "danger" ? "bg-red-700" : "bg-brand")}
        >
          {loading ? "Working..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
