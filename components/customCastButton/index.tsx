import { Selector, SelectorOption } from '@/components/selector';
import { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { CastButton, useCastDevice, useCastState } from 'react-native-google-cast';

export type CustomCastButtonProps = {
    style?: any;
    tintColor?: string;
};

// Placeholder devices - in a real implementation, you'd get these from Google Cast discovery
const placeholderDevices = [
    { id: '1', name: 'Living Room TV' },
    { id: '2', name: 'Basement TV' },
    { id: '3', name: 'Bedroom TV' },
    { id: '4', name: 'Kitchen Display' },
];

export function CustomCastButton({ style, tintColor = 'white' }: CustomCastButtonProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState('');
    const castDevice = useCastDevice();
    const castState = useCastState();

    const handleDeviceSelect = (deviceId: string) => {
        console.log('Selected device ID:', deviceId);
        setSelectedDevice(deviceId);
        setIsVisible(false);

        // TODO: Implement actual device connection
        // For now, we just close the selector
        // In a real implementation, you would connect to the selected device
        // This would typically involve the Google Cast SDK's device connection methods
    };

    const handleCastButtonPress = () => {
        // Show our custom selector instead of the default Google Cast device picker
        setIsVisible(true);
    };

    const deviceOptions: SelectorOption[] = placeholderDevices.map(device => ({
        label: device.name,
        value: device.id,
    }));

    return (
        <>
            <View style={style}>
                {/* Invisible overlay to intercept touches */}
                <TouchableOpacity
                    style={{
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        zIndex: 10,
                    }}
                    onPress={handleCastButtonPress}
                    activeOpacity={1}
                />
                {/* The actual CastButton for animations and state display */}
                <CastButton style={{ width: '100%', height: '100%' }} />
            </View>

            <Selector
                visible={isVisible}
                onClose={() => setIsVisible(false)}
                options={deviceOptions}
                selectedValue={selectedDevice}
                onSelectValue={handleDeviceSelect}
                title='Cast to Device'
                icon='cast'
            />
        </>
    );
}
