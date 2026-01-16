import React from "react";
import type { ReactNode, ButtonHTMLAttributes } from "react";

interface StepButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  loading?: boolean;
  children: ReactNode;
}

/**
 * Reusable button component for booking steps
 * Supports multiple variants for different use cases
 */
const StepButton = React.memo(function StepButton({
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  children,
  disabled = false,
  ...props
}: StepButtonProps) {
  const variantStyles = {
    primary: {
      background: "#0f172a",
      color: "white",
      border: "none",
    },
    secondary: {
      background: "#e2e8f0",
      color: "#0f172a",
      border: "2px solid #cbd5e1",
    },
    ghost: {
      background: "transparent",
      color: "#0f172a",
      border: "2px solid #e2e8f0",
    },
  };

  const sizeStyles = {
    sm: {
      height: "36px",
      fontSize: "14px",
      padding: "0 12px",
    },
    md: {
      height: "clamp(44px, 10vw, 56px)",
      fontSize: "clamp(14px, 4vw, 16px)",
      padding: "0 16px",
    },
    lg: {
      height: "56px",
      fontSize: "16px",
      padding: "0 20px",
    },
  };

  return (
    <button
      disabled={disabled || loading}
      {...props}
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        borderRadius: "12px",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.6 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        fontWeight: 500,
        transition: "all 0.2s ease",
        ...(props.style as React.CSSProperties),
      }}
    >
      {loading && (
        <div
          style={{
            width: "16px",
            height: "16px",
            border: "2px solid currentColor",
            borderTop: "2px solid transparent",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      )}
      {icon}
      {children}
    </button>
  );
});

export default StepButton;
