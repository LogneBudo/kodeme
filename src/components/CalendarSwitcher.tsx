import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { listTenantCalendars, getCalendarUnsafe } from "../api/firebaseApi/calendars";
import type { Calendar } from "../types/branch";
import styles from "./CalendarSwitcher.module.css";

export default function CalendarSwitcher() {
  const { orgId, calendarId, switchCalendar, organization } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [currentCalendar, setCurrentCalendar] = useState<Calendar | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch calendars for this organization
  useEffect(() => {
    if (!orgId) {
      // Defer setLoading to avoid cascading renders
      setTimeout(() => setLoading(false), 0);
      return;
    }

    setTimeout(() => setLoading(true), 0);
    listTenantCalendars(orgId)
      .then(async (cals) => {
        setCalendars(cals);
        // Find and set current calendar
        let current = cals.find((c) => c.id === calendarId);
        
        // Fallback: if calendarId set but not in list, try direct fetch
        if (!current && calendarId) {
          const fetched = await getCalendarUnsafe(calendarId);
          if (fetched) {
            current = fetched;
          }
        }
        
        setCurrentCalendar(current || null);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading calendars:", error);
        setLoading(false);
      });
  }, [orgId, calendarId]);

  // Don't show switcher if there's only one calendar
  if (calendars.length <= 1) {
    const displayName = loading
      ? "Loading..."
      : currentCalendar?.name || organization?.name || "No Calendar";
    return (
      <div className={styles.container}>
        <div className={styles.singleCalendar}>
          {displayName}
        </div>
      </div>
    );
  }

  const handleSelectCalendar = async (newCalendarId: string) => {
    await switchCalendar(newCalendarId);
    setIsOpen(false);
  };

  return (
    <div className={styles.container}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.label}>{currentCalendar?.name || "Select Calendar"}</span>
        <ChevronDown
          size={16}
          className={`${styles.icon} ${isOpen ? styles.iconOpen : ""}`}
        />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>Select Calendar</div>
          <div className={styles.items}>
            {calendars.map((cal) => (
              <button
                key={cal.id}
                className={`${styles.item} ${
                  cal.id === calendarId ? styles.active : ""
                }`}
                onClick={() => handleSelectCalendar(cal.id)}
              >
                <div className={styles.itemName}>{cal.name}</div>
                {cal.address && (
                  <div className={styles.itemAddress}>{cal.address}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
