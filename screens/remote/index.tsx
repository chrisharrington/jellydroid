import { Colours } from '@/constants/colours';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { ImageBackground, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRemoteScreen } from './hook';

export function RemoteScreen() {
    const { poster, status, item } = useRemoteScreen();

    return (
        <View style={styles.container}>
            {poster ? (
                <View style={styles.posterContainer}>
                    <ImageBackground source={{ uri: poster }} style={styles.posterBackground} blurRadius={10}>
                        <View style={styles.posterOverlay} />
                    </ImageBackground>
                </View>
            ) : (
                <View style={[styles.poster, { backgroundColor: Colours.background2 }]} />
            )}

            <View style={styles.titleContainer}>
                <Text style={styles.title}>{item?.Name || ''}</Text>
                <Text style={styles.year}>{item?.ProductionYear || ''}</Text>
                <Text style={styles.overview}>{item?.Overview || 'No overview available.'}</Text>
            </View>

            <View style={styles.progressControl}>
                <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>{status.currentTime}</Text>
                    <Text style={[styles.timeText, styles.timeRight]}>{status.maxTime}</Text>
                </View>
                <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={1}
                    value={0.3}
                    minimumTrackTintColor={Colours.icon}
                    maximumTrackTintColor={Colours.text}
                    thumbTintColor={Colours.icon}
                />
            </View>

            <View style={styles.controlBar}>
                <TouchableOpacity style={styles.button} activeOpacity={0.7}>
                    <MaterialIcons name='skip-previous' size={36} color='white' />
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} activeOpacity={0.7}>
                    <MaterialIcons name='replay-30' size={36} color='white' />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.playButton]} activeOpacity={0.7}>
                    <MaterialIcons name={status.isPlaying ? 'pause' : 'play-arrow'} size={48} color='white' />
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} activeOpacity={0.7}>
                    <MaterialIcons name='forward-10' size={36} color='white' />
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} activeOpacity={0.7}>
                    <MaterialIcons name='skip-next' size={36} color='white' />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colours.background,
        position: 'relative',
    },

    posterContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },

    posterBackground: {
        flex: 1,
        width: '100%',
    },

    posterOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colours.background,
        opacity: 0.7,
    },

    poster: {
        position: 'absolute',
        top: (StatusBar.currentHeight ?? 0) + 56,
        left: 0,
        right: 0,
        width: '100%',
        aspectRatio: 27 / 40, // Standard aspect ratio for movie posters.
        backgroundColor: Colours.background2,
    },

    controlBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        paddingHorizontal: 16,
        paddingBottom: 64,
    },

    button: {
        width: 56,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 28,
    },

    playButton: {
        transform: [{ scale: 1.2 }],
    },

    slider: {
        flex: 1,
        height: 40,
    },

    progressControl: {
        position: 'absolute',
        bottom: 120,
        left: 0,
        right: 0,
        paddingHorizontal: 32,
    },

    timeContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
    },

    timeText: {
        color: Colours.text,
        fontSize: 16,
        fontFamily: 'Lato-Regular',
    },

    timeRight: {
        textAlign: 'right',
    },

    titleContainer: {
        position: 'absolute',
        top: StatusBar.currentHeight ? StatusBar.currentHeight + 72 : 88,
        left: 0,
        right: 0,
        paddingHorizontal: 32,
    },

    title: {
        color: Colours.text,
        fontSize: 36,
        fontFamily: 'Lato-Bold',
        marginBottom: 4,
        fontWeight: 'bold',
    },

    year: {
        color: Colours.subtext,
        fontSize: 18,
        fontFamily: 'Lato-Regular',
        fontWeight: 'bold',
    },

    overview: {
        color: Colours.text,
        fontSize: 16,
        fontFamily: 'Lato-Regular',
        marginTop: 16,
    },
});
