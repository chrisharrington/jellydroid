import { Spinner } from '@/components/spinner';
import { SubtitleSelector } from '@/components/subtitleSelector';
import { Colours } from '@/constants/colours';
import { PlayStatus } from '@/contexts/cast';
import { MaterialIcons } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';
import { useRemoteControls } from './hook';
import styles from './style';

export type RemoteControlsProps = {
    /** Required. Function to stop playback. */
    stop: () => void;

    /** Required. Function to seek backward in the media. */
    seekBackward: () => void;

    /** Required. Function to pause playback. */
    pause: () => void;

    /** Required. Function to resume playback. */
    resume: () => void;

    /** Required. Function to seek forward in the media. */
    seekForward: () => void;

    /** Required. Object containing playback status.
     *  @property {boolean} isBusy - Indicates if player is in a loading state.
     *  @property {boolean} isPlaying - Indicates if media is currently playing.
     */
    status: PlayStatus;
};

export function RemoteControls(props: RemoteControlsProps) {
    const {
            handlePlayPause,
            handleSubtitleButtonPress,
            handleSubtitleSelection,
            isSubtitleTrackEnabled,
            isSubtitleTrackAvailable,
            isForcedSubtitleTrackAvailable,
            isSubtitleSelectorVisible,
            setSubtitleSelectorVisible,
            selectedSubtitleName,
        } = useRemoteControls(props),
        { stop, seekBackward, seekForward, status } = props;

    return (
        <View style={styles.controlBar} testID='control-bar'>
            <TouchableOpacity style={styles.button} activeOpacity={0.7} onPress={stop} testID='stop-button'>
                <MaterialIcons name='stop' size={36} color='white' />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.button}
                activeOpacity={0.7}
                onPress={() => seekBackward()}
                testID='seek-backward-button'
            >
                <MaterialIcons name='replay-10' size={36} color='white' />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, styles.playButton]}
                activeOpacity={0.7}
                onPress={status.isBusy ? undefined : handlePlayPause}
                disabled={status.isBusy}
                testID='play-pause-button'
            >
                {status.isBusy ? (
                    <Spinner testID='play-pause-spinner' />
                ) : (
                    <View testID={status.isPlaying ? 'pause-icon' : 'play-icon'}>
                        <MaterialIcons name={status.isPlaying ? 'pause' : 'play-arrow'} size={48} color='white' />
                    </View>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.button}
                activeOpacity={0.7}
                onPress={() => seekForward()}
                testID='seek-forward-button'
            >
                <MaterialIcons name='forward-30' size={36} color='white' />
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} activeOpacity={0.7} onPress={handleSubtitleButtonPress}>
                <MaterialIcons
                    name='closed-caption'
                    size={36}
                    color={
                        isSubtitleTrackEnabled
                            ? Colours.primary
                            : isSubtitleTrackAvailable || isForcedSubtitleTrackAvailable
                            ? Colours.text
                            : Colours.subtext
                    }
                />
            </TouchableOpacity>

            <SubtitleSelector
                isVisible={isSubtitleSelectorVisible}
                selectedValue={selectedSubtitleName}
                onSelectValue={handleSubtitleSelection}
                onClose={() => setSubtitleSelectorVisible(false)}
            />
        </View>
    );
}
