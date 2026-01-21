import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";

type UserWithOrgId = {
  org_id?: string;
  [key: string]: unknown;
};

type ProtectedAdminRouteProps = {
  children: React.ReactNode;
};

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { user, loading, needsSetup, orgId, refresh } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshAttempted, setRefreshAttempted] = useState(false);

  // Debug log
  if (typeof window !== 'undefined') {
    console.log("[ProtectedAdminRoute] user:", user?.uid, "loading:", loading, "needsSetup:", needsSetup, "orgId:", orgId);
  }

  // Kick off a refresh if user is present but orgId missing (once)
  useEffect(() => {
    if (user && !orgId && !refreshAttempted && !refreshing) {
      setRefreshing(true);
      void (async () => {
        try {
          await refresh();
        } finally {
          setRefreshAttempted(true);
          setRefreshing(false);
        }
      })();
    }
  }, [user, orgId, refreshAttempted, refreshing, refresh]);

  // Still loading auth state or refreshing
  if (loading || refreshing) {
    return <div style={{ textAlign: "center", padding: "50px" }}>Loading...</div>;
  }

  // Not logged in - redirect to login
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // If user has org information (from context or user payload), allow access immediately
  if (
    orgId ||
    ((user as UserWithOrgId)?.org_id !== undefined &&
      (user as UserWithOrgId).org_id !== null)
  ) {
    return <>{children}</>;
  }

  // If user exists but orgId is still missing, wait for refresh before redirecting
  if (!orgId) {
    if (!refreshAttempted || refreshing) {
      return <div style={{ textAlign: "center", padding: "50px" }}>Loading...</div>;
    }
    // After refresh attempt, if still no orgId, treat as needs setup
    console.log("[ProtectedAdminRoute] Redirecting to setup after refresh - orgId missing");
    return <Navigate to="/setup" replace />;
  }

  // If orgId exists, allow even if needsSetup flag was left true
  if (needsSetup && orgId) {
    console.warn("[ProtectedAdminRoute] needsSetup true but orgId present; allowing access");
  }

  // User is authenticated and has org - render the component
  return <>{children}</>;
}
