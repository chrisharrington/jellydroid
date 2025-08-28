import { useToast } from '@/components/toast';
import { useJellyfin } from '@/contexts/jellyfin';
import { useAsyncEffect } from '@/hooks/asyncEffect';
import { formatDuration } from '@/shared/formatDuration';
import { MediaStreamType } from '@jellyfin/sdk/lib/generated-client/models';
import { useRoute } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';

export function useMovieDetails() {
    const { id, name } = useRoute().params as { id: string; name: string },
        [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null),
        [selectedAudio, setSelectedAudio] = useState<string | null>(null),
        [isBusy, setBusy] = useState<boolean>(false),
        { loadItem, selectedItem, downloadTrickplayImages } = useJellyfin(),
        toast = useToast();

    useAsyncEffect(async () => {
        try {
            setBusy(true);

            // Retrieve the movie details.
            const localMovie = await loadItem(id);
            if (!localMovie) throw new Error('Movie not found.');

            // Download trickplay images.
            await downloadTrickplayImages(localMovie);

            // Set the default audio stream.
            setSelectedAudio(
                localMovie?.MediaStreams?.find(stream => stream.Type === MediaStreamType.Audio)?.Index?.toString() ||
                    null
            );
        } catch (error) {
            toast.error('Failed to fetch movie details. Try again later.', error);
        } finally {
            setBusy(false);
        }
    }, [name]);

    /**
     * Retrieves an array of subtitle options for a movie.
     * @returns An array of subtitle options where each option has a value and label.
     *          The first option is always "None" with a null value.
     *          Subsequent options are derived from the movie's MediaStreams of type Subtitle.
     * @example
     * // Returns an array like:
     * // [
     * //   { value: null, label: 'None' },
     * //   { value: '1', label: 'English' },
     * //   { value: '2', label: 'Spanish' }
     * // ]
     */
    const getSubtitleOptions = useCallback(() => {
        const subtitleStreams =
            selectedItem?.MediaStreams?.filter(stream => !!stream && stream.Type === MediaStreamType.Subtitle).map(
                subtitle => ({
                    value: subtitle.Index?.toString() || (subtitle.DisplayTitle as string),
                    label: subtitle.DisplayTitle || 'Unknown',
                })
            ) || [];

        return [{ value: null, label: 'None' }, ...subtitleStreams];
    }, [selectedItem]);

    /**
     * Retrieves a list of audio stream options from the movie's media streams.
     *
     * @returns An array of audio options, where each option contains a value and label.
     *          The first option is always "None" with a null value, followed by available audio streams.
     *          Each audio stream option includes:
     *          - value: The stream index or display title as string
     *          - label: The display title or "Unknown" if not available
     */
    const getAudioOptions = useCallback(() => {
        const audioStreams =
            selectedItem?.MediaStreams?.filter(stream => !!stream && stream.Type === MediaStreamType.Audio).map(
                audio => ({
                    value: audio.Index?.toString() || (audio.DisplayTitle as string),
                    label: audio.DisplayTitle || 'Unknown',
                })
            ) || [];

        return [{ value: null, label: 'None' }, ...audioStreams];
    }, [selectedItem]);

    return {
        movie: selectedItem,
        subtitleOptions: getSubtitleOptions(),
        audioOptions: getAudioOptions(),
        selectedSubtitle,
        selectedAudio,
        duration: useMemo(() => formatDuration(selectedItem?.RunTimeTicks || 0), [selectedItem]),
        isBusy,
        backdrop: useMemo(
            () => `${process.env.EXPO_PUBLIC_JELLYFIN_URL}/Items/${selectedItem?.Id}/Images/Backdrop/0`,
            [selectedItem]
        ),
        onSubtitleSelected: useCallback((subtitle: string | null) => setSelectedSubtitle(subtitle), [selectedItem]),
        onAudioSelected: useCallback((audio: string | null) => setSelectedAudio(audio), [selectedItem]),
    };
}
