import React from "react";

interface WorkingDaysSettingsProps {
  workingDays: { startDay: number; endDay: number };
  setWorkingDays: (days: { startDay: number; endDay: number }) => void;
  DAYS: string[];
}

const WorkingDaysSettings: React.FC<WorkingDaysSettingsProps> = ({ workingDays, setWorkingDays, DAYS }) => (
  <div>
    <h2 style={{ marginTop: 0, marginBottom: "24px", fontSize: "20px", fontWeight: 700 }}>
      Working Days
    </h2>
    <p style={{ marginTop: 0, marginBottom: "20px", fontSize: "14px", color: "#666" }}>
      Select the days of the week you are available for appointments
    </p>
    <div style={{ display: "flex", gap: "16px" }}>
      <div>
        <label style={{ fontSize: "14px", fontWeight: 600, color: "#222" }}>Start Day</label>
        <select
          value={workingDays.startDay}
          onChange={e => setWorkingDays({ ...workingDays, startDay: parseInt(e.target.value) })}
          style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", cursor: "pointer" }}
        >
          {DAYS.map((d, i) => (
            <option key={d} value={i}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label style={{ fontSize: "14px", fontWeight: 600, color: "#222" }}>End Day</label>
        <select
          value={workingDays.endDay}
          onChange={e => setWorkingDays({ ...workingDays, endDay: parseInt(e.target.value) })}
          style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", cursor: "pointer" }}
        >
          {DAYS.map((d, i) => (
            <option key={d} value={i}>
              {d}
            </option>
          ))}
        </select>
      </div>
    </div>
  </div>
);

export default WorkingDaysSettings;
