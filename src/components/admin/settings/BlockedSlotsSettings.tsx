import React from "react";
import { Plus, Trash2, Info } from "lucide-react";
import styles from "./BlockedSlotsSettings.module.css";

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

const BlockedSlotsSettings: React.FC<BlockedSlotsSettingsProps> = ({ blockedSlots, newBlockedSlot, setNewBlockedSlot, handleAddBlockedSlot, handleRemoveBlockedSlot }) => {
  // Parse HH:mm to {hour, minute}
  const parseTime = (time: string) => {
    const [h, m] = time.split(":");
    return { hour: h || "12", minute: m || "00" };
  };

  // Build HH:mm from {hour, minute}
  const buildTime = (hour: string, minute: string) => `${hour}:${minute}`;

  const startParts = parseTime(newBlockedSlot.startTime);
  const endParts = parseTime(newBlockedSlot.endTime);

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = ["00", "15", "30"];

  return (
  <div className={styles.container} data-testid="blocked-slots-container">
    <h2 className={styles.header}>Blocked Time Slots</h2>
    <p className={styles.description}>Add breaks or unavailable times to prevent bookings during those periods.</p>

    {/* Display */}
    <div className={styles.display} data-testid="blocked-slots-display">
      <p className={styles.displayText}>{newBlockedSlot.label || "New Block"}</p>
      <p className={styles.displaySubtext}>
        {(newBlockedSlot.startTime || "--:--") + " - " + (newBlockedSlot.endTime || "--:--")} • Every day
      </p>
    </div>

    {/* Form - inline with Add Block button */}
    <div className={styles.formRow}>
      <div className={styles.timeGroup}>
        <label className={styles.label}>Start</label>
        <div className={styles.timeSelects}>
          <select
            value={startParts.hour}
            onChange={e => setNewBlockedSlot({ ...newBlockedSlot, startTime: buildTime(e.target.value, startParts.minute) })}
            className={styles.select}
            data-testid="blocked-start-hour"
          >
            {hours.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <span className={styles.timeSeparator}>:</span>
          <select
            value={startParts.minute}
            onChange={e => setNewBlockedSlot({ ...newBlockedSlot, startTime: buildTime(startParts.hour, e.target.value) })}
            className={styles.select}
            data-testid="blocked-start-minute"
          >
            {minutes.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <div className={styles.timeGroup}>
        <label className={styles.label}>End</label>
        <div className={styles.timeSelects}>
          <select
            value={endParts.hour}
            onChange={e => setNewBlockedSlot({ ...newBlockedSlot, endTime: buildTime(e.target.value, endParts.minute) })}
            className={styles.select}
            data-testid="blocked-end-hour"
          >
            {hours.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <span className={styles.timeSeparator}>:</span>
          <select
            value={endParts.minute}
            onChange={e => setNewBlockedSlot({ ...newBlockedSlot, endTime: buildTime(endParts.hour, e.target.value) })}
            className={styles.select}
            data-testid="blocked-end-minute"
          >
            {minutes.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <div className={styles.labelGroup}>
        <label className={styles.label}>Label</label>
        <input
          type="text"
          value={newBlockedSlot.label}
          onChange={e => setNewBlockedSlot({ ...newBlockedSlot, label: e.target.value })}
          placeholder="e.g. Lunch"
          className={styles.input}
          data-testid="blocked-label"
        />
      </div>
      <div className={styles.buttonGroup}>
        <button
          type="button"
          onClick={handleAddBlockedSlot}
          className={styles.addButton}
          data-testid="add-blocked-slot"
        >
          <Plus size={16} /> Add Block
        </button>
      </div>
    </div>

    {/* Info */}
    <div className={styles.info}>
      <Info size={16} className={styles.infoIcon} />
      <div>
        These blocked times apply every day. Use one-off unavailable slots for single-date exceptions.
      </div>
    </div>

    {/* List */}
    <ul className={styles.list}>
      {blockedSlots.map(slot => (
        <li key={slot._key} className={styles.listItem} data-testid={`blocked-item-${slot._key}`}>
          <div className={styles.itemMain}>
            <span className={styles.itemLabel}>{slot.label}</span>
            <span className={styles.itemTime}>{slot.startTime} - {slot.endTime}</span>
            <span className={styles.itemScope}>Every day</span>
          </div>
          <button
            type="button"
            onClick={() => handleRemoveBlockedSlot(slot._key)}
            className={styles.removeButton}
            data-testid={`remove-blocked-${slot._key}`}
          >
            <Trash2 size={16} /> Remove
          </button>
        </li>
      ))}
      {blockedSlots.length === 0 && (
        <li className={styles.empty} data-testid="blocked-empty">No blocked slots</li>
      )}
    </ul>
  </div>
  );
};

export default BlockedSlotsSettings;
