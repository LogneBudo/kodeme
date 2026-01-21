import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/useAuth";

export interface UseFirestoreTenantQueryOptions {
  onError?: (error: Error) => void;
  skipQuery?: boolean; // Skip query if org/calendar not ready
}

export interface UseFirestoreTenantQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  orgId?: string;
  calendarId?: string;
}

/**
 * Custom hook for tenant-aware Firestore queries
 * 
 * Automatically injects orgId and calendarId from AuthContext into query functions.
 * This ensures all data fetching is properly scoped to the current organization and calendar.
 * 
 * Features:
 * - Automatically includes orgId and calendarId from auth context
 * - Handles loading and error states
 * - Toast notifications on errors
 * - Refetch capability
 * - Skips query if org/calendar not available (prevents errors during setup)
 * 
 * @template T - The data type to fetch
 * @param fetchFn - Async function that accepts (orgId, calendarId) and fetches data
 * @param deps - Optional dependency array (default: [])
 * @param options - Optional configuration (onError callback, skipQuery flag)
 * @returns Object with data, loading, error, refetch, orgId, calendarId
 * 
 * @example
 * const { data: slots, loading, refetch } = useFirestoreTenantQuery(
 *   (orgId, calendarId) => listTenantTimeSlots(orgId, calendarId),
 *   []
 * );
 */
export function useFirestoreTenantQuery<T>(
  fetchFn: (orgId: string, calendarId: string) => Promise<T>,
  deps?: React.DependencyList,
  options: UseFirestoreTenantQueryOptions = {}
): UseFirestoreTenantQueryResult<T> {
  const { orgId, calendarId } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    // Skip if org/calendar not available
    if (!orgId || !calendarId || options.skipQuery) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn(orgId, calendarId);
      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      toast.error(`Failed to fetch data: ${error.message}`);
      
      if (options.onError) {
        options.onError(error);
      }
    } finally {
      setLoading(false);
    }
  }, [orgId, calendarId, fetchFn, options]);

  useEffect(() => {
    // Trigger fetch when tenant context changes or explicit deps change.
    // Do NOT include fetchFn in deps to avoid refetch loops from inline functions.
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, calendarId, ...(deps || [])]);

  return {
    data,
    loading,
    error,
    refetch,
    orgId,
    calendarId,
  };
}
