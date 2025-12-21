import {
  CheckCircle,
  Calendar,
  Clock,
  Mail,
  MapPin,
  Video,
  Building,
  UtensilsCrossed,
  MapPinned,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import CalendarExport from "./CalendarExport";
import type { Appointment } from "../../types/appointment";
import type { LucideIcon } from "lucide-react";

const locationIcons: Record<string, LucideIcon> = {
  zoom: Video,
  your_premises: Building,
  restaurant: UtensilsCrossed,
  other: MapPinned,
};

const locationLabels: Record<string, string> = {
  zoom: "Zoom Meeting",
  your_premises: "Your Premises",
  restaurant: "Restaurant",
  other: "Other Location",
};

type Props = {
  appointment: Appointment;
  onReset: () => void;
};

export default function SuccessScreen({ appointment, onReset }: Props) {
  const LocationIcon = locationIcons[appointment.location_type] || MapPin;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        maxWidth: "480px",
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        style={{
          width: "96px",
          height: "96px",
          background: "#d1fae5",
          borderRadius: "9999px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 32px",
        }}
      >
        <CheckCircle size={56} color="#059669" />
      </motion.div>

      {/* Title */}
      <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", marginBottom: "12px" }}>
        Booking Confirmed!
      </h2>

      <p style={{ color: "#64748b", marginBottom: "32px" }}>
        Your appointment has been successfully scheduled
      </p>

      {/* Appointment Details */}
      <div
        style={{
          background: "#f8fafc",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Date */}
          <DetailRow
            icon={<Calendar size={24} color="#475569" />}
            label="Date"
            value={format(parseISO(appointment.date), "EEEE, MMMM d, yyyy")}
          />

          {/* Time */}
          <DetailRow
            icon={<Clock size={24} color="#475569" />}
            label="Time"
            value={appointment.time}
          />

          {/* Location */}
          <DetailRow
            icon={<LocationIcon size={24} color="#475569" />}
            label="Location"
            value={
              <>
                {locationLabels[appointment.location_type]}
                {appointment.location_type === "other" &&
                  appointment.location_details && (
                    <span
                      style={{
                        display: "block",
                        fontSize: "14px",
                        color: "#475569",
                        marginTop: "4px",
                        fontWeight: 400,
                      }}
                    >
                      {appointment.location_details}
                    </span>
                  )}
              </>
            }
          />

          {/* Email */}
          <DetailRow
            icon={<Mail size={24} color="#475569" />}
            label="Confirmation sent to"
            value={appointment.email}
          />
        </div>
      </div>

      {/* Calendar Export */}
      <div
        style={{
          background: "white",
          border: "2px solid #e2e8f0",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <CalendarExport appointment={appointment} />
      </div>

      <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "24px" }}>
        Use the buttons above to add this appointment to your calendar
      </p>

      {/* Reset Button */}
      <button
        onClick={onReset}
        style={{
          height: "48px",
          padding: "0 32px",
          borderRadius: "12px",
          border: "2px solid #cbd5e1",
          background: "white",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: 600,
          color: "#0f172a",
        }}
      >
        Book Another Appointment
      </button>
    </motion.div>
  );
}

/* ---------------------------------------------
   Small helper component for detail rows
--------------------------------------------- */
function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", textAlign: "left" }}>
      <div
        style={{
          width: "48px",
          height: "48px",
          background: "white",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        {icon}
      </div>

      <div>
        <p style={{ fontSize: "14px", color: "#64748b" }}>{label}</p>
        <p style={{ fontWeight: 600, color: "#0f172a" }}>{value}</p>
      </div>
    </div>
  );
}
