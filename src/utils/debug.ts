// Debug utility with flag control
const DEBUG = import.meta.env.DEV && import.meta.env.VITE_DEBUG === 'true';

export const debug = {
  log: (...args: any[]) => {
    if (DEBUG) console.log(...args);
  },
  warn: (...args: any[]) => {
    if (DEBUG) console.warn(...args);
  },
  error: (...args: any[]) => {
    // Always show errors
    console.error(...args);
  },
  info: (...args: any[]) => {
    if (DEBUG) console.info(...args);
  }
};
