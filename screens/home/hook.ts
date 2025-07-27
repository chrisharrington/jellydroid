import { useAsyncEffect } from '@/hooks/useAsyncEffect';
import { useJellyfin } from '@/hooks/useJellyfin';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useState } from 'react';

export function useHome() {
    const { getRecentlyAddedMovies } = useJellyfin(),
        [recentlyAddedMovies, setRecentlyAddedMovies] = useState<BaseItemDto[]>([]);

    useAsyncEffect(async () => {
        // const movie = await findMovieByName('Game Night');
        // console.log('Found movie:', movie);
        setRecentlyAddedMovies(await getRecentlyAddedMovies());
    }, []);

    return { recentlyAddedMovies };
}
