import { Check } from "lucide-react";

type StepIndicatorProps = {
  currentStep: number;
  steps: string[];
};

export default function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "clamp(4px, 2vw, 8px)", marginBottom: "clamp(24px, 6vw, 40px)", padding: "0 16px", boxSizing: "border-box", overflowX: "auto" }}>
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = currentStep > stepNumber;
        const isActive = currentStep === stepNumber;

        const circleStyle: React.CSSProperties = {
          width: "clamp(32px, 8vw, 40px)",
          height: "clamp(32px, 8vw, 40px)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "clamp(12px, 3vw, 14px)",
          fontWeight: 600,
          transition: "all 0.3s ease",
          background: isCompleted
            ? "#10b981" // emerald-500
            : isActive
            ? "#111827" // slate-900
            : "#e5e7eb", // slate-100
          color: isCompleted || isActive ? "white" : "#9ca3af", // slate-400
          boxShadow: isActive ? "0 0 0 4px rgba(17,24,39,0.1)" : "none",
          flexShrink: 0,
        };

        const labelStyle: React.CSSProperties = {
          fontSize: "clamp(10px, 2.5vw, 12px)",
          marginTop: "4px",
          fontWeight: 500,
          color: isCompleted ? "#10b981" : isActive ? "#111827" : "#64748b",
          transition: "color 0.3s ease",
          whiteSpace: "nowrap",
        };

        const connectorStyle: React.CSSProperties = {
          width: "clamp(30px, 5vw, 64px)",
          height: "2px",
          margin: "0 clamp(2px, 1vw, 8px)",
          marginTop: "-24px",
          background: isCompleted ? "#10b981" : "#bec0c2ff",
          transition: "background 0.3s ease",
          flexShrink: 0,
        };

        return (
          <div key={step} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={circleStyle}>
                {isCompleted ? <Check size={20} /> : stepNumber}
              </div>
              <span style={labelStyle}>{step}</span>
            </div>

            {index < steps.length - 1 && <div style={connectorStyle} />}
          </div>
        );
      })}
    </div>
  );
}