/**
 * Jellyfin Context for API interactions and session management.
 *
 * This context provides a centralized way to access Jellyfin API functionality
 * throughout the application, with persistent authentication and session management.
 *
 * @module JellyfinContext
 */

import { JellyfinConfig } from '@/models';
import { MinimalUser, useAuthStore } from '@/stores/useAuthStore';
import { Jellyfin } from '@jellyfin/sdk';
import { MediaInfoApiGetPostedPlaybackInfoRequest } from '@jellyfin/sdk/lib/generated-client/api/media-info-api';
import {
    BaseItemDto,
    BaseItemKind,
    ItemSortBy,
    SortOrder,
    SubtitleDeliveryMethod,
} from '@jellyfin/sdk/lib/generated-client/models';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getMediaInfoApi } from '@jellyfin/sdk/lib/utils/api/media-info-api';
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as FileSystem from 'expo-file-system';
import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import { JellyfinContextValue } from './models';

/**
 * Jellyfin React Context for API access.
 */
const JellyfinContext = createContext<JellyfinContextValue | undefined>(undefined);

/**
 * Props for the JellyfinProvider component.
 */
type JellyfinProviderProps = {
    /** Child components that will have access to the Jellyfin context. */
    children: React.ReactNode;
};

/**
 * Provider component that wraps the application to provide Jellyfin API access.
 *
 * @param props - The provider props containing children
 * @returns JSX element providing Jellyfin context to children
 *
 * @example
 * ```tsx
 * <JellyfinProvider>
 *   <App />
 * </JellyfinProvider>
 * ```
 */
