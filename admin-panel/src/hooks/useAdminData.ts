import { useState, useEffect, useCallback } from "react";

export type UseAdminDataResult<T> = {
  data: T | null;
  loading: boolean;
  error: string;
  reload: () => void;
};

/**
 * Generic hook for admin dashboard data: loading, error, reload.
 * Pass a fetch function that returns the data; it will run on mount and when reload() is called.
 */
export function useAdminData<T>(
  fetchFn: () => Promise<T>,
  deps: React.DependencyList = []
): UseAdminDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    fetchFn()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
