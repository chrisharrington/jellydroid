import { Selector } from '@/components/selector';
import { Colours } from '@/constants/colours';
import { MaterialIcons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSubtitleSelector } from './hook';
import styles from './style';

interface SubtitleSelectorProps {
    subtitleOptions: Array<{ label: string; value: string }>;
    selectedSubtitle: string;
    onSelectSubtitle: (value: string) => void;
}

export function SubtitleSelector({ subtitleOptions, selectedSubtitle, onSelectSubtitle }: SubtitleSelectorProps) {
    const { getSelectedLabel, showModal, setShowModal } = useSubtitleSelector();

    return (
        <>
            <View style={styles.selectorWrapper} testID='subtitle-selector-wrapper'>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowModal(true)}
                    testID='subtitle-selector-button'
                >
                    <View style={styles.selectorButton}>
                        <MaterialIcons name='subtitles' size={20} color={Colours.text} style={styles.selectorIcon} />
                        <Text style={styles.selectorText}>
                            {getSelectedLabel(subtitleOptions, selectedSubtitle, 'None')}
                        </Text>
                        <MaterialIcons name='keyboard-arrow-down' size={20} color={Colours.text} />
                    </View>
                </TouchableOpacity>
            </View>

            <Selector
                visible={showModal}
                onClose={() => setShowModal(false)}
                title='Subtitles'
                icon='subtitles'
                options={subtitleOptions}
                selectedValue={selectedSubtitle}
                onSelectValue={onSelectSubtitle}
            />
        </>
    );
}
