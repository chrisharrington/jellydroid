import Spinner from '@/components/ui/spinner';
import { Colours } from '@/constants/colours';
import { FontAwesome } from '@expo/vector-icons';
import { Image, Text, View } from 'react-native';
import { useMovieDetails } from './hook';
import styles from './style';

export function MovieDetailsScreen() {
    const { isBusy, movie, backdrop, duration } = useMovieDetails();

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
                            <View style={styles.infoContainer}>
                                {movie.ProductionYear && (
                                    <>
                                        <Text style={styles.info}>{movie.ProductionYear}</Text>
                                        <Text style={styles.divider}>/</Text>
                                    </>
                                )}
                                {duration && (
                                    <>
                                        <Text style={styles.info}>{duration}</Text>
                                        <Text style={styles.divider}>/</Text>
                                    </>
                                )}
                                {movie.Genres && movie.Genres.length > 0 && (
                                    <>
                                        <Text style={styles.info}>{movie.Genres.slice(0, 2).join(', ')}</Text>
                                        <Text style={styles.divider}>/</Text>
                                    </>
                                )}
                                {movie.CommunityRating && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <FontAwesome name='star' size={16} color='#FFD700' style={{ marginRight: 4 }} />
                                        <Text style={styles.info}>{movie.CommunityRating.toFixed(1)}</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.title}>{movie.Name}</Text>
                            <Text style={styles.overview}>{movie.Overview}</Text>
                        </View>
                    </>
                )
            )}
        </View>
    );
}
