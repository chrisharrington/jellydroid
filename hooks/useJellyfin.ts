import { Jellyfin } from '@jellyfin/sdk';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getMediaInfoApi } from '@jellyfin/sdk/lib/utils/api/media-info-api';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { useCallback, useMemo } from 'react';

/**
 * React hook for interacting with the Jellyfin API.
 *
 * This hook memoizes the Jellyfin API instance and provides utility methods
 * for querying media items, such as finding a movie by its name.
 *
 * @returns An object containing utility methods for interacting with Jellyfin.
 */
export function useJellyfin() {
    const api = useMemo(createApi, []);

    /**
     * Finds a movie by its name (title).
     * @param name - The movie name to search for.
     * @returns The first matching movie item, or undefined if not found.
     */
    const findMovieByName = useCallback(
        async (year: number, name: string) => {
            const itemsApi = getItemsApi(api);
            const response = await itemsApi.getItems({
                searchTerm: name,
                years: [year],
                includeItemTypes: ['Movie'],
                recursive: true,
                limit: 1,
            });

            const items = response.data.Items;
            return items && items.length > 0 ? items[0] : undefined;
        },
        [api]
    );

    /**
     * Retrieves playback information for a specific media item from the Jellyfin API.
     *
     * @param itemId - The unique identifier of the media item to fetch playback info for.
     * @returns A promise that resolves to the playback information data of the requested media item.
     */
    const getMediaInfo = useCallback(
        async (itemId: string) => (await getMediaInfoApi(api).getPlaybackInfo({ itemId })).data,
        [api]
    );

    /**
     * Retrieves the 10 most recently added movies from the Jellyfin server.
     *
     * Uses the Items API to fetch movies sorted by their creation date in descending order.
     *
     * @returns {Promise<Item[]>} A promise that resolves to an array of recently added movie items.
     */
    const getRecentlyAddedMovies = useCallback(async () => {
        const itemsApi = getItemsApi(api);
        const response = await itemsApi.getItems({
            sortBy: ['DateCreated'],
            sortOrder: ['Descending'],
            includeItemTypes: ['Movie'],
            recursive: true,
            limit: 30,
        });

        if (!response.data.Items) throw new Error('No items found in response.');

        return response.data.Items;
    }, [api]);

    /**
     * Retrieves detailed information about a movie item from the Jellyfin API.
     *
     * @param id - The unique identifier of the movie item to fetch.
     * @returns A promise that resolves to the movie item's data.
     */
    const getMovieDetails = useCallback(
        async (id: string) => {
            const itemsApi = getItemsApi(api);
            const response = await itemsApi.getItems({ ids: [id] });
            if (!response.data.Items || response.data.Items.length === 0) throw new Error('Movie not found');
            return response.data.Items[0] as BaseItemDto;
        },
        [api]
    );

    return { findMovieByName, getMediaInfo, getRecentlyAddedMovies, getMovieDetails };

    /**
     * Creates and configures a Jellyfin API instance using environment variables.
     *
     * @throws {Error} If any required environment variable is missing.
     * @returns A configured Jellyfin API instance.
     *
     * @remarks
     * This function reads configuration from Expo Constants and initializes
     * the Jellyfin API client with app and device information.
     */
    function createApi() {
        const appName = process.env.EXPO_PUBLIC_APP_NAME,
            appVersion = process.env.EXPO_PUBLIC_APP_VERSION,
            jellyfinUrl = process.env.EXPO_PUBLIC_JELLYFIN_URL,
            jellyfinApiKey = process.env.EXPO_PUBLIC_JELLYFIN_API_KEY;

        if (!appName) throw new Error('Missing required environment variable: APP_NAME.');
        if (!appVersion) throw new Error('Missing required environment variable: APP_VERSION.');
        if (!jellyfinUrl) throw new Error('Missing required environment variable: JELLYFIN_URL.');
        if (!jellyfinApiKey) throw new Error('Missing required environment variable: JELLYFIN_API_KEY.');

        const jellyfin = new Jellyfin({
            clientInfo: {
                name: appName,
                version: appVersion,
            },
            deviceInfo: {
                name: Device.deviceName || 'Unknown Device',
                id: Application.getAndroidId() || 'Unknown Device ID',
            },
        });
        return jellyfin.createApi(jellyfinUrl, jellyfinApiKey);
    }
}
