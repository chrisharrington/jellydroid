import { Selector } from '@/components/selector';
import { Colours } from '@/constants/colours';
import { MaterialIcons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { useAudioSelector } from './hook';
import styles from './style';

interface AudioSelectorProps {
    audioOptions: Array<{ label: string; value: string }>;
    selectedAudio: string;
    onSelectAudio: (value: string) => void;
}

export function AudioSelector({ audioOptions, selectedAudio, onSelectAudio }: AudioSelectorProps) {
    const { getSelectedLabel, showModal, setShowModal } = useAudioSelector();

    return (
        <>
            <View style={styles.selectorWrapper}>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setShowModal(true)}>
                    <View style={styles.selectorButton}>
                        <MaterialIcons name='volume-up' size={20} color={Colours.text} style={styles.selectorIcon} />
                        <Text style={styles.selectorText}>
                            {getSelectedLabel(audioOptions, selectedAudio, 'English')}
                        </Text>
                        <MaterialIcons name='keyboard-arrow-down' size={20} color={Colours.text} />
                    </View>
                </TouchableOpacity>
            </View>

            <Selector
                visible={showModal}
                onClose={() => setShowModal(false)}
                title='Audio Track'
                icon='volume-up'
                options={audioOptions}
                selectedValue={selectedAudio}
                onSelectValue={onSelectAudio}
            />
        </>
    );
}
