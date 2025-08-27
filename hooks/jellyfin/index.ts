import { JellyfinConfig } from '@/models';
import { useAuthStore } from '@/stores/useAuthStore';
import { Jellyfin } from '@jellyfin/sdk';
import { BaseItemDto, BaseItemKind, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client/models';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getMediaInfoApi } from '@jellyfin/sdk/lib/utils/api/media-info-api';
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as FileSystem from 'expo-file-system';
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
        config = useRef<JellyfinConfig | null>(null),
        { user, isAuthenticated, isSessionValid, setAuth, clearAuth } = useAuthStore();

    /**
     * Authenticates a user with the provided username and password.
     * On successful authentication, updates the auth store with the response data.
     *
     * @returns A promise that resolves when the authentication process is complete.
     */
    const login = useCallback(async () => {
        try {
            const response = await api.authenticateUserByName(
                process.env.EXPO_PUBLIC_JELLYFIN_USERNAME || '',
                process.env.EXPO_PUBLIC_JELLYFIN_PASSWORD || ''
            );

            const userData = response.data.User;
            const accessToken = response.data.AccessToken;

            if (!userData || !accessToken) {
                throw new Error('Invalid authentication response');
            }

            setAuth(userData, accessToken);
        } catch (error) {
            clearAuth();
            throw error;
        }
    }, [api, setAuth, clearAuth]);

    /**
     * Ensures the user is authenticated before making API calls.
     * Checks session validity and re-authenticates if necessary.
     */
    const ensureAuthenticated = useCallback(async () => {
        if (!isAuthenticated || !isSessionValid()) {
            await login();
        }
    }, [isAuthenticated, isSessionValid, login]);

    /**
     * Wrapper for API calls that handles 401 authentication errors.
     * Automatically retries once with re-authentication if a 401 error occurs.
     */
    const withAuthRetry = useCallback(
        async <T>(apiCall: () => Promise<T>): Promise<T> => {
            try {
                await ensureAuthenticated();
                return await apiCall();
            } catch (error: any) {
                // If we get a 401 error, clear auth and retry once
                if (error?.response?.status === 401 || error?.status === 401) {
                    clearAuth();
                    await login();
                    return await apiCall();
                }
                throw error;
            }
        },
        [ensureAuthenticated, clearAuth, login]
    );

    /**
     * Finds a movie by its name (title).
     * @param name - The movie name to search for.
     * @returns The first matching movie item, or undefined if not found.
     */
    const findMovieByName = useCallback(
        async (year: number, name: string) => {
            await ensureAuthenticated();

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
        [api, ensureAuthenticated]
    );

    /**
     * Retrieves playback information for a specific media item from the Jellyfin API.
     *
     * @param itemId - The unique identifier of the media item to fetch playback info for.
     * @returns A promise that resolves to the playback information data of the requested media item.
     */
    const getMediaInfo = useCallback(
        async (itemId: string) => {
            await ensureAuthenticated();

            const mediaInfoApi = getMediaInfoApi(api);
            const response = await mediaInfoApi.getPlaybackInfo({
                itemId,
            });

            return response.data;
        },
        [api, ensureAuthenticated]
    );

    /**
     * Retrieves the 10 most recently added movies from the Jellyfin server.
     *
     * Uses the Items API to fetch movies sorted by their creation date in descending order.
     *
     * @returns {Promise<Item[]>} A promise that resolves to an array of recently added movie items.
     */
    const getRecentlyAddedMovies = useCallback(async () => {
        return withAuthRetry(async () => {
            const itemsApi = getItemsApi(api);
            const response = await itemsApi.getItems({
                sortBy: [ItemSortBy.DateCreated],
                sortOrder: [SortOrder.Descending],
                includeItemTypes: [BaseItemKind.Movie],
                recursive: true,
                limit: 30,
            });

            if (!response.data.Items) throw new Error('No items found in response.');
            return response.data.Items;
        });
    }, [api, withAuthRetry]);

    /**
     * Retrieves the shows of the 30 most recently added episodes.
     *
     * Uses the Jellyfin API to fetch shows sorted by creation date in descending order.
     * The query is recursive, meaning it searches through all libraries and folders.
     *
     * @throws {Error} When the API response contains no items
     * @returns {Promise<BaseItemDto[]>} A promise that resolves to an array of episode items
     */
    const getRecentlyAddedEpisodes = useCallback(async () => {
        return withAuthRetry(async () => {
            const itemsApi = getItemsApi(api);
            const response = await itemsApi.getItems({
                sortBy: [ItemSortBy.DateCreated],
                sortOrder: [SortOrder.Descending],
                includeItemTypes: [BaseItemKind.Series],
                recursive: true,
                limit: 30,
            });

            if (!response.data.Items) throw new Error('No items found in response.');
            return response.data.Items;
        });
    }, [api, withAuthRetry]);

    /**
     * Retrieves a list of movies that can be resumed/continued watching.
     *
     * @returns A promise that resolves to an array of resumable movie items, sorted by date played in descending order
     * @throws {Error} When no items are found in the API response
     *
     * @remarks
     * - Fetches up to 30 resumable movies
     * - Results are sorted by most recently played first
     * - Only includes items of type 'Movie'
     * - Searches recursively through all libraries
     */
    const getContinueWatchingItems = useCallback(async () => {
        await ensureAuthenticated();

        const itemsApi = getItemsApi(api);
        const response = await itemsApi.getResumeItems({
            userId: user!.Id,
            includeItemTypes: [BaseItemKind.Movie],
            mediaTypes: ['Video'],
            limit: 30,
        });
        if (!response.data.Items) throw new Error('No items found in response.');
        return response.data.Items;
    }, [api, ensureAuthenticated, user]);

    /**
     * Retrieves detailed information about a movie item from the Jellyfin API.
     *
     * @param id - The unique identifier of the movie item to fetch.
     * @returns A promise that resolves to the movie item's data.
     */
    const getItemDetails = useCallback(
        async (id: string) => {
            await ensureAuthenticated();

            const userLibraryApi = getUserLibraryApi(api);
            const item = await userLibraryApi.getItem({ itemId: id, userId: user!.Id });
            return item.data as BaseItemDto;
        },
        [api, ensureAuthenticated, user]
    );

    /**
     * Generates a URL for retrieving the primary image of a Jellyfin item.
     * @param itemId - The unique identifier of the Jellyfin item
     * @returns A fully qualified URL string pointing to the item's primary image
     * @example
     * const imageUrl = getImageForId("123456");
     * // Returns: "http://your-jellyfin-server/Items/123456/Images/Primary?api_key=your-api-key"
     */
    const getImageForId = useCallback(
        (itemId: string) =>
            `${process.env.EXPO_PUBLIC_JELLYFIN_URL}/Items/${itemId}/Images/Primary?api_key=${process.env.EXPO_PUBLIC_JELLYFIN_API_KEY}`,
        []
    );

    /**
     * Retrieves the streaming URL for a given Jellyfin media item.
     * @param item - The Jellyfin BaseItemDto object containing media information
     * @returns The transcoding URL for streaming the media
     * @throws {Error} When the streaming URL cannot be retrieved
     */
    const getStreamUrl = useCallback(
        (item: BaseItemDto) =>
            `${process.env.EXPO_PUBLIC_JELLYFIN_URL}/Videos/${item.Id}/main.m3u8?MediaSourceId=${item.MediaSources?.[0].Id}&VideoCodec=h264&AudioCodec=aac,mp3&VideoBitrate=15808283&AudioBitrate=384000&MaxFramerate=23.976025&MaxWidth=1024&api_key=${process.env.EXPO_PUBLIC_JELLYFIN_API_KEY}&TranscodingMaxAudioChannels=2&RequireAvc=false&EnableAudioVbrEncoding=true&SegmentContainer=ts&MinSegments=1&BreakOnNonKeyFrames=False&hevc-level=150&hevc-videobitdepth=10&hevc-profile=main10&h264-profile=high,main,baseline,constrainedbaseline&h264-level=41&aac-audiochannels=2&TranscodeReasons=ContainerNotSupported,%20VideoCodecNotSupported,%20AudioCodecNotSupported`,
        [api]
    );

    /**
     * Gets the resume position for a media item in seconds.
     * @param item - The Jellyfin BaseItemDto object containing user data
     * @returns The resume position in seconds, or 0 if no resume position is available
     */
    const getResumePositionSeconds = useCallback((item: BaseItemDto) => {
        if (!item.UserData?.PlaybackPositionTicks) return 0;
        // Convert ticks to seconds (1 tick = 100 nanoseconds)
        return item.UserData.PlaybackPositionTicks / 10000000;
    }, []);

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
            await ensureAuthenticated();

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
        [api, ensureAuthenticated]
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
            await ensureAuthenticated();

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
        [api, ensureAuthenticated]
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
            await ensureAuthenticated();

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
        [api, ensureAuthenticated]
    );

    /**
     * Downloads trickplay images for a given media item. Trickplay images are sprite sheets used
     * for video scrubbing previews.
     *
     * The function first checks if images already exist by looking for a trickplay folder.
     * If not found, it creates the directory and downloads all required sprite sheets based on
     * the video duration and system configuration parameters.
     *
     * @param item - The Jellyfin media item (BaseItemDto) to download trickplay images for
     * @returns Promise<void> - Resolves when all trickplay images have been downloaded
     * @throws May throw errors if file system operations fail or network requests fail
     *
     * @remarks
     * - Requires user to be logged in
     * - Uses system configuration for trickplay parameters (interval, tile width/height)
     * - Downloads multiple sprite sheets in parallel
     * - Creates a directory structure for storing the downloaded images
     */
    const downloadTrickplayImages = useCallback(
        async (item: BaseItemDto) => {
            await ensureAuthenticated();
            if (!config.current) config.current = await getSystemConfig();

            // Check for the existence of the trickplay folder. If it's there, trickplay images have already been downloaded.
            const trickplayFolder = getTrickplayFolderUri(item),
                folderInfo = await FileSystem.getInfoAsync(trickplayFolder);
            if (folderInfo.exists) return;

            // Create download folder as it doesn't exist.
            await FileSystem.makeDirectoryAsync(trickplayFolder, { intermediates: true });

            // Pull the interval, tile width and tile height configuration parameters.
            const interval = config.current.TrickplayOptions.Interval,
                tileWidth = config.current.TrickplayOptions.TileWidth,
                tileHeight = config.current.TrickplayOptions.TileHeight;

            // Calculate the number of trickplay images based on the length of the given item.
            const numImages = Math.ceil((item.RunTimeTicks || 0) / 10_000_000 / (interval / 1_000)),
                numSpriteSheets = Math.ceil(numImages / (tileWidth * tileHeight));

            // Download all trickplay images in parallel.
            await Promise.all(
                Array.from({ length: numSpriteSheets }, (_, index) =>
                    FileSystem.downloadAsync(
                        `${process.env.EXPO_PUBLIC_JELLYFIN_URL}/Videos/${item.Id}/TrickPlay/320/${index}.jpg?api_key=${process.env.EXPO_PUBLIC_JELLYFIN_API_KEY}`,
                        getTrickplayTileFileUri(item, index)
                    )
                )
            );
        },
        [api, ensureAuthenticated]
    );

    /**
     * Creates a file URI for a trickplay tile image in the local cache directory.
     * On Android, expo-image sometimes has issues with direct file:// URIs from cache directory,
     * so we provide a function that can convert to base64 data URI if needed.
     *
     * @param item - The BaseItemDto object containing the media item information
     * @param index - The index of the trickplay tile image
     * @returns The local file system URI path for the cached trickplay tile image
     */
    const getTrickplayTileFileUri = useCallback(
        (item: BaseItemDto, index: number) => `${getTrickplayFolderUri(item)}/${index}.jpg`,
        []
    );

    /**
     * Returns the URI for the trickplay folder of a specific Jellyfin item.
     * @param item - The Jellyfin item for which to get the trickplay folder URI
     * @returns A string representing the full path to the trickplay folder for the given item
     */
    const getTrickplayFolderUri = useCallback(
        (item: BaseItemDto) => `${FileSystem.cacheDirectory}trickplay/${item.Id}`,
        []
    );

    /**
     * Retrieves the Jellyfin system configuration.
     *
     * This function ensures the user is logged in before making the API request.
     * It fetches the system configuration from the Jellyfin server using the configured
     * URL and API key from environment variables.
     *
     * @returns A promise that resolves to the Jellyfin system configuration object
     * @throws {Error} When the API request fails or returns a non-ok response
     */
    const getSystemConfig = useCallback(async () => {
        await ensureAuthenticated();
        if (config.current) return config.current;

        const response = await fetch(
            `${process.env.EXPO_PUBLIC_JELLYFIN_URL}/System/Configuration?api_key=${process.env.EXPO_PUBLIC_JELLYFIN_API_KEY}`
        );
        if (!response.ok) throw new Error('Failed to fetch system configuration.');

        // Cache the retrieved configuration.
        const localConfig = (await response.json()) as JellyfinConfig;
        config.current = localConfig;
        return config.current;
    }, [ensureAuthenticated]);

    /**
     * Toggles the watched status of a Jellyfin media item.
     * @param item - The Jellyfin media item to update
     * @param isWatched - The current watched status of the item. If true, marks item as unwatched. If false, marks item as watched.
     * @throws Will throw an error if the user is not logged in and login attempt fails
     * @returns Promise that resolves when the watched status has been updated
     */
    const toggleItemWatched = useCallback(
        async (item: BaseItemDto, isWatched: boolean) => {
            await ensureAuthenticated();

            const playstateApi = getPlaystateApi(api),
                parameters = { itemId: item.Id!, userId: user!.Id };

            if (isWatched) await playstateApi.markUnplayedItem(parameters);
            else await playstateApi.markPlayedItem(parameters);

            return !isWatched;
        },
        [api, ensureAuthenticated, user]
    );

    return {
        login,
        findMovieByName,
        getMediaInfo,
        getRecentlyAddedMovies,
        getRecentlyAddedEpisodes,
        getContinueWatchingItems,
        getItemDetails,
        getImageForId,
        getStreamUrl,
        getResumePositionSeconds,
        updatePlaybackProgress,
        startPlaybackSession,
        stopPlaybackSession,
        getSystemConfig,
        downloadTrickplayImages,
        getTrickplayTileFileUri,
        toggleItemWatched,
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
