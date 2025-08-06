import { useAsyncEffect } from '@/hooks/asyncEffect';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
    CastContext as GoogleCastContext,
    useCastSession,
    useDevices,
    useRemoteMediaClient,
} from 'react-native-google-cast';

export type PlayStatus = {
    isPlaying: boolean;
    isLoading: boolean;
    isStopped: boolean;
    streamPosition: number;
    maxPosition: number;
};

type CastContextType = {
    cast: (item: BaseItemDto) => void;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    stop: () => Promise<void>;
    seekBackward: (seconds?: number) => Promise<void>;
    seekForward: (seconds?: number) => Promise<void>;
    seekToPosition: (position: number) => Promise<void>;
    status: PlayStatus;
    devices: Array<{ label: string; value: string }>;
    playbackSessionId: string | null;
    onPlaybackUpdated: (callback: (status: PlayStatus) => void) => () => void;
    onDeviceSelected: (deviceId: string | null) => Promise<void>;
    isConnected: boolean;
    selectedDeviceId: string;
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
    const playbackSessionId = useRef<string | null>(null);
    const client = useRemoteMediaClient();
    const session = useCastSession();
    const [selectedItem, setSelectedItem] = useState<BaseItemDto | null>(null);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>('local');
    const devices = useDevices();
    const [status, setStatus] = useState<PlayStatus>({
        isPlaying: false,
        isLoading: false,
        isStopped: false,
        streamPosition: 0,
        maxPosition: 0,
    });

    useAsyncEffect(async () => {
        if (!session || !selectedItem || !client) return;

        try {
            // Generate stream and poster URLs.
            const itemId = selectedItem.Id,
                streamUrl = `${process.env.EXPO_PUBLIC_JELLYFIN_URL}/Videos/${itemId}/master.m3u8?MediaSourceId=${selectedItem.MediaSources?.[0].Id}&VideoCodec=h264&AudioCodec=aac,mp3&VideoBitrate=15808283&AudioBitrate=384000&MaxFramerate=23.976025&MaxWidth=1024&api_key=${process.env.EXPO_PUBLIC_JELLYFIN_API_KEY}&TranscodingMaxAudioChannels=2&RequireAvc=false&EnableAudioVbrEncoding=true&SegmentContainer=ts&MinSegments=1&BreakOnNonKeyFrames=False&hevc-level=150&hevc-videobitdepth=10&hevc-profile=main10&h264-profile=high,main,baseline,constrainedbaseline&h264-level=41&aac-audiochannels=2&TranscodeReasons=ContainerNotSupported,%20VideoCodecNotSupported,%20AudioCodecNotSupported`,
                posterUrl = `${process.env.EXPO_PUBLIC_JELLYFIN_URL}/Items/${itemId}/Images/Primary?api_key=${process.env.EXPO_PUBLIC_JELLYFIN_API_KEY}`;

            // Cast media to the connected device.
            await client.loadMedia({
                autoplay: true,
                mediaInfo: {
                    contentUrl: streamUrl,
                    contentType: 'application/x-mpegURL',
                    metadata: {
                        type: 'movie',
                        title: selectedItem.Name || 'Unknown Movie',
                        images: [{ url: posterUrl }],
                    },
                },
            });
        } catch (e) {
            console.error('Failed to cast:', e);
        }
    }, [session, selectedItem, client]);

    /**
     * Initiates casting of a media item to the connected Google Cast device.
     * Updates the selected item state which triggers the media loading process.
     * @param item - The Jellyfin media item to be cast to the device.
     */
    const cast = useCallback((item: BaseItemDto) => {
        setSelectedItem(item);
    }, []);

    /**
     * Pauses the current media playback on the connected Google Cast device.
     * Updates the UI state optimistically for responsive feedback, then performs the pause operation.
     * If the operation fails, the UI state is reverted to its previous state.
     * @returns A promise that resolves when the pause operation completes.
     */
    const pause = useCallback(async () => {
        try {
            const availableClient = getCastClient(),
                position = (await availableClient.getStreamPosition()) || 0;

            setStatus(prev => ({ ...prev, streamPosition: position, isPlaying: false, isLoading: true }));
            await availableClient.pause();
            setStatus(prev => ({ ...prev, isLoading: false }));
        } catch (error) {
            console.error('Failed to pause:', error);
            setStatus(prev => ({ ...prev, isPlaying: true, isLoading: false }));
        }
    }, [client]);

    /**
     * Resumes media playback on the connected Google Cast device.
     * Updates the UI state optimistically for responsive feedback, then performs the resume operation.
     * If the operation fails, the UI state is reverted to its previous state.
     * @returns A promise that resolves when the resume operation completes.
     */
    const resume = useCallback(async () => {
        try {
            const availableClient = getCastClient(),
                position = (await availableClient.getStreamPosition()) || 0;

            setStatus(prev => ({ ...prev, streamPosition: position, isPlaying: true, isLoading: true }));
            await availableClient.play();
            setStatus(prev => ({ ...prev, isLoading: false }));
        } catch (error) {
            console.error('Failed to resume:', error);
            setStatus(prev => ({ ...prev, isPlaying: false, isLoading: false }));
        }
    }, [client]);

    /**
     * Seeks forward in the current media playback by a specified number of seconds.
     * Updates the UI state to show loading during the operation.
     * @param seconds - The number of seconds to seek forward. Defaults to 30 seconds.
     * @returns A promise that resolves when the seek operation completes.
     */
    const seekForward = useCallback(
        async (seconds: number = 30) => {
            try {
                const availableClient = getCastClient();
                setStatus(prev => ({ ...prev, isLoading: true }));
                const mediaStatus = await availableClient.getMediaStatus();
                if (!mediaStatus) {
                    setStatus(prev => ({ ...prev, isLoading: false }));
                    return;
                }
                const newPosition = mediaStatus.streamPosition + seconds;
                await availableClient.seek({ position: newPosition });
                setStatus(prev => ({ ...prev, isLoading: false }));
            } catch (error) {
                console.error('Failed to seek forward:', error);
                setStatus(prev => ({ ...prev, isLoading: false }));
            }
        },
        [client]
    );

    /**
     * Seeks backward in the current media playback by a specified number of seconds.
     * Ensures the playback position does not go below zero seconds.
     * Updates the UI state to show loading during the operation.
     * @param seconds - The number of seconds to seek backward. Defaults to 10 seconds.
     * @returns A promise that resolves when the seek operation completes.
     */
    const seekBackward = useCallback(
        async (seconds: number = 10) => {
            try {
                const availableClient = getCastClient();
                setStatus(prev => ({ ...prev, isLoading: true }));
                const mediaStatus = await availableClient.getMediaStatus();
                if (!mediaStatus) {
                    setStatus(prev => ({ ...prev, isLoading: false }));
                    return;
                }
                const newPosition = Math.max(0, mediaStatus.streamPosition - seconds);
                await availableClient.seek({ position: newPosition });
                setStatus(prev => ({ ...prev, isLoading: false }));
            } catch (error) {
                console.error('Failed to seek backward:', error);
                setStatus(prev => ({ ...prev, isLoading: false }));
            }
        },
        [client]
    );

    /**
     * Seeks to a specific position in the current media playback.
     * Updates the UI state optimistically with the new position and shows loading during the operation.
     * @param position - The position in seconds to seek to.
     * @returns A promise that resolves when the seek operation completes.
     */
    const seekToPosition = useCallback(
        async (position: number) => {
            try {
                const availableClient = getCastClient();
                setStatus(prev => ({
                    ...prev,
                    isLoading: true,
                    streamPosition: position,
                }));
                await availableClient.seek({ position });
                setStatus(prev => ({ ...prev, isLoading: false }));
            } catch (error) {
                console.error('Failed to seek to position:', error);
                setStatus(prev => ({ ...prev, isLoading: false }));
            }
        },
        [client]
    );

    /**
     * Stops the current media playback on the connected Google Cast device.
     * Clears the selected item state to reset the casting session.
     * @returns A promise that resolves when the stop operation completes.
     */
    const stop = useCallback(async () => {
        try {
            const availableClient = getCastClient();
            await availableClient.stop();
            setSelectedItem(null);
        } catch (error) {
            console.error('Failed to stop:', error);
        }
    }, [client]);

    /**
     * Returns a list of available casting devices, including the local device option.
     * Filters devices to include only those with video output capabilities and sorts them alphabetically.
     * @returns An array of device objects with label and value properties.
     */
    const getDevices = useCallback(() => {
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
    }, [devices]);

    /**
     * Provides a callback mechanism for receiving real-time playback updates from the Google Cast client.
     * Combines both progress and status updates into a single callback interface.
     * The callback receives position, playback state, and loading information.
     * @param callback - Function to be called with playback status updates.
     * @returns A cleanup function that removes the event listeners when called.
     */
    const onPlaybackUpdated = useCallback(
        (callback: (status: PlayStatus) => void) => {
            if (!client) return () => {};

            let streamPosition = 0;
            let currentDuration = 0;
            let currentPlayerState = 'UNKNOWN';

            const progressListener = client.onMediaProgressUpdated(progress => {
                streamPosition = progress || 0;
                const localStatus = {
                    streamPosition,
                    maxPosition: 0,
                    isPlaying: currentPlayerState === 'PLAYING',
                    isLoading: currentPlayerState === 'BUFFERING',
                    isStopped: currentPlayerState === 'IDLE' || currentPlayerState === 'UNKNOWN',
                };
                setStatus(prev => ({ ...prev, streamPosition }));
                callback(localStatus);
            });

            const statusListener = client.onMediaStatusUpdated(mediaStatus => {
                if (!mediaStatus) return;
                currentPlayerState = mediaStatus.playerState || 'UNKNOWN';
                if (mediaStatus.mediaInfo?.streamDuration) currentDuration = mediaStatus.mediaInfo.streamDuration;
                if (mediaStatus.streamPosition !== undefined) streamPosition = mediaStatus.streamPosition;

                const localStatus = {
                    streamPosition,
                    maxPosition: 0,
                    isPlaying: currentPlayerState === 'PLAYING',
                    isLoading: currentPlayerState === 'BUFFERING',
                    isStopped: currentPlayerState === 'IDLE' || currentPlayerState === 'UNKNOWN',
                };
                setStatus(prev => ({ ...prev, ...localStatus }));
                callback(localStatus);
            });

            return () => {
                progressListener.remove();
                statusListener.remove();
            };
        },
        [client]
    );

    /**
     * Handles device selection for casting operations.
     * If deviceId is null or 'local', disconnects any active cast sessions.
     * If deviceId is provided, starts a cast session with the specified device.
     * @param deviceId - The ID of the device to connect to, or null to disconnect.
     * @returns A promise that resolves when the operation completes.
     */
    const onDeviceSelected = useCallback(
        async (deviceId: string | null) => {
            try {
                setStatus(prev => ({ ...prev, isLoading: true }));
                setSelectedDeviceId(deviceId);

                if (deviceId === null || deviceId === 'local') {
                    const sessionManager = GoogleCastContext.getSessionManager();
                    await sessionManager.endCurrentSession();
                } else {
                    const device = devices.find(d => d.deviceId === deviceId);
                    if (!device) {
                        console.error('Device not found:', deviceId);
                        setStatus(prev => ({ ...prev, isLoading: false }));
                        return;
                    }

                    const sessionManager = GoogleCastContext.getSessionManager();
                    await sessionManager.startSession(deviceId);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                setStatus(prev => ({ ...prev, isLoading: false }));
            } catch (error) {
                console.error('Failed to handle device selection:', error);
                setStatus(prev => ({ ...prev, isLoading: false }));
            }
        },
        [devices]
    );

    /**
     * Retrieves the Google Cast client instance and validates its availability.
     * @throws {Error} When no Google Cast client is available.
     * @returns The Google Cast client instance.
     */
    function getCastClient() {
        if (!client) throw new Error('No Google Cast client available.');
        return client;
    }

    const contextValue: CastContextType = useMemo(
        () => ({
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
            onPlaybackUpdated,
            onDeviceSelected,
            isConnected: !!session,
            selectedDeviceId: selectedDeviceId || 'local',
        }),
        [
            cast,
            pause,
            resume,
            stop,
            seekBackward,
            seekForward,
            seekToPosition,
            status,
            getDevices,
            selectedDeviceId,
            onPlaybackUpdated,
            onDeviceSelected,
            session,
            selectedDeviceId,
        ]
    );

    return <CastContext.Provider value={contextValue}>{children}</CastContext.Provider>;
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
