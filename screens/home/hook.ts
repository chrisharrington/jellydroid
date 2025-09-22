import { useToast } from '@/components/toast';
import { useJellyfin } from '@/contexts/jellyfin';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

/**
 * Custom hook for managing home screen state and interactions.
 * Handles fetching and displaying recently added content and continue watching items.
 * Automatically loads data when the screen gains focus.
 *
 * @returns {Object} Object containing:
 * - isBusy: Loading state indicator
 * - recentlyAddedMovies: Array of recently added movie items
 * - recentlyAddedEpisodes: Array of recently added episode items
 * - continueWatchingItems: Array of items to continue watching
 * - navigateToMovies: Function to navigate to movies screen
 * - navigateToTvShows: Function to navigate to TV shows screen
 */
export function useHome() {
    const { getRecentlyAddedMovies, getRecentlyAddedEpisodes, getContinueWatchingItems } = useJellyfin(),
        toast = useToast(),
        { push } = useRouter(),
        [isBusy, setBusy] = useState<boolean>(false),
        [recentlyAddedMovies, setRecentlyAddedMovies] = useState<BaseItemDto[]>([]),
        [recentlyAddedEpisodes, setRecentlyAddedEpisodes] = useState<BaseItemDto[]>([]),
        [continueWatchingItems, setContinueWatchingItems] = useState<BaseItemDto[]>([]);

    // Load data whenever the screen comes into focus.
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    return {
        isBusy,
        recentlyAddedMovies,
        recentlyAddedEpisodes,
        continueWatchingItems,
        navigateToItem,
        navigateToMovies: useCallback(() => push('/movies'), [push]),
        navigateToTvShows: useCallback(() => push('/tv-shows'), [push]),
    };

    /**
     * Navigates to a specific media item based on its type.
     * @param item - The media item to navigate to.
     * @throws {Error} Displays an error toast if the item type is not supported for navigation.
     */
    function navigateToItem(item: BaseItemDto) {
        switch (item.Type) {
            case 'Movie':
                push(`/movie/${item.Name}/${item.Id}`);
                break;
            case 'Episode':
                push(`/tv-shows/${item.SeriesId}/season/${item.ParentIndexNumber}/episode/${item.Id}`);
                break;
            default:
                toast.error('Navigation for this item type is not supported.');
                break;
        }
    }

    /**
     * Loads initial data for the home screen.
     * Fetches recently added movies, episodes, and continue watching items concurrently.
     * Displays error toast if data fetching fails.
     */
    async function loadData() {
        try {
            setBusy(true);

            // Fetch all data concurrently for better performance.
            const result = await Promise.all([
                getRecentlyAddedMovies(),
                getRecentlyAddedEpisodes(),
                getContinueWatchingItems(),
            ]);

            // Update state with fetched data.
            setRecentlyAddedMovies(result[0]);
            setRecentlyAddedEpisodes(result[1]);
            setContinueWatchingItems(result[2]);
        } catch (error: any) {
            toast.error('Failed to load home screen data.', error);
        } finally {
            setBusy(false);
        }
    }
}
