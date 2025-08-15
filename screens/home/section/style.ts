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
        color: Colours.text,
        letterSpacing: 0.5,
        fontSize: 17,
        fontFamily: 'Lato',
        paddingBottom: 4,
        borderBottomWidth: 2,
        borderBottomColor: Colours.primary,
    },

    childrenContainer: {
        flex: 1,
        marginTop: 12,
    },
});
