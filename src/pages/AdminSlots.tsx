import { useState, useEffect } from "react";
import {
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
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
import { useWeekSlots } from "../hooks/useWeekSlots";
import { useScrollLock } from "../hooks/useScrollLock";

import type { Appointment } from "../types/appointment";
import {
  listAppointments,
  getSettings,
  type Settings as SettingsType,
} from "../api/firebaseApi";
import styles from "./AdminSlots.module.css";

function AdminSlots() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  
  // Check if we can go to previous week (current week is the limit)
  const today = startOfDay(new Date());
  const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const todayWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const canGoPrevious = isBefore(todayWeekStart, currentWeekStart);

  useScrollLock(true);

  const {
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
  } = useWeekSlots({
    currentDate,
    settings,
    appointments,
    calendarEvents,
    setSettings,
  });

  // Load settings when component mounts (fresh from Firestore)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const settingsData = await getSettings();
        if (!isMounted) return;
        setSettings(settingsData);
      } catch (error) {
        console.error("Failed to load settings", error);
        if (!isMounted) return;
        setSettings(null);
        toast.error("Failed to load settings");
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load appointments and calendar events when date changes
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

      try {
        const allAppointments = await listAppointments();
        const weekAppointments = allAppointments.filter((apt) => {
          const d = new Date(apt.appointmentDate);
          return d >= weekStart && d <= weekEnd;
        });

        const events = await getCalendarEventsForWeek(weekStart, weekEnd);

        if (!isMounted) return;
        setCalendarEvents(events);
        setAppointments(weekAppointments);
      } catch (error) {
        console.error("Failed to load appointments or calendar events", error);
        if (isMounted) {
          toast.error("Failed to load appointments or calendar events");
          setCalendarEvents([]);
          setAppointments([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [currentDate]);


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
              weekDays={weekDays}
              timeSlots={timeSlots}
              getDayCounts={getDayCounts}
              isDayFullyUnavailable={isDayFullyUnavailable}
              isPastDay={isPastDay}
              getSlotStatus={getSlotStatus}
              onToggleSlot={toggleSlotAvailability}
              onToggleDay={toggleDayAvailability}
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
