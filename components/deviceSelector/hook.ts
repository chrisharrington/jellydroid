import { useCast } from '@/contexts/cast';
import { useCallback, useState } from 'react';

export function useCastSelector() {
    const [isVisible, setVisible] = useState(false),
        { selectedDeviceId, onDeviceSelected } = useCast();

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
        async (deviceId: string | null) => onDeviceSelected(deviceId),
        [onDeviceSelected]
    );

    return {
        isVisible,
        selectedDeviceId,
        handleCastButtonPress: () => setVisible(true),
        hideSelector: () => setVisible(false),
        handleDeviceSelect,
    };
}
