import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

interface ErrorPageProps {
  title?: string;
  message?: string;
  details?: string;
  onRetry?: () => void;
}

/**
 * Error page component for displaying error states
 * Used for API errors, 404s, and other exceptions
 */
export default function ErrorPage({
  title = "Something went wrong",
  message = "We encountered an error processing your request",
  details,
  onRetry,
}: ErrorPageProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "40px",
          maxWidth: "500px",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "80px",
            height: "80px",
            background: "#fee2e2",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <AlertTriangle size={40} color="#dc2626" />
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "#0f172a",
            margin: "0 0 12px 0",
          }}
        >
          {title}
        </h1>

        {/* Message */}
        <p
          style={{
            fontSize: "16px",
            color: "#64748b",
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          {message}
        </p>

        {/* Details */}
        {details && (
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "12px",
              fontSize: "13px",
              color: "#64748b",
              marginBottom: "24px",
              textAlign: "left",
              fontFamily: "monospace",
              overflowX: "auto",
            }}
          >
            {details}
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                background: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={16} />
              Try again
            </button>
          )}

          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              background: "#e2e8f0",
              color: "#0f172a",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            <Home size={16} />
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
