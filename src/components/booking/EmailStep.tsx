import { useState } from "react";
import { Mail, ArrowRight } from "lucide-react";

type Props = {
  email: string;
  setEmail: (value: string) => void;
  onNext: () => void;
};

export default function EmailStep({ email, setEmail, onNext }: Props) {
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleNext = () => {
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    setError("");
    onNext();
  };

  return (
    <div style={{ maxWidth: "420px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "clamp(20px, 5vw, 32px)" }}>
        <div
          style={{
            width: "clamp(48px, 12vw, 64px)",
            height: "clamp(48px, 12vw, 64px)",
            background: "#f1f5f9",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto clamp(16px, 4vw, 24px)",
          }}
        >
          <Mail size={32} color="#475569" />
        </div>

        <h2 style={{ fontSize: "clamp(20px, 5vw, 24px)", fontWeight: 600, marginBottom: "8px", color: "#0f172a", margin: "0 0 8px 0" }}>
          Enter your email
        </h2>

        <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
          We'll send the appointment confirmation to this address
        </p>
      </div>

      {/* Input + Button */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleNext()}
            style={{
              width: "100%",
              height: "clamp(44px, 10vw, 56px)",
              fontSize: "clamp(14px, 4vw, 16px)",
              padding: "0 16px",
              borderRadius: "12px",
              border: `2px solid ${error ? "#fca5a5" : "#e2e8f0"}`,
              outline: "none",
              transition: "border-color 0.2s ease",
              boxSizing: "border-box",
            }}
          />

          {error && (
            <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "6px", marginLeft: "4px", margin: "6px 4px 0" }}>
              {error}
            </p>
          )}
        </div>

        <button
          onClick={handleNext}
          style={{
            width: "100%",
            height: "clamp(44px, 10vw, 56px)",
            fontSize: "clamp(14px, 4vw, 16px)",
            borderRadius: "12px",
            background: "#0f172a",
            color: "white",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "background 0.2s ease",
            boxSizing: "border-box",
          }}
          onMouseEnter={(e) => ((e.currentTarget.style.background = "#1e293b"))}
          onMouseLeave={(e) => ((e.currentTarget.style.background = "#0f172a"))}
        >
          Continue
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
