import { Selector, SelectorOption } from '@/components/selector';
import { useCastSelector } from './hook';

export type CastSelectorProps = {
    isVisible: boolean;
    selectedDevice: string;
    onClose: () => void;
    onDeviceSelect: (deviceId: string) => void;
};

export function CastSelector({ isVisible, selectedDevice, onClose, onDeviceSelect }: CastSelectorProps) {
    const { devices } = useCastSelector();

    const deviceOptions: SelectorOption[] = devices.map(device => ({
        label: device.friendlyName,
        value: device.deviceId,
    }));

    return (
        <Selector
            visible={isVisible}
            onClose={onClose}
            options={deviceOptions}
            selectedValue={selectedDevice}
            onSelectValue={onDeviceSelect}
            title='Cast to Device'
            icon='cast'
        />
    );
}
