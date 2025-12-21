import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import React from "react";

type WeekNavigatorProps = {
  currentDate: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
};

export default function WeekNavigator({
  currentDate,
  onPrevWeek,
  onNextWeek,
  onToday,
}: WeekNavigatorProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const containerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "32px",
  };

  const buttonRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  };

  const iconButton: React.CSSProperties = {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const textButton: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "0 14px",
    height: "40px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "white",
    cursor: "pointer",
    fontSize: "14px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: 600,
    color: "#0f172a",
  };

  return (
    <div style={containerStyle}>
      <div style={buttonRow}>
        <button onClick={onPrevWeek} style={iconButton}>
          <ChevronLeft size={20} color="#0f172a" />
        </button>

        <button onClick={onNextWeek} style={iconButton}>
          <ChevronRight size={20} color="#0f172a" />
        </button>

        <button onClick={onToday} style={textButton}>
          <Calendar size={16} color="#0f172a" />
          Today
        </button>
      </div>

      <h2 style={titleStyle}>
        {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
      </h2>
    </div>
  );
}
