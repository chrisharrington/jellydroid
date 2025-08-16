import { SelectorButton } from '@/components/selectorButton';
import { LabelValue } from '@/models';

type AudioSelectorProps = {
    /** Required. Array of audio track options with label and value pairs. */
    audioOptions: Array<LabelValue>;

    /** Required. Currently selected audio track identifier, or null if none selected. */
    selectedAudio: string | null;

    /** Required. Callback function triggered when user selects a different audio track. */
    onSelectAudio: (value: string | null) => void;
};

export function AudioSelector({ audioOptions, selectedAudio, onSelectAudio }: AudioSelectorProps) {
    return (
        <SelectorButton
            options={audioOptions}
            selectedValue={selectedAudio}
            onSelectValue={onSelectAudio}
            title='Audio Track'
            defaultLabel='English'
            testIdPrefix='audio-selector'
        />
    );
}
