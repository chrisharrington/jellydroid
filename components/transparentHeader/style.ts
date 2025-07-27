import { StatusBar, StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        flex: 1,
        marginTop: StatusBar.currentHeight,
        height: 56,
        backgroundColor: 'transparent',
    },

    iconContainer: {
        position: 'absolute',
        left: 8,
        top: 8,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        width: 48,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 24,
    },
});
