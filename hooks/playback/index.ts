import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRemoteMediaClient } from 'react-native-google-cast';
import { useJellyfin } from '../jellyfin';
import { useRetry } from '../retry';

type PlayStatus = {
    isPlaying: boolean;
    isLoading: boolean;
    streamPosition: number;
    maxPosition: number;
    currentTime: string;
    maxTime: string;
};

export function usePlayback(itemId: string, mediaSourceId: string) {
    const playbackSessionId = useRef<string | null>(null);

    const client = useRemoteMediaClient(),
        { startPlaybackSession, stopPlaybackSession, updatePlaybackProgress, getItemDetails } = useJellyfin(),
        { retry } = useRetry(),
        navigation = useNavigation(),
        [status, setStatus] = useState<PlayStatus>({
            isPlaying: false,
            isLoading: false,
            streamPosition: 0,
            maxPosition: 0,
            currentTime: '00:00',
            maxTime: '00:00',
        });

    // Initialize playback session ID on first render or when the user changes the item or media source.
    useEffect(() => {
        console.log('Initializing playback session ID:', itemId);
        if (!itemId) return;

        // playbackSessionId.current = getRandomValues(new Uint8Array(16)).reduce(
        //     (acc, byte) => acc + byte.toString(16).padStart(2, '0'),
        //     ''
        // );
        playbackSessionId.current = 'blah';

        // Cast the media to the connected device.
        cast();

        console.log('Created new playback session ID:', playbackSessionId.current);
    }, [itemId]);

    /**
     * Initiates casting of media content to a connected Google Cast device.
     *
     * This function performs the following steps:
     * 1. Verifies connection to a Google Cast client
     * 2. Generates necessary streaming and poster URLs
     * 3. Retrieves item details from Jellyfin
     * 4. Configures and starts media playback on the Cast device
     * 5. Initiates a playback session in Jellyfin
     *
     * @throws {Error} When no Google Cast client is available
     * @throws {Error} When the requested item cannot be found
     *
     * @requires client - A connected Google Cast client instance
     * @requires itemId - The Jellyfin item ID to cast
     * @requires mediaSourceId - The media source ID for the item
     * @requires process.env.EXPO_PUBLIC_JELLYFIN_URL - Base URL for Jellyfin server
     * @requires process.env.EXPO_PUBLIC_JELLYFIN_API_KEY - API key for Jellyfin authentication
     */
    const cast = useCallback(async () => {
        try {
            console.log('Casting item:', itemId);

            // Use retry to wait for Google Cast client to become available.
            const availableClient = await getCastClient();

            // Generate stream and poster URLs.
            const streamUrl = `${process.env.EXPO_PUBLIC_JELLYFIN_URL}/Videos/${itemId}/master.m3u8?MediaSourceId=${mediaSourceId}&VideoCodec=h264&AudioCodec=aac,mp3&VideoBitrate=15808283&AudioBitrate=384000&MaxFramerate=23.976025&MaxWidth=1024&api_key=${process.env.EXPO_PUBLIC_JELLYFIN_API_KEY}&TranscodingMaxAudioChannels=2&RequireAvc=false&EnableAudioVbrEncoding=true&SegmentContainer=ts&MinSegments=1&BreakOnNonKeyFrames=False&hevc-level=150&hevc-videobitdepth=10&hevc-profile=main10&h264-profile=high,main,baseline,constrainedbaseline&h264-level=41&aac-audiochannels=2&TranscodeReasons=ContainerNotSupported,%20VideoCodecNotSupported,%20AudioCodecNotSupported`,
                posterUrl = `${process.env.EXPO_PUBLIC_JELLYFIN_URL}/Items/${itemId}/Images/Primary?api_key=${process.env.EXPO_PUBLIC_JELLYFIN_API_KEY}`,
                item = await getItemDetails(itemId);

            // Ensure item exists before proceeding.
            if (!item) throw new Error('Item not found: ' + itemId);

            // Cast media to the connected device.
            availableClient.loadMedia({
                autoplay: true,
                mediaInfo: {
                    contentUrl: streamUrl,
                    contentType: 'video/mp4',
                    metadata: {
                        type: 'movie',
                        title: item.Name || 'Unknown Movie',
                        images: [{ url: posterUrl }],
                    },
                },
            });

            // Start playback session in Jellyfin.
            startPlaybackSession(itemId, mediaSourceId, playbackSessionId.current);
        } catch (e) {
            console.error('Failed to cast.', e);
        }
    }, [client, retry, itemId, mediaSourceId, getItemDetails, startPlaybackSession]);

    /**
     * Pauses the current client operation asynchronously.
     *
     * This function attempts to call the `pause` method on the `client` object if it exists.
     * If the operation fails, an error is logged to the console.
     *
     * @returns {Promise<void>} A promise that resolves when the pause operation completes.
     * @throws Logs an error to the console if the pause operation fails.
     * @dependency Depends on the `client` object.
     */
    const pause = useCallback(async () => {
        try {
            // Use retry to wait for Google Cast client to become available.
            const availableClient = await getCastClient();

            // Retrieve the current stream position.
            const position = (await availableClient.getStreamPosition()) || 0;

            // Update the playback progress.
            updateProgress(position, true);

            // Immediately update UI state for responsive feedback.
            setStatus(prev => ({ ...prev, streamPosition: position, isPlaying: false, isLoading: true }));

            // Pause playback.
            await availableClient.pause();

            // Clear loading state after successful pause.
            setStatus(prev => ({ ...prev, isLoading: false }));
        } catch (error) {
            console.error('Failed to pause:', error);
            // Revert the optimistic update on error.
            setStatus(prev => ({ ...prev, isPlaying: true, isLoading: false }));
        }
    }, [client, retry]);

    /**
     * Attempts to resume playback by invoking the `play` method on the provided `client`.
     * If the `client` is not available, the function exits early.
     * Any errors encountered during the operation are caught and logged to the console.
     *
     * @returns {Promise<void>} A promise that resolves when the playback has been resumed or an error has been handled.
     * @throws Will not throw, but logs errors to the console.
     */
    const resume = useCallback(async () => {
        try {
            // Use retry to wait for Google Cast client to become available.
            const availableClient = await getCastClient();

            // Retrieve the current stream position.
            const position = (await availableClient.getStreamPosition()) || 0;

            // Update the playback progress.
            updateProgress(position, false);

            // Immediately update UI state for responsive feedback.
            setStatus(prev => ({ ...prev, streamPosition: position, isPlaying: true, isLoading: true }));

            // Resume playback.
            await availableClient.play();

            // Clear loading state after successful resume.
            setStatus(prev => ({ ...prev, isLoading: false }));
        } catch (error) {
            console.error('Failed to resume:', error);
            // Revert the optimistic update on error.
            setStatus(prev => ({ ...prev, isPlaying: false, isLoading: false }));
        }
    }, [client, retry]);

    /**
     * Seeks the media playback forward by a specified number of seconds.
     *
     * @param seconds - The number of seconds to seek forward. Defaults to 30 seconds if not provided.
     * @returns A promise that resolves when the seek operation is complete.
     *
     * @remarks
     * - If the `client` is not available or the media status cannot be retrieved, the function exits early.
     * - Logs an error to the console if the seek operation fails.
     */
    const seekForward = useCallback(
        async (seconds: number = 30) => {
            try {
                // Use retry to wait for Google Cast client to become available.
                const availableClient = await getCastClient();

                // Immediately update UI state for responsive feedback.
                setStatus(prev => ({ ...prev, isLoading: true }));

                const mediaStatus = await availableClient.getMediaStatus();
                if (!mediaStatus) {
                    setStatus(prev => ({ ...prev, isLoading: false }));
                    return;
                }

                // Seek to the new position.
                const newPosition = mediaStatus.streamPosition + seconds;
                await availableClient.seek({ position: newPosition });

                // Update the playback progress.
                updateProgress(newPosition, !status.isPlaying);

                // Clear loading state after successful seek.
                setStatus(prev => ({ ...prev, isLoading: false }));
            } catch (error) {
                console.error('Failed to seek forward:', error);
                // Clear loading state on error.
                setStatus(prev => ({ ...prev, isLoading: false }));
            }
        },
        [client, retry]
    );

    /**
     * Seeks the media playback backward by a specified number of seconds.
     *
     * @param seconds - The number of seconds to seek backward. Defaults to 10 seconds if not provided.
     * @remarks
     * - If the client is not available or the media status cannot be retrieved, the function exits early.
     * - The new playback position will not go below 0 seconds.
     * - Any errors encountered during the seek operation are logged to the console.
     */
    const seekBackward = useCallback(
        async (seconds: number = 10) => {
            try {
                // Use retry to wait for Google Cast client to become available.
                const availableClient = await getCastClient();

                // Immediately update UI state for responsive feedback.
                setStatus(prev => ({ ...prev, isLoading: true }));

                const mediaStatus = await availableClient.getMediaStatus();
                if (!mediaStatus) {
                    setStatus(prev => ({ ...prev, isLoading: false }));
                    return;
                }

                // Seek to the new position.
                const newPosition = Math.max(0, mediaStatus.streamPosition - seconds);
                await availableClient.seek({ position: newPosition });

                // Update the playback progress.
                updateProgress(newPosition, !status.isPlaying);

                // Clear loading state after successful seek.
                setStatus(prev => ({ ...prev, isLoading: false }));
            } catch (error) {
                console.error('Failed to seek backward:', error);
                // Clear loading state on error.
                setStatus(prev => ({ ...prev, isLoading: false }));
            }
        },
        [client, retry]
    );

    /**
     * Stops the current client asynchronously.
     *
     * This function attempts to stop the provided `client` instance by calling its `stop` method.
     * If the `client` is not available, the function returns early. Any errors encountered during
     * the stop operation are caught and logged to the console. Once the media has stopped, the user
     * is navigated back.
     *
     * @returns {Promise<void>} A promise that resolves when the client has been stopped or if no client exists.
     * @throws Logs an error to the console if stopping the client fails.
     */
    const stop = useCallback(async () => {
        try {
            // Use retry to wait for Google Cast client to become available.
            const availableClient = await getCastClient();

            // Stop playback.
            await availableClient.stop();

            // Update the playback progress.
            stopPlaybackSession(itemId, mediaSourceId, playbackSessionId.current, status.streamPosition);

            // Navigate back to the previous screen after stopping.
            navigation.goBack();
        } catch (error) {
            console.error('Failed to stop:', error);
        }
    }, [client, retry]);

    /**
     * Seeks to a specific position in the media playback.
     *
     * @param position - The position in seconds to seek to.
     * @returns A promise that resolves when the seek operation is complete.
     */
    const seekToPosition = useCallback(
        async (position: number) => {
            try {
                // Use retry to wait for Google Cast client to become available.
                const availableClient = await getCastClient();

                // Immediately update UI state for responsive feedback.
                setStatus(prev => ({
                    ...prev,
                    isLoading: true,
                    streamPosition: position,
                    currentTime: formatTimeFromSeconds(position),
                }));

                // Seek to the new position.
                await availableClient.seek({ position });

                // Update the playback progress.
                updateProgress(position, !status.isPlaying);

                // Clear loading state after successful seek.
                setStatus(prev => ({ ...prev, isLoading: false }));
            } catch (error) {
                console.error('Failed to seek to position:', error);
                // Clear loading state on error.
                setStatus(prev => ({ ...prev, isLoading: false }));
            }
        },
        [client, retry, formatTimeFromSeconds]
    );

    /**
     * Formats seconds into MM:SS or HH:MM:SS format.
     */
    function formatTimeFromSeconds(seconds: number) {
        if (!seconds || seconds < 0) return '00:00';

        const hours = Math.floor(seconds / 3600),
            minutes = Math.floor((seconds % 3600) / 60),
            secs = Math.floor(seconds % 60);

        return hours > 0
            ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs
                  .toString()
                  .padStart(2, '0')}`
            : `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Updates the playback progress in Jellyfin.
     */
    function updateProgress(position: number, isPaused: boolean) {
        updatePlaybackProgress(itemId, mediaSourceId, playbackSessionId.current, position, isPaused);
    }

    async function getCastClient() {
        return await retry(() => {
            if (!client) throw new Error('Google Cast client not available.');
            return client;
        });
    }

    return { cast, pause, resume, stop, seekBackward, seekForward, seekToPosition, status };
}
