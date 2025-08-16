import { useAsyncEffect } from '@/hooks/asyncEffect';
import { useJellyfin } from '@/hooks/jellyfin';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useState } from 'react';

export function useHome() {
    const { getRecentlyAddedMovies, getContinueWatchingItems } = useJellyfin(),
        [recentlyAddedMovies, setRecentlyAddedMovies] = useState<BaseItemDto[]>([]),
        [continueWatchingItems, setContinueWatchingItems] = useState<BaseItemDto[]>([]);

    useAsyncEffect(async () => {
        const result = await Promise.all([getRecentlyAddedMovies(), getContinueWatchingItems()]);
        setRecentlyAddedMovies(result[0]);
        setContinueWatchingItems(result[1]);
    }, []);

    return { recentlyAddedMovies, continueWatchingItems };
}
