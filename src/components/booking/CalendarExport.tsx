import { useState } from "react";
import { Download, Calendar, CheckCircle } from "lucide-react";
import { parseISO } from "date-fns";
import { toast } from "sonner";
import type { Appointment } from "../../types/appointment";

type CalendarExportProps = {
  appointment: Appointment;
};

export default function CalendarExport({ appointment }: CalendarExportProps) {
  const [downloaded, setDownloaded] = useState(false);

  const generateICS = () => {
    if (!appointment.date || !appointment.time) return "";
    const date = parseISO(appointment.date);
    const [hours, minutes] = appointment.time.split(":");
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const endDate = new Date(date);
    endDate.setHours(endDate.getHours() + 1);

    const formatICSDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const locationText =
      appointment.locationDetails.type === "other" && appointment.locationDetails.details
        ? appointment.locationDetails.details
        : appointment.locationDetails.type === "zoom"
        ? "Zoom Meeting (link TBD)"
        : appointment.locationDetails.type === "your_premises"
        ? "Your Premises"
        : appointment.locationDetails.type === "restaurant"
        ? "Restaurant (TBD)"
        : "To be confirmed";

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Appointment Booking//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${appointment.id}@appointments.booking
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(date)}
DTEND:${formatICSDate(endDate)}
SUMMARY:Kodika Appointment
DESCRIPTION:Your appointment has been confirmed. Please arrive 5 minutes early.
LOCATION:${locationText}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT30M
DESCRIPTION:Appointment Reminder
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`;
  };

  const downloadICS = () => {
    const icsContent = generateICS();
    if (!icsContent) {
      toast.error("Unable to generate calendar file");
      return;
    }
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `appointment-${appointment.date}-${appointment.time?.replace(":", "") || "time"}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    setDownloaded(true);
    toast.success("Calendar file downloaded!");
  };

  const addToGoogleCalendar = () => {
    if (!appointment.date || !appointment.time) return;
    const date = parseISO(appointment.date);
    const [hours, minutes] = appointment.time.split(":");
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const endDate = new Date(date);
    endDate.setHours(endDate.getHours() + 1);

    const formatGoogleDate = (d : Date) =>
      d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const locationText =
      appointment.locationDetails.type === "other" && appointment.locationDetails.details
        ? appointment.locationDetails.details
        : appointment.locationDetails.type === "zoom"
        ? "Zoom Meeting (link TBD)"
        : appointment.locationDetails.type === "your_premises"
        ? "Your Premises"
        : appointment.locationDetails.type === "restaurant"
        ? "Restaurant (TBD)"
        : "To be confirmed";

    const googleUrl = new URL("https://calendar.google.com/calendar/render");
    googleUrl.searchParams.append("action", "TEMPLATE");
    googleUrl.searchParams.append("text", "Kodika Appointment");
    googleUrl.searchParams.append(
      "dates",
      `${formatGoogleDate(date)}/${formatGoogleDate(endDate)}`
    );
    googleUrl.searchParams.append(
      "details",
      "Your appointment has been confirmed. Please arrive 5 minutes early."
    );
    googleUrl.searchParams.append("location", locationText);

    window.open(googleUrl.toString(), "_blank");
    toast.success("Opening Google Calendar...");
  };

  const addToOutlookCalendar = () => {
    if (!appointment.date || !appointment.time) return;
    const date = parseISO(appointment.date);
    const [hours, minutes] = appointment.time.split(":");
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const endDate = new Date(date);
    endDate.setHours(endDate.getHours() + 1);

    const formatOutlookDate = (d : Date) => d.toISOString();

    const locationText =
      appointment.locationDetails.type === "other" && appointment.locationDetails.details
        ? appointment.locationDetails.details
        : appointment.locationDetails.type === "zoom"
        ? "Zoom Meeting (link TBD)"
        : appointment.locationDetails.type === "your_premises"
        ? "Your Premises"
        : appointment.locationDetails.type === "restaurant"
        ? "Restaurant (TBD)"
        : "To be confirmed";

    const outlookUrl = new URL(
      "https://outlook.live.com/calendar/0/deeplink/compose"
    );
    outlookUrl.searchParams.append("path", "/calendar/action/compose");
    outlookUrl.searchParams.append("rru", "addevent");
    outlookUrl.searchParams.append("subject", "Kodika Appointment");
    outlookUrl.searchParams.append("startdt", formatOutlookDate(date));
    outlookUrl.searchParams.append("enddt", formatOutlookDate(endDate));
    outlookUrl.searchParams.append(
      "body",
      "Your appointment has been confirmed. Please arrive 5 minutes early."
    );
    outlookUrl.searchParams.append("location", locationText);

    window.open(outlookUrl.toString(), "_blank");
    toast.success("Opening Outlook Calendar...");
  };

  const addToOffice365Calendar = () => {
    if (!appointment.date || !appointment.time) return;
    const date = parseISO(appointment.date);
    const [hours, minutes] = appointment.time.split(":");
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const endDate = new Date(date);
    endDate.setHours(endDate.getHours() + 1);

    const formatOutlookDate = (d : Date) => d.toISOString();

    const locationText =
      appointment.locationDetails.type === "other" && appointment.locationDetails.details
        ? appointment.locationDetails.details
        : appointment.locationDetails.type === "zoom"
        ? "Zoom Meeting (link TBD)"
        : appointment.locationDetails.type === "your_premises"
        ? "Your Premises"
        : appointment.locationDetails.type === "restaurant"
        ? "Restaurant (TBD)"
        : "To be confirmed";

    const office365Url = new URL(
      "https://outlook.office.com/calendar/0/deeplink/compose"
    );
    office365Url.searchParams.append("path", "/calendar/action/compose");
    office365Url.searchParams.append("rru", "addevent");
    office365Url.searchParams.append("subject", "Kodika Appointment");
    office365Url.searchParams.append("startdt", formatOutlookDate(date));
    office365Url.searchParams.append("enddt", formatOutlookDate(endDate));
    office365Url.searchParams.append(
      "body",
      "Your appointment has been confirmed. Please arrive 5 minutes early."
    );
    office365Url.searchParams.append("location", locationText);

    window.open(office365Url.toString(), "_blank");
    toast.success("Opening Office 365 Calendar...");
  };

  /* ---------------------------------------------------------
     UI (plain React, no Tailwind, no shadcn)
  --------------------------------------------------------- */
  const buttonBase = {
    height: "48px",
    borderRadius: "12px",
    border: "2px solid #e2e8f0",
    background: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: 500,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#334155" }}>
          Add to Calendar
        </h3>

        {downloaded && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#059669",
              fontSize: "12px",
            }}
          >
            <CheckCircle size={14} />
            <span>Downloaded</span>
          </div>
        )}
      </div>

      {/* Primary actions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
        }}
      >
        <button
          onClick={addToGoogleCalendar}
          style={{ ...buttonBase, borderColor: "#bfdbfe" }}
        >
          <GoogleIcon />
          Google
        </button>

        <button
          onClick={addToOutlookCalendar}
          style={{ ...buttonBase, borderColor: "#93c5fd" }}
        >
          <OutlookIcon />
          Outlook
        </button>
      </div>

      {/* Secondary actions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
        }}
      >
        <button onClick={addToOffice365Calendar} style={buttonBase}>
          <Calendar size={16} color="#64748b" />
          Office 365
        </button>

        <button onClick={downloadICS} style={buttonBase}>
          <Download size={16} color="#64748b" />
          Download .ics
        </button>
      </div>

      <p
        style={{
          fontSize: "12px",
          color: "#94a3b8",
          textAlign: "center",
          paddingTop: "8px",
        }}
      >
        Choose your preferred calendar app or download the .ics file
      </p>
    </div>
  );
}

/* ---------------------------------------------------------
   Inline SVG icons (Google + Outlook)
--------------------------------------------------------- */

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function OutlookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z"
        fill="#0078D4"
      />
      <path d="M12 12L4 7V6L12 11L20 6V7L12 12Z" fill="white" />
    </svg>
  );
}
