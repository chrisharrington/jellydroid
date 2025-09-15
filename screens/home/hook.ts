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

    /**
     * Navigates to the movies screen.
     */
    const navigateToMovies = useCallback(() => push('/movies'), [push]);

    /**
     * Navigates to the TV shows screen.
     */
    const navigateToTvShows = useCallback(() => push('/tv-shows'), [push]);

    return {
        isBusy,
        recentlyAddedMovies,
        recentlyAddedEpisodes,
        continueWatchingItems,
        navigateToMovies,
        navigateToTvShows,
    };

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
