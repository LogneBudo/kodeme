import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import styles from "./WeekNavigator.module.css";

type WeekNavigatorProps = {
  currentDate: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  canGoPrevious: boolean;
};

export default function WeekNavigator({
  currentDate,
  onPrevWeek,
  onNextWeek,
  onToday,
  canGoPrevious,
}: WeekNavigatorProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
      </h2>
      
      <div className={styles.buttonRow}>
        <button 
          onClick={onPrevWeek} 
          className={`${styles.iconButton} ${!canGoPrevious ? styles.disabled : ""}`}
          disabled={!canGoPrevious}
          aria-label="Previous week"
        >
          <ChevronLeft size={20} color="#0f172a" />
        </button>

        <button 
          onClick={onNextWeek} 
          className={styles.iconButton}
          aria-label="Next week"
        >
          <ChevronRight size={20} color="#0f172a" />
        </button>

        <button 
          onClick={onToday} 
          className={styles.textButton}
          aria-label="Go to current week"
        >
          <Calendar size={16} color="#0f172a" />
          Today
        </button>
      </div>
    </div>
  );
}
