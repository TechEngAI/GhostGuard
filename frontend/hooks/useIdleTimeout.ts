"use client";

import { useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { clearTokens, getUserType } from "@/lib/auth";

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keypress", "scroll", "touchstart", "click"];

/**
 * useIdleTimeout Hook
 * Monitors user activity and logs them out after 30 minutes of inactivity.
 * Provides inactivity warning at 25 minutes and forces logout at 30 minutes.
 *
 * Usage:
 * ```tsx
 * export default function Layout() {
 *   useIdleTimeout();
 *   return <div>{children}</div>;
 * }
 * ```
 */
export function useIdleTimeout() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCleaningUpRef = useRef(false);

  /**
   * Clears all active timers to prevent memory leaks
   */
  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
  }, []);

  /**
   * Handles session expiration and logout
   */
  const handleSessionExpired = useCallback(async () => {
    if (isCleaningUpRef.current) return;
    isCleaningUpRef.current = true;

    clearAllTimers();
    clearTokens();
    toast.error("Session expired due to inactivity. Please log in again.", {
      duration: 5000,
      position: "top-center",
    });

    // Redirect to login page
    const userType = getUserType();
    const loginPath = `/${userType || "admin"}/login`;
    if (typeof window !== "undefined") {
      window.location.href = loginPath;
    }
  }, [clearAllTimers]);

  /**
   * Shows warning before session expires (at 25 minutes)
   */
  const showInactivityWarning = useCallback(() => {
    toast("Your session will expire in 5 minutes due to inactivity.", {
      duration: 10000,
      position: "top-center",
      icon: "⏰",
    });
  }, []);

  /**
   * Resets the inactivity timers
   */
  const resetInactivityTimer = useCallback(() => {
    // Clear existing timers
    clearAllTimers();

    // Set warning timer (25 minutes)
    warningTimeoutRef.current = setTimeout(() => {
      showInactivityWarning();
    }, 25 * 60 * 1000);

    // Set logout timer (30 minutes)
    timeoutRef.current = setTimeout(() => {
      handleSessionExpired();
    }, INACTIVITY_TIMEOUT);
  }, [clearAllTimers, showInactivityWarning, handleSessionExpired]);

  /**
   * Activity event listener with debouncing to avoid excessive calls
   */
  useEffect(() => {
    // Initial timer setup
    resetInactivityTimer();

    let activityTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleActivity = () => {
      // Debounce activity events to avoid excessive timer resets
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }

      activityTimeout = setTimeout(() => {
        resetInactivityTimer();
        activityTimeout = null;
      }, 1000); // Wait 1 second before resetting timer
    };

    // Add event listeners for user activity
    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup function
    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });

      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }

      clearAllTimers();
      isCleaningUpRef.current = false;
    };
  }, [resetInactivityTimer, clearAllTimers]);
}
