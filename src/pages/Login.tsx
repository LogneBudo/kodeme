import { useState } from "react";
import { login } from "../api/authApi";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, LogIn } from "lucide-react";
import styles from "./Login.module.css";

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
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <Calendar size={24} color="white" />
          </div>
          <h1 className={styles.title}>Kodika</h1>
        </div>

        <h2 className={styles.subtitle}>Sign In</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@example.com"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroupLast}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className={styles.input}
            />
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            <LogIn size={18} />
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className={styles.demoCredentials}>
          <strong>Demo credentials:</strong>
          Create a user in Firebase Auth and add their role in User Management.
        </div>
      </div>
    </div>
  );
}
