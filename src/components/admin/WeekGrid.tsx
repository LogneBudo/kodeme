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
import styles from "./WeekGrid.module.css";

const classNames = (
  ...classes: Array<string | false | null | undefined>
) => classes.filter(Boolean).join(" ");

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
    <div className={styles.container}>
      <div className={styles.gridCard}>
        <div className={styles.tableScroll}>
          <table className={styles.gridTable}>
          <thead>
            <tr>
              <th className={styles.timeHeader}>
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
                    className={classNames(styles.dayHeader, isToday && styles.dayHeaderToday)}
                    title={headerLabel}
                    aria-label={headerLabel}
                  >
                    <div className={styles.dayHeaderContent}>
                      <div className={styles.dayHeaderDow}>{format(day, "EEE")}</div>
                      <div className={styles.dayHeaderDate}>{format(day, "d")}</div>
                      {!isPastDay && (
                        <button
                          onClick={() => onToggleDay(day)}
                          disabled={isDayPending}
                          className={classNames(
                            styles.dayToggle,
                            isDayUnavailable ? styles.dayToggleEnable : styles.dayToggleDisable,
                            isDayPending && styles.pending
                          )}
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
                <td className={styles.timeCell}>
                  {time}
                </td>
                {weekDays.map((day) => {
                  const status = getSlotStatus(day, time);
                  const isDisabled = status.isPast || status.isBlocked || status.isCalendarBlocked || status.isBooked;
                  const slotKey = `${format(day, "yyyy-MM-dd")}-${time}`;
                  const isPending = pendingSlotKey === slotKey;

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
                      className={classNames(
                        styles.slotCell,
                        status.isPast && styles.slotPast,
                        status.isCalendarBlocked && styles.slotCalendarBlocked,
                        status.isBlocked && styles.slotBlocked,
                        status.isBooked && styles.slotBooked,
                        status.isUnavailable && styles.slotUnavailable,
                        !status.isPast && !status.isCalendarBlocked && !status.isBlocked && !status.isBooked && !status.isUnavailable && styles.slotAvailable,
                        isDisabled && styles.slotDisabled
                      )}
                    >
                      <button
                        onClick={() => !isDisabled && onToggleSlot(day, time)}
                        disabled={isDisabled || isPending}
                        className={classNames(styles.slotButton, isPending && styles.pending)}
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
