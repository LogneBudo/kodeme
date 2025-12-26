import { Calendar, Clock, CalendarDays, CalendarRange, Zap, ArrowLeft } from "lucide-react";

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
    <div style={{ maxWidth: "500px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
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
          <Calendar size={32} color="#475569" />
        </div>

        <h2 style={{ fontSize: "clamp(20px, 5vw, 24px)", fontWeight: 600, marginBottom: "8px", color: "#0f172a", margin: "0 0 8px 0" }}>
          When would you like to book?
        </h2>

        <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>Select your preferred timeframe</p>
      </div>

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
      <button
        onClick={onBack}
        style={{
          width: "100%",
          height: "48px",
          borderRadius: "8px",
          background: "transparent",
          border: "1px solid #cbd5e1",
          color: "#64748b",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          fontSize: "14px",
          transition: "color 0.2s ease",
        }}
      >
        <ArrowLeft size={16} />
        Back
      </button>
    </div>
  );
}
