import { Colours } from '@/constants/colours';
import { MaterialIcons } from '@expo/vector-icons';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from './hook';
import { styles } from './style';

export type SelectorOption = {
    label: string;
    value: string;
};

type SelectorProps = {
    visible: boolean;
    onClose: () => void;
    title: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    options: SelectorOption[];
    selectedValue: string;
    onSelectValue: (value: string) => void;
};

export function Selector({ visible, onClose, title, icon, options, selectedValue, onSelectValue }: SelectorProps) {
    const { slideAnim, fadeAnim, isVisible } = useSelector(visible);

    const handleSelectValue = (value: string) => {
        onSelectValue(value);
        onClose();
    };

    if (!isVisible) {
        return null;
    }

    return (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
            <Animated.View
                style={[
                    styles.slideUpContainer,
                    {
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                <View style={styles.header}>
                    <MaterialIcons name={icon} size={24} color={Colours.text} />
                    <Text style={styles.title}>{title}</Text>
                    <TouchableOpacity onPress={onClose}>
                        <MaterialIcons name='close' size={24} color={Colours.text} />
                    </TouchableOpacity>
                </View>
                <ScrollView style={styles.content}>
                    {options.map(option => (
                        <TouchableOpacity
                            key={option.value}
                            style={[styles.option, selectedValue === option.value && styles.selectedOption]}
                            activeOpacity={0.7}
                            onPress={() => handleSelectValue(option.value)}
                        >
                            <Text
                                style={[styles.optionText, selectedValue === option.value && styles.selectedOptionText]}
                            >
                                {option.label}
                            </Text>
                            {selectedValue === option.value && (
                                <MaterialIcons name='check' size={20} color={Colours.icon} />
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </Animated.View>
        </Animated.View>
    );
}
