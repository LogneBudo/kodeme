import { format, isSameDay } from "date-fns";
import type { SlotStatus } from "../../hooks/useWeekSlots";
import { slotStateClassMap, slotStateDisplay } from "../../constants/slotStates";
import styles from "./WeekGrid.module.css";

const classNames = (
  ...classes: Array<string | false | null | undefined>
) => classes.filter(Boolean).join(" ");

type WeekGridProps = {
  weekDays: Date[];
  timeSlots: string[];
  getDayCounts: (day: Date) => { booked: number; blocked: number; unavailable: number };
  isDayFullyUnavailable: (day: Date) => boolean;
  isPastDay: (day: Date) => boolean;
  getSlotStatus: (date: Date, time: string) => SlotStatus;
  onToggleSlot: (date: Date, time: string) => void;
  onToggleDay: (date: Date) => void;
  pendingSlotKey?: string | null;
  pendingDayKey?: string | null;
};

function WeekGrid({
  weekDays,
  timeSlots,
  getDayCounts,
  isDayFullyUnavailable,
  isPastDay,
  getSlotStatus,
  onToggleSlot,
  onToggleDay,
  pendingSlotKey,
  pendingDayKey,
}: WeekGridProps) {

  return (
    <div className={styles.container}>
      <div className={styles.gridCard}>
        <div className={styles.tableScroll}>
          <table className={styles.gridTable}>
          <thead>
            <tr>
              <th className={styles.timeHeader}>
                Time
              </th>
              {weekDays.map((day) => {
                const isToday = isSameDay(day, new Date());
                const pastDay = isPastDay(day);
                const isDayUnavailable = isDayFullyUnavailable(day);
                const isDayPending = pendingDayKey === format(day, "yyyy-MM-dd");
                const counts = getDayCounts(day);
                const headerLabel = `${format(day, "EEE, MMM d")} — ${counts.booked} booked, ${counts.blocked} blocked, ${counts.unavailable} unavailable`;

                return (
                  <th
                    key={day.toISOString()}
                    className={classNames(styles.dayHeader, isToday && styles.dayHeaderToday)}
                    title={headerLabel}
                    aria-label={headerLabel}
                  >
                    <div className={styles.dayHeaderContent}>
                      <div className={styles.dayHeaderDow}>{format(day, "EEE")}</div>
                      <div className={styles.dayHeaderDate}>{format(day, "d")}</div>
                      {!pastDay && (
                        <button
                          onClick={() => onToggleDay(day)}
                          disabled={isDayPending}
                          className={classNames(
                            styles.dayToggle,
                            isDayUnavailable ? styles.dayToggleEnable : styles.dayToggleDisable,
                            isDayPending && styles.pending
                          )}
                        >
                            {isDayPending ? "…" : isDayUnavailable ? "Enable" : "Disable"}
                        </button>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((time) => (
              <tr key={time}>
                <td className={styles.timeCell}>
                  {time}
                </td>
                {weekDays.map((day) => {
                  const status = getSlotStatus(day, time);
                  const isDisabled = status.isPast || status.isBlocked || status.isCalendarBlocked || status.isBooked;
                  const slotKey = `${format(day, "yyyy-MM-dd")}-${time}`;
                  const isPending = pendingSlotKey === slotKey;
                  const statusMeta = slotStateDisplay[status.state];

                  return (
                    <td
                      key={`${day.toISOString()}-${time}`}
                      className={classNames(
                        styles.slotCell,
                        styles[slotStateClassMap[status.state] as keyof typeof styles],
                        isDisabled && styles.slotDisabled
                      )}
                    >
                      <button
                        onClick={() => !isDisabled && onToggleSlot(day, time)}
                        disabled={isDisabled || isPending}
                        className={classNames(styles.slotButton, isPending && styles.pending)}
                        title={`${format(day, "EEE, MMM d")} at ${time} — ${statusMeta.label}${isPending ? " (updating...)" : ""}`}
                        aria-label={`${format(day, "EEE, MMM d")} at ${time} — ${statusMeta.label}${isPending ? " updating" : ""}`}
                      >
                        {isPending ? "…" : statusMeta.icon}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

export default WeekGrid;
