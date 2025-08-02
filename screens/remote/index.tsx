import { Spinner } from '@/components/spinner';
import { Colours } from '@/constants/colours';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { AudioModal } from './audioModal';
import { useRemoteScreen } from './hook';
import styles from './style';
import { SubtitleModal } from './subtitleModal';

export function RemoteScreen() {
    const {
        pause,
        resume,
        seekForward,
        seekBackward,
        stop,
        changeSubtitle,
        changeAudio,
        poster,
        selectedSubtitle,
        subtitleOptions,
        selectedAudio,
        audioOptions,
        showAudioPopover,
        setShowAudioPopover,
        showSubtitlePopover,
        setShowSubtitlePopover,
        status,
        handleSliderStart,
        handleSliderChange,
        handleSliderComplete,
        currentTime,
        streamPosition,
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
                        <Text style={styles.timeText}>{currentTime}</Text>
                        <Text style={[styles.timeText, styles.timeRight]}>{status.maxTime || '00:00'}</Text>
                    </View>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={status.maxPosition}
                        value={streamPosition}
                        onSlidingStart={handleSliderStart}
                        onValueChange={handleSliderChange}
                        onSlidingComplete={handleSliderComplete}
                        minimumTrackTintColor={Colours.icon}
                        maximumTrackTintColor={Colours.text}
                        thumbTintColor={Colours.icon}
                    />
                </View>

                <View style={styles.controlBar}>
                    <TouchableOpacity style={styles.button} activeOpacity={0.7} onPress={stop}>
                        <MaterialIcons name='stop' size={36} color='white' />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.button} activeOpacity={0.7} onPress={() => seekBackward()}>
                        <MaterialIcons name='replay-10' size={36} color='white' />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.playButton]}
                        activeOpacity={0.7}
                        onPress={status.isLoading ? undefined : status.isPlaying ? pause : resume}
                        disabled={status.isLoading}
                    >
                        {status.isLoading ? (
                            <Spinner />
                        ) : (
                            <MaterialIcons name={status.isPlaying ? 'pause' : 'play-arrow'} size={48} color='white' />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.button} activeOpacity={0.7} onPress={() => seekForward()}>
                        <MaterialIcons name='forward-30' size={36} color='white' />
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
