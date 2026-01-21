import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import BookAppointment from "./BookAppointment";
import { getTenantCalendar } from "../api/firebaseApi/calendars";
import { PublicBookingContext } from "../context/PublicBookingContext";
import type { Calendar } from "../types/branch";

/**
 * PublicBooking Component
 * 
 * Wraps BookAppointment for public booking access via URL params
 * Allows unauthenticated users to book appointments for a specific organization/calendar
 * 
 * Route: /book/:orgId/:calendarId
 * Example: /book/org123/calendar456
 */
export default function PublicBooking() {
  const { orgId, calendarId } = useParams<{ orgId: string; calendarId: string }>();
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validate that the calendar exists and is public
  useEffect(() => {
    if (!orgId || !calendarId) {
      setError("Missing organization or calendar ID");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const cal = await getTenantCalendar(orgId, calendarId);
        if (cal) {
          setCalendar(cal);
          setError(null);
        } else {
          setError("Calendar not found");
        }
      } catch (err) {
        console.error("Error loading calendar:", err);
        setError("Failed to load calendar");
      } finally {
        setLoading(false);
      }
    })();
  }, [orgId, calendarId]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !calendar || !orgId || !calendarId) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column" }}>
        <h1>Calendar Not Found</h1>
        <p>{error || "The calendar you're looking for doesn't exist or is not available."}</p>
      </div>
    );
  }

  // Provide org/calendar to BookAppointment via context
  return (
    <PublicBookingProvider orgId={orgId} calendarId={calendarId}>
      <BookAppointment />
    </PublicBookingProvider>
  );
}

/**
 * PublicBookingProvider
 * 
 * Provides orgId and calendarId to BookAppointment for public booking
 * Temporarily overrides AuthContext values with public params
 */
function PublicBookingProvider({
  children,
  orgId,
  calendarId,
}: {
  children: React.ReactNode;
  orgId: string;
  calendarId: string;
}) {
  // Use a simple context to override auth values for public booking
  return (
    <PublicBookingContext.Provider value={{ orgId, calendarId }}>
      {children}
    </PublicBookingContext.Provider>
  );
}
