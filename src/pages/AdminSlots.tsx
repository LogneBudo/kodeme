import { useState, useEffect } from "react";
import {
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  format,
} from "date-fns";
import { Loader2, Settings } from "lucide-react";
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

export default function AdminSlots() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SettingsType | null>(null);

  const loadData = async () => {
    setLoading(true);
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

    const allAppointments = await listAppointments();
    const weekAppointments = allAppointments.filter((apt) => {
      const d = new Date(apt.appointmentDate);
      return d >= weekStart && d <= weekEnd;
    });

    setAppointments(weekAppointments);
    setLoading(false);
  };

  // Load settings when component mounts (fresh from Firestore)
  useEffect(() => {
    (async () => {
      const settingsData = await getSettings();
      setSettings(settingsData);
    })();
  }, []);

  // Load appointments when date changes
  useEffect(() => {
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
      // Add a block for this specific 30-minute slot
      const newUnavailable = {
        date: dateStr,
        time,
        label: `Unavailable - ${time}`,
      };

      updatedSettings = {
        ...settings,
        oneOffUnavailableSlots: [...(settings.oneOffUnavailableSlots || []), newUnavailable],
      };
      await updateSettings(updatedSettings);
      setSettings(updatedSettings);
      toast.success("Slot marked as unavailable");
    }
  };

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
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
    marginBottom: "16px",
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

  return (
    <RequireAdmin>
      <div style={containerStyle}>
        <div style={innerStyle}>
          <div style={headerRow}>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "8px",
                }}
              >
                <div style={titleIconBox}>
                  <Settings size={20} color="white" />
                </div>
                <h1
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  Slot Management
                </h1>
              </div>
              <p style={{ color: "#64748b", fontSize: "14px" }}>
                Click on any slot to toggle its availability
              </p>
            </div>
          </div>

          <WeekNavigator
            currentDate={currentDate}
            onPrevWeek={() => setCurrentDate(subWeeks(currentDate, 1))}
            onNextWeek={() => setCurrentDate(addWeeks(currentDate, 1))}
            onToday={() => setCurrentDate(new Date())}
          />

          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "60px 0",
              }}
            >
              <Loader2 size={40} className="animate-spin" color="#94a3b8" />
            </div>
          ) : (
            <WeekGrid
              currentDate={currentDate}
              appointments={appointments}
              onToggleSlot={handleToggleSlot}
              settings={settings}
            />
          )}
        </div>
      </div>
    </RequireAdmin>
  );
}
