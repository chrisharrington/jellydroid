import { useToast } from '@/components/toast';
import { useCast } from '@/contexts/cast';
import { useJellyfin } from '@/contexts/jellyfin';
import { useAsyncEffect } from '@/hooks/asyncEffect';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

export function useRemoteScreen() {
    const { getItem, getImageForId } = useJellyfin(),
        { status } = useCast(),
        [isBusy, setBusy] = useState<boolean>(false),
        [isDragging, setDragging] = useState<boolean>(false),
        [isForcedSubtitlesAvailable, setForcedSubtitlesAvailable] = useState<boolean>(false),
        [isForcedSubtitlesEnabled, setForcedSubtitlesEnabled] = useState<boolean>(false),
        [isSubtitlesAvailable, setSubtitlesAvailable] = useState<boolean>(false),
        [isSubtitlesEnabled, setSubtitlesEnabled] = useState<boolean>(false),
        [dragTime, setDragTime] = useState<number>(0),
        [item, setItem] = useState<BaseItemDto | null>(null),
        [poster, setPoster] = useState<string | null>(null),
        params = useLocalSearchParams<{ itemId: string; mediaSourceId: string }>(),
        playback = useCast(),
        navigation = useNavigation(),
        toast = useToast();

    useAsyncEffect(async () => {
        try {
            // Initialize the remote media client and fetch item details.
            setBusy(true);

            // Ensure the client is available before proceeding.
            const item = await getItem(params.itemId);
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

    return {
        ...playback,
        stop: useCallback(() => {
            playback.stop();
            navigation.goBack();
        }, [navigation, playback]),
        item,
        poster,
        status,
        handleSliderStart: () => setDragging(true),
        handleSliderChange,
        handleSliderComplete,
        handleSubtitleToggle: () => setSubtitlesEnabled(v => !v),
        handleForcedSubtitleToggle: () => setForcedSubtitlesEnabled(v => !v),
        currentTime: formatTimeFromSeconds(isDragging ? dragTime : status.streamPosition),
        maxTime: useMemo(() => formatTimeFromSeconds(status.maxPosition), [item]),
        isBusy,
        isSubtitlesAvailable,
        isSubtitlesEnabled,
        isForcedSubtitlesAvailable,
        isForcedSubtitlesEnabled,
    };

    /**
     * Formats seconds into H:MM:SS format (always shows hours with single digit).
     */
    function formatTimeFromSeconds(seconds: number): string {
        if (!seconds || seconds < 0) return '0:00:00';

        const hours = Math.floor(seconds / 3600),
            minutes = Math.floor((seconds % 3600) / 60),
            secs = Math.floor(seconds % 60);

        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Handles slider position changes during dragging.
     * Updates both the drag position and the corresponding time.
     * @param value - The new slider position value
     */
    function handleSliderChange(value: number) {
        setDragTime(value);
    }

    /**
     * Handles the completion of slider movement by updating dragging state and seeking to a new position.
     * @param value - The position value to seek to, represented as a number
     * @returns void
     */
    function handleSliderComplete(value: number) {
        setDragging(false);
        playback.seekToPosition(value);
    }
}
