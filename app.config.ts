import { ConfigContext, ExpoConfig } from '@expo/config';
import 'dotenv/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: 'jellydroid',
    slug: 'jellydroid',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'jellydroid',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.chrisharrington.jellydroid',
    },
    android: {
        adaptiveIcon: {
            foregroundImage: './assets/images/adaptive-icon.png',
            backgroundColor: '#151718',
        },
        edgeToEdgeEnabled: true,
        package: 'com.chrisharrington.jellydroid',
    },
    web: {
        bundler: 'metro',
        output: 'static',
        favicon: './assets/images/favicon.png',
    },
    plugins: [
        'expo-font',
        'expo-router',
        'expo-video',
        'expo-screen-orientation',
        'expo-secure-store',
        [
            'expo-splash-screen',
            {
                image: './assets/images/splash-icon.png',
                imageWidth: 200,
                resizeMode: 'contain',
                backgroundColor: '#151718',
            },
        ],
        'react-native-google-cast',
    ],
    experiments: {
        typedRoutes: true,
    },
    extra: {
        router: {},
        eas: {
            projectId: '031f4d0b-bec0-4795-ad9c-115eaedd6007',
        },
        APP_NAME: process.env.EXPO_PUBLIC_APP_NAME,
        APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION,
        JELLYFIN_URL: process.env.EXPO_PUBLIC_JELLYFIN_URL,
        JELLYFIN_API_KEY: process.env.EXPO_PUBLIC_JELLYFIN_API_KEY,
    },
});
