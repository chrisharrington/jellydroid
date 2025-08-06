import { Jellyfin } from '@jellyfin/sdk';
import { BaseItemDto, UserDto } from '@jellyfin/sdk/lib/generated-client/models';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getMediaInfoApi } from '@jellyfin/sdk/lib/utils/api/media-info-api';
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { useCallback, useMemo, useRef } from 'react';

/**
 * React hook for interacting with the Jellyfin API.
 *
 * This hook memoizes the Jellyfin API instance and provides utility methods
 * for querying media items, such as finding a movie by its name.
 *
 * @returns An object containing utility methods for interacting with Jellyfin.
 */
export function useJellyfin() {
    const api = useMemo(createApi, []),
        user = useRef<UserDto | null>(null);

    /**
     * Authenticates a user with the provided username and password.
     * On successful authentication, updates the user state with the response data.
     *
     * @param username - The username of the user to authenticate.
     * @param password - The password of the user to authenticate.
     * @returns A promise that resolves when the authentication process is complete.
     */
    const login = useCallback(async () => {
        const response = await api.authenticateUserByName(
            process.env.EXPO_PUBLIC_JELLYFIN_USERNAME || '',
            process.env.EXPO_PUBLIC_JELLYFIN_PASSWORD || ''
        );
        user.current = response.data.User || null;
    }, [api]);

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
    const getItemDetails = useCallback(
        async (id: string) => {
            if (!user.current) await login();

            const userLibraryApi = getUserLibraryApi(api);
            const item = await userLibraryApi.getItem({ itemId: id, userId: user.current!.Id });
            return item.data as BaseItemDto;
        },
        [api, user]
    );

    /**
     * Generates the URL for the primary poster image of a given Jellyfin item.
     *
     * @param item - The Jellyfin item for which to retrieve the poster image.
     * @returns The URL string pointing to the item's primary poster image, including the API key for authentication.
     */
    const getPosterForItem = useCallback(
        (item: BaseItemDto) =>
            `${process.env.EXPO_PUBLIC_JELLYFIN_URL}/Items/${item.Id}/Images/Primary?api_key=${process.env.EXPO_PUBLIC_JELLYFIN_API_KEY}`,
        []
    );

    /**
     * Updates the playback progress for a media item, allowing Jellyfin to track viewing position.
     * This should be called periodically during playback to sync the current position.
     *
     * @param itemId - The unique identifier of the media item being played.
     * @param position - The current playback position in seconds.
     * @param isPaused - Whether playback is currently paused. Defaults to false.
     * @returns A promise that resolves when the progress has been reported.
     */
    const updatePlaybackProgress = useCallback(
        async (
            itemId: string,
            mediaSourceId: string,
            playSessionId: string | null,
            position: number,
            isPaused: boolean = false
        ) => {
            if (!user.current) await login();

            const playstateApi = getPlaystateApi(api);
            await playstateApi.reportPlaybackProgress({
                playbackProgressInfo: {
                    ItemId: itemId,
                    MediaSourceId: mediaSourceId,
                    PositionTicks: position * 10_000_000,
                    IsPaused: isPaused,
                    PlaySessionId: playSessionId,
                },
            });
        },
        [api, login]
    );

    /**
     * Reports the start of a playback session to Jellyfin.
     * This should be called when media playback begins.
     *
     * @param itemId - The unique identifier of the media item being played.
     * @returns A promise that resolves when the playback start has been reported.
     */
    const startPlaybackSession = useCallback(
        async (itemId: string, mediaSourceId: string, playSessionId: string | null) => {
            if (!user.current) await login();

            const playstateApi = getPlaystateApi(api);
            await playstateApi.reportPlaybackStart({
                playbackStartInfo: {
                    ItemId: itemId,
                    IsPaused: false,
                    MediaSourceId: mediaSourceId,
                    PlayMethod: 'Transcode',
                    PlaySessionId: playSessionId,
                },
            });
        },
        [api, login]
    );

    /**
     * Reports the end of a playback session to Jellyfin.
     * This should be called when media playback stops or ends.
     *
     * @param itemId - The unique identifier of the media item that was played.
     * @param positionTicks - The final playback position in ticks when stopping.
     * @returns A promise that resolves when the playback stop has been reported.
     */
    const stopPlaybackSession = useCallback(
        async (itemId: string, mediaSourceId: string, playSessionId: string | null, positionTicks: number) => {
            if (!user.current) await login();

            const playstateApi = getPlaystateApi(api);
            await playstateApi.reportPlaybackStopped({
                playbackStopInfo: {
                    ItemId: itemId,
                    MediaSourceId: mediaSourceId,
                    PositionTicks: positionTicks,
                    PlaySessionId: playSessionId,
                },
            });
        },
        [api, login]
    );

    return {
        login,
        findMovieByName,
        getMediaInfo,
        getRecentlyAddedMovies,
        getItemDetails,
        getPosterForItem,
        updatePlaybackProgress,
        startPlaybackSession,
        stopPlaybackSession,
    };

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
