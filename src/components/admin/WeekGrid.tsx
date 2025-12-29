import { useMemo } from "react";
import {
  format,
  addDays,
  startOfWeek,
  isSameDay,
  isBefore,
  startOfDay,
} from "date-fns";
import { Check, X, Clock, CalendarX, Lock, Calendar } from "lucide-react";
import { isTimeSlotBlocked } from "../../api/calendarApi";
import type { Appointment } from "../../types/appointment";
import type { Settings } from "../../api/firebaseApi";
import type { CalendarEvent } from "../../types/calendar";

type WeekGridProps = {
  currentDate: Date;
  appointments: Appointment[];
  onToggleSlot: (date: Date, time: string) => void;
  settings: Settings | null;
  calendarEvents: CalendarEvent[];
};

function WeekGrid({
  currentDate,
  appointments,
  onToggleSlot,
  settings,
  calendarEvents,
}: WeekGridProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const today = startOfDay(new Date());

  const weekDays = useMemo(() => {
    const allDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    
    // Filter days based on working days settings
    if (!settings) return allDays;
    
    const { startDay, endDay } = settings.workingDays;
    return allDays.filter((day) => {
      const dow = day.getDay();
      // Handle case where endDay < startDay (e.g., Friday to Monday)
      return startDay <= endDay 
        ? (dow >= startDay && dow <= endDay)
        : (dow >= startDay || dow <= endDay);
    });
  }, [weekStart, settings]);

  const timeSlots = useMemo(() => {
    if (!settings) return [];
    
    const slots: string[] = [];
    const { startHour, endHour } = settings.workingHours;
    
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${String(hour).padStart(2, "0")}:00`);
      slots.push(`${String(hour).padStart(2, "0")}:30`);
    }
    
    return slots;
  }, [settings]);

  const isTimeBlocked = (date: Date, time: string): boolean => {
    if (!settings) return false;
    
    return settings.blockedSlots.some((blocked) => {
      const slotMinutes = parseInt(time.split(":")[0]) * 60 + parseInt(time.split(":")[1]);
      const blockStartMinutes = parseInt(blocked.startTime.split(":")[0]) * 60 + parseInt(blocked.startTime.split(":")[1]);
      const blockEndMinutes = parseInt(blocked.endTime.split(":")[0]) * 60 + parseInt(blocked.endTime.split(":")[1]);
      const isTimeWithin = slotMinutes >= blockStartMinutes && slotMinutes < blockEndMinutes;
      if (!isTimeWithin) return false;
      // If blocked has a specific date, it only applies to that day; otherwise applies to all days
      if (blocked.date) {
        const dateStr = format(date, "yyyy-MM-dd");
        return blocked.date === dateStr;
      }
      return true;
    });
  };

  const getSlotStatus = (date: Date, time: string) => {
    const dateStr = format(date, "yyyy-MM-dd");

    const appointment = appointments.find(
      (a) =>
        a.date === dateStr &&
        a.time === time &&
        a.status === "confirmed"
    );

    const blocked = isTimeBlocked(date, time);
    const isUnavailable = !!settings?.oneOffUnavailableSlots?.some(
      (s) => s.date === dateStr && s.time === time
    );

    // Check if blocked by calendar event
    const isCalendarBlocked = isTimeSlotBlocked(date, time, 30, calendarEvents);

    return {
      isAvailable: !blocked && !appointment && !isUnavailable && !isCalendarBlocked,
      isBooked: !!appointment,
      isBlocked: blocked,
      isUnavailable,
      isCalendarBlocked,
      appointment,
      isPast: isBefore(date, today),
    };
  };

  // Inline styles
  const container: React.CSSProperties = {
    background: "white",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    overflow: "hidden",
    width: "100%",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  };

  const headerRow: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(8, 1fr)",
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc",
  };

  const headerCell: React.CSSProperties = {
    padding: "12px 8px",
    textAlign: "center",
    fontSize: "13px",
    fontWeight: 500,
    color: "#64748b",
  };

  const dayCellBase: React.CSSProperties = {
    padding: "12px 8px",
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
    padding: "6px 8px",
    textAlign: "center",
    fontSize: "12px",
    fontWeight: 500,
    color: "#64748b",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "40px",
  };

  const slotButtonBase: React.CSSProperties = {
    padding: "6px 4px",
    borderLeft: "1px solid #e2e8f0",
    minHeight: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s ease",
    cursor: "pointer",
    fontSize: "12px",
  };

  const legendRow: React.CSSProperties = {
    padding: "12px 16px",
    background: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    fontSize: "12px",
    flexShrink: 0,
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

              const { isAvailable, isBooked, isBlocked, isUnavailable, isPast, isCalendarBlocked } =
                getSlotStatus(day, time);

              let bg = "white";
              let hover = "";
              let isClickable = true;

              if (isPast) {
                bg = "#f1f5f9";
                isClickable = false;
              } else if (isCalendarBlocked) {
                bg = "#f3f4f6";
                isClickable = false;
              } else if (isBlocked) {
                bg = "#f3f4f6";
                isClickable = false;
              } else if (isBooked) {
                bg = "#d1fae5";
                isClickable = false;
              } else if (isUnavailable) {
                bg = "#fee2e2";
                hover = "#fecaca";
                isClickable = true;
              } else if (isAvailable) {
                bg = "#ecfdf5";
                hover = "#d1fae5";
              } else {
                bg = "#fee2e2";
                hover = "#fecaca";
              }

              return (
                <button
                  key={`${day.toISOString()}-${time}`}
                  disabled={!isClickable}
                  onClick={() => isClickable && onToggleSlot(day, time)}
                  style={{
                    ...slotButtonBase,
                    background: bg,
                    cursor: isClickable ? "pointer" : "not-allowed",
                  }}
                  onMouseEnter={(e) => {
                    if (isClickable && hover) e.currentTarget.style.background = hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = bg;
                  }}
                >
                  {isPast ? (
                    <span style={{ color: "#cbd5e1" }}>—</span>
                  ) : isCalendarBlocked ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <Calendar size={16} color="#2563eb" />
                      <span style={{ fontSize: "12px", color: "#2563eb", marginTop: "4px" }}>
                        Calendar
                      </span>
                    </div>
                  ) : isBlocked ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <Lock size={16} color="#6b7280" />
                      <span style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                        Blocked
                      </span>
                    </div>
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

        <div style={legendItem}>
          <div style={legendIconBox("#f3f4f6")}> 
            <Calendar size={16} color="#2563eb" />
          </div>
          <span style={{ color: "#475569" }}>Calendar Blocked</span>
        </div>
        <div style={legendItem}>
          <div style={legendIconBox("#f3f4f6")}> 
            <Lock size={16} color="#6b7280" />
          </div>
          <span style={{ color: "#475569" }}>Blocked</span>
        </div>
      </div>
    </div>
  );
}

export default WeekGrid;
