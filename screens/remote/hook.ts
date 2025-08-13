import { SelectorOption } from '@/components/selector';
import { useCast } from '@/contexts/cast';
import { useAsyncEffect } from '@/hooks/asyncEffect';
import { useJellyfin } from '@/hooks/jellyfin';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

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
    const { getItemDetails, getPosterForItem, updatePlaybackProgress } = useJellyfin(),
        { status } = useCast(),
        [isBusy, setBusy] = useState<boolean>(false),
        [isDragging, setDragging] = useState<boolean>(false),
        [dragPosition, setDragPosition] = useState<number>(0),
        [item, setItem] = useState<BaseItemDto | null>(null),
        [poster, setPoster] = useState<string | null>(null),
        [selectedSubtitle, setSelectedSubtitle] = useState<string>('none'),
        [selectedAudio, setSelectedAudio] = useState<string>('en'),
        params = useLocalSearchParams<{ itemId: string; mediaSourceId: string }>(),
        playback = useCast(),
        navigation = useNavigation(),
        [currentTime, setCurrentTime] = useState<string>('00:00');

    useAsyncEffect(async () => {
        try {
            // Initialize the remote media client and fetch item details.
            setBusy(true);

            // Ensure the client is available before proceeding.
            const item = await getItemDetails(params.itemId);
            if (!item) throw new Error('Item not found.');

            // Set the item and poster for the current playback.
            setItem(item);
            setPoster(getPosterForItem(item));
        } catch (e) {
            console.error('Error retrieving item details:', e);
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
     * Changes the subtitle track for the current media playback.
     *
     * @param subtitleValue - The value of the subtitle track to switch to.
     * @remarks
     * - If the client is not available, the function exits early.
     * - Updates the selected subtitle state when successful.
     * - Any errors encountered during the operation are logged to the console.
     */
    const changeSubtitle = useCallback(async (subtitleValue: string) => {
        try {
            // TODO: Implement actual subtitle switching logic with Google Cast
            // await client.setActiveTrackIds([subtitleTrackId]);
            setSelectedSubtitle(subtitleValue);
        } catch (error) {
            console.error('Failed to change subtitle:', error);
        }
    }, []);

    /**
     * Changes the audio track for the current media playback.
     *
     * @param audioValue - The value of the audio track to switch to.
     * @remarks
     * - If the client is not available, the function exits early.
     * - Updates the selected audio state when successful.
     * - Any errors encountered during the operation are logged to the console.
     */
    const changeAudio = useCallback(async (audioValue: string) => {
        try {
            // TODO: Implement actual audio track switching logic with Google Cast
            // await client.setActiveTrackIds([audioTrackId]);
            setSelectedAudio(audioValue);
        } catch (error) {
            console.error('Failed to change audio track:', error);
        }
    }, []);

    /**
     * Handles the completion of slider movement by updating dragging state and seeking to a new position.
     * @param value - The position value to seek to, represented as a number
     * @returns void
     */
    const handleSliderComplete = useCallback(
        (value: number) => {
            setDragging(false);
            playback.seekToPosition(value);
        },
        [playback]
    );

    return {
        ...playback,
        stop: () => {
            playback.stop();
            navigation.goBack();
        },
        changeSubtitle,
        changeAudio,
        item,
        poster,
        selectedSubtitle,
        subtitleOptions,
        selectedAudio,
        audioOptions,
        status,
        handleSliderStart: () => setDragging(true),
        handleSliderChange: setDragPosition,
        handleSliderComplete,
        currentTime: formatTimeFromSeconds(status.streamPosition),
        maxTime: useMemo(() => formatTimeFromSeconds(status.maxPosition), [item]),
        isBusy,
    };

    /**
     * Updates the media status by fetching current playback information from the remote media client.
     * This includes play state, stream position, duration, and formatted time strings.
     */
    // async function updateMediaStatus() {
    //     try {
    //         if (!client) return;

    //         // Retrieve the current media status from the client.
    //         const mediaStatus = await client.getMediaStatus();
    //         if (!mediaStatus) return;

    //         // Extract media info and current position.
    //         const mediaInfo = mediaStatus.mediaInfo,
    //             duration = mediaInfo?.streamDuration || 0,
    //             position = (await client.getStreamPosition()) || 0,
    //             playerState = mediaStatus.playerState;

    //         // Update local time and last update timestamp.
    //         const now = Date.now();
    //         setLastUpdateTime(now);
    //         setLocalTime(position);

    //         // Update playback status based on media state.
    //         setStatus({
    //             isPlaying: playerState === MediaPlayerState.PLAYING,
    //             isLoading: playerState !== MediaPlayerState.PLAYING && playerState !== MediaPlayerState.PAUSED,
    //             streamPosition: position,
    //             maxPosition: duration,
    //             currentTime: formatTimeFromSeconds(position),
    //             maxTime: formatTimeFromSeconds(duration),
    //         });

    //         // Update playback progress with Jellyfin every 10 updates to prevent
    //         // bombarding the server.
    //         progressCounter.current += 1;
    //         if (progressCounter.current >= 10) {
    //             updatePlaybackProgress(
    //                 params.itemId,
    //                 params.mediaSourceId,
    //                 playback.playbackSessionId,
    //                 position,
    //                 status.isPlaying
    //             );
    //             progressCounter.current = 0;
    //         }
    //     } catch (error) {
    //         console.error('Failed to update media status:', error);
    //     }
    // }

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
    function formatTimeForDrag(seconds: number | null): string {
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
    }
}
