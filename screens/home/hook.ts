import { useAsyncEffect } from '@/hooks/asyncEffect';
import { useJellyfin } from '@/hooks/jellyfin';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useState } from 'react';

export function useHome() {
    const { getRecentlyAddedMovies } = useJellyfin(),
        [recentlyAddedMovies, setRecentlyAddedMovies] = useState<BaseItemDto[]>([]);

    useAsyncEffect(async () => {
        setRecentlyAddedMovies(await getRecentlyAddedMovies());
    }, []);

    return { recentlyAddedMovies };
}
