import { MovieSection } from '@/components/movieSection';
import Spinner from '@/components/spinner';
import { TvSection } from '@/components/tvSection';
import { Colours } from '@/constants/colours';
import { ScrollView, View } from 'react-native';
import { useHome } from './hook';

export default function HomeScreen() {
    const { isBusy, recentlyAddedMovies, recentlyAddedEpisodes, continueWatchingItems } = useHome();

    return (
        <View style={{ flex: 1, backgroundColor: Colours.background }}>
            {isBusy ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Spinner />
                </View>
            ) : (
                <ScrollView style={{ flex: 1 }}>
                    <MovieSection label='Continue Watching' movies={continueWatchingItems} withProgressIndicator />
                    <MovieSection label='Recently Added Movies' movies={recentlyAddedMovies} />
                    <TvSection label='Recently Added Episodes' episodes={recentlyAddedEpisodes} />
                </ScrollView>
            )}
        </View>
    );
}
