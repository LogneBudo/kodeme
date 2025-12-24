import { useState, useEffect } from "react";
import { getSettings, updateSettings, type Settings, type BlockedSlot } from "../api/firebaseApi";
import { Settings as SettingsIcon, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newBlockedSlot, setNewBlockedSlot] = useState<BlockedSlot>({
    startTime: "12:00",
    endTime: "13:00",
    label: "Lunch",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    const data = await getSettings();
    setSettings(data);
    setLoading(false);
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
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
        <SettingsIcon size={28} />
        <h1 style={{ margin: 0, fontSize: "24px" }}>Settings</h1>
      </div>

      {/* Working Hours */}
      <div style={{
        background: "white",
        padding: "24px",
        borderRadius: "8px",
        marginBottom: "24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}>
        <h2 style={{ marginTop: 0, marginBottom: "20px", fontSize: "18px" }}>Working Hours</h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "20px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
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
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
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
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
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
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
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

      {/* Working Days */}
      <div style={{
        background: "white",
        padding: "24px",
        borderRadius: "8px",
        marginBottom: "24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}>
        <h2 style={{ marginTop: 0, marginBottom: "20px", fontSize: "18px" }}>Working Days</h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "20px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
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
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
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
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
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
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
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

      {/* Blocked Time Slots */}
      <div style={{
        background: "white",
        padding: "24px",
        borderRadius: "8px",
        marginBottom: "24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}>
        <h2 style={{ marginTop: 0, marginBottom: "20px", fontSize: "18px" }}>Blocked Time Slots</h2>
        
        {settings.blockedSlots.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <div style={{
              background: "#f5f5f5",
              borderRadius: "6px",
              overflow: "hidden",
            }}>
              {settings.blockedSlots.map((slot) => (
                <div
                  key={slot._key}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #ddd",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 500 }}>{slot.label}</div>
                    <div style={{ fontSize: "13px", color: "#666" }}>
                      {slot.startTime} - {slot.endTime}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveBlockedSlot(slot._key!)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "6px 12px",
                      fontSize: "13px",
                      background: "white",
                      border: "1px solid #dc2626",
                      borderRadius: "4px",
                      cursor: "pointer",
                      color: "#dc2626",
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

        <div style={{
          padding: "16px",
          background: "#f9f9f9",
          borderRadius: "6px",
          border: "1px solid #ddd",
        }}>
          <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "14px" }}>Add New Blocked Slot</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: 500 }}>
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
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "13px",
                  boxSizing: "border-box",
                }}
              />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: 500 }}>
                Start Time
              </label>
              <input
                type="time"
                value={newBlockedSlot.startTime}
                onChange={(e) =>
                  setNewBlockedSlot({ ...newBlockedSlot, startTime: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "13px",
                  boxSizing: "border-box",
                }}
              />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: 500 }}>
                End Time
              </label>
              <input
                type="time"
                value={newBlockedSlot.endTime}
                onChange={(e) =>
                  setNewBlockedSlot({ ...newBlockedSlot, endTime: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "13px",
                  boxSizing: "border-box",
                }}
              />
            </div>
            
            <button
              onClick={handleAddBlockedSlot}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "8px 12px",
                background: "#222",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px",
                alignSelf: "flex-end",
              }}
            >
              <Plus size={14} />
              Add
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          padding: "12px 24px",
          background: saving ? "#666" : "#222",
          color: "white",
          border: "none",
          borderRadius: "6px",
          fontSize: "16px",
          fontWeight: 600,
          cursor: saving ? "not-allowed" : "pointer",
        }}
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
