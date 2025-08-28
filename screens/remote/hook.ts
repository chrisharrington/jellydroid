import { SelectorOption } from '@/components/selector';
import { useToast } from '@/components/toast';
import { useCast } from '@/contexts/cast';
import { useJellyfin } from '@/contexts/jellyfin';
import { useAsyncEffect } from '@/hooks/asyncEffect';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

const subtitleOptions: SelectorOption[] = [
    { label: 'None', value: null },
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
    const { loadItem, getImageForId } = useJellyfin(),
        { status } = useCast(),
        [isBusy, setBusy] = useState<boolean>(false),
        [isDragging, setDragging] = useState<boolean>(false),
        [dragPosition, setDragPosition] = useState<number>(0),
        [item, setItem] = useState<BaseItemDto | null>(null),
        [poster, setPoster] = useState<string | null>(null),
        [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null),
        [selectedAudio, setSelectedAudio] = useState<string | null>(null),
        params = useLocalSearchParams<{ itemId: string; mediaSourceId: string }>(),
        playback = useCast(),
        navigation = useNavigation(),
        toast = useToast();

    useAsyncEffect(async () => {
        try {
            // Initialize the remote media client and fetch item details.
            setBusy(true);

            // Ensure the client is available before proceeding.
            const item = await loadItem(params.itemId);
            if (!item) throw new Error('Item not found.');

            // Set the item and poster for the current playback.
            setItem(item);
            setPoster(getImageForId(item.Id!));
        } catch (e) {
            toast.error('Error retrieving item details:', e);
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
    const changeSubtitle = useCallback(async (subtitleValue: string | null) => {
        try {
            // TODO: Implement actual subtitle switching logic with Google Cast
            // await client.setActiveTrackIds([subtitleTrackId]);
            setSelectedSubtitle(subtitleValue);
        } catch (error) {
            toast.error('Failed to change subtitle:', error);
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
    const changeAudio = useCallback(async (audioValue: string | null) => {
        try {
            // TODO: Implement actual audio track switching logic with Google Cast
            setSelectedAudio(audioValue);
        } catch (error) {
            toast.error('Failed to change audio track:', error);
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
}
