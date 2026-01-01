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
  
  // Style objects
  const containerStyle: React.CSSProperties = {
    height: "100vh",
    background: "linear-gradient(to bottom right, #f8fafc, #f1f5f9)",
    width: "100%",
    boxSizing: "border-box",
    overflow: "hidden",
  };

  const innerStyle: React.CSSProperties = {
    width: "100%",
    padding: "32px 15px",
    boxSizing: "border-box",
    height: "calc(100vh - 70px)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };

  const headerRow: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
    flexShrink: 0,
  };

  const titleIconBox: React.CSSProperties = {
    width: "40px",
    height: "40px",
    background: "#0f172a",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };


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
  };

  const handleToggleDay = async (date: Date) => {
    if (!settings) return;

    const dateStr = format(date, "yyyy-MM-dd");
    
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
  };

  return (
    <RequireAdmin>
      <div style={containerStyle}>
        <div style={innerStyle}>
          <div style={headerRow}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <div style={titleIconBox}>
                  <Settings size={20} color="white" />
                </div>
                <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a" }}>
                  Slot Management
                </h1>
              </div>
              <p style={{ color: "#64748b", fontSize: "16px" }}>
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
            <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
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
            />
          )}
        </div>
      </div>
    </RequireAdmin>
  );
}

export default AdminSlots;
