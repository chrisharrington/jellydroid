import { Colours } from '@/constants/colours';
import { StatusBar, StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        flex: 1,
        marginTop: StatusBar.currentHeight,
        height: 56,
    },

    iconContainer: {
        position: 'absolute',
        left: 8,
        top: 4,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        width: 48,
        borderRadius: 6,
    },

    castBadge: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    castBadgeContent: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },

    castText: {
        color: Colours.text,
        fontSize: 14,
        fontFamily: 'Lato-Regular',
        marginLeft: 8,
        lineHeight: 16,
    },
});
