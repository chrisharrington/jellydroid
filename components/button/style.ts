import { Colours } from '@/constants/colours';
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    button: {
        borderRadius: 6,
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },

    primaryButton: {
        backgroundColor: Colours.primary,
    },

    secondaryButton: {
        backgroundColor: Colours.background3,
    },
});
