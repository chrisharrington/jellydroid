import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },

    visibleOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 11,
    },

    overlayTouchArea: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },

    controlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 40,
    },

    controlButton: {
        borderRadius: 30,
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },

    playPauseButton: {
        borderRadius: 35,
        width: 70,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
    },

    buttonIcon: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },

    playPauseIcon: {
        color: 'white',
        fontSize: 28,
        fontWeight: 'bold',
    },

    seekText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },

    bottomContainer: {
        position: 'absolute',
        bottom: 60,
        left: 60,
        right: 60,
    },

    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },

    timeText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },

    seekBarContainer: {
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 2,
        position: 'relative',
    },

    seekBarProgress: {
        height: '100%',
        backgroundColor: 'white',
        borderRadius: 2,
    },

    seekBarThumb: {
        position: 'absolute',
        width: 16,
        height: 16,
        backgroundColor: 'white',
        borderRadius: 8,
        top: -6,
        transform: [{ translateX: -8 }],
    },

    slider: {
        width: '100%',
        height: 20,
    },

    topRightContainer: {
        position: 'absolute',
        top: 16,
        right: 16,
        flexDirection: 'row',
        gap: 12,
    },

    topRightButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
