import { useEffect } from 'react';

export function useAsyncEffect(callback: () => void | Promise<void>, dependencies: any[]) {
    useEffect(() => {
        (async () => {
            try {
                await callback();
            } catch (error) {
                console.error('Error in useAsyncEffect:', error);
            }
        })();
    }, dependencies);
}
