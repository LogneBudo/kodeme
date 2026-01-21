import React from "react";
// No unused imports
import GmailLogo from "../../icons/GmailLogo";
import OutlookLogo from "../../icons/OutlookLogo";

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
  handleDisconnectGoogle: () => void;
  handleDisconnectOutlook: () => void;
}

export const CalendarIntegrationSettings: React.FC<CalendarIntegrationSettingsProps> = ({
  calendarSync,
  setCalendarSync,
  calendarConnected,
  outlookConnected,
  googleConnecting,
  outlookConnecting,
  handleConnectGoogle,
  handleConnectOutlook,
  handleDisconnectGoogle,
  handleDisconnectOutlook,
}) => {
  return (
    <>
      <div>
        <h2 style={{ marginTop: 0, marginBottom: "18px", fontSize: "22px", fontWeight: 700 }}>
          Calendar Integration
        </h2>
        <p style={{ marginTop: 0, marginBottom: "18px", fontSize: "15px", color: "#666" }}>
          Automatically sync your bookings with your calendar and block busy times
        </p>
        {/* Top section: connectors only */}
        <div style={{ background: "#fafcff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "28px 24px 24px 24px", marginBottom: "24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", alignItems: "center" }}>
            {(!calendarConnected && !outlookConnected) && (
              <>
                <div style={{
                  color: "#b45309",
                  background: "#fef3c7",
                  border: "1.5px solid #fbbf24",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "16px",
                  marginBottom: "18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 18px"
                }}>
                  <span style={{ fontSize: "22px", marginRight: 8, color: '#fbbf24', display: 'flex', alignItems: 'center' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" fill="#fef3c7"/><path d="M12 8v4" stroke="#b45309"/><circle cx="12" cy="16" r="1" fill="#b45309"/></svg>
                  </span>
                  <span>No calendar connected. Connect Google or Outlook to sync your bookings.</span>
                </div>
                <div style={{ display: "flex", gap: "32px", justifyContent: "center", width: "100%" }}>
                  <button
                    onClick={handleConnectGoogle}
                    disabled={googleConnecting}
                    aria-label="Sign in with Google"
                    style={{
                      background: "#fff",
                      border: "none",
                      borderRadius: "10px",
                      width: 64,
                      height: 64,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: googleConnecting ? "none" : "0 2px 12px rgba(0,0,0,0.10)",
                      cursor: googleConnecting ? "not-allowed" : "pointer",
                      opacity: googleConnecting ? 0.7 : 1,
                      transition: "box-shadow 0.2s, transform 0.2s, opacity 0.2s",
                      padding: 0,
                      outline: "none"
                    }}
                  >
                    <GmailLogo style={{ width: 40, height: 40 }} />
                  </button>
                  <button
                    onClick={handleConnectOutlook}
                    disabled={outlookConnecting}
                    aria-label="Sign in with Outlook"
                    style={{
                      background: "#fff",
                      border: "none",
                      borderRadius: "10px",
                      width: 64,
                      height: 64,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: outlookConnecting ? "none" : "0 2px 12px rgba(0,0,0,0.10)",
                      cursor: outlookConnecting ? "not-allowed" : "pointer",
                      opacity: outlookConnecting ? 0.7 : 1,
                      transition: "box-shadow 0.2s, transform 0.2s, opacity 0.2s",
                      padding: 0,
                      outline: "none"
                    }}
                  >
                    <OutlookLogo style={{ width: 40, height: 40 }} />
                  </button>
                </div>
              </>
            )}
            {calendarConnected && !outlookConnected && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", justifyContent: "center" }}>
                <span style={{ color: "#22c55e", fontWeight: 600, fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px" }}>✔</span> Google Calendar connected
                </span>
                <button
                  onClick={handleDisconnectGoogle}
                  style={{ background: "#ef4444", color: "white", border: "none", borderRadius: "6px", padding: "8px 18px", fontWeight: 600, cursor: "pointer", fontSize: "14px", marginLeft: "8px" }}
                >
                  Disconnect / Reset
                </button>
              </div>
            )}
            {outlookConnected && !calendarConnected && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", justifyContent: "center" }}>
                <span style={{ color: "#22c55e", fontWeight: 600, fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px" }}>✔</span> Outlook Calendar connected
                </span>
                <button
                  onClick={handleDisconnectOutlook}
                  style={{ background: "#ef4444", color: "white", border: "none", borderRadius: "6px", padding: "8px 18px", fontWeight: 600, cursor: "pointer", fontSize: "14px", marginLeft: "8px" }}
                >
                  Disconnect / Reset
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Bottom section: sync preferences */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "28px 24px 24px 24px", marginBottom: "18px", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <div style={{ fontWeight: 600, fontSize: "16px", marginBottom: "16px" }}>Sync Preferences</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
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
        {/* Info tip */}
        <div style={{ marginTop: "0px", padding: "16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", fontSize: "14px", color: "#1e40af" }}>
          <strong>💡 Tip:</strong> Once you connect a calendar, all your bookings will be automatically added to it. You can also block times in your calendar to prevent booking conflicts.
        </div>
      </div>
    </>
  );
}

export default CalendarIntegrationSettings;
