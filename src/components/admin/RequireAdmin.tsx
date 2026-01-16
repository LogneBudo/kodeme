import { useEffect, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import type { AuthUser } from "../../api/authApi";
import { getCurrentUser, redirectToLogin } from "../../api/authApi";

type RequireAdminProps = {
  children: React.ReactNode;
};

export default function RequireAdmin({ children }: RequireAdminProps) {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        redirectToLogin(window.location.pathname);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // If user is not admin after loading, redirect to login with redirect param
  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== "admin") {
        const redirectPath = window.location.pathname + window.location.search;
        setRedirecting(true);
        redirectToLogin(redirectPath);
      }
    }
  }, [loading, user]);

  // -----------------------------
  // Inline styles
  // -----------------------------
  const fullScreenCenter: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(to bottom right, #f8fafc, #f1f5f9)",
    padding: "20px",
  };

  const cardStyle: React.CSSProperties = {
    textAlign: "center",
    maxWidth: "360px",
  };

  const iconCircle: React.CSSProperties = {
    width: "80px",
    height: "80px",
    background: "#fee2e2",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px",
  };

  const primaryButton: React.CSSProperties = {
    background: "#0f172a",
    color: "white",
    border: "none",
    borderRadius: "10px",
    padding: "12px 20px",
    cursor: "pointer",
    fontSize: "16px",
    marginTop: "12px",
  };

  // -----------------------------
  // Loading state
  // -----------------------------
  if (loading) {
    return (
      <div style={fullScreenCenter}>
        <div style={{ textAlign: "center" }}>
          <Loader2 size={40} style={{ margin: "0 auto 16px", color: "#94a3b8" }} className="animate-spin" />
          <p style={{ color: "#64748b" }}>Checking permissions...</p>
        </div>
      </div>
    );
  }

  // -----------------------------
  // Access denied
  // -----------------------------
  if (!loading && (!user || user.role !== "admin")) {
    return (
      <div style={fullScreenCenter}>
        <div style={{ textAlign: "center" }}>
          <Loader2 size={40} style={{ margin: "0 auto 16px", color: "#94a3b8" }} className="animate-spin" />
          <p style={{ color: "#64748b" }}>{redirecting ? "Redirecting to login..." : "Checking permissions..."}</p>
        </div>
      </div>
    );
  }

  // -----------------------------
  // Authorized
  // -----------------------------
  return <>{children}</>;
}
