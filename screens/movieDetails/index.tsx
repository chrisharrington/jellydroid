import { CastList } from '@/components/castList';
import { InfoTable } from '@/components/infoTable';
import { PlayButton } from '@/components/playButton';
import Spinner from '@/components/spinner';
import { TogglePlayedButton } from '@/components/togglePlayedButton';
import { Colours } from '@/constants/colours';
import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ScrollView, Text, View } from 'react-native';
import { useMovieDetails } from './hook';
import style from './style';

export function MovieDetailsScreen() {
    const {
        isBusy,
        isForcedSubtitleTrackAvailable: isForcedSubtitlesAvailable,
        isSubtitleTrackAvailable: isSubtitlesAvailable,
        movie,
        backdrop,
        duration,
    } = useMovieDetails();

    return (
        <View style={{ flex: 1, backgroundColor: Colours.background }}>
            {isBusy ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Spinner size='md' />
                </View>
            ) : (
                movie && (
                    <ScrollView>
                        <Image
                            source={{
                                uri: backdrop,
                            }}
                            style={style.backdrop}
                        />
                        <View style={{ padding: 16, gap: 24, paddingBottom: 48 }}>
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
                                                <Text style={style.divider}>/</Text>
                                            </>
                                        )}
                                        {movie.CriticRating && (
                                            <>
                                                <Image
                                                    source={require('@/assets/images/critic-icon.svg')}
                                                    style={style.criticIcon}
                                                    contentFit='contain'
                                                />
                                                <Text style={style.subHeaderEntry}>
                                                    {movie.CriticRating.toFixed(1)}
                                                </Text>
                                                <Text style={style.divider}>/</Text>
                                            </>
                                        )}
                                        {movie.OfficialRating && (
                                            <>
                                                <Text style={style.subHeaderEntry}>{movie.OfficialRating}</Text>
                                            </>
                                        )}
                                    </View>
                                </View>

                                <Text style={style.title}>{movie.Name}</Text>

                                {movie.Taglines?.[0] && <Text style={style.tagline}>{movie.Taglines[0]}</Text>}

                                <View style={style.buttonContainer}>
                                    <View style={style.playButton}>
                                        <PlayButton item={movie} />
                                    </View>

                                    <View style={style.additionalButton}>
                                        <TogglePlayedButton item={movie} />
                                    </View>
                                </View>

                                <Text style={style.overview}>{movie.Overview}</Text>
                            </View>

                            <View style={{ marginTop: 0 }}>
                                <CastList item={movie} />
                            </View>

                            <InfoTable
                                item={movie}
                                isForcedSubtitlesAvailable={isForcedSubtitlesAvailable}
                                isSubtitlesAvailable={isSubtitlesAvailable}
                            />
                        </View>
                    </ScrollView>
                )
            )}
        </View>
    );
}
