import { StyleSheet } from 'react-native';

export default StyleSheet.create({
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
});
