import { SelectorButton } from '@/components/selectorButton';
import { LabelValue } from '@/models';

type SubtitleSelectorProps = {
    /** Required. Array of subtitle options available for selection. */
    subtitleOptions: Array<LabelValue>;

    /** Required. Currently selected subtitle index, null if none selected. */
    selectedSubtitleIndex: string | null;

    /** Required. Callback fired when a subtitle option is selected. */
    onSelectSubtitle: (value: string | null) => void;
};

export function SubtitleSelector({ subtitleOptions, selectedSubtitleIndex, onSelectSubtitle }: SubtitleSelectorProps) {
    return (
        <SelectorButton
            options={subtitleOptions}
            selectedValue={selectedSubtitleIndex}
            onSelectValue={onSelectSubtitle}
            title='Subtitles'
            defaultLabel='None'
            testIdPrefix='subtitle-selector'
        />
    );
}
