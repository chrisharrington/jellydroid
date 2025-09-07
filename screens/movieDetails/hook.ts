import { useToast } from '@/components/toast';
import { useJellyfin } from '@/contexts/jellyfin';
import { useAsyncEffect } from '@/hooks/asyncEffect';
import { formatDuration } from '@/shared/formatDuration';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useRoute } from '@react-navigation/native';
import { useMemo, useState } from 'react';

export function useMovieDetails() {
    const { id, name } = useRoute().params as { id: string; name: string },
        [isBusy, setBusy] = useState<boolean>(false),
        [selectedItem, setSelectedItem] = useState<BaseItemDto | null>(null),
        { loadItem, downloadTrickplayImages, getSubtitleTrackMetadata } = useJellyfin(),
        [isForcedSubtitlesAvailable, setForcedSubtitlesAvailable] = useState<boolean>(false),
        [isSubtitlesAvailable, setSubtitlesAvailable] = useState<boolean>(false),
        toast = useToast();

    useAsyncEffect(async () => {
        if (!id || !name) return;

        try {
            setBusy(true);

            // Retrieve the movie details.
            const localMovie = await loadItem(id);
            if (!localMovie) throw new Error('Movie not found.');

            // Set the item for the screen.
            setSelectedItem(localMovie);

            // Download trickplay images and parse subtitle options from the HLS manifest.
            await downloadTrickplayImages(localMovie);

            // Determine available subtitle tracks.
            const subtitles = getSubtitleTrackMetadata(localMovie).filter(sub => sub.language === 'eng');
            setSubtitlesAvailable(subtitles.length > 0);
            setForcedSubtitlesAvailable(subtitles.some(sub => sub.isForced));
        } catch (error) {
            toast.error('Failed to fetch movie details. Try again later.', error);
        } finally {
            setBusy(false);
        }
    }, [id, name]);

    return {
        movie: selectedItem,
        duration: useMemo(() => formatDuration(selectedItem?.RunTimeTicks || 0), [selectedItem]),
        isBusy,
        isForcedSubtitlesAvailable,
        isSubtitlesAvailable,
        backdrop: useMemo(
            () => `${process.env.EXPO_PUBLIC_JELLYFIN_URL}/Items/${selectedItem?.Id}/Images/Backdrop/0`,
            [selectedItem]
        ),
    };
}
