import { useMemo, useState, useCallback } from "react";
import { addDays, format, isBefore, startOfDay, startOfWeek } from "date-fns";
import { toast } from "sonner";
import { isTimeSlotBlocked } from "../api/calendarApi";
import { updateSettings, type Settings } from "../api/firebaseApi/settings";
import { SlotState } from "../constants/slotStates";
import type { Appointment } from "../types/appointment";
import type { CalendarEvent } from "../types/calendar";

export type SlotStatus = {
  isAvailable: boolean;
  isBooked: boolean;
  isBlocked: boolean;
  isUnavailable: boolean;
  isCalendarBlocked: boolean;
  appointment?: Appointment;
  isPast: boolean;
  state: SlotState;
};

type UseWeekSlotsParams = {
  currentDate: Date;
  settings: Settings | null;
  appointments: Appointment[];
  calendarEvents: CalendarEvent[];
  setSettings: (settings: Settings) => void;
};

export function useWeekSlots({
  currentDate,
  settings,
  appointments,
  calendarEvents,
  setSettings,
}: UseWeekSlotsParams) {
  const [pendingSlotKey, setPendingSlotKey] = useState<string | null>(null);
  const [pendingDayKey, setPendingDayKey] = useState<string | null>(null);
  const today = startOfDay(new Date());
  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 1 }),
    [currentDate]
  );

  const weekDays = useMemo(() => {
    const allDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    if (!settings) return allDays;

    const allowed = new Set(settings.workingDays || []);
    if (!allowed.size) return [];

    return allDays.filter((day) => allowed.has(day.getDay()));
  }, [weekStart, settings]);

  const timeSlots = useMemo(() => {
    if (!settings) return [];

    let startHour = 0, endHour = 23;
    if (
      typeof settings.workingHours.startHour === 'number' &&
      typeof settings.workingHours.endHour === 'number'
    ) {
      startHour = settings.workingHours.startHour;
      endHour = settings.workingHours.endHour;
    } else {
      [startHour] = (settings.workingHours.startTime || "00:00").split(":").map(Number);
      [endHour] = (settings.workingHours.endTime || "23:45").split(":").map(Number);
    }

    const slots: string[] = [];
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${String(hour).padStart(2, "0")}:00`);
      slots.push(`${String(hour).padStart(2, "0")}:30`);
    }

    return slots;
  }, [settings]);

  const buildDaySlots = useCallback(
    (): string[] => {
      if (!settings) return [];
      const { startTime, endTime } = settings.workingHours;
      const [startHour] = startTime.split(':').map(Number);
      const [endHour] = endTime.split(':').map(Number);
      const daySlots: string[] = [];

      for (let hour = startHour; hour < endHour; hour++) {
        daySlots.push(`${String(hour).padStart(2, "0")}:00`);
        daySlots.push(`${String(hour).padStart(2, "0")}:30`);
      }

      return daySlots;
    },
    [settings]
  );

  const getDayCounts = useCallback(
    (day: Date) => {
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
    },
    [appointments, settings]
  );

  const isDayFullyUnavailable = useCallback(
    (day: Date): boolean => {
      if (!settings) return false;

      const dateStr = format(day, "yyyy-MM-dd");
      const daySlots = buildDaySlots();
      if (!daySlots.length) return false;

      return daySlots.every((time) =>
        settings.oneOffUnavailableSlots?.some(
          (s) => s.date === dateStr && s.time === time
        )
      );
    },
    [buildDaySlots, settings]
  );

  const isPastDay = useCallback(
    (day: Date) => isBefore(day, today),
    [today]
  );

  const isTimeBlocked = useCallback(
    (date: Date, time: string): boolean => {
      if (!settings) return false;

      return settings.blockedSlots.some((blocked) => {
        const [slotHour, slotMinute] = time.split(":").map(Number);
        const slotMinutes = slotHour * 60 + slotMinute;
        const [startHour, startMinute] = blocked.startTime.split(":").map(Number);
        const [endHour, endMinute] = blocked.endTime.split(":").map(Number);
        const blockStartMinutes = startHour * 60 + startMinute;
        const blockEndMinutes = endHour * 60 + endMinute;
        const isTimeWithin =
          slotMinutes >= blockStartMinutes && slotMinutes < blockEndMinutes;
        if (!isTimeWithin) return false;
        if (blocked.date) {
          const dateStr = format(date, "yyyy-MM-dd");
          return blocked.date === dateStr;
        }
        return true;
      });
    },
    [settings]
  );

  const getSlotStatus = useCallback(
    (date: Date, time: string): SlotStatus => {
      const dateStr = format(date, "yyyy-MM-dd");

      const appointment = appointments.find(
        (a) => a.date === dateStr && a.time === time && a.status === "confirmed"
      );

      const blocked = isTimeBlocked(date, time);
      const isUnavailable = !!settings?.oneOffUnavailableSlots?.some(
        (s) => s.date === dateStr && s.time === time
      );

      const isCalendarBlocked = isTimeSlotBlocked(
        date,
        time,
        30,
        calendarEvents
      );

      const state: SlotState = (() => {
        if (isBefore(date, today)) return SlotState.Past;
        if (isCalendarBlocked) return SlotState.CalendarBlocked;
        if (blocked) return SlotState.Blocked;
        if (appointment) return SlotState.Booked;
        if (isUnavailable) return SlotState.Unavailable;
        return SlotState.Available;
      })();

      return {
        isAvailable: !blocked && !appointment && !isUnavailable && !isCalendarBlocked,
        isBooked: !!appointment,
        isBlocked: blocked,
        isUnavailable,
        isCalendarBlocked,
        appointment,
        isPast: isBefore(date, today),
        state,
      };
    },
    [appointments, calendarEvents, isTimeBlocked, settings, today]
  );

  const toggleSlotAvailability = useCallback(
    async (date: Date, time: string) => {
      if (!settings) return;

      const dateStr = format(date, "yyyy-MM-dd");
      const slotKey = `${dateStr}-${time}`;
      setPendingSlotKey(slotKey);

      const isCurrentlyUnavailable = settings.oneOffUnavailableSlots?.some(
        (s) => s.date === dateStr && s.time === time
      );

      let updatedSettings: Settings;

      try {
        if (isCurrentlyUnavailable) {
          updatedSettings = {
            ...settings,
            oneOffUnavailableSlots: (settings.oneOffUnavailableSlots || []).filter(
              (s) => !(s.date === dateStr && s.time === time)
            ),
          };
          await updateSettings(updatedSettings);
          setSettings(updatedSettings);
          toast.success("Slot marked as available");
        } else {
          updatedSettings = {
            ...settings,
            oneOffUnavailableSlots: [
              ...(settings.oneOffUnavailableSlots || []),
              { date: dateStr, time },
            ],
          };
          await updateSettings(updatedSettings);
          setSettings(updatedSettings);
          toast.success("Slot marked as unavailable");
        }
      } catch (error) {
        toast.error("Failed to update slot availability");
        console.error(error);
      } finally {
        setPendingSlotKey(null);
      }
    },
    [settings, setSettings]
  );

  const toggleDayAvailability = useCallback(
    async (date: Date) => {
      if (!settings) return;

      const dateStr = format(date, "yyyy-MM-dd");
      setPendingDayKey(dateStr);

      const daySlots = buildDaySlots();
      const allUnavailable = daySlots.every((time) =>
        settings.oneOffUnavailableSlots?.some(
          (s) => s.date === dateStr && s.time === time
        )
      );

      const dayName = format(date, "EEEE, MMMM d");
      let updatedSettings: Settings;

      try {
        if (allUnavailable) {
          updatedSettings = {
            ...settings,
            oneOffUnavailableSlots: (settings.oneOffUnavailableSlots || []).filter(
              (s) => s.date !== dateStr
            ),
          };
          await updateSettings(updatedSettings);
          setSettings(updatedSettings);
          toast.success(`All slots made available for ${dayName}`);
        } else {
          const existingSlots = settings.oneOffUnavailableSlots || [];
          const newSlots = daySlots.map((time) => ({ date: dateStr, time }));

          updatedSettings = {
            ...settings,
            oneOffUnavailableSlots: [
              ...existingSlots.filter((s) => s.date !== dateStr),
              ...newSlots,
            ],
          };
          await updateSettings(updatedSettings);
          setSettings(updatedSettings);
          toast.success(`All slots blocked for ${dayName}`);
        }
      } catch (error) {
        toast.error("Failed to update day availability");
        console.error(error);
      } finally {
        setPendingDayKey(null);
      }
    },
    [buildDaySlots, settings, setSettings]
  );

  return {
    weekDays,
    timeSlots,
    getDayCounts,
    isDayFullyUnavailable,
    isPastDay,
    getSlotStatus,
    toggleSlotAvailability,
    toggleDayAvailability,
    pendingSlotKey,
    pendingDayKey,
  };
}
