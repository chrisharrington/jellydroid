import { Colours } from '@/constants/colours';
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        flexDirection: 'column',
        padding: 16,
    },

    labelContainer: {
        marginBottom: 8,
    },

    label: {
        color: Colours.subtext,
        letterSpacing: 0.7,
        fontSize: 14,
        textTransform: 'uppercase',
        fontFamily: 'Lato',
    },

    childrenContainer: {
        flex: 1,
        marginTop: 4,
    },
});
