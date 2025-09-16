import { useToast } from '@/components/toast';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import {
    CastContext as GoogleCastContext,
    MediaPlayerState,
    MediaTrack,
    useCastSession,
    useDevices,
    useRemoteMediaClient,
} from 'react-native-google-cast';
import { useJellyfin } from '../jellyfin';
import { SubtitleMetadata } from '../jellyfin/models';

export type PlayStatus = {
    /** Indicates whether media is currently playing. */
    isPlaying: boolean;

    /** Indicates if the player is in a loading or buffering state. */
    isBusy: boolean;

    /** Indicates if playback has been stopped or ended. */
    isStopped: boolean;

    /** Indicates that media track info is available. */
    isMediaTrackInfoAvailable: boolean;

    /** Current playback position in seconds. */
    streamPosition: number;

    /** Total duration of the media in seconds. */
    maxPosition: number;
};

type CastContextType = {
    /** Initiates casting of a media item to the connected device. */
    cast: (item: BaseItemDto, resumePlayback?: boolean) => void;

    /** Pauses the current media playback. */
    pause: () => Promise<void>;

    /** Resumes the current media playback. */
    resume: () => Promise<void>;

    /** Stops the current media playback and ends the casting session. */
    stop: () => void;

    /** Seeks backward in the current media by specified seconds. Defaults to 10 seconds. */
    seekBackward: (seconds?: number) => Promise<void>;

    /** Seeks forward in the current media by specified seconds. Defaults to 30 seconds. */
    seekForward: (seconds?: number) => Promise<void>;

    /** Seeks to a specific position in seconds in the current media. */
    seekToPosition: (position: number) => Promise<void>;

    /** Current playback status including position, duration, and player state. */
    status: PlayStatus;

    /** List of available casting devices including the local device. */
    devices: Array<{ label: string; value: string }>;

    /** Handles device selection and connection management. */
    onDeviceSelected: (deviceId: string | null) => Promise<void>;

    /** Indicates if connected to a casting device. */
    isConnected: boolean;

    /** ID of the currently selected casting device. */
    selectedDeviceId: string;

    /** Unique identifier for the current playback session. */
    playbackSessionId: string | null;

    /** Returns the loaded subtitle tracks for the current session. */
    getSubtitleTrackMetadata: () => Promise<Array<MediaTrack & SubtitleMetadata>>;

    /** Sets the active subtitle track for the current cast session or clears it when given null. */
    setSubtitleTrack: (track: (MediaTrack & SubtitleMetadata) | null) => void;

    /** The currently active subtitle track, if any. */
    currentSubtitleTrack: (MediaTrack & SubtitleMetadata) | null;
};

const CastContext = createContext<CastContextType | undefined>(undefined);

type CastProviderProps = {
    children: ReactNode;
};

/**
 * Cast context provider that manages Google Cast functionality across the application.
 * Provides centralized state management for casting operations, device selection,
 * and media playback control. This ensures a single source of truth for all
 * cast-related operations and prevents multiple hook instances from causing state conflicts.
 * @param children - React child components that will have access to the cast context.
 */
