import { MovieSection } from '@/components/movieSection';
import { TvSection } from '@/components/tvSection';
import { Colours } from '@/constants/colours';
import { ScrollView } from 'react-native';
import { useHome } from './hook';

export default function HomeScreen() {
    const { recentlyAddedMovies, recentlyAddedEpisodes, continueWatchingItems } = useHome();

    return (
        <ScrollView style={{ flex: 1, backgroundColor: Colours.background }}>
            <MovieSection label='Continue Watching' movies={continueWatchingItems} withProgressIndicator />
            <MovieSection label='Recently Added Movies' movies={recentlyAddedMovies} />
            <TvSection label='Recently Added Episodes' episodes={recentlyAddedEpisodes} />
        </ScrollView>
    );
}
