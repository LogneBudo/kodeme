import React, { useMemo } from "react";
import styles from "./WorkingHoursSettings.module.css";
import WorkingHoursClock3 from "./WorkingHoursClock3";
import TimePicker from "./TimePicker";

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
        {/* Dynamic Clock Visualization */}
        <div style={{ gridColumn: '1 / span 2', display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <WorkingHoursClock3
            startTime={safeStartTime}
            endTime={safeEndTime}
            onChange={(start, end) => setWorkingHours({ ...workingHours, startTime: start, endTime: end })}
          />
        </div>
        <TimePicker
          label="Start Time of Day"
          hours={startParsed.hours}
          minutes={startParsed.minutes}
          onHourChange={handleStartHourChange}
          onMinuteChange={handleStartMinuteChange}
          uses12Hour={uses12Hour}
          display={formatTimeDisplay(startParsed.hours, startParsed.minutes)}
          hourOptions={HOURS}
          minuteOptions={MINUTES}
        />
        <TimePicker
          label="End Time of Day"
          hours={endParsed.hours}
          minutes={endParsed.minutes}
          onHourChange={handleEndHourChange}
          onMinuteChange={handleEndMinuteChange}
          uses12Hour={uses12Hour}
          display={formatTimeDisplay(endParsed.hours, endParsed.minutes)}
          hourOptions={HOURS}
          minuteOptions={MINUTES}
        />
      </div>
    </div>
  );
};

export default WorkingHoursSettings;
