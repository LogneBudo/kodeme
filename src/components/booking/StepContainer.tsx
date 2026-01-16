import type { LucideIcon } from "lucide-react";
import React from "react";

interface StepContainerProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * Reusable container for booking step layouts
 * Provides consistent styling and header with icon
 */
const StepContainer = React.memo(function StepContainer({
  icon: Icon,
  title,
  subtitle,
  children,
}: StepContainerProps) {
  return (
    <div
      style={{
        maxWidth: "420px",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "clamp(20px, 5vw, 32px)",
        }}
      >
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
          <Icon size={32} color="#475569" />
        </div>

        <h2
          style={{
            fontSize: "clamp(20px, 5vw, 24px)",
            fontWeight: 600,
            color: "#0f172a",
            margin: "0 0 8px 0",
          }}
        >
          {title}
        </h2>

        {subtitle && (
          <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Content */}
      {children}
    </div>
  );
});

export default StepContainer;
