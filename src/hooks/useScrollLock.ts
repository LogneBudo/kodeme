import { useEffect, useRef } from "react";

// Locks body scroll while `locked` is true, restoring the previous overflow value on cleanup.
export function useScrollLock(locked: boolean) {
  const originalOverflow = useRef<string | null>(null);

  useEffect(() => {
    const body = document?.body;
    if (!body) return;

    // Capture original overflow once
    if (originalOverflow.current === null) {
      const inline = body.style.overflow;
      originalOverflow.current = inline || getComputedStyle(body).overflow || "";
    }

    if (locked) {
      body.style.overflow = "hidden";
    } else {
      body.style.overflow = originalOverflow.current ?? "";
    }

    return () => {
      if (body && originalOverflow.current !== null) {
        body.style.overflow = originalOverflow.current;
      }
    };
  }, [locked]);
}
