import { Spinner } from '@/components/spinner';
import { MaterialIcons } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';
import { useControlBar } from './hook';
import styles from './style';

interface ControlBarProps {
    stop: () => void;
    seekBackward: () => void;
    pause: () => void;
    resume: () => void;
    seekForward: () => void;
    status: {
        isLoading: boolean;
        isPlaying: boolean;
    };
}

export function ControlBar({ stop, seekBackward, pause, resume, seekForward, status }: ControlBarProps) {
    const { handlePlayPause } = useControlBar({ pause, resume, status });

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
                onPress={status.isLoading ? undefined : handlePlayPause}
                disabled={status.isLoading}
                testID='play-pause-button'
            >
                {status.isLoading ? (
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

            <TouchableOpacity style={styles.button} activeOpacity={0.7}>
                <MaterialIcons name='skip-next' size={36} color='white' />
            </TouchableOpacity>
        </View>
    );
}
