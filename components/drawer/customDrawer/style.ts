import { Colours } from '@/constants/colours';
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colours.background2,
    },
    content: {
        flex: 1,
        paddingTop: 20,
    },
    label: {
        color: Colours.text,
        fontSize: 16,
    },
    item: {
        backgroundColor: 'transparent',
    }
});
