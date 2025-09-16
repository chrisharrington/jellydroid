import { Colours } from '@/constants/colours';
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    posterContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 12,
        paddingBottom: 16,
    },

    poster: {
        width: 300,
        marginTop: 12,
        maxHeight: '100%',
        aspectRatio: 300 / 515,
        borderRadius: 6,
        backgroundColor: Colours.background2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
});
