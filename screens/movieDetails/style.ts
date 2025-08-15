import { Colours } from '@/constants/colours';
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    backdrop: {
        width: '100%',
        height: 200,
    },

    subHeader: {
        flexDirection: 'row',
        marginTop: 8,
        justifyContent: 'space-between',
    },

    subHeaderEntries: {
        flexDirection: 'row',
        gap: 8,
    },

    subHeaderEntry: {
        fontSize: 14,
        color: Colours.subtext,
    },

    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colours.text,
    },

    rating: {
        borderRadius: 4,
        backgroundColor: Colours.background3,
        color: Colours.text,
        paddingHorizontal: 10,
        paddingVertical: 4,
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },

    divider: {
        fontSize: 14,
        color: Colours.subtext,
    },

    buttonContainer: {
        marginTop: 16,
    },

    overview: {
        fontSize: 17,
        color: Colours.subtext,
        marginTop: 16,
    },
});
