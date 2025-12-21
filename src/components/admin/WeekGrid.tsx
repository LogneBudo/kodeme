import { useMemo } from "react";
import {
  format,
  addDays,
  startOfWeek,
  isSameDay,
  isBefore,
  startOfDay,
} from "date-fns";
import { Check, X, Clock, CalendarX } from "lucide-react";
import type { Appointment } from "../../types/appointment";
import type { TimeSlot } from "../../types/timeSlot";


const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00",
];

type WeekGridProps = {
  currentDate: Date;
  slots: TimeSlot[];
  appointments: Appointment[];
  onToggleSlot: (date: Date, time: string, slot: TimeSlot | null) => void;
};

export default function WeekGrid({
  currentDate,
  slots,
  appointments,
  onToggleSlot,
}: WeekGridProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const today = startOfDay(new Date());

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const getSlotStatus = (date: Date, time: string) => {
    const dateStr = format(date, "yyyy-MM-dd");

    const slot = slots.find((s) => s.date === dateStr && s.time === time);
    const appointment = appointments.find(
      (a) =>
        a.date === dateStr &&
        a.time === time &&
        a.status === "confirmed"
    );

    const slotStatus = slot?.status || "unavailable";

    return {
      slot,
      isAvailable: slotStatus === "available",
      isBooked: !!appointment || slotStatus === "booked",
      appointment,
      isPast: isBefore(date, today),
    };
  };

  // -----------------------------
  // Inline styles
  // -----------------------------
  const container: React.CSSProperties = {
    background: "white",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    overflow: "hidden",
    width: "100%",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
  };

  const headerRow: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(8, 1fr)",
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc",
  };

  const headerCell: React.CSSProperties = {
    padding: "16px",
    textAlign: "center",
    fontSize: "14px",
    fontWeight: 500,
    color: "#64748b",
  };

  const dayCellBase: React.CSSProperties = {
    padding: "16px",
    textAlign: "center",
    borderLeft: "1px solid #e2e8f0",
  };

  const timeGridContainer: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
  };

  const timeRow: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(8, 1fr)",
    borderBottom: "1px solid #e2e8f0",
  };

  const timeLabelCell: React.CSSProperties = {
    padding: "12px",
    textAlign: "center",
    fontSize: "14px",
    fontWeight: 500,
    color: "#64748b",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const slotButtonBase: React.CSSProperties = {
    padding: "8px",
    borderLeft: "1px solid #e2e8f0",
    minHeight: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s ease",
    cursor: "pointer",
  };

  const legendRow: React.CSSProperties = {
    padding: "16px",
    background: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "24px",
    fontSize: "14px",
  };

  const legendItem: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const legendIconBox = (bg: string): React.CSSProperties => ({
    width: "24px",
    height: "24px",
    borderRadius: "6px",
    background: bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div style={container}>
      {/* Header */}
      <div style={headerRow}>
        <div style={headerCell}>
          <Clock size={16} />
        </div>

        {weekDays.map((day) => {
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              style={{
                ...dayCellBase,
                background: isToday ? "#0f172a" : undefined,
                color: isToday ? "white" : "#0f172a",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  opacity: isToday ? 0.8 : 0.6,
                  fontWeight: 500,
                }}
              >
                {format(day, "EEE")}
              </div>
              <div style={{ fontSize: "18px", fontWeight: 700 }}>
                {format(day, "d")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time Grid */}
      <div style={timeGridContainer}>
        {timeSlots.map((time) => (
          <div key={time} style={timeRow}>
            <div style={timeLabelCell}>{time}</div>

            {weekDays.map((day) => {
              const { slot, isAvailable, isBooked, isPast } =
                getSlotStatus(day, time);

              let bg = "white";
              let hover = "";

              if (isPast) bg = "#f1f5f9";
              else if (isBooked) bg = "#d1fae5";
              else if (isAvailable) {
                bg = "#ecfdf5";
                hover = "#d1fae5";
              } else {
                bg = "#fee2e2";
                hover = "#fecaca";
              }

              return (
                <button
                  key={`${day.toISOString()}-${time}`}
                  disabled={isPast}
                  onClick={() => !isPast && onToggleSlot(day, time, slot ?? null)}
                  style={{
                    ...slotButtonBase,
                    background: bg,
                    cursor: isPast ? "not-allowed" : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!isPast && hover) e.currentTarget.style.background = hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = bg;
                  }}
                >
                  {isPast ? (
                    <span style={{ color: "#cbd5e1" }}>—</span>
                  ) : isBooked ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <CalendarX size={16} color="#059669" />
                      <span style={{ fontSize: "12px", color: "#047857", marginTop: "4px" }}>
                        Booked
                      </span>
                    </div>
                  ) : isAvailable ? (
                    <Check size={20} color="#10b981" />
                  ) : (
                    <X size={20} color="#f87171" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={legendRow}>
        <div style={legendItem}>
          <div style={legendIconBox("#ecfdf5")}>
            <Check size={16} color="#10b981" />
          </div>
          <span style={{ color: "#475569" }}>Available</span>
        </div>

        <div style={legendItem}>
          <div style={legendIconBox("#fee2e2")}>
            <X size={16} color="#f87171" />
          </div>
          <span style={{ color: "#475569" }}>Unavailable</span>
        </div>

        <div style={legendItem}>
          <div style={legendIconBox("#d1fae5")}>
            <CalendarX size={16} color="#059669" />
          </div>
          <span style={{ color: "#475569" }}>Booked</span>
        </div>
      </div>
    </div>
  );
}