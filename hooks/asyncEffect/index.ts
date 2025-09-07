import { useEffect } from 'react';

export function useAsyncEffect(
    callback: () => void | Promise<void> | (() => void) | (() => Promise<void>),
    dependencies: any[]
) {
    useEffect(() => {
        (async () => {
            try {
                return await callback();
            } catch (error) {
                // Silently handle errors in async effects
            }
        })();
    }, dependencies);
}
