import { SelectorOption } from '@/components/selector';
import { useAsyncEffect } from '@/hooks/asyncEffect';
import { useInterpolatedTime } from '@/hooks/interpolatedTime';
import { useJellyfin } from '@/hooks/jellyfin';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MediaPlayerState, useRemoteMediaClient } from 'react-native-google-cast';

type PlayStatus = {
    isPlaying: boolean;
    isLoading: boolean;
    streamPosition: number;
    maxPosition: number;
    currentTime: string;
    maxTime: string;
};

const subtitleOptions: SelectorOption[] = [
    { label: 'None', value: 'none' },
    { label: 'English', value: 'en' },
    { label: 'Spanish', value: 'es' },
    { label: 'French', value: 'fr' },
    { label: 'German', value: 'de' },
    { label: 'Italian', value: 'it' },
    { label: 'Portuguese', value: 'pt' },
    { label: 'Japanese', value: 'ja' },
];

const audioOptions: SelectorOption[] = [
    { label: 'English', value: 'en' },
    { label: 'Spanish', value: 'es' },
    { label: 'French', value: 'fr' },
    { label: 'German', value: 'de' },
    { label: 'Italian', value: 'it' },
    { label: 'Portuguese', value: 'pt' },
    { label: 'Japanese', value: 'ja' },
    { label: 'Russian', value: 'ru' },
];

