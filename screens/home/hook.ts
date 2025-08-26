import { useToast } from '@/components/toast';
import { useAsyncEffect } from '@/hooks/asyncEffect';
import { useJellyfin } from '@/hooks/jellyfin';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useState } from 'react';

export function useHome() {
    const { getRecentlyAddedMovies, getRecentlyAddedEpisodes, getContinueWatchingItems } = useJellyfin(),
        toast = useToast(),
        [isBusy, setBusy] = useState<boolean>(false),
        [recentlyAddedMovies, setRecentlyAddedMovies] = useState<BaseItemDto[]>([]),
        [recentlyAddedEpisodes, setRecentlyAddedEpisodes] = useState<BaseItemDto[]>([]),
        [continueWatchingItems, setContinueWatchingItems] = useState<BaseItemDto[]>([]);

    useAsyncEffect(async () => {
        try {
            setBusy(true);

            const result = await Promise.all([
                getRecentlyAddedMovies(),
                getRecentlyAddedEpisodes(),
                getContinueWatchingItems(),
            ]);
            setRecentlyAddedMovies(result[0]);
            setRecentlyAddedEpisodes(result[1]);
            setContinueWatchingItems(result[2]);
        } catch (error) {
            // TODO: Redirect to error view.
            toast.error('Failed to load home screen data.', error);
        } finally {
            setBusy(false);
        }
    }, []);

    return { isBusy, recentlyAddedMovies, recentlyAddedEpisodes, continueWatchingItems };
}
