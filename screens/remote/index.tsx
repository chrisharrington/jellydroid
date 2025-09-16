import { Spinner } from '@/components/spinner';
import { Colours } from '@/constants/colours';
import Slider from '@react-native-community/slider';
import { Text, View } from 'react-native';
import { TrickplayWindow } from '../video/trickPlayWindow';
import { RemoteControls } from './controls';
import { useRemoteScreen } from './hook';
import { Poster } from './poster';
import style from './style';

export function RemoteScreen() {
    const {
        item,
        pause,
        resume,
        seekForward,
        seekBackward,
        stop,
        poster,
        status,
        currentTime,
        maxTime,
        percentagePosition,
        screenWidth,
        handleSliderStart,
        handleSliderChange,
        handleSliderComplete,
        isBusy,
        isDragging,
    } = useRemoteScreen();

    return isBusy ? (
        <View style={style.loadingContainer}>
            <Spinner />
        </View>
    ) : (
        <View style={style.container}>
            <View style={style.content}>
                <Poster poster={poster} isDimmed={isDragging} />

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

                {item && (
                    <View style={[style.trickplayContainer, { width: screenWidth * 0.8, left: screenWidth * 0.1 }]}>
                        <TrickplayWindow
                            isVisible={isDragging}
                            item={item}
                            percentagePosition={percentagePosition}
                            width={screenWidth * 0.8}
                        />
                    </View>
                )}

                <RemoteControls
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
