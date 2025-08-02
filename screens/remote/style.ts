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

    controlBar: {
        height: 120,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 32,
    },

    button: {
        width: 56,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 28,
    },

    playButton: {
        transform: [{ scale: 1.2 }],
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

    selectorWrapper: {
        flex: 1,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },

    selectorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 6,
        paddingHorizontal: 16,
        paddingVertical: 14,
        minHeight: 48,
    },

    selectorText: {
        color: Colours.text,
        fontSize: 16,
        fontFamily: 'Lato-Regular',
        flex: 1,
    },

    selectorIcon: {
        marginRight: 12,
    },
});
