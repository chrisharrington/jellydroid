import { useNavigation } from 'expo-router';
import { useCallback, useState } from 'react';
import { useRemoteMediaClient } from 'react-native-google-cast';

type PlayStatus = {
    isPlaying: boolean;
    isLoading: boolean;
    streamPosition: number;
    maxPosition: number;
    currentTime: string;
    maxTime: string;
};

export function usePlayback() {
    const client = useRemoteMediaClient(),
        navigation = useNavigation(),
        [status, setStatus] = useState<PlayStatus>({
            isPlaying: false,
            isLoading: false,
            streamPosition: 0,
            maxPosition: 0,
            currentTime: '00:00',
            maxTime: '00:00',
        });

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
            if (!client) return;

            // Immediately update UI state for responsive feedback
            setStatus(prev => ({ ...prev, isPlaying: false, isLoading: true }));

            await client.pause();

            // Clear loading state after successful pause
            setStatus(prev => ({ ...prev, isLoading: false }));
        } catch (error) {
            console.error('Failed to pause:', error);
            // Revert the optimistic update on error
            setStatus(prev => ({ ...prev, isPlaying: true, isLoading: false }));
        }
    }, [client]);

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
            if (!client) return;

            // Immediately update UI state for responsive feedback
            setStatus(prev => ({ ...prev, isPlaying: true, isLoading: true }));

            await client.play();

            // Clear loading state after successful resume
            setStatus(prev => ({ ...prev, isLoading: false }));
        } catch (error) {
            console.error('Failed to resume:', error);
            // Revert the optimistic update on error
            setStatus(prev => ({ ...prev, isPlaying: false, isLoading: false }));
        }
    }, [client]);

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
                if (!client) return;

                // Immediately update UI state for responsive feedback
                setStatus(prev => ({ ...prev, isLoading: true }));

                const status = await client.getMediaStatus();
                if (!status) {
                    setStatus(prev => ({ ...prev, isLoading: false }));
                    return;
                }

                const newPosition = status.streamPosition + seconds;
                await client.seek({ position: newPosition });

                // Clear loading state after successful seek
                setStatus(prev => ({ ...prev, isLoading: false }));
            } catch (error) {
                console.error('Failed to seek forward:', error);
                // Clear loading state on error
                setStatus(prev => ({ ...prev, isLoading: false }));
            }
        },
        [client]
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
                if (!client) return;

                // Immediately update UI state for responsive feedback
                setStatus(prev => ({ ...prev, isLoading: true }));

                const status = await client.getMediaStatus();
                if (!status) {
                    setStatus(prev => ({ ...prev, isLoading: false }));
                    return;
                }

                const newPosition = Math.max(0, status.streamPosition - seconds);
                await client.seek({ position: newPosition });

                // Clear loading state after successful seek
                setStatus(prev => ({ ...prev, isLoading: false }));
            } catch (error) {
                console.error('Failed to seek backward:', error);
                // Clear loading state on error
                setStatus(prev => ({ ...prev, isLoading: false }));
            }
        },
        [client]
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
            if (!client) return;
            await client.stop();
            navigation.goBack();
        } catch (error) {
            console.error('Failed to stop:', error);
        }
    }, [client]);

    /**
     * Seeks to a specific position in the media playback.
     *
     * @param position - The position in seconds to seek to.
     * @returns A promise that resolves when the seek operation is complete.
     */
    const seekToPosition = useCallback(
        async (position: number) => {
            try {
                if (!client) return;

                // Immediately update UI state for responsive feedback
                setStatus(prev => ({
                    ...prev,
                    isLoading: true,
                    streamPosition: position,
                    currentTime: formatTimeFromSeconds(position),
                }));

                await client.seek({ position });

                // Clear loading state after successful seek
                setStatus(prev => ({ ...prev, isLoading: false }));
            } catch (error) {
                console.error('Failed to seek to position:', error);
                // Clear loading state on error
                setStatus(prev => ({ ...prev, isLoading: false }));
            }
        },
        [client, formatTimeFromSeconds]
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

    return { pause, resume, stop, seekBackward, seekForward, seekToPosition, status };
}
