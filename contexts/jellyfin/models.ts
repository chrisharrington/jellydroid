import { JellyfinConfig } from '@/models';
import { MinimalUser } from '@/stores/useAuthStore';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

/**
 * Represents metadata for a subtitle track.
 * @typedef {Object} SubtitleMetadata
 * @property {number} index - The index of the subtitle track.
 * @property {string} language - The language code of the subtitle track.
 * @property {string} displayTitle - The human-readable title of the subtitle track.
 * @property {boolean} isDefault - Indicates if this is the default subtitle track.
 * @property {boolean} isForced - Indicates if these are forced subtitles.
 * @property {string} codec - The codec used for the subtitle track.
 * @property {string} [deliveryMethod] - The method used to deliver the subtitles.
 * @property {boolean} isExternal - Indicates if the subtitle track is from an external source.
 */
export type SubtitleMetadata = {
    index: number;
    language: string;
    displayTitle: string;
    isDefault: boolean;
    isForced: boolean;
    codec: string;
    deliveryMethod?: string;
    isExternal: boolean;
};

/**
 * Type defining the Jellyfin context value with all available API methods.
 */
export type JellyfinContextValue = {
    /** Authenticates user with stored credentials. */
    login: () => Promise<MinimalUser>;

    /** Retrieves the item using the given ID. */
    getItem: (id: string) => Promise<BaseItemDto | null>;

    /** Finds a movie by name and year. */
    findMovieByName: (year: number, name: string) => Promise<BaseItemDto | undefined>;

    /** Retrieves playback information for a media item. */
    getMediaInfo: (itemId: string) => Promise<any>;

    /** Gets recently added movies from Jellyfin server. */
    getRecentlyAddedMovies: () => Promise<BaseItemDto[]>;

    /** Gets recently added TV series from Jellyfin server. */
    getRecentlyAddedEpisodes: () => Promise<BaseItemDto[]>;

    /** Gets items that can be resumed/continued watching. */
    getContinueWatchingItems: () => Promise<BaseItemDto[]>;

    /** Gets next up episodes for the current user. */
    getNextUp: () => Promise<BaseItemDto[]>;

    /** Generates image URL for a Jellyfin item. */
    getImageForId: (itemId: string) => string;

    /** Gets streaming URL for a media item by its ID. */
    getStreamUrlFromItemId: (itemId: string, subtitleStreamIndex?: number) => Promise<string>;

    /** Gets streaming URL for a media item with optional burned-in subtitles. */
    getStreamUrl: (item: BaseItemDto, subtitleIndex?: number) => Promise<string>;

    /** Gets resume position in seconds for a media item. */
    getResumePositionSeconds: (item: BaseItemDto) => number;

    /** Updates playback progress for a media item. */
    updatePlaybackProgress: (
        itemId: string,
        mediaSourceId: string,
        playSessionId: string | null,
        position: number,
        isPaused?: boolean
    ) => Promise<void>;

    /** Reports start of playback session to Jellyfin. */
    startPlaybackSession: (itemId: string, mediaSourceId: string) => Promise<string>;

    /** Reports end of playback session to Jellyfin. */
    stopPlaybackSession: (
        itemId: string,
        mediaSourceId: string,
        playSessionId: string | null,
        positionTicks: number
    ) => Promise<void>;

    /** Retrieves Jellyfin system configuration. */
    getSystemConfig: () => Promise<JellyfinConfig>;

    /** Downloads trickplay images for video scrubbing. */
    downloadTrickplayImages: (item: BaseItemDto) => Promise<void>;

    /** Gets file URI for trickplay tile image. */
    getTrickplayTileFileUri: (item: BaseItemDto, index: number) => string;

    /** Toggles watched status of a media item. */
    toggleItemWatched: (item: BaseItemDto, isWatched: boolean) => Promise<boolean>;

    /** Updates item user data. */
    updateItem: (itemId: string, item: BaseItemDto) => Promise<void>;

    /** Gets subtitle track metadata including default, forced, and other properties. */
    getSubtitleTrackMetadata: (item: BaseItemDto) => Array<SubtitleMetadata>;
};
