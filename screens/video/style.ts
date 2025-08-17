import { Colours } from '@/constants/colours';
import { Dimensions, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
    loadingContainer: {
        flex: 1,
        backgroundColor: Colours.background,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },

    contentContainer: {
        flex: 1,
        backgroundColor: 'black',
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },

    video: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
});
