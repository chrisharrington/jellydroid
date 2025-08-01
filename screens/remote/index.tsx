import { Spinner } from '@/components/spinner';
import { Colours } from '@/constants/colours';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AudioModal } from './audioModal';
import { useRemoteScreen } from './hook';
import { SubtitleModal } from './subtitleModal';

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
        showAudioPopover,
        setShowAudioPopover,
        showSubtitlePopover,
        setShowSubtitlePopover,
        isBusy,
    } = useRemoteScreen();

    return isBusy ? (
        <View style={styles.loadingContainer}>
            <Spinner />
        </View>
    ) : (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.posterContainer}>
                    {poster && <Image source={{ uri: poster }} style={styles.poster} />}
                </View>

                <View style={styles.selectorsContainer}>
                    <View style={styles.selectorWrapper}>
                        <TouchableOpacity activeOpacity={0.7} onPress={() => setShowAudioPopover(true)}>
                            <View style={styles.selectorButton}>
                                <MaterialIcons
                                    name='volume-up'
                                    size={20}
                                    color={Colours.text}
                                    style={styles.selectorIcon}
                                />
                                <Text style={styles.selectorText}>
                                    {audioOptions.find(option => option.value === selectedAudio)?.label || 'English'}
                                </Text>
                                <MaterialIcons name='keyboard-arrow-down' size={20} color={Colours.text} />
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.selectorWrapper}>
                        <TouchableOpacity activeOpacity={0.7} onPress={() => setShowSubtitlePopover(true)}>
                            <View style={styles.selectorButton}>
                                <MaterialIcons
                                    name='subtitles'
                                    size={20}
                                    color={Colours.text}
                                    style={styles.selectorIcon}
                                />
                                <Text style={styles.selectorText}>
                                    {subtitleOptions.find(option => option.value === selectedSubtitle)?.label || 'None'}
                                </Text>
                                <MaterialIcons name='keyboard-arrow-down' size={20} color={Colours.text} />
                            </View>
                        </TouchableOpacity>
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

            <AudioModal
                visible={showAudioPopover}
                onClose={() => setShowAudioPopover(false)}
                audioOptions={audioOptions}
                selectedAudio={selectedAudio}
                onSelectAudio={changeAudio}
            />

            <SubtitleModal
                visible={showSubtitlePopover}
                onClose={() => setShowSubtitlePopover(false)}
                subtitleOptions={subtitleOptions}
                selectedSubtitle={selectedSubtitle}
                onSelectSubtitle={changeSubtitle}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colours.background,
    },

    content: {
        flex: 1,
        paddingHorizontal: 32,
    },

    loadingContainer: {
        flex: 1,
        backgroundColor: Colours.background,
        justifyContent: 'center',
        alignItems: 'center',
    },

    posterContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 12,
        paddingBottom: 16,
    },

    poster: {
        width: 320,
        maxHeight: '100%',
        aspectRatio: 300 / 515,
        borderRadius: 6,
        backgroundColor: Colours.background2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },

    selectorsContainer: {
        flexDirection: 'row',
        gap: 16,
        paddingVertical: 8,
        marginBottom: 12,
    },

    progressControl: {
        paddingVertical: 16,
    },

    controlBar: {
        height: 120,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 32,
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

    selectorWrapper: {
        flex: 1,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },

    selectorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 6,
        paddingHorizontal: 16,
        paddingVertical: 14,
        minHeight: 48,
    },

    selectorText: {
        color: Colours.text,
        fontSize: 16,
        fontFamily: 'Lato-Regular',
        flex: 1,
    },

    selectorIcon: {
        marginRight: 12,
    },
});
