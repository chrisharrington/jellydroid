import { JellyfinConfig } from '@/models';
import { Jellyfin } from '@jellyfin/sdk';
import { BaseItemDto, BaseItemKind, ItemSortBy, SortOrder, UserDto } from '@jellyfin/sdk/lib/generated-client/models';
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
        user = useRef<UserDto | null>(null),
        config = useRef<JellyfinConfig | null>(null);

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
            sortBy: [ItemSortBy.DateCreated],
            sortOrder: [SortOrder.Descending],
            includeItemTypes: [BaseItemKind.Movie],
            recursive: true,
            limit: 30,
        });

        if (!response.data.Items) throw new Error('No items found in response.');

        return response.data.Items;
    }, [api]);

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
        if (!user.current) await login();

        const itemsApi = getItemsApi(api);
        const response = await itemsApi.getResumeItems({
            userId: user.current!.Id,
            includeItemTypes: [BaseItemKind.Movie],
            mediaTypes: ['Video'],
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
            if (!user.current) await login();
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
        [api, login]
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
        [api, login]
    );

    /**
     * Returns the URI for the trickplay folder of a specific Jellyfin item.
     * @param item - The Jellyfin item for which to get the trickplay folder URI
     * @returns A string representing the full path to the trickplay folder for the given item
     */
    const getTrickplayFolderUri = useCallback(
        (item: BaseItemDto) => `${FileSystem.cacheDirectory}trickplay/${item.Id}`,
        [api, login]
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
        if (!user.current) await login();
        if (config.current) return config.current;

        const response = await fetch(
            `${process.env.EXPO_PUBLIC_JELLYFIN_URL}/System/Configuration?api_key=${process.env.EXPO_PUBLIC_JELLYFIN_API_KEY}`
        );
        if (!response.ok) throw new Error('Failed to fetch system configuration.');

        // Cache the retrieved configuration.
        const localConfig = (await response.json()) as JellyfinConfig;
        config.current = localConfig;
        return config.current;
    }, [api, login]);

    return {
        login,
        findMovieByName,
        getMediaInfo,
        getRecentlyAddedMovies,
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
