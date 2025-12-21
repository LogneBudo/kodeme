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
import { listTimeSlots } from "../../api/slotsApi";
import type { TimeSlot } from "../../types/timeSlot";

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
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadSlots();
  }, [timeframe]);

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
    setLoading(true);

    const { start, end } = getDateRange();
    
    try {
      const allSlots = await listTimeSlots();
      console.log("All slots from API:", allSlots);
      console.log("Date range:", { start, end });

      const availableSlots = allSlots.filter((slot) => {
        // Check if slot is within the requested date range
        const slotDate = parseISO(slot.date);
        const inRange = !isBefore(slotDate, start) && !isAfter(slotDate, end);
        
        // Check if slot is marked as available (status defaults to "available" if not specified)
        const isAvailable = slot.status !== "unavailable" && slot.status !== "booked";
        
        console.log(`Slot ${slot.id} (${slot.date} ${slot.time}): inRange=${inRange}, isAvailable=${isAvailable}, status=${slot.status}`);
        
        return inRange && isAvailable;
      });

      console.log("Filtered available slots:", availableSlots);

      availableSlots.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });

      setSlots(availableSlots);
    } catch (error) {
      console.error("Failed to load time slots:", error);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const formatSlotDisplay = (slot: TimeSlot) => {
    const date = parseISO(slot.date);
    return {
      date: format(date, "EEE, MMM d"),
      time: slot.time,
    };
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <Loader2 size={40} style={{ marginBottom: "16px", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "#64748b" }}>Loading available slots...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            background: "#f1f5f9",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <Clock size={32} color="#475569" />
        </div>

        <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px", color: "#0f172a" }}>
          Choose your time slot
        </h2>

        <p style={{ color: "#64748b" }}>{slots.length} slots available</p>
      </div>

      {/* No slots */}
      {slots.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 0",
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
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "12px",
            marginBottom: "32px",
            maxHeight: "400px",
            overflowY: "auto",
            padding: "4px",
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
                  padding: "16px",
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
                    fontSize: "14px",
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
        <button
          onClick={onBook}
          disabled={!selectedSlot || isBooking}
          style={{
            width: "100%",
            height: "64px",
            borderRadius: "12px",
            fontSize: "20px",
            fontWeight: 600,
            background: selectedSlot ? "#059669" : "#e2e8f0",
            color: selectedSlot ? "white" : "#94a3b8",
            cursor: selectedSlot ? "pointer" : "not-allowed",
            border: "none",
          }}
        >
          {isBooking ? (
            <>
              <Loader2 size={24} style={{ marginRight: "12px", animation: "spin 1s linear infinite" }} />
              Booking...
            </>
          ) : (
            <>
              <CalendarCheck size={24} style={{ marginRight: "12px" }} />
              BOOK
            </>
          )}
        </button>

        <button
          onClick={onBack}
          disabled={isBooking}
          style={{
            width: "100%",
            height: "48px",
            borderRadius: "8px",
            background: "transparent",
            border: "1px solid #cbd5e1",
            color: "#64748b",
            cursor: isBooking ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>
    </div>
  );
}
