import Spinner from '@/components/ui/spinner';
import { Colours } from '@/constants/colours';
import { Image, Text, View } from 'react-native';
import { useMovieDetails } from './hook';
import styles from './style';

export function MovieDetailsScreen() {
    const { isBusy, movie, backdrop } = useMovieDetails();

    return (
        <View style={{ flex: 1, backgroundColor: Colours.background }}>
            {isBusy ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Spinner size='md' />
                </View>
            ) : (
                movie && (
                    <>
                        <Image source={{ uri: backdrop }} style={styles.backdrop} resizeMode='cover' />
                        <View style={{ padding: 16 }}>
                            <Text style={styles.title}>{movie.Name}</Text>
                            <Text style={styles.year}>{movie.ProductionYear}</Text>
                            <Text style={styles.overview}>{movie.Overview}</Text>
                        </View>
                    </>
                )
            )}
        </View>
    );
}
