import { useState, useEffect } from "react";
import {
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  format,
  eachDayOfInterval,
} from "date-fns";
import { Loader2, Settings, Calendar } from "lucide-react";
import { toast } from "sonner";

import RequireAdmin from "../components/admin/RequireAdmin";
import WeekNavigator from "../components/admin/WeekNavigator";
import WeekGrid from "../components/admin/WeekGrid";

import type { TimeSlot } from "../types/timeSlot";
import type { Appointment } from "../types/appointment";
import {
  listTimeSlots,
  listAppointments,
  updateTimeSlot,
  createTimeSlot,
  bulkCreateTimeSlots,
} from "../api/slotsApi";

const defaultTimeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00",
];

export default function AdminSlots() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadData = async () => {
  setLoading(true);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const [allSlots, allAppointments] = await Promise.all([
    listTimeSlots(),
    listAppointments(),
  ]);

  const weekSlots = allSlots.filter((slot) => {
    const d = new Date(slot.date);
    return d >= weekStart && d <= weekEnd;
  });

  const weekAppointments = allAppointments.filter((apt) => {
    const d = new Date(apt.date);
    return d >= weekStart && d <= weekEnd;
  });

  setSlots(weekSlots);
  setAppointments(weekAppointments);
  setLoading(false);
};

useEffect(() => {
  (async () => {
    await loadData();
  })();
}, [currentDate]);

  const handleToggleSlot = async (
    date: Date,
    time: string,
    existingSlot: TimeSlot | null
  ) => {
    const dateStr = format(date, "yyyy-MM-dd");

    if (existingSlot) {
      // Default to "unavailable" if status is undefined
      const currentStatus = existingSlot.status || "unavailable";
      const newStatus = currentStatus === "available" ? "unavailable" : "available";

      // Optimistically update local state immediately using functional update
      const updatedSlot = { ...existingSlot, status: newStatus };
      setSlots((prevSlots) => {
        const updated = prevSlots.map((s) =>
          s.id === existingSlot.id ? updatedSlot : s
        );
        console.log(`[AdminSlots] Optimistic update - changed slot ${existingSlot.id} to ${newStatus}`, updated);
        return updated;
      });

      await updateTimeSlot(existingSlot.id, {
        status: newStatus,
      });

      toast.success(
        `Slot marked as ${newStatus}`
      );
    } else {
      await createTimeSlot({
        date: dateStr,
        time,
        status: "unavailable",
      });

      toast.success("Slot created and marked as unavailable");
      await loadData();
    }
  };

  const generateWeekSlots = async () => {
    setGenerating(true);

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const existingKeys = slots.map((s) => `${s.date}-${s.time}`);
    const newSlots: Omit<TimeSlot, "id">[] = [];

    for (const day of days) {
      const dow = day.getDay();
      if (dow === 0 || dow === 6) continue;

      const dateStr = format(day, "yyyy-MM-dd");

      for (const time of defaultTimeSlots) {
        const key = `${dateStr}-${time}`;
        if (!existingKeys.includes(key)) {
          newSlots.push({
            date: dateStr,
            time,
            status: "unavailable",
          });
        }
      }
    }

    if (newSlots.length > 0) {
      await bulkCreateTimeSlots(newSlots);
      toast.success(`Generated ${newSlots.length} new slots`);
      await loadData();
    } else {
      toast.info("All slots for this week already exist");
    }

    setGenerating(false);
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
    maxHeight: "calc(100vh - 70px)",
    overflowY: "auto",
  };

  const headerRow: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
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

  const primaryButton: React.CSSProperties = {
    background: "#0f172a",
    color: "white",
    border: "none",
    borderRadius: "12px",
    height: "48px",
    padding: "0 20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "15px",
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
              <p style={{ color: "#64748b" }}>
                Click on any slot to toggle its availability
              </p>
            </div>

            <button
              onClick={generateWeekSlots}
              disabled={generating}
              style={{
                ...primaryButton,
                opacity: generating ? 0.7 : 1,
              }}
            >
              {generating ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Calendar size={18} />
              )}
              Generate Week Slots
            </button>
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
              slots={slots}
              appointments={appointments}
              onToggleSlot={handleToggleSlot}
            />
          )}
        </div>
      </div>
    </RequireAdmin>
  );
}
