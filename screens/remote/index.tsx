import { Colours } from '@/constants/colours';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import { ImageBackground, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRemoteScreen } from './hook';

export function RemoteScreen() {
    const {
        poster,
        status,
        item,
        selectedSubtitle,
        subtitleOptions,
        changeSubtitle,
        selectedAudio,
        audioOptions,
        changeAudio,
    } = useRemoteScreen();

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
            </View>

            <View style={styles.audioContainer}>
                <Text style={styles.audioLabel}>Audio</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={selectedAudio}
                        onValueChange={(itemValue: string) => changeAudio(itemValue)}
                        style={styles.picker}
                        dropdownIconColor={Colours.text}
                    >
                        {audioOptions.map(option => (
                            <Picker.Item
                                key={option.value}
                                label={option.label}
                                value={option.value}
                                color={Colours.text}
                            />
                        ))}
                    </Picker>
                </View>
            </View>

            <View style={styles.subtitleContainer}>
                <Text style={styles.subtitleLabel}>Subtitles</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={selectedSubtitle}
                        onValueChange={(itemValue: string) => changeSubtitle(itemValue)}
                        style={styles.picker}
                        dropdownIconColor={Colours.text}
                    >
                        {subtitleOptions.map(option => (
                            <Picker.Item
                                key={option.value}
                                label={option.label}
                                value={option.value}
                                color={Colours.text}
                            />
                        ))}
                    </Picker>
                </View>
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
        backgroundColor: Colours.background,
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

    subtitleContainer: {
        position: 'absolute',
        bottom: 200,
        left: 0,
        right: 0,
        paddingHorizontal: 32,
        marginVertical: 16,
    },

    audioContainer: {
        position: 'absolute',
        bottom: 320,
        left: 0,
        right: 0,
        paddingHorizontal: 32,
        marginBottom: 16,
    },

    subtitleLabel: {
        color: Colours.text,
        fontSize: 16,
        fontFamily: 'Lato-Bold',
        marginBottom: 8,
    },

    audioLabel: {
        color: Colours.text,
        fontSize: 16,
        fontFamily: 'Lato-Bold',
        marginBottom: 8,
    },

    pickerContainer: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
    },

    picker: {
        color: Colours.text,
        height: 60,
    },
});
