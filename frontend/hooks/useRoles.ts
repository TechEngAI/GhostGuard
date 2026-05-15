"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getRoles, unwrapError } from "@/lib/api";
import { unwrapData } from "@/lib/utils";

export function useRoles() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getRoles();
      const data = unwrapData<any>(response);
      setRoles(data.roles || data.items || data || []);
    } catch (error) {
      toast.error(unwrapError(error));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return { roles, loading, reload };
}
