import { Selector } from '@/components/selector';
import { useCastSelector } from './hook';

export type CastSelectorProps = {
    isVisible: boolean;
    selectedDevice: string;
    onClose: () => void;
    onDeviceSelect: (deviceId: string) => void;
};

export function CastSelector({ isVisible, selectedDevice, onClose, onDeviceSelect }: CastSelectorProps) {
    const { devices } = useCastSelector();

    return (
        <Selector
            visible={isVisible}
            onClose={onClose}
            options={devices}
            selectedValue={selectedDevice}
            onSelectValue={onDeviceSelect}
            title='Device'
            icon='cast'
        />
    );
}
