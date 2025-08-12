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
                console.error('Error in useAsyncEffect:', error);
            }
        })();
    }, dependencies);
}
