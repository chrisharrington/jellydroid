import { useToast } from '@/components/toast';
import { useAsyncEffect } from '@/hooks/asyncEffect';
import { useJellyfin } from '@/hooks/jellyfin';
import { formatDuration } from '@/shared/formatDuration';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useRoute } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';

export function useMovieDetails() {
    const { id, name } = useRoute().params as { id: string; name: string },
        [movie, setMovie] = useState<BaseItemDto | null>(null),
        [isBusy, setBusy] = useState<boolean>(false),
        { getItemDetails: getMovieDetails } = useJellyfin(),
        toast = useToast();

    useAsyncEffect(async () => {
        try {
            setBusy(true);

            const localMovie = await getMovieDetails(id);
            if (!localMovie) throw new Error('Movie not found.');

            setMovie(localMovie);
        } catch (error) {
            toast.error('Failed to fetch movie details. Try again later.');
            console.error('Failed to fetch movie details:', error);
        } finally {
            setBusy(false);
        }
    }, [name]);

    const onMovieWatchedPress = useCallback(() => {
        if (!movie) return;
        toast.success(`${movie.Name} has been marked as watched.`);
    }, [movie]);

    return {
        movie,
        duration: useMemo(() => formatDuration(movie?.RunTimeTicks || 0), [movie]),
        isBusy,
        backdrop: useMemo(
            () => `${process.env.EXPO_PUBLIC_JELLYFIN_URL}/Items/${movie?.Id}/Images/Backdrop/0`,
            [movie]
        ),
        onMovieWatchedPress,
    };
}
