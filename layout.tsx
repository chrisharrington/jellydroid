import { Stack } from 'expo-router';
import { CustomCastButton } from './components/customCastButton';
import { DeviceSelector } from './components/deviceSelector';
import { useCastSelector } from './components/deviceSelector/hook';
import { Colours } from './constants/colours';

export function BaseLayout() {
    const { isVisible, selectedDeviceId, handleCastButtonPress, hideSelector, handleDeviceSelect } = useCastSelector();

    return (
        <>
            <Stack
                screenOptions={{
                    title: 'Jellydroid',
                    headerStyle: {
                        backgroundColor: Colours.background2,
                    },
                    headerTintColor: Colours.text,
                    headerRight: () => <CustomCastButton tintColor={Colours.text} onPress={handleCastButtonPress} />,
                }}
            >
                <Stack.Screen name='index' />
                <Stack.Screen name='movie/[name]/[id]' />
                <Stack.Screen name='remote/[itemId]/[mediaSourceId]' options={{ headerRight: () => null }} />
                <Stack.Screen name='video/[itemId]/[mediaSourceId]' options={{ headerShown: false }} />
            </Stack>

            <DeviceSelector
                isVisible={isVisible}
                selectedDeviceId={selectedDeviceId}
                onClose={hideSelector}
                onDeviceSelect={handleDeviceSelect}
            />
        </>
    );
}
