import React, { useMemo } from "react";
import styles from "./WorkingHoursSettings.module.css";

interface WorkingHoursSettingsProps {
  workingHours: { startTime: string; endTime: string };
  setWorkingHours: (hours: { startTime: string; endTime: string }) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

const WorkingHoursSettings: React.FC<WorkingHoursSettingsProps> = ({ workingHours, setWorkingHours }) => {
  // Detect if user's locale uses 12-hour format
  const uses12Hour = useMemo(() => {
    const testDate = new Date(2000, 0, 1, 13, 0);
    const formatted = testDate.toLocaleTimeString(undefined, { hour: 'numeric' });
    return formatted.includes('PM') || formatted.includes('AM');
  }, []);

  const parseTime = (time: string | undefined) => {
    if (!time || !time.includes(':')) {
      // Default to 09:00 if invalid
      return { hours: 9, minutes: 0 };
    }
    const [hours, minutes] = time.split(':').map(Number);
    return { hours: hours || 0, minutes: minutes || 0 };
  };

  const formatTime = (hours: number, minutes: number) => {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const formatTimeDisplay = (hours: number, minutes: number) => {
    if (uses12Hour) {
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${String(displayHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
    }
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  // Ensure we have valid time strings
  const safeStartTime = workingHours.startTime || "09:00";
  const safeEndTime = workingHours.endTime || "17:00";
  
  const startParsed = parseTime(safeStartTime);
  const endParsed = parseTime(safeEndTime);

  const handleStartHourChange = (hours: number) => {
    setWorkingHours({
      ...workingHours,
      startTime: formatTime(hours, startParsed.minutes)
    });
  };

  const handleStartMinuteChange = (minutes: number) => {
    setWorkingHours({
      ...workingHours,
      startTime: formatTime(startParsed.hours, minutes)
    });
  };

  const handleEndHourChange = (hours: number) => {
    setWorkingHours({
      ...workingHours,
      endTime: formatTime(hours, endParsed.minutes)
    });
  };

  const handleEndMinuteChange = (minutes: number) => {
    setWorkingHours({
      ...workingHours,
      endTime: formatTime(endParsed.hours, minutes)
    });
  };

  return (
    <div>
      <h2 className={styles.title}>Working Hours</h2>
      <p className={styles.description}>
        Set the daily time window when you're available for appointments
      </p>
      
      <div className={styles.timePickersGrid}>
        {/* Start Time */}
        <div>
          <label className={styles.label}>Start Time of Day</label>
          <div className={styles.timePickerContainer}>
            <div className={styles.timeDisplay}>
              <span className={styles.timeValue} data-testid="start-time-display">
                {formatTimeDisplay(startParsed.hours, startParsed.minutes)}
              </span>
            </div>
            <div className={styles.selectGroup}>
              <select
                value={startParsed.hours}
                onChange={e => handleStartHourChange(parseInt(e.target.value))}
                className={styles.select}
                aria-label="Start hour"
                data-testid="start-hour-select"
              >
                {HOURS.map(h => (
                  <option key={h} value={h}>
                    {uses12Hour ? (h === 0 ? '12' : h > 12 ? String(h - 12).padStart(2, '0') : String(h).padStart(2, '0')) : String(h).padStart(2, '0')}
                  </option>
                ))}
              </select>
              <span className={styles.separator}>:</span>
              <select
                value={startParsed.minutes}
                onChange={e => handleStartMinuteChange(parseInt(e.target.value))}
                className={styles.select}
                aria-label="Start minute"
                data-testid="start-minute-select"
              >
                {MINUTES.map(m => (
                  <option key={m} value={m}>
                    {String(m).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* End Time */}
        <div>
          <label className={styles.label}>End Time of Day</label>
          <div className={styles.timePickerContainer}>
            <div className={styles.timeDisplay}>
              <span className={styles.timeValue} data-testid="end-time-display">
                {formatTimeDisplay(endParsed.hours, endParsed.minutes)}
              </span>
            </div>
            <div className={styles.selectGroup}>
              <select
                value={endParsed.hours}
                onChange={e => handleEndHourChange(parseInt(e.target.value))}
                className={styles.select}
                aria-label="End hour"
                data-testid="end-hour-select"
              >
                {HOURS.map(h => (
                  <option key={h} value={h}>
                    {uses12Hour ? (h === 0 ? '12' : h > 12 ? String(h - 12).padStart(2, '0') : String(h).padStart(2, '0')) : String(h).padStart(2, '0')}
                  </option>
                ))}
              </select>
              <span className={styles.separator}>:</span>
              <select
                value={endParsed.minutes}
                onChange={e => handleEndMinuteChange(parseInt(e.target.value))}
                className={styles.select}
                aria-label="End minute"
                data-testid="end-minute-select"
              >
                {MINUTES.map(m => (
                  <option key={m} value={m}>
                    {String(m).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkingHoursSettings;
