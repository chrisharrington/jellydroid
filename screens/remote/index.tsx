import { Spinner } from '@/components/spinner';
import { Colours } from '@/constants/colours';
import Slider from '@react-native-community/slider';
import { Image, Text, View } from 'react-native';
import { AudioSelector } from './audio';
import { ControlBar } from './controlBar';
import { useRemoteScreen } from './hook';
import styles from './style';
import { SubtitleSelector } from './subtitles';

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
                    <AudioSelector
                        audioOptions={audioOptions}
                        selectedAudio={selectedAudio}
                        onSelectAudio={changeAudio}
                    />

                    <SubtitleSelector
                        subtitleOptions={subtitleOptions}
                        selectedSubtitle={selectedSubtitle}
                        onSelectSubtitle={changeSubtitle}
                    />
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
                        testID='slider'
                    />
                </View>

                <ControlBar
                    stop={stop}
                    seekBackward={seekBackward}
                    pause={pause}
                    resume={resume}
                    seekForward={seekForward}
                    status={status}
                />
            </View>
        </View>
    );
}
