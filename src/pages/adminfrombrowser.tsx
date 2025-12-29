import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getSettings, updateSettings, type Settings, type BlockedSlot } from "../api/firebaseApi";
import { Settings as SettingsIcon, Plus, Trash2, Clock, Calendar, Ban, Save, CalendarSync } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Settings groups definition
const SETTINGS_GROUPS = [
  {
    id: "hours",
    label: "Working Hours",
    icon: Clock,
    description: "Set your daily business hours",
  },
  {
    id: "days",
    label: "Working Days",
    icon: Calendar,
    description: "Define your operating days",
  },
  {
    id: "blocked",
    label: "Blocked Time Slots",
    icon: Ban,
    description: "Manage breaks and unavailable times",
  },
  {
    id: "calendar",
    label: "Calendar Integration",
    icon: CalendarSync,
    description: "Connect and sync with your calendar",
  },
];

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("hours");
  const [googleConnecting, setGoogleConnecting] = useState(false);
  const [outlookConnecting, setOutlookConnecting] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [newBlockedSlot, setNewBlockedSlot] = useState<BlockedSlot>({
    startTime: "12:00",
    endTime: "13:00",
    label: "Lunch",
  });

  useEffect(() => {
    loadSettings();
    checkCalendarStatus();
    
    // Check if returning from OAuth callback
    const calendarParam = searchParams.get("calendar");
    const providerParam = searchParams.get("provider");
    
    if (calendarParam === "connected" || calendarParam === "callback_received") {
      if (providerParam === "outlook") {
        toast.success("Outlook Calendar connected!");
        setOutlookConnected(true);
        setOutlookConnecting(false);
      } else {
        toast.success("Google Calendar connected!");
        setCalendarConnected(true);
        setGoogleConnecting(false);
      }
      setActiveTab("calendar");
    } else if (searchParams.get("error")) {
      const errorMsg = searchParams.get("error");
      toast.error(`Failed to connect ${providerParam === "outlook" ? "Outlook" : "Google"} Calendar: ${errorMsg}`);
      setGoogleConnecting(false);
      setOutlookConnecting(false);
    }
  }, [searchParams]);

  async function loadSettings() {
    setLoading(true);
    const data = await getSettings();
    setSettings(data);
    setLoading(false);
  }

  async function checkCalendarStatus() {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3001";
      const response = await fetch(`${backendUrl}/api/calendar/status`);
      const data = await response.json();
      setCalendarConnected(data.connected);
      setOutlookConnected(data.outlookConnected || false);
    } catch (error) {
      console.error("Failed to check calendar status:", error);
      setCalendarConnected(false);
      setOutlookConnected(false);
    }
  }

  async function handleSave() {
    if (!settings) return;
    
    setSaving(true);
    const success = await updateSettings(settings);
    setSaving(false);
    
    if (success) {
      toast.success("Settings saved successfully!");
    } else {
      toast.error("Failed to save settings");
    }
  }

  function handleAddBlockedSlot() {
    if (!settings) return;
    
    // Validate times
    if (newBlockedSlot.startTime >= newBlockedSlot.endTime) {
      toast.error("Start time must be before end time");
      return;
    }

    const updated = {
      ...settings,
      blockedSlots: [
        ...settings.blockedSlots,
        {
          ...newBlockedSlot,
          _key: Date.now().toString(),
        },
      ],
    };
    setSettings(updated);
    setNewBlockedSlot({ startTime: "12:00", endTime: "13:00", label: "Lunch" });
  }

  function handleRemoveBlockedSlot(key: string) {
    if (!settings) return;
    
    const updated = {
      ...settings,
      blockedSlots: settings.blockedSlots.filter((s) => s._key !== key),
    };
    setSettings(updated);
  }

  async function handleConnectGoogle() {
    try {
      setGoogleConnecting(true);
      const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3001";
      const response = await fetch(`${backendUrl}/auth/google/init`);
      const data = await response.json();
      
      if (data.url) {
        // Redirect to Google OAuth
        window.location.href = data.url;
      } else {
        toast.error("Failed to start Google OAuth");
      }
    } catch (error) {
      console.error("Error connecting Google:", error);
      toast.error("Failed to connect Google Calendar");
    } finally {
      setGoogleConnecting(false);
    }
  }

  async function handleConnectOutlook() {
    try {
      setOutlookConnecting(true);
      const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3001";
      const response = await fetch(`${backendUrl}/auth/outlook/init`);
      const data = await response.json();
      
      if (data.url) {
        // Redirect to Microsoft OAuth
        window.location.href = data.url;
      } else {
        toast.error("Failed to start Outlook OAuth");
      }
    } catch (error) {
      console.error("Error connecting Outlook:", error);
      toast.error("Failed to connect Outlook Calendar");
    } finally {
      setOutlookConnecting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
        Loading settings...
      </div>
    );
  }

  if (!settings) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
        Error loading settings
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      {/* Header */}
      <div style={{
        background: "white",
        borderBottom: "1px solid #e5e5e5",
        padding: "24px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <SettingsIcon size={28} />
            <div>
              <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700 }}>Settings</h1>
              <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#666" }}>
                Manage your booking preferences and availability
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "24px" }}>
          {/* Sidebar Navigation */}
          <div>
            <div style={{
              background: "white",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}>
              {SETTINGS_GROUPS.map((group) => {
                const Icon = group.icon;
                const isActive = activeTab === group.id;
                return (
                  <button
                    key={group.id}
                    onClick={() => setActiveTab(group.id)}
                    style={{
                      width: "100%",
                      padding: "16px",
                      background: isActive ? "#222" : "white",
                      border: "none",
                      borderBottom: "1px solid #e5e5e5",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.background = "#f5f5f5";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.background = "white";
                      }
                    }}
                  >
                    <Icon
                      size={20}
                      style={{
                        color: isActive ? "white" : "#666",
                        marginTop: "2px",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ textAlign: "left" }}>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: isActive ? "white" : "#222",
                          marginBottom: "2px",
                        }}
                      >
                        {group.label}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: isActive ? "rgba(255,255,255,0.7)" : "#999",
                        }}
                      >
                        {group.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div>
            <div style={{
              background: "white",
              borderRadius: "8px",
              padding: "28px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}>
              {/* Working Hours Tab */}
              {activeTab === "hours" && (
                <div>
                  <h2 style={{ marginTop: 0, marginBottom: "24px", fontSize: "20px", fontWeight: 700 }}>
                    Working Hours
                  </h2>
                  <p style={{ marginTop: 0, marginBottom: "20px", fontSize: "14px", color: "#666" }}>
                    Set the daily time window when you're available for appointments
                  </p>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                    <div>
                      <label style={{
                        display: "block",
                        marginBottom: "8px",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#222",
                      }}>
                        Start Hour
                      </label>
                      <select
                        value={settings.workingHours.startHour}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            workingHours: {
                              ...settings.workingHours,
                              startHour: parseInt(e.target.value),
                            },
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #ddd",
                          borderRadius: "6px",
                          fontSize: "14px",
                          boxSizing: "border-box",
                          cursor: "pointer",
                        }}
                      >
                        {HOURS.map((h) => (
                          <option key={h} value={h}>
                            {String(h).padStart(2, "0")}:00
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label style={{
                        display: "block",
                        marginBottom: "8px",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#222",
                      }}>
                        End Hour
                      </label>
                      <select
                        value={settings.workingHours.endHour}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            workingHours: {
                              ...settings.workingHours,
                              endHour: parseInt(e.target.value),
                            },
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #ddd",
                          borderRadius: "6px",
                          fontSize: "14px",
                          boxSizing: "border-box",
                          cursor: "pointer",
                        }}
                      >
                        {HOURS.map((h) => (
                          <option key={h} value={h}>
                            {String(h).padStart(2, "0")}:00
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Working Days Tab */}
              {activeTab === "days" && (
                <div>
                  <h2 style={{ marginTop: 0, marginBottom: "24px", fontSize: "20px", fontWeight: 700 }}>
                    Working Days
                  </h2>
                  <p style={{ marginTop: 0, marginBottom: "20px", fontSize: "14px", color: "#666" }}>
                    Define which days of the week you operate
                  </p>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                    <div>
                      <label style={{
                        display: "block",
                        marginBottom: "8px",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#222",
                      }}>
                        Start Day
                      </label>
                      <select
                        value={settings.workingDays.startDay}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            workingDays: {
                              ...settings.workingDays,
                              startDay: parseInt(e.target.value),
                            },
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #ddd",
                          borderRadius: "6px",
                          fontSize: "14px",
                          boxSizing: "border-box",
                          cursor: "pointer",
                        }}
                      >
                        {DAYS.map((day, idx) => (
                          <option key={idx} value={idx}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label style={{
                        display: "block",
                        marginBottom: "8px",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#222",
                      }}>
                        End Day
                      </label>
                      <select
                        value={settings.workingDays.endDay}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            workingDays: {
                              ...settings.workingDays,
                              endDay: parseInt(e.target.value),
                            },
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #ddd",
                          borderRadius: "6px",
                          fontSize: "14px",
                          boxSizing: "border-box",
                          cursor: "pointer",
                        }}
                      >
                        {DAYS.map((day, idx) => (
                          <option key={idx} value={idx}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Blocked Time Slots Tab */}
              {activeTab === "blocked" && (
                <div>
                  <h2 style={{ marginTop: 0, marginBottom: "24px", fontSize: "20px", fontWeight: 700 }}>
                    Blocked Time Slots
                  </h2>
                  <p style={{ marginTop: 0, marginBottom: "20px", fontSize: "14px", color: "#666" }}>
                    Add breaks, lunch times, or any periods when you're unavailable
                  </p>
                  
                  {/* Existing Blocked Slots */}
                  {settings.blockedSlots.length > 0 && (
                    <div style={{ marginBottom: "28px" }}>
                      <h3 style={{ marginTop: 0, marginBottom: "12px", fontSize: "14px", fontWeight: 600, color: "#222" }}>
                        Current Blocked Slots ({settings.blockedSlots.length})
                      </h3>
                      <div style={{
                        background: "#fafafa",
                        borderRadius: "6px",
                        border: "1px solid #e5e5e5",
                        overflow: "hidden",
                      }}>
                        {settings.blockedSlots.map((slot) => (
                          <div
                            key={slot._key}
                            style={{
                              padding: "16px",
                              borderBottom: "1px solid #e5e5e5",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <div style={{ fontSize: "14px", fontWeight: 600, color: "#222" }}>
                                {slot.label}
                              </div>
                              <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
                                {slot.startTime} — {slot.endTime}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveBlockedSlot(slot._key!)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 12px",
                                fontSize: "13px",
                                background: "white",
                                border: "1px solid #dc2626",
                                borderRadius: "4px",
                                cursor: "pointer",
                                color: "#dc2626",
                                fontWeight: 500,
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background = "#fca5a5";
                                (e.currentTarget as HTMLElement).style.color = "white";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = "white";
                                (e.currentTarget as HTMLElement).style.color = "#dc2626";
                              }}
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add New Blocked Slot */}
                  <div style={{
                    padding: "20px",
                    background: "#fafafa",
                    borderRadius: "6px",
                    border: "1px solid #e5e5e5",
                  }}>
                    <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "14px", fontWeight: 600, color: "#222" }}>
                      Add New Blocked Slot
                    </h3>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.5fr", gap: "12px", marginBottom: "12px" }}>
                      <div>
                        <label style={{
                          display: "block",
                          marginBottom: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#222",
                        }}>
                          Label
                        </label>
                        <input
                          type="text"
                          value={newBlockedSlot.label}
                          onChange={(e) =>
                            setNewBlockedSlot({ ...newBlockedSlot, label: e.target.value })
                          }
                          placeholder="e.g., Lunch Break"
                          style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            fontSize: "13px",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{
                          display: "block",
                          marginBottom: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#222",
                        }}>
                          Start
                        </label>
                        <input
                          type="time"
                          value={newBlockedSlot.startTime}
                          onChange={(e) =>
                            setNewBlockedSlot({ ...newBlockedSlot, startTime: e.target.value })
                          }
                          style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            fontSize: "13px",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{
                          display: "block",
                          marginBottom: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#222",
                        }}>
                          End
                        </label>
                        <input
                          type="time"
                          value={newBlockedSlot.endTime}
                          onChange={(e) =>
                            setNewBlockedSlot({ ...newBlockedSlot, endTime: e.target.value })
                          }
                          style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            fontSize: "13px",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={handleAddBlockedSlot}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "10px 16px",
                        background: "#222",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: 600,
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "#404040";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "#222";
                      }}
                    >
                      <Plus size={14} />
                      Add Slot
                    </button>
                  </div>
                </div>
              )}

              {/* Calendar Integration Tab */}
              {activeTab === "calendar" && (
                <div>
                  <h2 style={{ marginTop: 0, marginBottom: "24px", fontSize: "20px", fontWeight: 700 }}>
                    Calendar Integration
                  </h2>
                  <p style={{ marginTop: 0, marginBottom: "24px", fontSize: "14px", color: "#666" }}>
                    Automatically sync your bookings with your calendar and block busy times
                  </p>

                  {/* Calendar Providers */}
                  <div style={{ marginBottom: "32px" }}>
                    <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "14px", fontWeight: 600, color: "#222" }}>
                      Connected Calendars
                    </h3>
                    <div style={{
                      background: "#fafafa",
                      borderRadius: "6px",
                      border: "1px solid #e5e5e5",
                      padding: "24px",
                      textAlign: "center",
                    }}>
                      {(calendarConnected || outlookConnected) ? (
                        <div style={{ fontSize: "14px", color: "#27ae60", marginBottom: "16px" }}>
                          {calendarConnected && "✅ Google Calendar connected successfully!"}
                          {calendarConnected && outlookConnected && <br />}
                          {outlookConnected && "✅ Outlook Calendar connected successfully!"}
                        </div>
                      ) : (
                        <div style={{ fontSize: "14px", color: "#999", marginBottom: "16px" }}>
                          No calendars connected yet
                        </div>
                      )}
                      <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                        <button
                          onClick={handleConnectGoogle}
                          disabled={googleConnecting}
                          style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px 16px",
                          background: googleConnecting ? "#999" : "#4285f4",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: googleConnecting ? "not-allowed" : "pointer",
                          fontSize: "13px",
                          fontWeight: 600,
                          transition: "opacity 0.2s",
                        }}
                        onMouseEnter={(e) => !googleConnecting && ((e.currentTarget as HTMLElement).style.opacity = "0.9")}
                        onMouseLeave={(e) => !googleConnecting && ((e.currentTarget as HTMLElement).style.opacity = "1")}
                        >
                          <span>{googleConnecting ? "⏳" : "📧"}</span>
                          {googleConnecting ? "Connecting..." : "Connect Google Calendar"}
                        </button>
                        <button
                          onClick={handleConnectOutlook}
                          disabled={outlookConnecting}
                          style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px 16px",
                          background: outlookConnecting ? "#999" : "#0078d4",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: outlookConnecting ? "not-allowed" : "pointer",
                          fontSize: "13px",
                          fontWeight: 600,
                          transition: "opacity 0.2s",
                        }}
                        onMouseEnter={(e) => !outlookConnecting && ((e.currentTarget as HTMLElement).style.opacity = "0.9")}
                        onMouseLeave={(e) => !outlookConnecting && ((e.currentTarget as HTMLElement).style.opacity = "1")}
                        >
                          <span>{outlookConnecting ? "⏳" : "📅"}</span>
                          {outlookConnecting ? "Connecting..." : "Connect Outlook Calendar"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sync Settings */}
                  <div style={{
                    padding: "20px",
                    background: "#fafafa",
                    borderRadius: "6px",
                    border: "1px solid #e5e5e5",
                  }}>
                    <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "14px", fontWeight: 600, color: "#222" }}>
                      Sync Preferences
                    </h3>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <label style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}>
                        <input
                          type="checkbox"
                          checked={settings.calendarSync?.autoCreateEvents ?? true}
                          onChange={(e) => setSettings({
                            ...settings,
                            calendarSync: {
                              ...settings.calendarSync,
                              autoCreateEvents: e.target.checked,
                              showBusyTimes: settings.calendarSync?.showBusyTimes ?? false,
                              syncCancellations: settings.calendarSync?.syncCancellations ?? true,
                            }
                          })}
                          style={{
                            width: "18px",
                            height: "18px",
                            cursor: "pointer",
                          }}
                        />
                        <span style={{ color: "#222", fontWeight: 500 }}>
                          Auto-create calendar events for new bookings
                        </span>
                      </label>

                      <label style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}>
                        <input
                          type="checkbox"
                          checked={settings.calendarSync?.showBusyTimes ?? false}
                          onChange={(e) => setSettings({
                            ...settings,
                            calendarSync: {
                              ...settings.calendarSync,
                              autoCreateEvents: settings.calendarSync?.autoCreateEvents ?? true,
                              showBusyTimes: e.target.checked,
                              syncCancellations: settings.calendarSync?.syncCancellations ?? true,
                            }
                          })}
                          style={{
                            width: "18px",
                            height: "18px",
                            cursor: "pointer",
                          }}
                        />
                        <span style={{ color: "#222", fontWeight: 500 }}>
                          Show busy times from connected calendars
                        </span>
                      </label>

                      <label style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}>
                        <input
                          type="checkbox"
                          checked={settings.calendarSync?.syncCancellations ?? true}
                          onChange={(e) => setSettings({
                            ...settings,
                            calendarSync: {
                              ...settings.calendarSync,
                              autoCreateEvents: settings.calendarSync?.autoCreateEvents ?? true,
                              showBusyTimes: settings.calendarSync?.showBusyTimes ?? false,
                              syncCancellations: e.target.checked,
                            }
                          })}
                          style={{
                            width: "18px",
                            height: "18px",
                            cursor: "pointer",
                          }}
                        />
                        <span style={{ color: "#222", fontWeight: 500 }}>
                          Send booking confirmation to calendar organizer
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div style={{
                    marginTop: "24px",
                    padding: "16px",
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "6px",
                    fontSize: "13px",
                    color: "#1e40af",
                  }}>
                    <strong>💡 Tip:</strong> Once you connect a calendar, all your bookings will be automatically added to it. You can also block times in your calendar to prevent booking conflicts.
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div style={{ marginTop: "28px", paddingTop: "24px", borderTop: "1px solid #e5e5e5" }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 24px",
                    background: saving ? "#999" : "#222",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: saving ? "not-allowed" : "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) {
                      (e.currentTarget as HTMLElement).style.background = "#404040";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saving) {
                      (e.currentTarget as HTMLElement).style.background = "#222";
                    }
                  }}
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save Settings"}
                </button>
                <p style={{
                  marginTop: "12px",
                  fontSize: "13px",
                  color: "#666",
                }}>
                  Changes are saved across all sections
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
