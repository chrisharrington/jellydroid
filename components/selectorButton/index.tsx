import { Selector } from '@/components/selector';
import { Colours } from '@/constants/colours';
import { MaterialIcons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { Portal } from 'react-native-portalize';
import { useSelectorButton } from './hook';
import styles from './style';

interface SelectorButtonProps {
    options: Array<{ label: string; value: string }>;
    selectedValue: string;
    onSelectValue: (value: string | null) => void;
    title: string;
    iconName: keyof typeof MaterialIcons.glyphMap;
    defaultLabel: string;
    testIdPrefix: string;
}

export function SelectorButton({
    options,
    selectedValue,
    onSelectValue,
    title,
    iconName,
    defaultLabel,
    testIdPrefix,
}: SelectorButtonProps) {
    const { getSelectedLabel, showModal, setShowModal } = useSelectorButton();

    return (
        <>
            <View style={styles.selectorWrapper} testID={`${testIdPrefix}-wrapper`}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowModal(true)}
                    testID={`${testIdPrefix}-button`}
                >
                    <View style={styles.selectorButton}>
                        {iconName && (
                            <MaterialIcons name={iconName} size={20} color={Colours.text} style={styles.selectorIcon} />
                        )}
                        <Text style={styles.selectorText}>
                            {getSelectedLabel(options, selectedValue, defaultLabel)}
                        </Text>
                        <MaterialIcons name='keyboard-arrow-down' size={20} color={Colours.text} />
                    </View>
                </TouchableOpacity>
            </View>

            {/* Render the Selector at the root level to avoid positioning issues. */}
            <Portal>
                <Selector
                    visible={showModal}
                    onClose={() => setShowModal(false)}
                    title={title}
                    icon={iconName}
                    options={options}
                    selectedValue={selectedValue}
                    onSelectValue={onSelectValue}
                />
            </Portal>
        </>
    );
}
