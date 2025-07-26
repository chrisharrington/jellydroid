import { Colours } from '@/constants/colours';
import { View } from 'react-native';
import { useHome } from './hook';
import { Section } from './section';

export default function HomeScreen() {
    useHome();

    return (
        <View style={{ flex: 1, backgroundColor: Colours.background }}>
            <Section label='continue watching'>
                <View></View>
            </Section>
        </View>
    );
}
