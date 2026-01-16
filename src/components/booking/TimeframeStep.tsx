import { Calendar, Clock, CalendarDays, CalendarRange, Zap, ArrowLeft } from "lucide-react";
import StepContainer from "./StepContainer";
import StepButton from "./StepButton";

const timeframes = [
  { id: "asap", label: "As Early as Possible", icon: Zap, description: "Get the next available slot" },
  { id: "this_week", label: "This Week", icon: Clock, description: "Within the next 7 days" },
  { id: "next_week", label: "Next Week", icon: CalendarDays, description: "7-14 days from now" },
  { id: "this_month", label: "This Month", icon: CalendarRange, description: "Within 30 days" },
];

type Props = {
  selectedTimeframe: string;
  setSelectedTimeframe: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
};

export default function TimeframeStep({ selectedTimeframe, setSelectedTimeframe, onNext, onBack }: Props) {
  return (
    <StepContainer
      icon={Calendar}
      title="When would you like to book?"
      subtitle="Select your preferred timeframe"
    >
      {/* Timeframe options */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "20px" }}>
        {timeframes.map((tf) => {
          const Icon = tf.icon;
          const isSelected = selectedTimeframe === tf.id;

          return (
            <button
              key={tf.id}
              onClick={() => {
                setSelectedTimeframe(tf.id);
                setTimeout(onNext, 200);
              }}
              style={{
                width: "100%",
                padding: "clamp(12px, 3vw, 16px)",
                borderRadius: "12px",
                border: `2px solid ${isSelected ? "#0f172a" : "#e2e8f0"}`,
                background: isSelected ? "#0f172a" : "white",
                color: isSelected ? "white" : "#0f172a",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isSelected ? "rgba(255,255,255,0.2)" : "#f1f5f9",
                  transition: "background 0.2s ease",
                  marginBottom: "8px",
                }}
              >
                <Icon size={20} color={isSelected ? "white" : "#475569"} />
              </div>

              <div>
                <p
                  style={{
                    fontSize: "clamp(13px, 3vw, 16px)",
                    fontWeight: 600,
                    marginBottom: "2px",
                    color: isSelected ? "white" : "#0f172a",
                    margin: "0 0 2px 0",
                  }}
                >
                  {tf.label}
                </p>
                <p style={{ fontSize: "11px", color: isSelected ? "rgba(255,255,255,0.7)" : "#64748b", margin: 0 }}>
                  {tf.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Back button */}
      <StepButton variant="ghost" onClick={onBack} icon={<ArrowLeft size={16} />}>
        Back
      </StepButton>
    </StepContainer>
  );
}