export function JellyfinProvider({ children }: JellyfinProviderProps) {
    const api = useMemo(createApi, []),
        config = useRef<JellyfinConfig | null>(null),
        { user, setAuth, clearAuth } = useAuthStore();

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

            const userData = response.data.User,
                accessToken = response.data.AccessToken;

            if (!userData || !accessToken) throw new Error('Invalid authentication response');

            return setAuth(userData, accessToken);
        } catch (error) {
            clearAuth();
            throw error;
        }
    }, [api, setAuth, clearAuth]);

    /**
     * Retrieves the current user or performs a login if no user is authenticated.
     * @returns A Promise that resolves to a MinimalUser object
     * @remarks
     * If a user is already authenticated, returns the existing user.
     * Otherwise, initiates the login process and returns the newly authenticated user.
     */
    const getUser = useCallback(() => {
        return new Promise<MinimalUser>(async resolve => {
            if (user) resolve(user);
            else resolve(await login());
        });
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
        async (itemId: string, options?: Partial<MediaInfoApiGetPostedPlaybackInfoRequest>) => {
            const mediaInfoApi = getMediaInfoApi(api);
            const response = await mediaInfoApi.getPostedPlaybackInfo({
                itemId,
                ...options,
            });

            return response.data;
        },
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
     * Retrieves the shows of the 30 most recently added episodes.
     *
     * Uses the Jellyfin API to fetch shows sorted by creation date in descending order.
     * The query is recursive, meaning it searches through all libraries and folders.
     *
     * @throws {Error} When the API response contains no items
     * @returns {Promise<BaseItemDto[]>} A promise that resolves to an array of episode items
     */
    const getRecentlyAddedEpisodes = useCallback(async () => {
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
        const itemsApi = getItemsApi(api);
        const response = await itemsApi.getResumeItems({
            userId: (await getUser())!.Id,
            includeItemTypes: [BaseItemKind.Movie],
            mediaTypes: ['Video'],
            limit: 30,
        });
        if (!response.data.Items) throw new Error('No items found in response.');
        return response.data.Items;
    }, [api, user]);

    /**
     * Retrieves detailed information about a movie item from the Jellyfin API.
     *
     * @param id - The unique identifier of the movie item to fetch.
     * @returns A promise that resolves to the movie item's data.
     */
    const loadItem = useCallback(
        async (itemId: string) => {
            const item = await getItem(itemId);
            // setItem(item);
            return item;
        },
        [api, user]
    );

    /**
     * Retrieves a specific item from the Jellyfin user library
     * @param itemId - The unique identifier of the item to retrieve
     * @returns Promise that resolves to the BaseItemDto representing the requested item
     * @throws Will throw an error if the API call fails or if user is not authenticated
     */
    const getItem = useCallback(
        async (itemId: string) => {
            const userLibraryApi = getUserLibraryApi(api),
                user = await getUser(),
                response = await userLibraryApi.getItem({ itemId, userId: user!.Id }),
                item = response.data;

            // Return the item data.
            return item as BaseItemDto;
        },
        [api, user]
    );

    /**
     * Updates item user data in Jellyfin.
     * @param itemId - The unique identifier of the item to update
     * @param item - The item data containing user data to update
     * @returns Promise that resolves when the update is complete
     */
    const updateItem = useCallback(
        async (itemId: string, itemToUpdate: BaseItemDto) => {
            if (!itemToUpdate.UserData) return;

            // Update the item with the Jellyfin API.
            const itemsApi = getItemsApi(api);
            itemsApi.updateItemUserData({
                userId: user!.Id,
                itemId,
                updateUserItemDataDto: itemToUpdate.UserData,
            });
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
     * Retrieves the streaming URL for a given item ID.
     *
     * @param itemId - The unique identifier of the media item
     * @param subtitleStreamIndex - Optional index for subtitle stream selection
     * @returns Promise that resolves to the streaming URL for the specified item
     *
     * @remarks
     * This function first loads the item details using the itemId, then generates
     * the appropriate streaming URL with optional subtitle selection.
     */
    const getStreamUrlFromItemId = useCallback(
        async (itemId: string, subtitleStreamIndex?: number) => {
            const item = await loadItem(itemId);
            return getStreamUrl(item, subtitleStreamIndex);
        },
        [api]
    );

    /**
     * Gets streaming URL for a media item with optional subtitle configuration.
     * @param item - The Jellyfin BaseItemDto object containing media information
     * @param subtitleStreamIndex - Optional subtitle stream index to include in playback
     * @returns The transcoding URL for streaming the media with burned-in subtitles
     */
    const getStreamUrl = useCallback(
        async (item: BaseItemDto, subtitleStreamIndex?: number) => {
            const baseUrl = `${process.env.EXPO_PUBLIC_JELLYFIN_URL}/Videos/${item.Id}/master.m3u8`;
            const params = new URLSearchParams({
                MediaSourceId: item.MediaSources?.[0].Id || '',
                VideoCodec: 'h264',
                AudioCodec: 'aac,mp3',
                VideoBitrate: '15808283',
                AudioBitrate: '384000',
                MaxFramerate: '23.976025',
                MaxWidth: '1024',
                api_key: process.env.EXPO_PUBLIC_JELLYFIN_API_KEY || '',
                TranscodingMaxAudioChannels: '2',
                RequireAvc: 'false',
                EnableAudioVbrEncoding: 'true',
                SegmentContainer: 'ts',
                MinSegments: '1',
                BreakOnNonKeyFrames: 'False',
                'hevc-level': '150',
                'hevc-videobitdepth': '10',
                'hevc-profile': 'main10',
                'h264-profile': 'high,main,baseline,constrainedbaseline',
                'h264-level': '41',
                'aac-audiochannels': '2',
                TranscodeReasons: `ContainerNotSupported, VideoCodecNotSupported, AudioCodecNotSupported ${
                    subtitleStreamIndex !== undefined ? `, SubtitleCodecNotSupported` : ''
                }`,
                SubtitleMethod: SubtitleDeliveryMethod.Hls,
            });

            // Add subtitle parameters if subtitle stream is specified
            if (subtitleStreamIndex !== undefined && subtitleStreamIndex >= 0) {
                params.append('SubtitleStreamIndex', subtitleStreamIndex.toString());
                params.append('SubtitleMethod', SubtitleDeliveryMethod.Hls);
            }

            // console.log('Stream URL:', `${baseUrl}?${params.toString()}`);

            return `${baseUrl}?${params.toString()}`;
            // return 'https://bitmovin-a.akamaihd.net/content/sintel/hls/playlist.m3u8';
        },
        [api, login]
    );

    /**
     * Gets available subtitle tracks for a media item.
     * @param item - The Jellyfin BaseItemDto object containing media information
     * @returns Array of subtitle stream objects with index, language, and display name
     */
    const getSubtitleTracks = useCallback((item: BaseItemDto) => {
        if (!item.MediaStreams) return [];

        return item.MediaStreams.filter(stream => stream.Type === 'Subtitle').map(stream => ({
            index: stream.Index || 0,
            language: stream.Language || 'Unknown',
            displayTitle: stream.DisplayTitle || `Subtitle ${stream.Index}`,
            codec: stream.Codec || 'Unknown',
            isExternal: stream.IsExternal || false,
            isDefault: stream.IsDefault || false,
            isForced: stream.IsForced || false,
        }));
    }, []);

    /**
     * Gets subtitle track metadata including default, forced, and other properties.
     * @param item - The Jellyfin BaseItemDto object containing media information
     * @returns Array of subtitle track metadata objects
     */
    const getSubtitleTrackMetadata = useCallback((item: BaseItemDto) => {
        const mediaSource = item.MediaSources?.[0];
        if (!mediaSource?.MediaStreams) return [];

        return mediaSource.MediaStreams.filter(stream => stream.Type === 'Subtitle').map(stream => ({
            index: stream.Index || 0,
            language: stream.Language || 'Unknown',
            displayTitle: stream.DisplayTitle || `Subtitle ${stream.Index}`,
            isDefault: stream.IsDefault || false,
            isForced: stream.IsForced || false,
            codec: stream.Codec || 'Unknown',
            deliveryMethod: stream.DeliveryMethod,
            isExternal: stream.IsExternal || false,
        }));
    }, []);

    /**
     * Gets external subtitle URL for a specific subtitle stream.
     * Used when subtitles need to be loaded separately (e.g., SRT files).
     * @param item - The Jellyfin BaseItemDto object containing media information
     * @param subtitleStreamIndex - The index of the subtitle stream
     * @returns URL to the subtitle file
     */
    const getSubtitleUrl = useCallback((item: BaseItemDto, subtitleStreamIndex: number) => {
        return `${process.env.EXPO_PUBLIC_JELLYFIN_URL}/Videos/${item.Id}/${item.MediaSources?.[0].Id}/Subtitles/${subtitleStreamIndex}/Stream.vtt?api_key=${process.env.EXPO_PUBLIC_JELLYFIN_API_KEY}`;
    }, []);

    /**
     * Gets the resume position for a media item in seconds.
     * @param item - The Jellyfin BaseItemDto object containing user data
     * @returns The resume position in seconds, or 0 if no resume position is available
     */
    const getResumePositionSeconds = useCallback((item: BaseItemDto) => {
        if (!item.UserData?.PlaybackPositionTicks) return 0;
        // Convert ticks to seconds (1 tick = 100 nanoseconds)
        return item.UserData.PlaybackPositionTicks / 10_000_000;
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
        [api]
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
        [api]
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
        [api]
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
        [api]
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
        if (config.current) return config.current;

        const response = await fetch(
            `${process.env.EXPO_PUBLIC_JELLYFIN_URL}/System/Configuration?api_key=${process.env.EXPO_PUBLIC_JELLYFIN_API_KEY}`
        );
        if (!response.ok) throw new Error('Failed to fetch system configuration.');

        // Cache the retrieved configuration.
        const localConfig = (await response.json()) as JellyfinConfig;
        config.current = localConfig;
        return config.current;
    }, [api]);

    /**
     * Toggles the watched status of a Jellyfin media item.
     * @param item - The Jellyfin media item to update
     * @param isWatched - The current watched status of the item. If true, marks item as unwatched. If false, marks item as watched.
     * @throws Will throw an error if the user is not logged in and login attempt fails
     * @returns Promise that resolves when the watched status has been updated
     */
    const toggleItemWatched = useCallback(
        async (item: BaseItemDto, isWatched: boolean) => {
            if (!item.Id) throw new Error('Item ID is required');

            const playstateApi = getPlaystateApi(api),
                parameters = { itemId: item.Id, userId: (await getUser()).Id };

            if (isWatched) await playstateApi.markUnplayedItem(parameters);
            else await playstateApi.markPlayedItem(parameters);

            return !isWatched;
        },
        [api, getUser]
    );

    const contextValue: JellyfinContextValue = {
        login,
        loadItem,
        updateItem,
        findMovieByName,
        getMediaInfo,
        getRecentlyAddedMovies,
        getRecentlyAddedEpisodes,
        getContinueWatchingItems,
        getImageForId,
        getStreamUrlFromItemId,
        getStreamUrl,
        getResumePositionSeconds,
        updatePlaybackProgress,
        startPlaybackSession,
        stopPlaybackSession,
        getSystemConfig,
        downloadTrickplayImages,
        getTrickplayTileFileUri,
        toggleItemWatched,
        getSubtitleTrackMetadata,
    };

    return <JellyfinContext.Provider value={contextValue}>{children}</JellyfinContext.Provider>;

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

/**
 * Custom hook to access the Jellyfin context.
 *
 * @returns The Jellyfin context value with all API methods
 * @throws {Error} If used outside of JellyfinProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { getRecentlyAddedMovies, getImageForId } = useJellyfin();
 *
 *   useEffect(() => {
 *     getRecentlyAddedMovies().then(setMovies);
 *   }, []);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useJellyfin(): JellyfinContextValue {
    const context = useContext(JellyfinContext);
    if (context === undefined) throw new Error('useJellyfin must be used within a JellyfinProvider');
    return context;
}
