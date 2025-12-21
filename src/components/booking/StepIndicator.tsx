import { Check } from "lucide-react";

type StepIndicatorProps = {
  currentStep: number;
  steps: string[];
};

export default function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "40px" }}>
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = currentStep > stepNumber;
        const isActive = currentStep === stepNumber;

        const circleStyle: React.CSSProperties = {
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "14px",
          fontWeight: 600,
          transition: "all 0.3s ease",
          background: isCompleted
            ? "#10b981" // emerald-500
            : isActive
            ? "#111827" // slate-900
            : "#e5e7eb", // slate-100
          color: isCompleted || isActive ? "white" : "#9ca3af", // slate-400
          boxShadow: isActive ? "0 0 0 4px rgba(17,24,39,0.1)" : "none",
        };

        const labelStyle: React.CSSProperties = {
          fontSize: "12px",
          marginTop: "6px",
          fontWeight: 500,
          color: isActive ? "#111827" : "#9ca3af",
          transition: "color 0.3s ease",
        };

        const connectorStyle: React.CSSProperties = {
          width: "64px",
          height: "2px",
          margin: "0 8px",
          marginTop: "-24px",
          background: isCompleted ? "#10b981" : "#e5e7eb",
          transition: "background 0.3s ease",
        };

        return (
          <div key={step} style={{ display: "flex", alignItems: "center" }}>
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