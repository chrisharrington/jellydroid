import { ToastProvider } from '@/components/toast';
import { CastProvider } from '@/contexts/cast';
import { JellyfinProvider } from '@/contexts/jellyfin';
import { BaseLayout } from '@/layout';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Host } from 'react-native-portalize';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

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

    useEffect(() => {
        if (fontsLoaded) SplashScreen.hideAsync();
    }, [fontsLoaded]);

    if (!fontsLoaded) return null;

    return (
        <Host>
            <ToastProvider>
                <JellyfinProvider>
                    <CastProvider>
                        <BaseLayout />
                    </CastProvider>
                </JellyfinProvider>
            </ToastProvider>
        </Host>
    );
}
