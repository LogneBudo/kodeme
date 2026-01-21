import { useContext } from "react";
import { AuthContext } from "./AuthContext";
import type { AuthContextValue } from "./AuthContext";

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Defensive fallback to avoid crashing when provider isn't mounted yet.
    // Logs an error and returns a minimal, inert context so callers can handle gracefully.
    console.error("useAuth called outside of AuthProvider. Returning inert fallback context.");
    return {
      user: null,
      loading: true,
      orgId: undefined,
      calendarId: undefined,
      organization: undefined,
      tenants: undefined,
      needsSetup: false,
      switchTenant: async () => {},
      switchCalendar: async () => {},
      login: async () => ({ success: false, error: "Auth not initialized" }),
      logout: async () => {},
      refresh: async () => {},
    } as AuthContextValue;
  }
  return ctx;
}