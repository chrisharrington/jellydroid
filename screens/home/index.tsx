import { MovieSection } from '@/components/movieSection';
import { Colours } from '@/constants/colours';
import { ScrollView } from 'react-native';
import { useHome } from './hook';

export default function HomeScreen() {
    const { recentlyAddedMovies, continueWatchingItems } = useHome();

    return (
        <ScrollView style={{ flex: 1, backgroundColor: Colours.background }}>
            <MovieSection label='Continue Watching' movies={continueWatchingItems} withProgressIndicator />
            <MovieSection label='Recently Added' movies={recentlyAddedMovies} />
        </ScrollView>
    );
}
