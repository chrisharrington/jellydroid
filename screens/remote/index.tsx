import { Spinner } from '@/components/spinner';
import { Colours } from '@/constants/colours';
import Slider from '@react-native-community/slider';
import { Image, Text, View } from 'react-native';
import { AudioSelector } from '../../components/audio';
import { SubtitleSelector } from '../../components/subtitles';
import { ControlBar } from './controlBar';
import { useRemoteScreen } from './hook';
import style from './style';

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
        currentTime,
        maxTime,
        handleSliderStart,
        handleSliderChange,
        handleSliderComplete,
        isBusy,
    } = useRemoteScreen();

    return isBusy ? (
        <View style={style.loadingContainer}>
            <Spinner />
        </View>
    ) : (
        <View style={style.container}>
            <View style={style.content}>
                <View style={style.posterContainer}>
                    {poster && <Image source={{ uri: poster }} style={style.poster} />}
                </View>

                <View style={style.selectorsContainer}>
                    <AudioSelector
                        audioOptions={audioOptions}
                        selectedAudio={selectedAudio}
                        onSelectAudio={changeAudio}
                    />

                    <SubtitleSelector
                        subtitleOptions={subtitleOptions}
                        selectedSubtitleIndex={selectedSubtitle}
                        onSelectSubtitle={changeSubtitle}
                    />
                </View>

                <View style={style.progressControl}>
                    <View style={style.timeContainer}>
                        <Text style={style.timeText}>{currentTime}</Text>
                        <Text style={[style.timeText, style.timeRight]}>{maxTime}</Text>
                    </View>
                    <Slider
                        style={style.slider}
                        minimumValue={0}
                        maximumValue={status.maxPosition}
                        value={status.streamPosition}
                        onSlidingStart={handleSliderStart}
                        onValueChange={handleSliderChange}
                        onSlidingComplete={handleSliderComplete}
                        minimumTrackTintColor={Colours.primary}
                        maximumTrackTintColor={Colours.text}
                        thumbTintColor={Colours.primary}
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
