import React from "react";

interface StyledInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

/**
 * Reusable styled input component with error handling
 * Used across booking steps for consistent input styling
 */
export default function StyledInput({
  error,
  label,
  ...props
}: StyledInputProps) {
  return (
    <div>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: "14px",
            fontWeight: 500,
            color: "#0f172a",
            marginBottom: "8px",
          }}
        >
          {label}
        </label>
      )}
      <input
        {...props}
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
        <p
          style={{
            color: "#ef4444",
            fontSize: "12px",
            margin: "6px 4px 0",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
