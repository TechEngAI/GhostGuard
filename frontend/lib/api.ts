"use client";

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { clearTokens, getAccessToken, getRefreshToken, getUserType, setTokens } from "@/lib/auth";
import type { UserType } from "@/types";

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const loginPath = (type: UserType | null) => `/${type || "admin"}/login`;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    const userType = getUserType();
    const refreshToken = getRefreshToken();
    if (error.response?.status === 401 && original && !original._retry && userType && refreshToken) {
      original._retry = true;
      try {
        const refresh = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/${userType}/refresh`, { refresh_token: refreshToken });
        const payload = refresh.data?.data || refresh.data;
        setTokens(payload.access_token, payload.refresh_token, userType);
        original.headers.Authorization = `Bearer ${payload.access_token}`;
        return api(original);
      } catch {
        clearTokens();
        if (typeof window !== "undefined") window.location.href = loginPath(userType);
      }
    }
    return Promise.reject(error);
  },
);

export const unwrapError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.message || error.response?.data?.message || "Request failed.";
  }
  return "Something went wrong.";
};

export const adminRegister = (data: unknown) => api.post("/auth/admin/register", data);
export const adminVerifyOtp = (data: unknown) => api.post("/auth/admin/verify-otp", data);
export const adminResendOtp = (data: unknown) => api.post("/auth/admin/resend-otp", data);
export const adminLogin = (data: unknown) => api.post("/auth/admin/login", data);
export const adminForgotPassword = (data: unknown) => api.post("/auth/admin/forgot-password", data);
export const adminResetPassword = (data: unknown) => api.post("/auth/admin/reset-password", data);

export const workerRegister = (data: unknown) => api.post("/auth/worker/register", data);
export const workerVerifyOtp = (data: unknown) => api.post("/auth/worker/verify-otp", data);
export const workerResendOtp = (data: unknown) => api.post("/auth/worker/resend-otp", data);
export const workerLogin = (data: unknown) => api.post("/auth/worker/login", data);
export const workerForgotPassword = (data: unknown) => api.post("/auth/worker/forgot-password", data);
export const workerResetPassword = (data: unknown) => api.post("/auth/worker/reset-password", data);

export const hrLogin = (data: unknown) => api.post("/auth/hr/login", data);
export const hrForgotPassword = (data: unknown) => api.post("/auth/hr/forgot-password", data);
export const hrResetPassword = (data: unknown) => api.post("/auth/hr/reset-password", data);

export const getCompany = () => api.get("/admin/company");
export const updateCompany = (data: unknown) => api.put("/admin/company", data);

export const getWorkerProfile = () => api.get("/worker/profile");
export const updateWorkerProfile = (data: unknown) => api.put("/worker/profile", data);
export const bankLookup = (data: unknown) => api.post("/worker/bank/lookup", data);
export const bankSubmit = (data: unknown) => api.post("/worker/bank/submit", data);
export const getWorkerBank = () => api.get("/worker/bank");
