import { Colours } from '@/constants/colours';
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    backdrop: {
        width: '100%',
        height: 200,
    },

    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colours.text,
        marginTop: 8,
    },

    year: {
        fontSize: 16,
        color: Colours.subtext,
        marginTop: 4,
    },

    overview: {
        fontSize: 16,
        color: Colours.subtext,
        marginTop: 8,
    },
});
