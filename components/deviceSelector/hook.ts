import { useAsyncEffect } from '@/hooks/asyncEffect';
import { useCallback, useMemo, useState } from 'react';
import { CastContext, CastState, useCastState, useDevices, useRemoteMediaClient } from 'react-native-google-cast';

export function useCastSelector() {
    const [isVisible, setVisible] = useState(false),
        [selectedDevice, setSelectedDevice] = useState('local'), // Default to local device
        devices = useDevices(),
        castState = useCastState(),
        remoteMediaClient = useRemoteMediaClient(),
        sessionManager = useMemo(() => CastContext.getSessionManager(), []);

    // Set the local device as the selected device on initial load.
    useAsyncEffect(async () => {
        const session = await sessionManager.getCurrentCastSession();
        const localDevice = await session?.getCastDevice();
        localDevice?.deviceId && setSelectedDevice(localDevice.deviceId);
    }, []);

    /**
     * Handles the selection of a cast device by its ID.
     *
     * This callback function is triggered when a user selects a device from the cast selector.
     * It finds the device by ID and connects to it using the CastContext, or disconnects if "This Device" is selected.
     *
     * @param deviceId - The unique identifier of the selected cast device, or "local" for this device
     * @returns A promise that resolves when the device connection/disconnection is complete
     */
    const handleDeviceSelect = useCallback(
        async (deviceId: string) => {
            try {
                // Handle "This Device" selection - disconnect from cast.
                if (deviceId === 'local') {
                    if (castState === CastState.CONNECTED) {
                        if (remoteMediaClient) await remoteMediaClient.stop();
                        await sessionManager.endCurrentSession();
                    }
                } else {
                    const device = devices.find(d => d.deviceId === deviceId);
                    if (!device) {
                        console.error('Device not found:', deviceId);
                        return;
                    }

                    // Connect to the selected device using the session manager.
                    await sessionManager.startSession(device.deviceId);
                }

                setSelectedDevice(deviceId);
                setVisible(false);
            } catch (error) {
                console.error('Failed to connect to device:', error);
            }
        },
        [devices, castState, remoteMediaClient]
    );

    return {
        isVisible,
        selectedDevice,
        devices: useMemo(
            () => [
                {
                    label: 'This Device',
                    value: 'local',
                },
                ...devices
                    .filter(device => device.capabilities.includes('VideoOut'))
                    .sort((a, b) => a.friendlyName.toLowerCase().localeCompare(b.friendlyName.toLowerCase()))
                    .map(device => ({
                        label: device.friendlyName.replace(/\b\w/g, char => char.toUpperCase()),
                        value: device.deviceId,
                    })),
            ],
            [devices]
        ),
        handleCastButtonPress: () => setVisible(true),
        hideSelector: () => setVisible(false),
        handleDeviceSelect,
    };
}
