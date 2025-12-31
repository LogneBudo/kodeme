import React from "react";
import { Calendar } from "lucide-react";

interface CalendarSync {
  autoCreateEvents: boolean;
  showBusyTimes: boolean;
  syncCancellations: boolean;
}

interface CalendarIntegrationSettingsProps {
  calendarSync: CalendarSync;
  setCalendarSync: (sync: CalendarSync) => void;
  calendarConnected: boolean;
  outlookConnected: boolean;
  googleConnecting: boolean;
  outlookConnecting: boolean;
  handleConnectGoogle: () => void;
  handleConnectOutlook: () => void;
}

const CalendarIntegrationSettings: React.FC<CalendarIntegrationSettingsProps> = ({
  calendarSync,
  setCalendarSync,
  calendarConnected,
  outlookConnected,
  googleConnecting,
  outlookConnecting,
  handleConnectGoogle,
  handleConnectOutlook,
}) => (
  <div>
    <h2 style={{ marginTop: 0, marginBottom: "18px", fontSize: "22px", fontWeight: 700 }}>
      Calendar Integration
    </h2>
    <p style={{ marginTop: 0, marginBottom: "18px", fontSize: "15px", color: "#666" }}>
      Automatically sync your bookings with your calendar and block busy times
    </p>
    <div style={{ background: "#fafcff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "28px 24px 24px 24px", marginBottom: "24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      {calendarConnected && (
        <div style={{ marginBottom: "18px", color: "#22c55e", fontWeight: 600, fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px" }}>✔</span> Google Calendar connected successfully!
        </div>
      )}
      <div style={{ display: "flex", gap: "16px" }}>
        <button
          onClick={handleConnectGoogle}
          disabled={googleConnecting || calendarConnected}
          style={{ background: "#2563eb", color: "white", border: "none", borderRadius: "6px", padding: "10px 24px", fontWeight: 600, cursor: googleConnecting || calendarConnected ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "15px" }}
        >
          <span style={{ display: "flex", alignItems: "center" }}><Calendar size={16} /></span>
          Connect Google Calendar
        </button>
        <button
          onClick={handleConnectOutlook}
          disabled={outlookConnecting || outlookConnected}
          style={{ background: "#2563eb", color: "white", border: "none", borderRadius: "6px", padding: "10px 24px", fontWeight: 600, cursor: outlookConnecting || outlookConnected ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "15px" }}
        >
          <span style={{ display: "flex", alignItems: "center" }}><Calendar size={16} /></span>
          Connect Outlook Calendar
        </button>
      </div>
    </div>
    <div style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px 24px 18px 24px", marginBottom: "18px" }}>
      <div style={{ fontWeight: 600, fontSize: "16px", marginBottom: "16px" }}>Sync Preferences</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", fontSize: "15px" }}>
          <input
            type="checkbox"
            checked={calendarSync.autoCreateEvents}
            onChange={e => setCalendarSync({ ...calendarSync, autoCreateEvents: e.target.checked })}
            style={{ width: "18px", height: "18px", cursor: "pointer" }}
          />
          <span style={{ color: "#222", fontWeight: 500 }}>
            Auto-create calendar events for new bookings
          </span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", fontSize: "15px" }}>
          <input
            type="checkbox"
            checked={calendarSync.showBusyTimes}
            onChange={e => setCalendarSync({ ...calendarSync, showBusyTimes: e.target.checked })}
            style={{ width: "18px", height: "18px", cursor: "pointer" }}
          />
          <span style={{ color: "#222", fontWeight: 500 }}>
            Show busy times from connected calendars
          </span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", fontSize: "15px" }}>
          <input
            type="checkbox"
            checked={calendarSync.syncCancellations}
            onChange={e => setCalendarSync({ ...calendarSync, syncCancellations: e.target.checked })}
            style={{ width: "18px", height: "18px", cursor: "pointer" }}
          />
          <span style={{ color: "#222", fontWeight: 500 }}>
            Send booking confirmation to calendar organizer
          </span>
        </label>
      </div>
    </div>
    <div style={{ marginTop: "0px", padding: "16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", fontSize: "14px", color: "#1e40af" }}>
      <strong>💡 Tip:</strong> Once you connect a calendar, all your bookings will be automatically added to it. You can also block times in your calendar to prevent booking conflicts.
    </div>
  </div>
);

export default CalendarIntegrationSettings;
