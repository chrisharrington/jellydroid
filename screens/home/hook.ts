import { useToast } from '@/components/toast';
import { useJellyfin } from '@/contexts/jellyfin';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

export function useHome() {
    const { getRecentlyAddedMovies, getRecentlyAddedEpisodes, getContinueWatchingItems } = useJellyfin(),
        toast = useToast(),
        { navigate } = useNavigation(),
        { push } = useRouter(),
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
                toast.error('Failed to load home screen data.', error);
            } finally {
                setBusy(false);
            }
        })();
    }, [getRecentlyAddedMovies, toast]);

    useFocusEffect(loadData);

    return {
        isBusy,
        recentlyAddedMovies,
        recentlyAddedEpisodes,
        continueWatchingItems,
        navigateToMovies: useCallback(() => push('/movies'), [push]),
        navigateToTvShows: useCallback(() => push('/tv-shows'), [push]),
    };
}
