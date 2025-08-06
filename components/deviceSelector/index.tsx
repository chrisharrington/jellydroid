import { Selector } from '@/components/selector';
import { useCast } from '@/contexts/cast';

export type DeviceSelector = {
    isVisible: boolean;
    selectedDeviceId: string;
    onClose: () => void;
    onDeviceSelect: (deviceId: string) => void;
};

export function DeviceSelector({ isVisible, selectedDeviceId, onClose, onDeviceSelect }: DeviceSelector) {
    const { devices } = useCast();

    return (
        <Selector
            visible={isVisible}
            onClose={onClose}
            options={devices}
            selectedValue={selectedDeviceId}
            onSelectValue={onDeviceSelect}
            title='Device'
            icon='cast'
        />
    );
}
