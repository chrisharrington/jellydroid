import Spinner from '@/components/spinner';
import { Colours } from '@/constants/colours';
import { formatTime } from '@/shared/formatTime';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import Slider from '@react-native-community/slider';
import { VideoPlayer } from 'expo-video';
import React from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { TrickplayWindow } from '../trickPlayWindow';
import { useVideoControls } from './hook';
import style from './style';

export type VideoControlsProps = {
    item: BaseItemDto;
    player: VideoPlayer;
};

export function VideoControls(props: VideoControlsProps) {
    const {
        isVisible,
        isPlaying,
        isBusy,
        isForcedSubtitlesAvailable,
        isForcedSubtitlesEnabled,
        isSubtitlesAvailable,
        isSubtitlesEnabled,
        currentTime,
        duration,
        isSliding,
        thumbPosition,
        fadeAnim,
        handleVideoPress,
        handlePlayPause,
        handleSeekBackward,
        handleSeekForward,
        handleSliderStart,
        handleSliderChange,
        handleSliderComplete,
        handleForcedSubtitlesToggle,
        handleSubtitlesToggle,
        getSeekBarProgress,
    } = useVideoControls(props);

    return (
        <>
            <TouchableOpacity style={style.overlay} onPress={handleVideoPress} activeOpacity={1} />

            {isVisible && (
                <Animated.View style={[style.visibleOverlay, { opacity: fadeAnim }]}>
                    <TouchableOpacity style={style.overlayTouchArea} onPress={handleVideoPress} activeOpacity={1}>
                        {/* Top-right buttons */}
                        <View style={style.topRightContainer}>
                            {isForcedSubtitlesAvailable && (
                                <TouchableOpacity
                                    style={style.topRightButton}
                                    onPress={() => handleForcedSubtitlesToggle(!isForcedSubtitlesEnabled)}
                                    activeOpacity={0.7}
                                >
                                    <Feather
                                        name='globe'
                                        size={24}
                                        color={isForcedSubtitlesEnabled ? Colours.primary : Colours.text}
                                    />
                                </TouchableOpacity>
                            )}

                            {isSubtitlesAvailable && (
                                <TouchableOpacity
                                    style={style.topRightButton}
                                    onPress={() => handleSubtitlesToggle(!isSubtitlesEnabled)}
                                    activeOpacity={0.7}
                                >
                                    <MaterialIcons
                                        name='subtitles'
                                        size={24}
                                        color={isSubtitlesEnabled ? Colours.primary : Colours.text}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={style.controlsContainer}>
                            <TouchableOpacity
                                style={style.controlButton}
                                onPress={handleSeekBackward}
                                activeOpacity={0.7}
                            >
                                <MaterialIcons name='replay-10' size={36} color='white' />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={style.playPauseButton}
                                onPress={handlePlayPause}
                                activeOpacity={0.7}
                            >
                                {isBusy && <Spinner />}
                                {!isBusy && (
                                    <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={48} color='white' />
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={style.controlButton}
                                onPress={handleSeekForward}
                                activeOpacity={0.7}
                            >
                                <MaterialIcons name='forward-30' size={36} color='white' />
                            </TouchableOpacity>
                        </View>

                        <View style={style.bottomContainer}>
                            <TrickplayWindow
                                percentagePosition={thumbPosition}
                                item={props.item}
                                isVisible={isSliding}
                            />

                            <View style={style.timeContainer}>
                                <Text style={[style.timeText, { marginLeft: 15 }]}>{formatTime(currentTime)}</Text>
                                <Text style={[style.timeText, { marginRight: 15 }]}>{formatTime(duration)}</Text>
                            </View>

                            <Slider
                                style={style.slider}
                                minimumValue={0}
                                maximumValue={100}
                                value={getSeekBarProgress()}
                                onSlidingStart={handleSliderStart}
                                onValueChange={handleSliderChange}
                                onSlidingComplete={handleSliderComplete}
                                minimumTrackTintColor={Colours.primary}
                                maximumTrackTintColor={Colours.subtext}
                                thumbTintColor={Colours.primary}
                            />
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </>
    );
}
