import { useEffect } from 'react';

export async function useAsyncEffect(callback: () => void | Promise<void>, dependencies: any[]) {
    useEffect(() => {
        (async () => {
            await callback();
        })();
    }, dependencies);
}
