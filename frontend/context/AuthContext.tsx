"use client";

import { createContext, ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { clearTokens, getUserType } from "@/lib/auth";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import type { UserType } from "@/types";

type AuthContextValue = {
  user: Record<string, unknown> | null;
  setUser: (user: Record<string, unknown> | null) => void;
  userType: UserType | null;
  setUserType: (type: UserType | null) => void;
  isLoading: boolean;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize idle timeout monitoring when user is authenticated
  useIdleTimeout();

  useEffect(() => {
    setUserType(getUserType());
    setIsLoading(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      userType,
      setUserType,
      isLoading,
      logout: () => {
        const type = getUserType();
        clearTokens();
        setUser(null);
        setUserType(null);
        toast.success("Logged out successfully.", { duration: 2000 });
        router.push(`/${type || "admin"}/login`);
      },
    }),
    [isLoading, router, user, userType],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
