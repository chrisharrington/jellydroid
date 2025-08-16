import Spinner from '@/components/spinner';
import { ToastProvider } from '@/components/toast';
import { CastProvider } from '@/contexts/cast';
import { BaseLayout } from '@/layout';
import { useFonts } from 'expo-font';
import { View } from 'react-native';
import { Host } from 'react-native-portalize';

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

    return (
        <Host>
            <ToastProvider>
                <CastProvider>
                    {fontsLoaded ? (
                        <BaseLayout />
                    ) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Spinner size='md' />
                        </View>
                    )}
                </CastProvider>
            </ToastProvider>
        </Host>
    );
}
