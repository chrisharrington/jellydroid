import { CastList } from '@/components/castList';
import { PlayButton } from '@/components/playButton';
import Spinner from '@/components/spinner';
import { Colours } from '@/constants/colours';
import { FontAwesome } from '@expo/vector-icons';
import { Image, Text, View } from 'react-native';
import { useMovieDetails } from './hook';
import style from './style';

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
                        <Image source={{ uri: backdrop }} style={style.backdrop} resizeMode='cover' />
                        <View style={{ padding: 16, gap: 24 }}>
                            <View>
                                <View style={style.infoContainer}>
                                    <View style={style.infoEntries}>
                                        {movie.ProductionYear && (
                                            <>
                                                <Text style={style.info}>{movie.ProductionYear}</Text>
                                                <Text style={style.divider}>/</Text>
                                            </>
                                        )}
                                        {duration && (
                                            <>
                                                <Text style={style.info}>{duration}</Text>
                                                <Text style={style.divider}>/</Text>
                                            </>
                                        )}
                                        {movie.CommunityRating && (
                                            <>
                                                <FontAwesome
                                                    name='star'
                                                    size={16}
                                                    color='#FFD700'
                                                    style={{ marginTop: 2 }}
                                                />
                                                <Text style={style.info}>{movie.CommunityRating.toFixed(1)}</Text>
                                            </>
                                        )}
                                    </View>
                                    {movie.OfficialRating && <Text style={style.rating}>{movie.OfficialRating}</Text>}
                                </View>
                                <Text style={style.title}>{movie.Name}</Text>
                                <View style={style.buttonContainer}>
                                    <PlayButton item={movie}>
                                        <FontAwesome name='play' size={18} color='white' />
                                    </PlayButton>
                                </View>
                                <Text style={style.overview}>{movie.Overview}</Text>
                            </View>

                            <CastList item={movie} />
                        </View>
                    </>
                )
            )}
        </View>
    );
}
