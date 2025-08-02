import { Colours } from '@/constants/colours';
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colours.background,
    },

    content: {
        flex: 1,
        paddingHorizontal: 32,
    },

    loadingContainer: {
        flex: 1,
        backgroundColor: Colours.background,
        justifyContent: 'center',
        alignItems: 'center',
    },

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

    selectorsContainer: {
        flexDirection: 'row',
        gap: 16,
        paddingVertical: 8,
        marginBottom: 12,
    },

    progressControl: {
        height: 90,
        paddingVertical: 16,
    },

    slider: {
        flex: 1,
        height: 40,
    },

    timeContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
    },

    timeText: {
        color: Colours.text,
        fontSize: 16,
        fontFamily: 'Lato-Regular',
    },

    timeRight: {
        textAlign: 'right',
    },
});