export function CastProvider({ children }: CastProviderProps) {
    const playbackSessionId = useRef<string | null>(null),
        client = useRemoteMediaClient(),
        session = useCastSession(),
        [selectedDeviceId, setSelectedDeviceId] = useState<string | null>('local'),
        [jellyfinSubtitleTrackMetadata, setJellyfinSubtitleTrackMetadata] = useState<SubtitleMetadata[]>([]),
        devices = useDevices(),
        statusCallback = useRef<((status: PlayStatus) => void) | null>(null),
        [status, setStatus] = useState<PlayStatus>({
            isPlaying: false,
            isBusy: false,
            isStopped: false,
            isMediaTrackInfoAvailable: false,
            streamPosition: 0,
            maxPosition: 0,
        }),
        toast = useToast(),
        { getStreamUrl, getSubtitleTrackMetadata: getJellyfinSubtitleTrackMetadata } = useJellyfin(),
        [currentSubtitleTrack, setCurrentSubtitleTrack] = useState<(MediaTrack & SubtitleMetadata) | null>(null);

    // Set up event listeners for media status updates.
    useEffect(() => {
        if (!client) return;

        const progressListener = client.onMediaProgressUpdated(progress => {
            setStatus(prev => ({ ...prev, streamPosition: progress || 0 }));
        });

        const statusListener = client.onMediaStatusUpdated(mediaStatus => {
            if (!mediaStatus) return;

            const currentPlayerState = mediaStatus.playerState,
                streamPosition = mediaStatus.streamPosition || 0,
                duration = mediaStatus.mediaInfo?.streamDuration || 0;

            setStatus(prev => ({
                ...prev,
                streamPosition,
                maxPosition: duration,
                isPlaying: currentPlayerState === MediaPlayerState.PLAYING,
                isBusy: currentPlayerState === MediaPlayerState.BUFFERING || !currentPlayerState,
                isStopped: currentPlayerState === MediaPlayerState.IDLE,
                isMediaTrackInfoAvailable: (mediaStatus.mediaInfo?.mediaTracks?.length || 0) > 0,
            }));
        });

        return () => {
            progressListener.remove();
            statusListener.remove();
        };
    }, [client]);

    useEffect(() => {
        statusCallback.current && statusCallback.current(status);
    }, [status]);

    return (
        <CastContext.Provider
            value={{
                cast,
                pause,
                resume,
                stop,
                seekBackward,
                seekForward,
                seekToPosition,
                status,
                devices: getDevices(),
                playbackSessionId: playbackSessionId.current,
                onDeviceSelected,
                isConnected: !!client,
                selectedDeviceId: selectedDeviceId || 'local',
                getSubtitleTrackMetadata,
                setSubtitleTrack,
                currentSubtitleTrack,
            }}
        >
            {children}
        </CastContext.Provider>
    );

    /**
     * Initiates casting of a media item to the connected Google Cast device.
     * Updates the selected item state which triggers the media loading process.
     * @param item - The Jellyfin media item to be cast to the device.
     * @param resumePlayback - Whether to resume playback if the item is already playing.
     */
    async function cast(item: BaseItemDto) {
        try {
            if (!client) throw new Error('Cannot cast; no client available.');

            // Generate stream and poster URLs.
            let itemId = item.Id,
                streamUrl = await getStreamUrl(item),
                posterUrl = `${process.env.EXPO_PUBLIC_JELLYFIN_URL}/Items/${itemId}/Images/Primary?api_key=${process.env.EXPO_PUBLIC_JELLYFIN_API_KEY}`;

            // Cast media to the connected device.
            await client.loadMedia({
                autoplay: true,
                mediaInfo: {
                    contentUrl: streamUrl,
                    contentType: 'application/x-mpegURL',
                    metadata: {
                        type: 'movie',
                        title: item.Name || 'Unknown Movie',
                        images: [{ url: posterUrl }],
                    },
                },
            });

            // Seek to the last known position, if necessary.
            const lastKnownPosition = item.UserData?.PlaybackPositionTicks || 0;
            if (lastKnownPosition > 0) seekToPosition(lastKnownPosition / 10_000_000);

            // Retrieve Jellyfin subtitle metadata for later use.
            setJellyfinSubtitleTrackMetadata(getJellyfinSubtitleTrackMetadata(item));

            // Clear the selected subtitle for new casts.
            setCurrentSubtitleTrack(null);
        } catch (e) {
            toast.error('Failed to cast media. Please try again later.', e);
        }
    }

    /**
     * Pauses the current media playback on the connected Google Cast device.
     * Updates the UI state optimistically for responsive feedback, then performs the pause operation.
     * If the operation fails, the UI state is reverted to its previous state.
     * @returns A promise that resolves when the pause operation completes.
     */
    async function pause() {
        try {
            const availableClient = getCastClient(),
                position = (await availableClient.getStreamPosition()) || 0;

            setStatus(prev => ({ ...prev, streamPosition: position, isPlaying: false, isBusy: true }));
            await availableClient.pause();
            setStatus(prev => ({ ...prev, isBusy: false }));
        } catch (error) {
            toast.error('Failed to pause.', error);
            setStatus(prev => ({ ...prev, isPlaying: true, isBusy: false }));
        }
    }

    /**
     * Resumes media playback on the connected Google Cast device.
     * Updates the UI state optimistically for responsive feedback, then performs the resume operation.
     * If the operation fails, the UI state is reverted to its previous state.
     * @returns A promise that resolves when the resume operation completes.
     */
    async function resume() {
        try {
            const availableClient = getCastClient(),
                position = (await availableClient.getStreamPosition()) || 0;

            setStatus(prev => ({ ...prev, streamPosition: position, isPlaying: true, isBusy: true }));
            await availableClient.play();
            setStatus(prev => ({ ...prev, isBusy: false }));
        } catch (error) {
            toast.error('Failed to resume.', error);
            setStatus(prev => ({ ...prev, isPlaying: false, isBusy: false }));
        }
    }

    /**
     * Seeks forward in the current media playback by a specified number of seconds.
     * Updates the UI state to show loading during the operation.
     * @param seconds - The number of seconds to seek forward. Defaults to 30 seconds.
     * @returns A promise that resolves when the seek operation completes.
     */
    async function seekForward(seconds: number = 30) {
        try {
            const availableClient = getCastClient();
            setStatus(prev => ({ ...prev, isBusy: true }));
            const mediaStatus = await availableClient.getMediaStatus();
            if (!mediaStatus) {
                setStatus(prev => ({ ...prev, isBusy: false }));
                return;
            }
            const newPosition = mediaStatus.streamPosition + seconds;
            await availableClient.seek({ position: newPosition });
            setStatus(prev => ({ ...prev, isBusy: false }));
        } catch (error) {
            toast.error('Failed to seek forward.', error);
            setStatus(prev => ({ ...prev, isBusy: false }));
        }
    }

    /**
     * Seeks backward in the current media playback by a specified number of seconds.
     * Ensures the playback position does not go below zero seconds.
     * Updates the UI state to show loading during the operation.
     * @param seconds - The number of seconds to seek backward. Defaults to 10 seconds.
     * @returns A promise that resolves when the seek operation completes.
     */
    async function seekBackward(seconds: number = 10) {
        try {
            const availableClient = getCastClient();
            setStatus(prev => ({ ...prev, isBusy: true }));
            const mediaStatus = await availableClient.getMediaStatus();
            if (!mediaStatus) {
                setStatus(prev => ({ ...prev, isBusy: false }));
                return;
            }
            const newPosition = Math.max(0, mediaStatus.streamPosition - seconds);
            availableClient.seek({ position: newPosition });
            setStatus(prev => ({ ...prev, isBusy: false }));
        } catch (error) {
            toast.error('Failed to seek backward.', error);
            setStatus(prev => ({ ...prev, isBusy: false }));
        }
    }

    /**
     * Seeks to a specific position in the current media playback.
     * Updates the UI state optimistically with the new position and shows loading during the operation.
     * @param position - The position in seconds to seek to.
     * @returns A promise that resolves when the seek operation completes.
     */
    async function seekToPosition(position: number) {
        try {
            const availableClient = getCastClient();
            setStatus(prev => ({
                ...prev,
                isBusy: true,
                streamPosition: position,
            }));
            availableClient.seek({ position });
            setStatus(prev => ({ ...prev, isBusy: false }));
        } catch (error) {
            toast.error('Failed to seek to position.', error);
            setStatus(prev => ({ ...prev, isBusy: false }));
        }
    }

    /**
     * Stops the current media playback on the connected Google Cast device.
     * Clears the selected item state to reset the casting session.
     * @returns A promise that resolves when the stop operation completes.
     */
    function stop() {
        try {
            getCastClient().stop();
        } catch (error) {
            toast.error('Failed to stop the casting session.', error);
        }
    }

    /**
     * Returns a list of available casting devices, including the local device option.
     * Filters devices to include only those with video output capabilities and sorts them alphabetically.
     * @returns An array of device objects with label and value properties.
     */
    function getDevices() {
        return [
            { label: 'This Device', value: 'local' },
            ...devices
                .filter(device => device.capabilities.includes('VideoOut'))
                .sort((a, b) => a.friendlyName.toLowerCase().localeCompare(b.friendlyName.toLowerCase()))
                .map(device => ({
                    label: device.friendlyName.replace(/\b\w/g, char => char.toUpperCase()),
                    value: device.deviceId,
                })),
        ];
    }

    /**
     * Retrieves and combines subtitle track metadata from both the Cast client and Jellyfin.
     * @returns {Promise<Array<MediaTrack & SubtitleMetadata>>} A promise that resolves to an array of merged subtitle track objects containing both Cast and Jellyfin metadata.
     * Only returns English language tracks.
     * @throws {Error} When unable to find matching Jellyfin subtitle metadata for a Cast track.
     */
    async function getSubtitleTrackMetadata() {
        try {
            const client = getCastClient(),
                status = await client.getMediaStatus(),
                tracks = status?.mediaInfo?.mediaTracks || [];

            return tracks
                .map(track => {
                    let jellyfinTrack = jellyfinSubtitleTrackMetadata.find(t => t.displayTitle === track.name);
                    if (!jellyfinTrack && !track.name)
                        jellyfinTrack = jellyfinSubtitleTrackMetadata.find(t => t.isForced);
                    if (!jellyfinTrack) return null;
                    return {
                        ...track,
                        ...jellyfinTrack,
                    };
                })
                .filter(track => track && track.language === 'eng') as Array<MediaTrack & SubtitleMetadata>;
        } catch (error) {
            toast.error('Failed to retrieve subtitle metadata.', error);
            return [];
        }
    }

    /**
     * Sets the active subtitle track for the current cast session.
     * @param track - The subtitle track to set as active, or null to disable subtitles.
     * Track must include both MediaTrack properties and SubtitleMetadata.
     * @throws {Error} When setting the subtitle track fails
     */
    async function setSubtitleTrack(track: (MediaTrack & SubtitleMetadata) | null) {
        try {
            const client = getCastClient();
            client.setActiveTrackIds(track ? [track.id] : []);
            setCurrentSubtitleTrack(track);
        } catch (error) {
            toast.error('Failed to set subtitle track.', error);
        }
    }

    /**
     * Retrieves the currently active subtitle track from the cast client's media status.
     * @returns {Promise<MediaTrack | null>} A promise that resolves to the active subtitle track if found, null otherwise.
     * @throws {Error} When there's an error retrieving the media status, which is caught and displayed as a toast error.
     */
    async function getCurrentSubtitleTrack() {
        try {
            const client = getCastClient(),
                status = await client.getMediaStatus(),
                tracks = status?.mediaInfo?.mediaTracks || [],
                activeTrackids = status?.activeTrackIds || [];

            return (
                tracks.filter(track => activeTrackids.includes(track.id)).find(track => track.type === 'text') || null
            );
        } catch (error) {
            toast.error('Failed to retrieve current subtitle track.', error);
            return null;
        }
    }

    /**
     * Handles device selection for casting operations.
     * If deviceId is null or 'local', disconnects any active cast sessions.
     * If deviceId is provided, starts a cast session with the specified device.
     * @param deviceId - The ID of the device to connect to, or null to disconnect.
     * @returns A promise that resolves when the operation completes.
     */
    async function onDeviceSelected(deviceId: string | null) {
        try {
            setStatus(prev => ({ ...prev, isBusy: true }));
            setSelectedDeviceId(deviceId);

            if (deviceId === null || deviceId === 'local') {
                const sessionManager = GoogleCastContext.getSessionManager();
                await sessionManager.endCurrentSession();
            } else {
                const device = devices.find(d => d.deviceId === deviceId);
                if (!device) {
                    setStatus(prev => ({ ...prev, isBusy: false }));
                    return;
                }

                const sessionManager = GoogleCastContext.getSessionManager();
                await sessionManager.startSession(deviceId);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            setStatus(prev => ({ ...prev, isBusy: false }));
        } catch (error) {
            toast.error('Failed to handle device selection.', error);
            setStatus(prev => ({ ...prev, isBusy: false }));
        }
    }

    /**
     * Retrieves the Google Cast client instance and validates its availability.
     * @throws {Error} When no Google Cast client is available.
     * @returns The Google Cast client instance.
     */
    function getCastClient() {
        if (!client) throw new Error('No Google Cast client available.');
        return client;
    }
}

/**
 * Custom hook for accessing Google Cast functionality within the application.
 * Must be used within a CastProvider component tree to function properly.
 * Provides access to all casting operations including device management,
 * playback control, and status monitoring.
 * @throws {Error} When used outside of a CastProvider context.
 * @returns The cast context containing all casting functionality and state.
 */
export function useCast() {
    const context = useContext(CastContext);
    if (context === undefined) throw new Error('useCast must be used within a CastProvider');
    return context;
}
