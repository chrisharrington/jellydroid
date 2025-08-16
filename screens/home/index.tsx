import { ItemSection } from '@/components/itemSection';
import { Colours } from '@/constants/colours';
import { ScrollView } from 'react-native';
import { useHome } from './hook';

export default function HomeScreen() {
    const { recentlyAddedMovies, continueWatchingItems } = useHome();

    return (
        <ScrollView style={{ flex: 1, backgroundColor: Colours.background }}>
            <ItemSection label='Continue Watching' movies={continueWatchingItems} />
            <ItemSection label='Recently Added' movies={recentlyAddedMovies} />
        </ScrollView>
    );
}
