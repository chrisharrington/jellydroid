import { SecondaryButton } from '@/components/button';
import { CastList } from '@/components/castList';
import { InfoTable } from '@/components/infoTable';
import { PlayButton } from '@/components/playButton';
import Spinner from '@/components/spinner';
import { Colours } from '@/constants/colours';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import { Image, ScrollView, Text, View } from 'react-native';
import { useMovieDetails } from './hook';
import style from './style';

export function MovieDetailsScreen() {
    const { isBusy, movie, backdrop, duration, onMovieWatchedPress } = useMovieDetails();

    return (
        <View style={{ flex: 1, backgroundColor: Colours.background }}>
            {isBusy ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Spinner size='md' />
                </View>
            ) : (
                movie && (
                    <ScrollView>
                        <Image source={{ uri: backdrop }} style={style.backdrop} resizeMode='cover' />
                        <View style={{ padding: 16, gap: 24 }}>
                            <View>
                                <View style={style.subHeader}>
                                    <View style={style.subHeaderEntries}>
                                        {movie.ProductionYear && (
                                            <>
                                                <Text style={style.subHeaderEntry}>{movie.ProductionYear}</Text>
                                                <Text style={style.divider}>/</Text>
                                            </>
                                        )}
                                        {duration && (
                                            <>
                                                <Text style={style.subHeaderEntry}>{duration}</Text>
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
                                                <Text style={style.subHeaderEntry}>
                                                    {movie.CommunityRating.toFixed(1)}
                                                </Text>
                                            </>
                                        )}
                                    </View>
                                    {movie.OfficialRating && <Text style={style.rating}>{movie.OfficialRating}</Text>}
                                </View>

                                <Text style={style.title}>{movie.Name}</Text>
                                {movie.Taglines?.length && <Text style={style.tagline}>{movie.Taglines[0]}</Text>}

                                <View style={style.buttonContainer}>
                                    <View style={style.playButton}>
                                        <PlayButton item={movie}>
                                            <FontAwesome name='play' size={18} color='white' />
                                        </PlayButton>
                                    </View>

                                    <View style={style.watchedButton}>
                                        <SecondaryButton onPress={onMovieWatchedPress}>
                                            <AntDesign name='checkcircle' size={18} color='white' />
                                        </SecondaryButton>
                                    </View>
                                </View>

                                <Text style={style.overview}>{movie.Overview}</Text>
                            </View>

                            <InfoTable item={movie} />

                            <CastList item={movie} />
                        </View>
                    </ScrollView>
                )
            )}
        </View>
    );
}
