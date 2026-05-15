"use client";

import { useState } from "react";
import { unwrapError } from "@/lib/api";

export function useApi<TArgs extends unknown[], TResult>(fn: (...args: TArgs) => Promise<TResult>) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function execute(...args: TArgs) {
    setIsLoading(true);
    setError(null);
    try {
      return await fn(...args);
    } catch (err) {
      const message = unwrapError(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  return { execute, isLoading, error };
}
