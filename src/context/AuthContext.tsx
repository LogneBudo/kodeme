import { createContext, useContext, useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    let mounted = true;
    // Subscribe to Firebase auth changes; when it fires, ask authApi for the enriched user (with role)
    const unsub = onAuthStateChanged(auth, async () => {
      const u = await getCurrentUser();
      if (!mounted) return;
      setUser(u);
      setLoading(false);
    });

    // Prime initial state in case onAuthStateChanged already fired in another module
    (async () => {
      const u = await getCurrentUser();
      if (!mounted) return;
      setUser(u);
      setLoading(false);
    })();

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
        await apiLogout();
        setUser(null);
      },
      refresh: async () => {
        setLoading(true);
        const u = await getCurrentUser();
        setUser(u);
        setLoading(false);
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
