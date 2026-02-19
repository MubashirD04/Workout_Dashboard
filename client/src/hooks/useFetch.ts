import { useState, useEffect, useCallback } from 'react';

interface FetchState<T> {
    data: T | null;
    loading: boolean;
    error: any;
}

export function useFetch<T>(fetchFn: () => Promise<T>, deps: any[] = []) {
    const [state, setState] = useState<FetchState<T>>({
        data: undefined as unknown as T,
        loading: true,
        error: null,
    });

    const execute = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true }));
        try {
            const data = await fetchFn();
            setState({ data, loading: false, error: null });
        } catch (error) {
            setState({ data: null, loading: false, error });
        }
    }, [fetchFn]);

    useEffect(() => {
        execute();
    }, deps);

    return { ...state, refresh: execute };
}
