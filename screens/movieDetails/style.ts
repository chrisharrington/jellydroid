import { Colours } from '@/constants/colours';
import { Platform, StatusBar, StyleSheet } from 'react-native';

export default StyleSheet.create({
    backdrop: {
        width: '100%',
        marginTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
        height: 200,
    },

    infoContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },

    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colours.text,
    },

    info: {
        fontSize: 14,
        color: Colours.icon,
    },

    divider: {
        fontSize: 14,
        color: Colours.text,
    },

    buttonContainer: {
        marginTop: 16,
    },

    overview: {
        fontSize: 18,
        color: Colours.subtext,
        marginTop: 16,
    },
});