export function useRemoteScreen() {
    const client = useRemoteMediaClient(),
        { getItemDetails, getPosterForItem } = useJellyfin(),
        [isBusy, setBusy] = useState<boolean>(false),
        [isDragging, setDragging] = useState<boolean>(false),
        [dragPosition, setDragPosition] = useState<number>(0),
        [item, setItem] = useState<BaseItemDto | null>(null),
        [poster, setPoster] = useState<string | null>(null),
        [selectedSubtitle, setSelectedSubtitle] = useState<string>('none'),
        [selectedAudio, setSelectedAudio] = useState<string>('en'),
        [showAudioPopover, setShowAudioPopover] = useState<boolean>(false),
        [showSubtitlePopover, setShowSubtitlePopover] = useState<boolean>(false),
        [status, setStatus] = useState<PlayStatus>({
            isPlaying: false,
            isLoading: false,
            streamPosition: 0,
            maxPosition: 0,
            currentTime: '00:00',
            maxTime: '00:00',
        }),
        [localTime, setLocalTime] = useState<number>(0),
        [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now()),
        params = useLocalSearchParams<{ id: string }>(),
        navigation = useNavigation(),
        currentInterpolatedTime = useInterpolatedTime(localTime, status.isPlaying, lastUpdateTime);

    useAsyncEffect(async () => {
        if (!params.id) return;

        try {
            setBusy(true);

            const item = await getItemDetails(params.id);
            if (!item) throw new Error('Item not found.');

            setItem(item);
            setPoster(getPosterForItem(item));
        } catch (e) {
            console.error('Failed to initialize remote media client:', e);
        } finally {
            setBusy(false);
        }
    }, []);

    /**
     * Formats seconds into MM:SS or HH:MM:SS format.
     */
    const formatTimeFromSeconds = useCallback((seconds: number): string => {
        if (!seconds || seconds < 0) return '00:00';

        const hours = Math.floor(seconds / 3600),
            minutes = Math.floor((seconds % 3600) / 60),
            secs = Math.floor(seconds % 60);

        return hours > 0
            ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs
                  .toString()
                  .padStart(2, '0')}`
            : `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    /**
     * Updates the media status by fetching current playback information from the remote media client.
     * This includes play state, stream position, duration, and formatted time strings.
     */
    const updateMediaStatus = useCallback(async () => {
        try {
            if (!client) return;

            const mediaStatus = await client.getMediaStatus();
            if (!mediaStatus) return;

            const mediaInfo = mediaStatus.mediaInfo,
                duration = mediaInfo?.streamDuration || 0,
                position = (await client.getStreamPosition()) || 0,
                playerState = mediaStatus.playerState;

            const now = Date.now();
            setLastUpdateTime(now);
            setLocalTime(position);

            setStatus({
                isPlaying: playerState === MediaPlayerState.PLAYING,
                isLoading: playerState !== MediaPlayerState.PLAYING && playerState !== MediaPlayerState.PAUSED,
                streamPosition: position,
                maxPosition: duration,
                currentTime: formatTimeFromSeconds(position),
                maxTime: formatTimeFromSeconds(duration),
            });
        } catch (error) {
            console.error('Failed to update media status:', error);
        }
    }, [client, formatTimeFromSeconds]);

    // Listen for media status changes and poll at different frequencies
    useEffect(() => {
        if (!client) return;

        // Initial status update
        updateMediaStatus();

        // Set up event listeners for immediate updates
        const statusListener = client.onMediaStatusUpdated?.(status => {
            updateMediaStatus();
        });

        const progressListener = client.onMediaProgressUpdated?.(progress => {
            updateMediaStatus();
        });

        // Use shorter interval for more responsive time updates during playback
        const interval = setInterval(updateMediaStatus, 250); // 4 times per second

        return () => {
            clearInterval(interval);
            // Clean up listeners if they exist
            statusListener?.remove?.();
            progressListener?.remove?.();
        };
    }, [client, updateMediaStatus]);

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
     * Changes the subtitle track for the current media playback.
     *
     * @param subtitleValue - The value of the subtitle track to switch to.
     * @remarks
     * - If the client is not available, the function exits early.
     * - Updates the selected subtitle state when successful.
     * - Any errors encountered during the operation are logged to the console.
     */
    const changeSubtitle = useCallback(
        async (subtitleValue: string) => {
            try {
                if (!client) return;

                // TODO: Implement actual subtitle switching logic with Google Cast
                // await client.setActiveTrackIds([subtitleTrackId]);

                setSelectedSubtitle(subtitleValue);
            } catch (error) {
                console.error('Failed to change subtitle:', error);
            }
        },
        [client]
    );

    /**
     * Changes the audio track for the current media playback.
     *
     * @param audioValue - The value of the audio track to switch to.
     * @remarks
     * - If the client is not available, the function exits early.
     * - Updates the selected audio state when successful.
     * - Any errors encountered during the operation are logged to the console.
     */
    const changeAudio = useCallback(
        async (audioValue: string) => {
            try {
                if (!client) return;

                // TODO: Implement actual audio track switching logic with Google Cast
                // await client.setActiveTrackIds([audioTrackId]);

                setSelectedAudio(audioValue);
            } catch (error) {
                console.error('Failed to change audio track:', error);
            }
        },
        [client]
    );

    /**
     * Handles the completion of slider movement by updating dragging state and seeking to a new position.
     * @param value - The position value to seek to, represented as a number
     * @returns void
     */
    const handleSliderComplete = useCallback(
        (value: number) => {
            setDragging(false);
            seekToPosition(value);
        },
        [seekToPosition]
    );

    /**
     * Formats a time duration in seconds into a human-readable string format.
     * Returns time in either "MM:SS" or "HH:MM:SS" format depending on the duration.
     *
     * @param seconds - The number of seconds to format
     * @returns A formatted string representation of the time duration
     * - Returns "00:00" if seconds is null or negative
     * - Returns "HH:MM:SS" format if hours > 0
     * - Returns "MM:SS" format if hours = 0
     *
     * @example
     * formatTimeForDrag(3661) // returns "01:01:01"
     * formatTimeForDrag(61) // returns "01:01"
     * formatTimeForDrag(-1) // returns "00:00"
     */
    const formatTimeForDrag = useCallback((seconds: number): string => {
        if (seconds == null || seconds < 0) return '00:00';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs
                .toString()
                .padStart(2, '0')}`;
        }

        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    return {
        pause,
        resume,
        seekForward,
        seekBackward,
        stop,
        changeSubtitle,
        changeAudio,
        item,
        poster,
        selectedSubtitle,
        subtitleOptions,
        selectedAudio,
        audioOptions,
        showAudioPopover,
        setShowAudioPopover,
        showSubtitlePopover,
        setShowSubtitlePopover,
        status: {
            ...status,
            // Use interpolated time for smoother display
            currentTime: isDragging ? formatTimeForDrag(dragPosition) : formatTimeFromSeconds(currentInterpolatedTime),
            streamPosition: isDragging ? dragPosition : currentInterpolatedTime,
        },
        handleSliderStart: () => setDragging(true),
        handleSliderChange: setDragPosition,
        handleSliderComplete,
        currentTime: useMemo(
            () => (isDragging ? formatTimeForDrag(dragPosition) : formatTimeFromSeconds(currentInterpolatedTime)),
            [dragPosition, isDragging, currentInterpolatedTime, formatTimeForDrag, formatTimeFromSeconds]
        ),
        streamPosition: useMemo(
            () => (isDragging ? dragPosition : currentInterpolatedTime),
            [isDragging, dragPosition, currentInterpolatedTime]
        ),
        isBusy,
    };
}
