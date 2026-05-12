"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getWorkers, unwrapError } from "@/lib/api";
import { unwrapData } from "@/lib/utils";

export function useWorkers(params?: Record<string, unknown>) {
  const [workers, setWorkers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getWorkers(params);
      const data = unwrapData<any>(response);
      const items = data.items || data.workers || data || [];
      setWorkers(items);
      setTotal(data.total ?? items.length);
    } catch (error) {
      toast.error(unwrapError(error));
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { workers, total, loading, reload };
}
