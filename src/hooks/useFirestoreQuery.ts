import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export interface UseFirestoreQueryOptions {
  onError?: (error: Error) => void;
}

export interface UseFirestoreQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for Firestore data fetching with loading and error handling
 * 
 * Consolidates the common pattern:
 * - useState for data/loading/error
 * - useEffect for fetch on mount
 * - Try/catch with toast notifications
 * - Refetch capability
 * 
 * @template T - The data type to fetch
 * @param fetchFn - Async function that fetches the data
 * @param deps - Optional dependency array (default: [])
 * @param options - Optional configuration (onError callback, etc.)
 * @returns Object with data, loading, error, and refetch
 * 
 * @example
 * const { data: appointments, loading, refetch } = useFirestoreQuery(
 *   () => listAppointments(),
 *   []
 * );
 */
export function useFirestoreQuery<T>(
  fetchFn: () => Promise<T>,
  deps?: React.DependencyList,
  options: UseFirestoreQueryOptions = {}
): UseFirestoreQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      if (options.onError) {
        options.onError(error);
      } else {
        toast.error("Failed to load data");
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFn, options]);

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch };
}
