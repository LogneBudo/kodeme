import React from "react";
import { Plus, Trash2 } from "lucide-react";

interface BlockedSlot {
  _key: string;
  startTime: string;
  endTime: string;
  label: string;
}

interface BlockedSlotsSettingsProps {
  blockedSlots: BlockedSlot[];
  newBlockedSlot: BlockedSlot;
  setNewBlockedSlot: (slot: BlockedSlot) => void;
  handleAddBlockedSlot: () => void;
  handleRemoveBlockedSlot: (key: string) => void;
}

const BlockedSlotsSettings: React.FC<BlockedSlotsSettingsProps> = ({ blockedSlots, newBlockedSlot, setNewBlockedSlot, handleAddBlockedSlot, handleRemoveBlockedSlot }) => (
  <div>
    <h2 style={{ marginTop: 0, marginBottom: "24px", fontSize: "20px", fontWeight: 700 }}>
      Blocked Time Slots
    </h2>
    <p style={{ marginTop: 0, marginBottom: "20px", fontSize: "14px", color: "#666" }}>
      Add breaks or unavailable times to prevent bookings during those periods
    </p>
    <div style={{ marginBottom: "20px", display: "flex", gap: "12px", alignItems: "center" }}>
      <input
        type="time"
        value={newBlockedSlot.startTime}
        onChange={e => setNewBlockedSlot({ ...newBlockedSlot, startTime: e.target.value })}
        style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
      />
      <span style={{ fontWeight: 600 }}>to</span>
      <input
        type="time"
        value={newBlockedSlot.endTime}
        onChange={e => setNewBlockedSlot({ ...newBlockedSlot, endTime: e.target.value })}
        style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
      />
      <input
        type="text"
        value={newBlockedSlot.label}
        onChange={e => setNewBlockedSlot({ ...newBlockedSlot, label: e.target.value })}
        placeholder="Label (e.g. Lunch)"
        style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", width: "160px" }}
      />
      <button
        onClick={handleAddBlockedSlot}
        style={{ background: "#222", color: "white", border: "none", borderRadius: "6px", padding: "8px 16px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
      >
        <Plus size={16} /> Add
      </button>
    </div>
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {blockedSlots.map(slot => (
        <li key={slot._key} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
          <span style={{ fontWeight: 500 }}>{slot.label}:</span>
          <span>{slot.startTime} - {slot.endTime}</span>
          <button
            onClick={() => handleRemoveBlockedSlot(slot._key)}
            style={{ background: "none", border: "none", color: "#e11d48", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
          >
            <Trash2 size={16} /> Remove
          </button>
        </li>
      ))}
    </ul>
  </div>
);

export default BlockedSlotsSettings;
