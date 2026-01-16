import { useState } from "react";
import { login } from "../api/authApi";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, LogIn } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      // Read and sanitize redirect target (must be same-origin path)
      const raw = searchParams.get("redirect") || "/BookAppointment";
      const isSafePath = raw.startsWith("/") && !raw.startsWith("//");
      let target = isSafePath ? raw : "/BookAppointment";
      // Avoid redirect loop to the login page
      if (target.toLowerCase().startsWith("/admin/login")) {
        target = "/admin/settings";
      }
      navigate(target, { replace: true });
    } else {
      setError(result.error || "Login failed");
    }
    
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        padding: "40px",
        width: "100%",
        maxWidth: "400px",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          marginBottom: "32px",
        }}>
          <div style={{
            width: "48px",
            height: "48px",
            background: "#222",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Calendar size={24} color="white" />
          </div>
          <h1 style={{ margin: 0, fontSize: "28px" }}>Kodika</h1>
        </div>

        <h2 style={{ marginTop: 0, marginBottom: "24px", textAlign: "center", fontSize: "20px" }}>
          Sign In
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: 500,
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@example.com"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: 500,
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: "12px",
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: "6px",
              color: "#dc2626",
              fontSize: "14px",
              marginBottom: "20px",
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: loading ? "#666" : "#222",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <LogIn size={18} />
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={{
          marginTop: "24px",
          padding: "16px",
          background: "#f5f5f5",
          borderRadius: "6px",
          fontSize: "13px",
          color: "#666",
        }}>
          <strong>Demo credentials:</strong><br />
          Create a user in Firebase Auth and add their role in User Management.
        </div>
      </div>
    </div>
  );
}
