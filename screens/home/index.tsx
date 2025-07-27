import { MovieSection } from '@/components/ui/movieSection';
import { Colours } from '@/constants/colours';
import { ScrollView } from 'react-native';
import { useHome } from './hook';

export default function HomeScreen() {
    const { recentlyAddedMovies } = useHome();

    return (
        <ScrollView style={{ flex: 1, backgroundColor: Colours.background }}>
            <MovieSection label='recently added' movies={recentlyAddedMovies} />
        </ScrollView>
    );
}
