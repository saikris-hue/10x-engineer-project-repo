import { useCallback, useEffect, useState } from "react";

interface AsyncState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

const initialState = {
  data: null,
  error: null,
  isLoading: true,
};

export function useAsync<T>(request: () => Promise<T>) {
  const [state, setState] = useState<AsyncState<T>>(initialState);

  const run = useCallback(async () => {
    setState((current) => ({ ...current, isLoading: true, error: null }));

    try {
      const data = await request();
      setState({ data, error: null, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setState({ data: null, error: message, isLoading: false });
    }
  }, [request]);

  useEffect(() => {
    void run();
  }, [run]);

  return {
    ...state,
    reload: run,
  };
}
