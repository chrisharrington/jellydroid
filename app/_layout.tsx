import Spinner from '@/components/ui/Spinner';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import { View } from 'react-native';

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        'Lato-Black': require('../fonts/Lato-Black.ttf'),
        'Lato-BlackItalic': require('../fonts/Lato-BlackItalic.ttf'),
        'Lato-Bold': require('../fonts/Lato-Bold.ttf'),
        'Lato-BoldItalic': require('../fonts/Lato-BoldItalic.ttf'),
        'Lato-Italic': require('../fonts/Lato-Italic.ttf'),
        'Lato-Light': require('../fonts/Lato-Light.ttf'),
        'Lato-LightItalic': require('../fonts/Lato-LightItalic.ttf'),
        'Lato-Regular': require('../fonts/Lato-Regular.ttf'),
        'Lato-Thin': require('../fonts/Lato-Thin.ttf'),
        'Lato-ThinItalic': require('../fonts/Lato-ThinItalic.ttf'),
    });

    return fontsLoaded ? (
        <Slot />
    ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Spinner size='md' />
        </View>
    );
}
