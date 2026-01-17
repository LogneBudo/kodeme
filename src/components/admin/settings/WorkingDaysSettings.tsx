import React, { useMemo } from "react";
import { Info } from "lucide-react";
import styles from "./WorkingDaysSettings.module.css";

interface WorkingDaysSettingsProps {
  workingDays: number[]; // array of day indexes 0-6
  setWorkingDays: (days: number[]) => void;
  DAYS: string[];
}

const WorkingDaysSettings: React.FC<WorkingDaysSettingsProps> = ({ workingDays, setWorkingDays, DAYS }) => {
  const selectedDays = useMemo(() => new Set<number>(workingDays), [workingDays]);

  // Format display text
  const displayText = useMemo(() => {
    const days = Array.from(selectedDays).sort((a, b) => a - b);
    if (days.length === 0) return "No days selected";
    if (days.length === 7) return "Every day";
    if (days.length === 1) return DAYS[days[0]];
    
    // Check for continuous range (non-wrapping)
    const isContinuous = days.every((day, index) => {
      if (index === 0) return true;
      return day === days[index - 1] + 1;
    });

    if (isContinuous) {
      return `${DAYS[days[0]]} - ${DAYS[days[days.length - 1]]}`;
    }

    // Non-continuous
    return days.map(d => DAYS[d].substring(0, 3)).join(", ");
  }, [selectedDays, DAYS]);

  const daysCount = selectedDays.size;

  // Toggle a specific day
  const toggleDay = (dayIndex: number) => {
    const days = Array.from(selectedDays);

    if (selectedDays.has(dayIndex)) {
      const newDays = days.filter(d => d !== dayIndex);
      if (!newDays.length) return; // must keep at least one day
      setWorkingDays(newDays.sort((a, b) => a - b));
    } else {
      const newDays = [...days, dayIndex].sort((a, b) => a - b);
      setWorkingDays(newDays);
    }
  };

  // Quick select presets
  const quickSelectWeekdays = () => {
    setWorkingDays([1, 2, 3, 4, 5]); // Mon-Fri
  };

  const quickSelectWeekend = () => {
    setWorkingDays([0, 6]); // Sat-Sun
  };

  const quickSelectEveryDay = () => {
    setWorkingDays([0, 1, 2, 3, 4, 5, 6]); // Sun-Sat
  };

  return (
    <div className={styles.container} data-testid="working-days-container">
      <h2 className={styles.header}>Working Days</h2>
      <p className={styles.description}>
        Select the days of the week you are available for appointments. Click individual days or use quick select buttons.
      </p>

      {/* Display current selection */}
      <div className={styles.daysDisplay} data-testid="days-display">
        <p className={styles.daysDisplayText}>{displayText}</p>
        <p className={styles.daysDisplaySubtext}>
          {daysCount} {daysCount === 1 ? 'day' : 'days'} selected
        </p>
      </div>

      {/* Quick select buttons */}
      <div className={styles.quickSelect}>
        <span className={styles.quickSelectLabel}>Quick select:</span>
        <button
          type="button"
          className={styles.quickSelectButton}
          onClick={quickSelectWeekdays}
          data-testid="quick-select-weekdays"
        >
          Weekdays (Mon-Fri)
        </button>
        <button
          type="button"
          className={styles.quickSelectButton}
          onClick={quickSelectWeekend}
          data-testid="quick-select-weekend"
        >
          Weekend (Sat-Sun)
        </button>
        <button
          type="button"
          className={styles.quickSelectButton}
          onClick={quickSelectEveryDay}
          data-testid="quick-select-everyday"
        >
          Every Day
        </button>
      </div>

      {/* Interactive day grid */}
      <div className={styles.daysGrid}>
        {DAYS.map((day, index) => (
          <button
            key={day}
            type="button"
            className={`${styles.dayButton} ${selectedDays.has(index) ? styles.selected : ''}`}
            onClick={() => toggleDay(index)}
            data-testid={`day-button-${index}`}
            aria-label={`Toggle ${day}`}
            aria-pressed={selectedDays.has(index)}
          >
            <div>{day.substring(0, 3)}</div>
            <span className={styles.dayLabel}>{day.substring(3)}</span>
          </button>
        ))}
      </div>

      {/* Info message */}
      <div className={styles.info}>
        <Info size={16} className={styles.infoIcon} />
        <div>
          <strong>Note:</strong> The system will automatically create time slots only for the selected days. 
          Days not selected will not be available for booking.
        </div>
      </div>
    </div>
  );
};

export default WorkingDaysSettings;
