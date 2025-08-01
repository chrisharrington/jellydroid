import Spinner from '@/components/spinner';
import { Colours } from '@/constants/colours';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { CastButton } from 'react-native-google-cast';

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
        <Stack
            screenOptions={{
                title: 'Jellydroid',
                headerStyle: {
                    backgroundColor: Colours.background2,
                },
                headerTintColor: Colours.text,
                headerRight: () => (
                    <View>
                        <CastButton style={{ width: 48, height: 48 }} />
                    </View>
                ),
            }}
        >
            <Stack.Screen name='index' />
            <Stack.Screen name='movie/[name]/[id]' />
            <Stack.Screen name='remote/[id]' />
        </Stack>
    ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Spinner size='md' />
        </View>
    );
}
