import React from "react";

interface WorkingHoursSettingsProps {
  workingHours: { startHour: number; endHour: number };
  setWorkingHours: (hours: { startHour: number; endHour: number }) => void;
  HOURS: number[];
}

const WorkingHoursSettings: React.FC<WorkingHoursSettingsProps> = ({ workingHours, setWorkingHours, HOURS }) => (
  <div>
    <h2 style={{ marginTop: 0, marginBottom: "24px", fontSize: "20px", fontWeight: 700 }}>
      Working Hours
    </h2>
    <p style={{ marginTop: 0, marginBottom: "20px", fontSize: "14px", color: "#666" }}>
      Set the daily time window when you're available for appointments
    </p>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
      <div>
        <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "#222" }}>
          Start Hour
        </label>
        <select
          value={workingHours.startHour}
          onChange={e => setWorkingHours({ ...workingHours, startHour: parseInt(e.target.value) })}
          style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", cursor: "pointer" }}
        >
          {HOURS.map(h => (
            <option key={h} value={h}>
              {String(h).padStart(2, "0")}:00
            </option>
          ))}
        </select>
      </div>
      <div>
        <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: "#222" }}>
          End Hour
        </label>
        <select
          value={workingHours.endHour}
          onChange={e => setWorkingHours({ ...workingHours, endHour: parseInt(e.target.value) })}
          style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", cursor: "pointer" }}
        >
          {HOURS.map(h => (
            <option key={h} value={h}>
              {String(h).padStart(2, "0")}:00
            </option>
          ))}
        </select>
      </div>
    </div>
  </div>
);

export default WorkingHoursSettings;
