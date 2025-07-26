import { useCallback, useMemo } from 'react';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getMediaInfoApi } from '@jellyfin/sdk/lib/utils/api/media-info-api';
import { Jellyfin } from '@jellyfin/sdk';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import type { MediaStream as JellyfinMediaStream } from '@jellyfin/sdk/lib/generated-client/models/media-stream';

/**
 * React hook for interacting with the Jellyfin API.
 *
 * This hook memoizes the Jellyfin API instance and provides utility methods
 * for querying media items, such as finding a movie by its name.
 *
 * @returns An object containing utility methods for interacting with Jellyfin.
 */
export function useJellyfin() {
    // Memoize the API instance so it's not recreated on every render.
    const api = useMemo(createApi, []);

    /**
     * Finds a movie by its name (title).
     * @param name - The movie name to search for.
     * @returns The first matching movie item, or undefined if not found.
     */
    const findMovieByName = useCallback(
        async (name: string) => {
            const itemsApi = getItemsApi(api);
            const response = await itemsApi.getItems({
                searchTerm: name,
                includeItemTypes: ['Movie'],
                recursive: true,
                limit: 1,
            });

            const items = response.data.Items;
            return items && items.length > 0 ? items[0] : undefined;
        },
        [api]
    );

    const getMediaInfo = useCallback(
        async (itemId: string) => (
            (await getMediaInfoApi(api).getPlaybackInfo({ itemId })).data
        ),
        [api]
    );

    // Import the correct type from the Jellyfin SDK

    const getMediaStreams = useCallback(
        async (itemId: string, type?: string): Promise<JellyfinMediaStream[]> => {
            let mediaInfo = await getMediaInfo(itemId),
                mediaSources = mediaInfo.MediaSources || [];


            if (!mediaInfo.MediaSources || mediaInfo.MediaSources.length === 0) return [];

            let mediaStreams = mediaSources[0]?.MediaStreams || [];
            if (type) mediaStreams = mediaStreams.filter(stream => stream.Type === type);

            return mediaStreams;
        },
        [api]
    );

    return { findMovieByName, getMediaInfo, getMediaStreams };

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

        if (!appName)
            throw new Error('Missing required environment variable: APP_NAME.');
        if (!appVersion)
            throw new Error('Missing required environment variable: APP_VERSION.');
        if (!jellyfinUrl)
            throw new Error('Missing required environment variable: JELLYFIN_URL.');
        if (!jellyfinApiKey)
            throw new Error('Missing required environment variable: JELLYFIN_API_KEY.');

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
