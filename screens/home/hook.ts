import { useToast } from '@/components/toast';
import { useJellyfin } from '@/hooks/jellyfin';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';

export function useHome() {
    const { getRecentlyAddedMovies, getRecentlyAddedEpisodes, getContinueWatchingItems } = useJellyfin(),
        toast = useToast(),
        [isBusy, setBusy] = useState<boolean>(false),
        [recentlyAddedMovies, setRecentlyAddedMovies] = useState<BaseItemDto[]>([]),
        [recentlyAddedEpisodes, setRecentlyAddedEpisodes] = useState<BaseItemDto[]>([]),
        [continueWatchingItems, setContinueWatchingItems] = useState<BaseItemDto[]>([]);

    const loadData = useCallback(() => {
        (async () => {
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
            } catch (error: any) {
                // Handle authentication errors gracefully.
                if (error?.response?.status === 401 || error?.status === 401) {
                    toast.error('Authentication failed. Please check your credentials.');
                } else {
                    toast.error('Failed to load home screen data.', error);
                }
            } finally {
                setBusy(false);
            }
        })();
    }, [getRecentlyAddedMovies, toast]);

    useFocusEffect(loadData);

    return { isBusy, recentlyAddedMovies, recentlyAddedEpisodes, continueWatchingItems };
}
