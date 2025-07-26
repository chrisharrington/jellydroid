import { View, Text } from 'react-native';
import { useHome } from './hook';
import { Colours } from '@/constants/colours';

export default function HomeScreen() {
    useHome();

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colours.background }}>
            <Text>Welcome to Jellydroid!</Text>
        </View>
    );
}
