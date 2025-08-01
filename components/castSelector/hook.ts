import { useCallback, useEffect, useState } from 'react';
import { CastContext, CastState, useCastDevice, useCastState, useDevices } from 'react-native-google-cast';

export function useCastSelector() {
    const [isVisible, setIsVisible] = useState(false),
        [selectedDevice, setSelectedDevice] = useState(''),
        devices = useDevices(),
        castDevice = useCastDevice(),
        castState = useCastState();

    useEffect(() => {
        console.log(
            'Devices changed:',
            devices
                // .filter(device => !device.friendlyName.includes('Speaker'))
                .map(device => device.friendlyName)
                .sort()
        );
    }, [devices]);

    /**
     * Handles the selection of a cast device by its ID.
     *
     * This callback function is triggered when a user selects a device from the cast selector.
     * It finds the device by ID and connects to it using the CastContext.
     *
     * @param deviceId - The unique identifier of the selected cast device
     * @returns A promise that resolves when the device connection is complete
     */
    const handleDeviceSelect = useCallback(
        async (deviceId: string) => {
            try {
                console.log('Selected device ID:', deviceId);

                // Find the device object by ID
                const device = devices.find(d => d.deviceId === deviceId);
                if (!device) {
                    console.error('Device not found:', deviceId);
                    return;
                }

                console.log('Connecting to device:', device.friendlyName);

                // Connect to the selected device using the session manager
                await CastContext.getSessionManager().startSession(device.deviceId);

                setSelectedDevice(deviceId);
                setIsVisible(false);

                console.log('Successfully connected to:', device.friendlyName);
            } catch (error) {
                console.error('Failed to connect to device:', error);
            }
        },
        [devices]
    );

    /**
     * Disconnects from the currently connected cast device.
     *
     * @returns A promise that resolves when the device has been disconnected
     */
    const handleDisconnect = useCallback(async () => {
        try {
            console.log('Disconnecting from cast device...');
            await CastContext.getSessionManager().endCurrentSession();
            setSelectedDevice('');
            console.log('Successfully disconnected from cast device');
        } catch (error) {
            console.error('Failed to disconnect from device:', error);
        }
    }, []);

    return {
        isVisible,
        selectedDevice,
        devices,
        isConnected: castState === CastState.CONNECTED,
        connectedDevice: castDevice,
        showSelector: () => setIsVisible(true),
        hideSelector: () => setIsVisible(false),
        handleDeviceSelect,
        handleDisconnect,
    };
}
