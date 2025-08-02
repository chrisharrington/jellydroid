import { SelectorButton } from '@/components/selectorButton';

interface AudioSelectorProps {
    audioOptions: Array<{ label: string; value: string }>;
    selectedAudio: string;
    onSelectAudio: (value: string) => void;
}

export function AudioSelector({ audioOptions, selectedAudio, onSelectAudio }: AudioSelectorProps) {
    return (
        <SelectorButton
            options={audioOptions}
            selectedValue={selectedAudio}
            onSelectValue={onSelectAudio}
            title='Audio Track'
            iconName='volume-up'
            defaultLabel='English'
            testIdPrefix='audio-selector'
        />
    );
}
