"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getFraudSignals, unwrapError } from "@/lib/api";
import { unwrapData } from "@/lib/utils";

export function useFraudSignals(params?: Record<string, unknown>) {
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getFraudSignals(params);
      const data = unwrapData<any>(response);
      setSignals(data.signals || data.items || data || []);
    } catch (error) {
      toast.error(unwrapError(error));
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { signals, loading, reload };
}
