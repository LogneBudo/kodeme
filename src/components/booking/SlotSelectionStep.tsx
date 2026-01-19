import { useState, useEffect } from "react";
import { Clock, ArrowLeft, CalendarCheck, Loader2 } from "lucide-react";
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  addWeeks,
  addDays,
  endOfMonth,
  isAfter,
  isBefore,
  startOfDay,
} from "date-fns";
import { listTenantTimeSlots, getTenantSettings, listTenantAppointments } from "../../api/firebaseApi";
import { useAuth } from "../../context/AuthContext";
import { usePublicBookingContext } from "../../context/PublicBookingContext";
import type { TimeSlot } from "../../types/timeSlot";
import StepContainer from "./StepContainer";
import StepButton from "./StepButton";

type Props = {
  timeframe: string;
  selectedSlot: TimeSlot | null;
  setSelectedSlot: (slot: TimeSlot | null) => void;
  onBook: () => void;
  onBack: () => void;
  isBooking: boolean;
};

export default function SlotSelectionStep({
  timeframe,
  selectedSlot,
  setSelectedSlot,
  onBook,
  onBack,
  isBooking,
}: Props) {
  const authContext = useAuth();
  const publicContext = usePublicBookingContext();
  // Use public booking params when present (unauthenticated flow), otherwise auth context
  const orgId = publicContext?.orgId || authContext.orgId;
  const calendarId = publicContext?.calendarId || authContext.calendarId;
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadSlots();
  }, [timeframe, orgId, calendarId]);

  const getDateRange = () => {
  const today = startOfDay(new Date());

  switch (timeframe) {
    case "asap": {
      return { start: today, end: addDays(today, 30) };
    }

    case "this_week": {
      return { start: today, end: endOfWeek(today, { weekStartsOn: 1 }) };
    }

    case "next_week": {
      const nextWeekStart = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });
      return { start: nextWeekStart, end: endOfWeek(nextWeekStart, { weekStartsOn: 1 }) };
    }

    case "this_month": {
      return { start: today, end: endOfMonth(today) };
    }

    default: {
      return { start: today, end: addDays(today, 7) };
    }
  }
};

  const loadSlots = async () => {
    if (!orgId || !calendarId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const { start, end } = getDateRange();
    
    try {
      // Fetch tenant settings + appointments to build availability if time_slots collection is empty
      const [settings, appointments, storedSlots] = await Promise.all([
        getTenantSettings(orgId, calendarId),
        listTenantAppointments(orgId, calendarId).catch(() => []),
        listTenantTimeSlots(orgId, calendarId).catch(() => []),
      ]);

      const hasStoredSlots = storedSlots.length > 0;

      const normalizeDate = (raw: any) =>
        typeof raw === "string"
          ? parseISO(raw)
          : raw?.toDate?.()
            ? raw.toDate()
            : new Date(raw);

      const isTimeBlocked = (date: Date, time: string) => {
        if (!settings?.blockedSlots) return false;
        const [slotHour, slotMinute] = time.split(":").map(Number);
        const slotMinutes = slotHour * 60 + slotMinute;

        return settings.blockedSlots.some((blocked) => {
          const [startHour, startMinute] = blocked.startTime.split(":").map(Number);
          const [endHour, endMinute] = blocked.endTime.split(":").map(Number);
          const blockStart = startHour * 60 + startMinute;
          const blockEnd = endHour * 60 + endMinute;
          const within = slotMinutes >= blockStart && slotMinutes < blockEnd;
          if (!within) return false;
          if (blocked.date) {
            return blocked.date === format(date, "yyyy-MM-dd");
          }
          return true;
        });
      };

      const isUnavailable = (date: Date, time: string) =>
        !!settings?.oneOffUnavailableSlots?.some(
          (s) => s.date === format(date, "yyyy-MM-dd") && s.time === time
        );

      const hasAppointment = (date: Date, time: string) =>
        appointments?.some((a) => {
          const d = normalizeDate((a as any).appointmentDate ?? (a as any).date);
          return (
            format(d, "yyyy-MM-dd") === format(date, "yyyy-MM-dd") &&
            (a as any).time === time &&
            (a as any).status !== "cancelled"
          );
        });

      const slotsFromStorage = storedSlots
        .filter((slot) => {
          const slotDate = normalizeDate(slot.date);
          const inRange = !isBefore(slotDate, start) && !isAfter(slotDate, end);
          const isAvailable = !slot.status || slot.status === "available";
          return inRange && isAvailable;
        })
        .sort((a, b) => {
          const dateCompare = String(a.date).localeCompare(String(b.date));
          if (dateCompare !== 0) return dateCompare;
          return String(a.time).localeCompare(String(b.time));
        });

      const generateSlots = (): TimeSlot[] => {
        if (!settings) return [];
        // workingDays is an array of numbers (0=Sun, 1=Mon, ...)
        const workingDays = new Set(settings.workingDays || []);
        // Prefer startHour/endHour if present, else use startTime/endTime
        let startHour = 0, endHour = 23;
        if (typeof settings.workingHours.startHour === 'number' && typeof settings.workingHours.endHour === 'number') {
          startHour = settings.workingHours.startHour;
          endHour = settings.workingHours.endHour;
        } else {
          [startHour] = (settings.workingHours.startTime || "00:00").split(":").map(Number);
          [endHour] = (settings.workingHours.endTime || "23:45").split(":").map(Number);
        }

        const generated: TimeSlot[] = [];
        for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
          if (!workingDays.has(d.getDay())) continue;
          for (let hour = startHour; hour < endHour; hour++) {
            for (let minute of [0, 30]) {
              const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
              if (isTimeBlocked(d, time)) continue;
              if (isUnavailable(d, time)) continue;
              if (hasAppointment(d, time)) continue;
              generated.push({
                id: `${format(d, "yyyy-MM-dd")}-${time}`,
                org_id: orgId,
                calendar_id: calendarId,
                date: format(d, "yyyy-MM-dd"),
                time,
                status: "available",
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
          }
        }
        return generated.sort((a, b) => {
          const dateCompare = String(a.date).localeCompare(String(b.date));
          if (dateCompare !== 0) return dateCompare;
          return String(a.time).localeCompare(String(b.time));
        });
      };

      // If stored slots exist but all are blocked/booked, treat as "all available" (persisted slots = exceptions only)
      let availableSlots: TimeSlot[];
      // If there are any stored slots, treat them as exceptions (blocked/booked),
      // and generate all possible slots, filtering out any that match a stored slot (by date+time)
      if (hasStoredSlots) {
        const storedBlocked = new Set(slotsFromStorage.map(s => `${s.date}|${s.time}`));
        availableSlots = generateSlots().filter(s => !storedBlocked.has(`${s.date}|${s.time}`));
      } else {
        availableSlots = generateSlots();
      }
      console.log('[SlotSelectionStep] org:', orgId, 'calendar:', calendarId, 'slots:', availableSlots.length, 'stored:', hasStoredSlots, 'settings:', settings, 'appointments:', appointments.length);
      // Limit to first 8 slots for display
      setSlots(availableSlots.slice(0, 8));
      // Optionally, show more slots by default (remove slice if present)
    } catch (error) {
      console.error("Failed to load time slots:", error);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const formatSlotDisplay = (slot: TimeSlot) => {
    const rawDate: any = slot.date;
    const date = typeof rawDate === "string"
      ? parseISO(rawDate)
      : rawDate?.toDate?.()
        ? rawDate.toDate()
        : new Date(rawDate);
    return {
      date: format(date, "EEE, MMM d"),
      time: slot.time,
    };
  };

  if (loading) {
    return (
      <StepContainer icon={Clock} title="Loading slots..." subtitle="">
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Loader2 size={40} style={{ marginBottom: "16px", animation: "spin 1s linear infinite" }} />
          <p style={{ color: "#64748b" }}>Loading available slots...</p>
        </div>
      </StepContainer>
    );
  }

  return (
    <StepContainer
      icon={Clock}
      title="Choose your time slot"
      subtitle={`${slots.length} slots available`}
    >

      {/* No slots */}
      {slots.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "32px 16px",
            background: "#f8fafc",
            borderRadius: "16px",
          }}
        >
          <CalendarCheck size={48} color="#cbd5e1" style={{ marginBottom: "16px" }} />
          <p style={{ color: "#475569", fontWeight: 500, marginBottom: "8px" }}>No slots available</p>
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>Try selecting a different timeframe</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(clamp(120px, 25vw, 160px), 1fr))",
            gap: "12px",
            marginBottom: "20px",
            maxHeight: "400px",
            overflowY: "auto",
            padding: "4px",
            boxSizing: "border-box",
          }}
        >
          {slots.map((slot) => {
            const display = formatSlotDisplay(slot);
            const isSelected = selectedSlot?.id === slot.id;

            return (
              <button
                key={slot.id}
                onClick={() => setSelectedSlot(isSelected ? null : slot)}
                style={{
                  padding: "clamp(12px, 3vw, 16px)",
                  borderRadius: "12px",
                  border: `2px solid ${isSelected ? "#059669" : "#e2e8f0"}`,
                  background: isSelected ? "#ecfdf5" : "white",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontWeight: 600,
                    fontSize: "clamp(12px, 3vw, 14px)",
                    color: isSelected ? "#047857" : "#0f172a",
                  }}
                >
                  {display.date}
                </p>
                <p
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    marginTop: "4px",
                    color: isSelected ? "#059669" : "#334155",
                  }}
                >
                  {display.time}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <StepButton
          onClick={onBook}
          disabled={!selectedSlot || isBooking}
          loading={isBooking}
          style={{
            height: "64px",
            fontSize: "20px",
            background: selectedSlot ? "#059669" : "#e2e8f0",
            color: selectedSlot ? "white" : "#94a3b8",
          }}
          icon={!isBooking && <CalendarCheck size={24} />}
        >
          {isBooking ? "Booking..." : "BOOK"}
        </StepButton>

        <StepButton variant="ghost" onClick={onBack} disabled={isBooking} icon={<ArrowLeft size={16} />}>
          Back
        </StepButton>
      </div>
    </StepContainer>
  );
}
