import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { AuthUser } from "../api/authApi";
import { getCurrentUser, login as apiLogin, logout as apiLogout } from "../api/authApi";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

type AuthContextValue = {
  user: AuthUser;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);
  const opIdRef = useRef(0);
  const authDebug = (import.meta as any).env?.VITE_AUTH_DEBUG === "true";

  useEffect(() => {
    let mounted = true;
    // Subscribe to Firebase auth changes; when it fires, resolve current user once
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      const myOp = ++opIdRef.current;
      if (!fbUser) {
        if (!mounted) return;
        // No user signed in
        if (myOp === opIdRef.current) {
          setUser(null);
          setLoading(false);
          if (authDebug) {
            console.log("[auth] onAuthStateChanged: signed out");
          }
          toast.dismiss("auth-state");
          toast("Signed out", { id: "auth-state" });
        }
        return;
      }
      const u = await getCurrentUser();
      if (!mounted) return;
      if (myOp === opIdRef.current) {
        setUser(u);
        setLoading(false);
        if (authDebug) {
          console.log("[auth] onAuthStateChanged: signed in", u);
        }
        toast.dismiss("auth-state");
        toast("Signed in", { id: "auth-state" });
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: apiLogin,
      logout: async () => {
        setLoading(true);
        await apiLogout();
        setUser(null);
        setLoading(false);
        if (authDebug) {
          console.log("[auth] logout invoked");
        }
        toast.dismiss("auth-state");
        toast("Signed out", { id: "auth-state" });
      },
      refresh: async () => {
        const myOp = ++opIdRef.current;
        setLoading(true);
        const u = await getCurrentUser();
        if (myOp === opIdRef.current) {
          setUser(u);
          setLoading(false);
          if (authDebug) {
            console.log("[auth] refresh resolved", u);
          }
        }
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
