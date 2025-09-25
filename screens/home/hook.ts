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
 * - continueWatchingAndNextUpItems: Array of combined continue watching and next up items
 * - navigateToMovies: Function to navigate to movies screen
 * - navigateToTvShows: Function to navigate to TV shows screen
 */
export function useHome() {
    const { getRecentlyAddedMovies, getRecentlyAddedEpisodes, getContinueWatchingItems, getNextUp } = useJellyfin(),
        toast = useToast(),
        { push } = useRouter(),
        [isBusy, setBusy] = useState<boolean>(false),
        [recentlyAddedMovies, setRecentlyAddedMovies] = useState<BaseItemDto[]>([]),
        [recentlyAddedEpisodes, setRecentlyAddedEpisodes] = useState<BaseItemDto[]>([]),
        [continueWatchingAndNextUpItems, setContinueWatchingAndNextUpItems] = useState<BaseItemDto[]>([]);

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
        continueWatchingAndNextUpItems,
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
     * Fetches recently added movies, episodes, continue watching items, and next up items concurrently.
     * Combines continue watching and next up lists, prioritizing continue watching items.
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
                getNextUp(),
            ]);

            const continueWatchingItems = result[2];
            const nextUpItems = result[3];

            // Get series IDs from continue watching items to filter out from next up.
            const continueWatchingSeriesIds = new Set(
                continueWatchingItems
                    .filter(item => item.Type === 'Episode' && item.SeriesId)
                    .map(item => item.SeriesId)
            );

            // Filter next up items to exclude series that appear in continue watching.
            const filteredNextUpItems = nextUpItems.filter(item => {
                return !(item.Type === 'Episode' && item.SeriesId && continueWatchingSeriesIds.has(item.SeriesId));
            });

            // Combine continue watching and filtered next up items.
            const combinedItems = [...continueWatchingItems, ...filteredNextUpItems];

            // Sort by latest user activity descending (most recent first).
            const sortedItems = combinedItems.sort((a, b) => {
                const dateA = a.UserData?.LastPlayedDate ? new Date(a.UserData.LastPlayedDate) : new Date(0);
                const dateB = b.UserData?.LastPlayedDate ? new Date(b.UserData.LastPlayedDate) : new Date(0);
                return dateB.getTime() - dateA.getTime();
            });

            // Update state with fetched data.
            setRecentlyAddedMovies(result[0]);
            setRecentlyAddedEpisodes(result[1]);
            setContinueWatchingAndNextUpItems(sortedItems);
        } catch (error: any) {
            toast.error('Failed to load home screen data.', error);
        } finally {
            setBusy(false);
        }
    }
}
