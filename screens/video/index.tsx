import Spinner from '@/components/spinner';
import { VideoView } from 'expo-video';
import React, { useEffect } from 'react';
import { StatusBar, View } from 'react-native';
import { VideoControls } from './controls';
import { useVideoScreen } from './hook';
import style from './style';

export function VideoScreen() {
    const { isBusy, player } = useVideoScreen();

    // Hide status bar for fullscreen experience
    useEffect(() => {
        StatusBar.setHidden(true);

        return () => {
            StatusBar.setHidden(false);
        };
    }, []);

    return isBusy ? (
        <View style={style.loadingContainer}>
            <Spinner />
        </View>
    ) : (
        <View style={style.contentContainer}>
            <VideoView
                style={style.video}
                player={player}
                allowsFullscreen={false}
                requiresLinearPlayback
                showsTimecodes={false}
                allowsPictureInPicture={false}
                nativeControls={false}
            />
            <VideoControls player={player} />
        </View>
    );
}
