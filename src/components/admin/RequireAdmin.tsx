import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { redirectToLogin } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";

type RequireAdminProps = {
  children: React.ReactNode;
};

export default function RequireAdmin({ children }: RequireAdminProps) {
  const { user, loading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);


  // If user is not admin after loading, redirect to login with redirect param
  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== "admin") {
        // Avoid redirect loop if already on login page
        const isOnLogin = window.location.pathname.toLowerCase().startsWith("/admin/login");
        if (isOnLogin) return;
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
