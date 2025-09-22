import { PrimaryButton } from '@/components/button';
import { ItemSection } from '@/components/itemSection';
import { MovieSection } from '@/components/movieSection';
import Spinner from '@/components/spinner';
import { TvSection } from '@/components/tvSection';
import { Colours } from '@/constants/colours';
import { ScrollView, View } from 'react-native';
import { useHome } from './hook';

export default function HomeScreen() {
    const {
        isBusy,
        recentlyAddedMovies,
        recentlyAddedEpisodes,
        continueWatchingItems,
        navigateToItem,
        navigateToMovies,
        navigateToTvShows,
    } = useHome();

    return (
        <View style={{ flex: 1, backgroundColor: Colours.background }}>
            {isBusy ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Spinner />
                </View>
            ) : (
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
                    {continueWatchingItems.length > 0 ? (
                        <ItemSection
                            label='Continue Watching'
                            items={continueWatchingItems}
                            withProgressIndicator
                            onItemSelected={navigateToItem}
                        />
                    ) : (
                        <></>
                    )}
                    {recentlyAddedMovies.length > 0 ? (
                        <MovieSection label='Recently Added Movies' movies={recentlyAddedMovies} />
                    ) : (
                        <></>
                    )}
                    {recentlyAddedEpisodes.length > 0 ? (
                        <TvSection label='Recently Added Episodes' episodes={recentlyAddedEpisodes} />
                    ) : (
                        <></>
                    )}

                    <View style={{ flex: 1, marginHorizontal: 16, flexDirection: 'row', gap: 24 }}>
                        <View style={{ flex: 1 }}>
                            <PrimaryButton text='See All Movies' onPress={navigateToMovies} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <PrimaryButton text='See All TV Shows' onPress={navigateToTvShows} />
                        </View>
                    </View>
                </ScrollView>
            )}
        </View>
    );
}
