import React from "react";
import styles from "./WorkingHoursSettings.module.css";

interface TimePickerProps {
  label: string;
  hours: number;
  minutes: number;
  onHourChange: (h: number) => void;
  onMinuteChange: (m: number) => void;
  uses12Hour: boolean;
  display: string;
  hourOptions: number[];
  minuteOptions: number[];
}

const TimePicker: React.FC<TimePickerProps> = ({ label, hours, minutes, onHourChange, onMinuteChange, uses12Hour, display, hourOptions, minuteOptions }) => (
  <div>
    <label className={styles.label}>{label}</label>
    <div className={styles.timePickerContainer}>
      <div className={styles.timeDisplay}>
        <span className={styles.timeValue}>{display}</span>
      </div>
      <div className={styles.selectGroup}>
        <select
          value={hours}
          onChange={e => onHourChange(parseInt(e.target.value))}
          className={styles.select}
          aria-label={label + " hour"}
        >
          {hourOptions.map(h => (
            <option key={h} value={h}>
              {uses12Hour ? (h === 0 ? '12' : h > 12 ? String(h - 12).padStart(2, '0') : String(h).padStart(2, '0')) : String(h).padStart(2, '0')}
            </option>
          ))}
        </select>
        <span className={styles.separator}>:</span>
        <select
          value={minutes}
          onChange={e => onMinuteChange(parseInt(e.target.value))}
          className={styles.select}
          aria-label={label + " minute"}
        >
          {minuteOptions.map(m => (
            <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
          ))}
        </select>
      </div>
    </div>
  </div>
);

export default TimePicker;
