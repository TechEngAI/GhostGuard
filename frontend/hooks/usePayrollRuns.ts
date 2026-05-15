"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getHrPayrollRuns, getPayrollRuns, unwrapError } from "@/lib/api";
import { unwrapData } from "@/lib/utils";

export function usePayrollRuns(scope: "admin" | "hr" = "admin") {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const response = scope === "hr" ? await getHrPayrollRuns() : await getPayrollRuns();
      const data = unwrapData<any>(response);
      setRuns(data.runs || data.items || data || []);
    } catch (error) {
      toast.error(unwrapError(error));
    } finally {
      setLoading(false);
    }
  }, [scope]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { runs, loading, reload };
}
