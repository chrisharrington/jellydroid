import { Colours } from '@/constants/colours';
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    item: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        backgroundColor: Colours.background,
        marginBottom: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },

    itemPressed: {
        backgroundColor: Colours.background3,
    },

    label: {
        flex: 1,
        padding: 8,
        fontSize: 16,
        color: Colours.text,
    },
});
