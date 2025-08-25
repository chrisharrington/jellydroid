import { useAsyncEffect } from '@/hooks/asyncEffect';
import { useJellyfin } from '@/hooks/jellyfin';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useState } from 'react';

export function useHome() {
    const { getRecentlyAddedMovies, getRecentlyAddedEpisodes, getContinueWatchingItems } = useJellyfin(),
        [recentlyAddedMovies, setRecentlyAddedMovies] = useState<BaseItemDto[]>([]),
        [recentlyAddedEpisodes, setRecentlyAddedEpisodes] = useState<BaseItemDto[]>([]),
        [continueWatchingItems, setContinueWatchingItems] = useState<BaseItemDto[]>([]);

    useAsyncEffect(async () => {
        const result = await Promise.all([
            getRecentlyAddedMovies(),
            getRecentlyAddedEpisodes(),
            getContinueWatchingItems(),
        ]);
        setRecentlyAddedMovies(result[0]);
        setRecentlyAddedEpisodes(result[1]);
        setContinueWatchingItems(result[2]);
    }, []);

    return { recentlyAddedMovies, recentlyAddedEpisodes, continueWatchingItems };
}
