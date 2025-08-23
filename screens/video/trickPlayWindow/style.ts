import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    thumbPanel: {
        position: 'absolute',
        bottom: 60,
        width: 320,
        height: 132,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        overflow: 'hidden',
        zIndex: 12,
    },

    trickPlayImage: {
        width: 3200,
        height: 1320,
        transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
    },

    thumbPanelImage: {
        width: 60,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },

    thumbPanelText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },

    placeholderIcon: {
        color: 'rgba(255, 255, 255, 0.6)',
    },
});
