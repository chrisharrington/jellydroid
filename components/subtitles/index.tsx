import { SelectorButton } from '@/components/selectorButton';
import { LabelValue } from '@/models';

type SubtitleSelectorProps = {
    subtitleOptions: Array<LabelValue>;
    selectedSubtitle: string | null;
    onSelectSubtitle: (value: string | null) => void;
};

export function SubtitleSelector({ subtitleOptions, selectedSubtitle, onSelectSubtitle }: SubtitleSelectorProps) {
    return (
        <SelectorButton
            options={subtitleOptions}
            selectedValue={selectedSubtitle}
            onSelectValue={onSelectSubtitle}
            title='Subtitles'
            defaultLabel='None'
            testIdPrefix='subtitle-selector'
        />
    );
}
