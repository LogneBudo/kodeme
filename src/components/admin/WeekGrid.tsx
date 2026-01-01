import { useMemo } from "react";
import {
  format,
  addDays,
  startOfWeek,
  isSameDay,
  isBefore,
  startOfDay,
} from "date-fns";
import { isTimeSlotBlocked } from "../../api/calendarApi";
import type { Appointment } from "../../types/appointment";
import type { Settings } from "../../api/firebaseApi";
import type { CalendarEvent } from "../../types/calendar";

type WeekGridProps = {
  currentDate: Date;
  appointments: Appointment[];
  onToggleSlot: (date: Date, time: string) => void;
  onToggleDay: (date: Date) => void;
  settings: Settings | null;
  calendarEvents: CalendarEvent[];
  pendingSlotKey?: string | null;
  pendingDayKey?: string | null;
};

function WeekGrid({
  currentDate,
  appointments,
  onToggleSlot,
  onToggleDay,
  settings,
  calendarEvents,
  pendingSlotKey,
  pendingDayKey,
}: WeekGridProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const today = startOfDay(new Date());

  const getDayCounts = (day: Date) => {
    if (!settings) return { booked: 0, blocked: 0, unavailable: 0 };
    const dateStr = format(day, "yyyy-MM-dd");
    const booked = appointments.filter(
      (a) => a.date === dateStr || a.appointmentDate === dateStr
    ).length;
    const blocked = (settings.blockedSlots || []).filter(
      (b) => !b.date || b.date === dateStr
    ).length;
    const unavailable = (settings.oneOffUnavailableSlots || []).filter(
      (s) => s.date === dateStr
    ).length;
    return { booked, blocked, unavailable };
  };

  const isDayFullyUnavailable = (day: Date): boolean => {
    if (!settings) return false;
    
    const dateStr = format(day, "yyyy-MM-dd");
    const { startHour, endHour } = settings.workingHours;
    const daySlots: string[] = [];
    
    for (let hour = startHour; hour < endHour; hour++) {
      daySlots.push(`${String(hour).padStart(2, "0")}:00`);
      daySlots.push(`${String(hour).padStart(2, "0")}:30`);
    }
    
    return daySlots.every((time) =>
      settings.oneOffUnavailableSlots?.some(
        (s) => s.date === dateStr && s.time === time
      )
    );
  };

  const weekDays = useMemo(() => {
    const allDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    
    if (!settings) return allDays;
    
    const { startDay, endDay } = settings.workingDays;
    return allDays.filter((day) => {
      const dow = day.getDay();
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

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Week Grid */}
      <div style={{ backgroundColor: "white", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0", width: "fit-content", maxHeight: "450px", display: "flex", flexDirection: "column" }}>
        {/* Grid Wrapper */}
        <div style={{ overflowX: "auto", overflowY: "auto", flex: 1 }}>
          <table style={{ borderCollapse: "collapse", width: "auto" }}>
          <thead>
            <tr>
              <th style={{ width: "64px", height: "48px", backgroundColor: "#f8fafc", borderRight: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", padding: "0", textAlign: "center", fontSize: "18px", fontWeight: "500", color: "#64748b", position: "sticky", top: 0, left: 0, zIndex: 3 }}>
                Time
              </th>
              {weekDays.map((day) => {
                const isToday = isSameDay(day, new Date());
                const isPastDay = isBefore(day, today);
                const isDayUnavailable = isDayFullyUnavailable(day);
                const isDayPending = pendingDayKey === format(day, "yyyy-MM-dd");
                const counts = getDayCounts(day);
                const headerLabel = `${format(day, "EEE, MMM d")} — ${counts.booked} booked, ${counts.blocked} blocked, ${counts.unavailable} unavailable`;

                return (
                  <th
                    key={day.toISOString()}
                    style={{
                      width: "64px",
                      height: "48px",
                      backgroundColor: isToday ? "#0f172a" : "#f8fafc",
                      borderRight: "1px solid #e2e8f0",
                      borderBottom: "1px solid #e2e8f0",
                      color: isToday ? "white" : "#0f172a",
                      padding: "0",
                      textAlign: "center",
                      fontSize: "22px",
                      fontWeight: "500",
                      position: "sticky",
                      top: 0,
                      zIndex: 2,
                      cursor: "default",
                    }}
                    title={headerLabel}
                    aria-label={headerLabel}
                  >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "2px" }}>
                      <div style={{ fontSize: "10px", opacity: 0.7 }}>{format(day, "EEE")}</div>
                      <div style={{ fontSize: "12px", fontWeight: "bold" }}>{format(day, "d")}</div>
                      {!isPastDay && (
                        <button
                          onClick={() => onToggleDay(day)}
                          disabled={isDayPending}
                          style={{
                            padding: "2px 4px",
                            fontSize: "9px",
                            fontWeight: "600",
                            borderRadius: "2px",
                            border: "none",
                            cursor: "pointer",
                            background: isDayUnavailable ? "#10b981" : "#ef4444",
                            color: "white",
                            transition: "opacity 0.15s",
                            marginTop: "2px",
                            opacity: isDayPending ? 0.6 : 1,
                          }}
                        >
                            {isDayPending ? "…" : isDayUnavailable ? "Enable" : "Disable"}
                        </button>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((time) => (
              <tr key={time}>
                <td
                  style={{
                    width: "64px",
                    height: "40px",
                    backgroundColor: "#f8fafc",
                    borderRight: "1px solid #e2e8f0",
                    borderBottom: "1px solid #e2e8f0",
                    padding: "0",
                    textAlign: "center",
                    fontSize: "18px",
                    fontWeight: "500",
                    color: "#64748b",
                    position: "sticky",
                    left: 0,
                    zIndex: 1,
                  }}
                >
                  {time}
                </td>
                {weekDays.map((day) => {
                  const status = getSlotStatus(day, time);
                  const isDisabled = status.isPast || status.isBlocked || status.isCalendarBlocked || status.isBooked;
                  const slotKey = `${format(day, "yyyy-MM-dd")}-${time}`;
                  const isPending = pendingSlotKey === slotKey;
                  
                  let bgColor = "#ecfdf5";
                  if (status.isPast) bgColor = "#f1f5f9";
                  else if (status.isCalendarBlocked) bgColor = "#dbeafe";
                  else if (status.isBlocked) bgColor = "#f3f4f6";
                  else if (status.isBooked) bgColor = "#d1fae5";
                  else if (status.isUnavailable) bgColor = "#fee2e2";

                  const statusLabel = (() => {
                    if (status.isPast) return "Past";
                    if (status.isCalendarBlocked) return "Calendar blocked";
                    if (status.isBlocked) return "Blocked";
                    if (status.isBooked) return "Booked";
                    if (status.isUnavailable) return "Unavailable";
                    return "Available";
                  })();

                  return (
                    <td
                      key={`${day.toISOString()}-${time}`}
                      style={{
                        width: "64px",
                        height: "40px",
                        backgroundColor: bgColor,
                        borderRight: "1px solid #e2e8f0",
                        borderBottom: "1px solid #e2e8f0",
                        padding: "0",
                        textAlign: "center",
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        opacity: isDisabled ? "0.5" : "1",
                      }}
                    >
                      <button
                        onClick={() => !isDisabled && onToggleSlot(day, time)}
                        disabled={isDisabled || isPending}
                        style={{
                          width: "100%",
                          height: "100%",
                          border: "none",
                          background: "transparent",
                          cursor: isDisabled || isPending ? "not-allowed" : "pointer",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                        title={`${format(day, "EEE, MMM d")} at ${time} — ${statusLabel}${isPending ? " (updating...)" : ""}`}
                        aria-label={`${format(day, "EEE, MMM d")} at ${time} — ${statusLabel}${isPending ? " updating" : ""}`}
                      >
                        {isPending
                          ? "…"
                          : status.isPast
                          ? "—"
                          : status.isCalendarBlocked
                          ? "X"
                          : status.isBlocked
                          ? "X"
                          : status.isBooked
                          ? "✓"
                          : status.isUnavailable
                          ? "✕"
                          : "✓"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

export default WeekGrid;
