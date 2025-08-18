import Spinner from '@/components/spinner';
import { Colours } from '@/constants/colours';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { VideoPlayer } from 'expo-video';
import React from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { useVideoControls } from './hook';
import style from './style';

export type VideoControlsProps = {
    player: VideoPlayer;
};

export function VideoControls({ player }: VideoControlsProps) {
    const {
        isVisible,
        isPlaying,
        isBusy,
        currentTime,
        duration,
        isSliding,
        sliderValue,
        thumbPosition,
        fadeAnim,
        handleVideoPress,
        handlePlayPause,
        handleSeekBackward,
        handleSeekForward,
        handleSliderStart,
        handleSliderChange,
        handleSliderComplete,
        formatTime,
        getSeekBarProgress,
    } = useVideoControls({ player });

    return (
        <>
            <TouchableOpacity style={style.overlay} onPress={handleVideoPress} activeOpacity={1} />

            {isVisible && (
                <Animated.View style={[style.visibleOverlay, { opacity: fadeAnim }]}>
                    <TouchableOpacity style={style.overlayTouchArea} onPress={handleVideoPress} activeOpacity={1}>
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
                            {/* Thumb panel that follows the slider thumb when dragging */}
                            {isSliding && (
                                <View
                                    style={[
                                        style.thumbPanel,
                                        {
                                            left: `${thumbPosition}%`,
                                            transform: [{ translateX: -40 }], // Center the panel on the thumb
                                        },
                                    ]}
                                >
                                    <View style={style.thumbPanelImage}>
                                        <MaterialIcons name='image' size={24} style={style.placeholderIcon} />
                                    </View>
                                    <Text style={style.thumbPanelText}>
                                        {formatTime((thumbPosition / 100) * duration)}
                                    </Text>
                                </View>
                            )}

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
