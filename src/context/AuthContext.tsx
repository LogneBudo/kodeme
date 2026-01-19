import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { AuthUser } from "../api/authApi";
import { getCurrentUser, login as apiLogin, logout as apiLogout } from "../api/authApi";
import { getOrganization, listTenantCalendars, createTenantCalendar } from "../api/firebaseApi";
import type { Organization } from "../types/organization";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

type Tenant = Organization & {
  calendars?: { id: string; name: string }[];
};

type AuthContextValue = {
  user: AuthUser;
  loading: boolean;
  orgId?: string; // Current selected organization
  calendarId?: string; // Current selected calendar
  organization?: Organization; // Current organization data
  tenants?: Tenant[]; // All organizations user belongs to
  needsSetup: boolean; // True if user is new and needs org setup
  switchTenant: (orgId: string) => Promise<void>; // Change current tenant
  switchCalendar: (calendarId: string) => Promise<void>; // Change current calendar
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | undefined>(undefined);
  const [calendarId, setCalendarId] = useState<string | undefined>(undefined);
  const [organization, setOrganization] = useState<Organization | undefined>(undefined);
  const [tenants, setTenants] = useState<Tenant[] | undefined>(undefined);
  const [needsSetup, setNeedsSetup] = useState(false);
  const opIdRef = useRef(0);
  const authDebug = (import.meta as any).env?.VITE_AUTH_DEBUG === "true";

  // Derive an org_id from branch assignment keys when org_id is missing or invalid
  const deriveOrgIdFromAssignments = (assignments?: Record<string, string>): string | undefined => {
    if (!assignments) return undefined;
    const keys = Object.keys(assignments);
    if (keys.length === 0) return undefined;
    // Keys are stored as `${orgId}-primary` (or similar); split on the first hyphen
    const first = keys[0];
    const parts = first.split("-");
    return parts.length > 0 ? parts[0] : undefined;
  };

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
          setOrgId(undefined);
          setCalendarId(undefined);
          setOrganization(undefined);
          setTenants(undefined);
          setNeedsSetup(false);
          setLoading(false);
          if (authDebug) {
            console.log("[auth] onAuthStateChanged: signed out");
          }
          toast.dismiss("auth-state");
          toast("Signed out", { id: "auth-state" });
        }
        return;
      }
      
      // User is signed in
      let u = await getCurrentUser();

      // Fallback: if auth cache lacks org_id, fetch user doc directly to hydrate
      if (u && !u.org_id) {
        try {
          const userDocRef = doc(db, "users", u.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.org_id) {
              u = {
                ...u,
                org_id: data.org_id,
                branch_assignments: data.branch_assignments,
                role: (data.role as any) || u.role || "user",
              } as AuthUser;
              if (authDebug) {
                console.log("[auth] Hydrated org_id from Firestore fallback", data.org_id);
              }
            }
          }
        } catch (hydrateErr) {
          console.error("[auth] Fallback hydration failed", hydrateErr);
        }
      }
      if (!mounted) return;
      if (myOp === opIdRef.current) {
        setUser(u);

        const inferredOrgId = deriveOrgIdFromAssignments(u?.branch_assignments as any);
        const effectiveOrgId = u?.org_id || inferredOrgId;
        const primaryCalendarFromAssignments = u?.branch_assignments ? Object.keys(u.branch_assignments)[0] : undefined;

        // Check if user needs setup (new user with no org_id and no inference)
        if (u && !effectiveOrgId) {
          if (authDebug) {
            console.log("[auth] New user detected (no org_id), needs setup");
          }
          setNeedsSetup(true);
          setLoading(false);
          toast.dismiss("auth-state");
          toast("Welcome! Let's set up your organization.", { id: "auth-state" });
          return;
        }
        // If org_id (or inferred) is present, clear needsSetup defensively
        if (effectiveOrgId) {
          setNeedsSetup(false);
        }
        
        // Existing user: load org and branches using effectiveOrgId
        if (u && effectiveOrgId) {
          // Set orgId immediately so downstream views can fetch even if org doc is missing
          setOrgId(effectiveOrgId);
          // Always prefer a known calendar from assignments first
          if (primaryCalendarFromAssignments) {
            setCalendarId(primaryCalendarFromAssignments);
          }
          try {
            let org = await getOrganization(effectiveOrgId);
            if (!org && inferredOrgId && inferredOrgId !== effectiveOrgId) {
              // Try inferred org if the declared org_id is wrong
              if (authDebug) {
                console.warn(`[auth] Org ${effectiveOrgId} missing, retrying inferred ${inferredOrgId}`);
              }
              org = await getOrganization(inferredOrgId);
              if (org) {
                setOrgId(inferredOrgId);
              }
            }

            if (mounted && myOp === opIdRef.current) {
              if (org) {
                setOrganization(org);
                setNeedsSetup(false);
              } else {
                setOrganization(undefined);
                if (authDebug) {
                  console.warn(`[auth] Organization ${effectiveOrgId} not found`);
                }
              }
              // Set primary calendar (from branch assignments or fallback to first calendar; seed if none)
              const assignments = u.branch_assignments ? Object.keys(u.branch_assignments) : [];
              const primaryCalendar = assignments.length > 0 ? assignments[0] : undefined;
              if (primaryCalendar) {
                setCalendarId(primaryCalendar);
                if (authDebug) {
                  console.log(`[auth] Loaded org ${org ? org.org_id : effectiveOrgId}, primary calendar ${primaryCalendar}`);
                }
              } else {
                const orgForCalendars = org?.org_id || effectiveOrgId;
                try {
                  let calendars = await listTenantCalendars(orgForCalendars);
                  if (calendars.length === 0 && u?.uid) {
                    const created = await createTenantCalendar(orgForCalendars, u.uid, {
                      name: "Primary Calendar",
                      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
                    });
                    calendars = [created];
                    if (authDebug) {
                      console.log(`[auth] Seeded primary calendar ${created.id} for org ${orgForCalendars}`);
                    }
                  }
                  if (calendars.length > 0) {
                    setCalendarId(calendars[0].id);
                    if (authDebug) {
                      console.log(`[auth] Fallback calendar set to ${calendars[0].id} for org ${orgForCalendars}`);
                    }
                  }
                } catch (calErr) {
                  console.error("[auth] Failed to load or seed calendars for fallback:", calErr);
                }
              }
            }
          } catch (err) {
            console.error("[auth] Failed to load organization:", err);
          }
        }
        
        setNeedsSetup(false);
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

  const switchTenant = async (newOrgId: string) => {
    try {
      if (!user || !user.branch_assignments || !user.branch_assignments[newOrgId]) {
        throw new Error("User does not belong to this organization");
      }
      
      const org = await getOrganization(newOrgId);
      if (org) {
        setOrgId(newOrgId);
        setOrganization(org);
        
        // Switch to first available calendar in new org
        const calendars = user.branch_assignments ? Object.keys(user.branch_assignments).filter(b => b.startsWith(newOrgId)) : [];
        if (calendars.length > 0) {
          setCalendarId(calendars[0]);
        }
        
        if (authDebug) {
          console.log(`[auth] Switched to org ${newOrgId}`);
        }
        toast("Switched organization", { id: "auth-state" });
      }
    } catch (err) {
      console.error("[auth] Failed to switch organization:", err);
      toast.error("Failed to switch organization");
    }
  };
  
  const switchCalendar = async (newCalendarId: string) => {
    if (user && user.branch_assignments && user.branch_assignments[newCalendarId]) {
      setCalendarId(newCalendarId);
      if (authDebug) {
        console.log(`[auth] Switched to calendar ${newCalendarId}`);
      }
      toast("Switched calendar", { id: "auth-state" });
    } else {
      console.error("[auth] User does not have access to this calendar");
      toast.error("No access to this calendar");
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      orgId,
      calendarId,
      organization,
      tenants,
      needsSetup,
      switchTenant,
      switchCalendar,
      login: apiLogin,
      logout: async () => {
        setLoading(true);
        await apiLogout();
        setUser(null);
        setOrgId(undefined);
        setCalendarId(undefined);
        setOrganization(undefined);
        setTenants(undefined);
        setNeedsSetup(false);
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
        
        try {
          // Force fresh fetch from Firestore instead of using cache
          if (auth.currentUser) {
            const userDocRef = doc(db, "users", auth.currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              if (authDebug) {
                console.log("[auth] Loaded fresh user from Firestore:", userData);
              }
              
              const u: AuthUser = {
                uid: auth.currentUser.uid,
                email: auth.currentUser.email || "",
                role: userData.role || "user",
                org_id: userData.org_id,
                branch_assignments: userData.branch_assignments,
              };
              
              if (myOp === opIdRef.current) {
                setUser(u);
                const inferredOrgId = deriveOrgIdFromAssignments(u?.branch_assignments as any);
                const effectiveOrgId = u?.org_id || inferredOrgId;
                const primaryCalendarFromAssignments = u?.branch_assignments ? Object.keys(u.branch_assignments)[0] : undefined;
                
                if (effectiveOrgId) {
                  // Set orgId immediately so UI can load even if org doc is missing
                  setOrgId(effectiveOrgId);
                  if (primaryCalendarFromAssignments) {
                    setCalendarId(primaryCalendarFromAssignments);
                  }
                  try {
                    let org = await getOrganization(effectiveOrgId);
                    if (!org && inferredOrgId && inferredOrgId !== effectiveOrgId) {
                      if (authDebug) {
                        console.warn(`[auth] Refresh org ${effectiveOrgId} missing, retrying inferred ${inferredOrgId}`);
                      }
                      org = await getOrganization(inferredOrgId);
                      if (org) {
                        setOrgId(inferredOrgId);
                      }
                    }

                    if (org) {
                      setOrganization(org);
                      setNeedsSetup(false); // Clear setup flag when org is loaded
                       
                      if (authDebug) {
                        console.log("[auth] Refresh: loaded org " + (org?.org_id || effectiveOrgId) + ", org_id state set, needsSetup=false");
                      }
                    } else {
                      setOrganization(undefined);
                    }
                     
                    // Set primary calendar from branch_assignments or fallback to first calendar in org; seed if none
                    const assignments = u.branch_assignments ? Object.keys(u.branch_assignments) : [];
                    const primaryCalendar = assignments.length > 0 ? assignments[0] : undefined;
                    if (primaryCalendar) {
                      setCalendarId(primaryCalendar);
                    } else {
                      const orgForCalendars = org?.org_id || effectiveOrgId;
                      try {
                        let calendars = await listTenantCalendars(orgForCalendars);
                        if (calendars.length === 0 && u?.uid) {
                          const created = await createTenantCalendar(orgForCalendars, u.uid, {
                            name: "Primary Calendar",
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
                          });
                          calendars = [created];
                          if (authDebug) {
                            console.log(`[auth] Refresh seeded primary calendar ${created.id} for org ${orgForCalendars}`);
                          }
                        }
                        if (calendars.length > 0) {
                          setCalendarId(calendars[0].id);
                          if (authDebug) {
                            console.log(`[auth] Refresh fallback calendar set to ${calendars[0].id} for org ${orgForCalendars}`);
                          }
                        }
                      } catch (calErr) {
                        console.error("[auth] Refresh failed to load or seed calendars for fallback:", calErr);
                      }
                    }
                  } catch (err) {
                    console.error("[auth] Failed to refresh organization:", err);
                  }
                }
                
                setLoading(false);
                if (authDebug) {
                  console.log("[auth] refresh resolved", u);
                }
              }
            }
          }
        } catch (err) {
          console.error("[auth] refresh error:", err);
          setLoading(false);
        }
      },
    }),
    [user, loading, orgId, calendarId, organization, tenants, needsSetup]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
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
