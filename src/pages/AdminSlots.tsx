import { useState, useEffect } from "react";
import {
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  format,
  isBefore,
  startOfDay,
} from "date-fns";
import { Loader2, Settings } from "lucide-react";
import { getCalendarEventsForWeek } from "../api/calendarApi";
import type { CalendarEvent } from "../types/calendar";
import { toast } from "sonner";

import RequireAdmin from "../components/admin/RequireAdmin";
import WeekNavigator from "../components/admin/WeekNavigator";
import WeekGrid from "../components/admin/WeekGrid";

import type { Appointment } from "../types/appointment";
import {
  listAppointments,
  getSettings,
  updateSettings,
  type Settings as SettingsType,
} from "../api/firebaseApi";
import styles from "./AdminSlots.module.css";

function AdminSlots() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [pendingSlotKey, setPendingSlotKey] = useState<string | null>(null);
  const [pendingDayKey, setPendingDayKey] = useState<string | null>(null);
  
  // Check if we can go to previous week (current week is the limit)
  const today = startOfDay(new Date());
  const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const todayWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const canGoPrevious = isBefore(todayWeekStart, currentWeekStart);

  // Hide body scrollbar when component mounts
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Load settings when component mounts (fresh from Firestore)
  useEffect(() => {
    (async () => {
      const settingsData = await getSettings();
      setSettings(settingsData);
    })();
  }, []);

  // Load appointments and calendar events when date changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

      const allAppointments = await listAppointments();
      const weekAppointments = allAppointments.filter((apt) => {
        const d = new Date(apt.appointmentDate);
        return d >= weekStart && d <= weekEnd;
      });

      // Fetch calendar events for the week
      const events = await getCalendarEventsForWeek(weekStart, weekEnd);
      setCalendarEvents(events);

      setAppointments(weekAppointments);
      setLoading(false);
    };
    loadData();
  }, [currentDate]);


  const handleToggleSlot = async (date: Date, time: string) => {
    if (!settings) return;

    const dateStr = format(date, "yyyy-MM-dd");
    const slotKey = `${dateStr}-${time}`;
    setPendingSlotKey(slotKey);
    // Toggle per-date unavailable (not touching blocked settings)
    const isCurrentlyUnavailable = settings.oneOffUnavailableSlots?.some(
      (s) => s.date === dateStr && s.time === time
    );

    let updatedSettings: SettingsType;

    if (isCurrentlyUnavailable) {
      // Make available again by removing from oneOffUnavailableSlots
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
      // Add to oneOffUnavailableSlots to mark as unavailable
      updatedSettings = {
        ...settings,
        oneOffUnavailableSlots: [
          ...(settings.oneOffUnavailableSlots || []),
          { date: dateStr, time }
        ],
      };
      await updateSettings(updatedSettings);
      setSettings(updatedSettings);
      toast.success("Slot marked as unavailable");
    }
    setPendingSlotKey(null);
  };

  const handleToggleDay = async (date: Date) => {
    if (!settings) return;

    const dateStr = format(date, "yyyy-MM-dd");
    setPendingDayKey(dateStr);
    
    // Generate all time slots for the day
    const { startHour, endHour } = settings.workingHours;
    const daySlots: string[] = [];
    for (let hour = startHour; hour < endHour; hour++) {
      daySlots.push(`${String(hour).padStart(2, "0")}:00`);
      daySlots.push(`${String(hour).padStart(2, "0")}:30`);
    }

    // Check if all slots are currently unavailable
    const allUnavailable = daySlots.every((time) =>
      settings.oneOffUnavailableSlots?.some(
        (s) => s.date === dateStr && s.time === time
      )
    );

    let updatedSettings: SettingsType;

    const dayName = format(date, "EEEE, MMMM d");

    if (allUnavailable) {
      // Make entire day available by removing all slots for this date
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
      // Make entire day unavailable by adding all slots for this date
      const existingSlots = settings.oneOffUnavailableSlots || [];
      const newSlots = daySlots.map((time) => ({ date: dateStr, time }));
      
      // Remove any existing slots for this date and add all new ones
      updatedSettings = {
        ...settings,
        oneOffUnavailableSlots: [
          ...existingSlots.filter((s) => s.date !== dateStr),
          ...newSlots
        ],
      };
      await updateSettings(updatedSettings);
      setSettings(updatedSettings);
      toast.success(`All slots blocked for ${dayName}`);
    }
    setPendingDayKey(null);
  };

  return (
    <RequireAdmin>
      <div className={styles.page}>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.titleGroup}>
              <div className={styles.titleRow}>
                <div className={styles.titleIcon}>
                  <Settings size={20} color="white" />
                </div>
                <h1 className={styles.title}>
                  Slot Management
                </h1>
              </div>
              <p className={styles.subtitle}>
                  Click on any slot to toggle its availability
              </p>
            </div>
          </div>

          <WeekNavigator
            currentDate={currentDate}
            onPrevWeek={() => setCurrentDate(subWeeks(currentDate, 1))}
            onNextWeek={() => setCurrentDate(addWeeks(currentDate, 1))}
            onToday={() => setCurrentDate(new Date())}
            canGoPrevious={canGoPrevious}
          />

          {loading ? (
            <div className={styles.loading}>
              <Loader2 size={40} className="animate-spin" color="#94a3b8" />
            </div>
          ) : (
            <WeekGrid
              currentDate={currentDate}
              appointments={appointments}
              onToggleSlot={handleToggleSlot}
              onToggleDay={handleToggleDay}
              settings={settings}
              calendarEvents={calendarEvents}
              pendingSlotKey={pendingSlotKey}
              pendingDayKey={pendingDayKey}
            />
          )}
        </div>
      </div>
    </RequireAdmin>
  );
}

export default AdminSlots;
