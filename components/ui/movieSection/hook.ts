import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useRouter } from 'expo-router';

export function useMovieSection() {
    const { navigate } = useRouter();

    return {
        navigateToMovieDetails: (movie: BaseItemDto) => navigate(`./movie/${movie.Name}/${movie.Id}`),
    };
}
