import { Selector, SelectorOption } from '@/components/selector';

type AudioModalProps = {
    visible: boolean;
    onClose: () => void;
    audioOptions: SelectorOption[];
    selectedAudio: string;
    onSelectAudio: (value: string) => void;
};

export function AudioModal({ visible, onClose, audioOptions, selectedAudio, onSelectAudio }: AudioModalProps) {
    return (
        <Selector
            visible={visible}
            onClose={onClose}
            title='Audio Track'
            icon='volume-up'
            options={audioOptions}
            selectedValue={selectedAudio}
            onSelectValue={onSelectAudio}
        />
    );
}
