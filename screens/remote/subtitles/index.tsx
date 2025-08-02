import { SelectorButton } from '@/components/selectorButton';

interface SubtitleSelectorProps {
    subtitleOptions: Array<{ label: string; value: string }>;
    selectedSubtitle: string;
    onSelectSubtitle: (value: string) => void;
}

export function SubtitleSelector({ subtitleOptions, selectedSubtitle, onSelectSubtitle }: SubtitleSelectorProps) {
    return (
        <SelectorButton
            options={subtitleOptions}
            selectedValue={selectedSubtitle}
            onSelectValue={onSelectSubtitle}
            title='Subtitles'
            iconName='subtitles'
            defaultLabel='None'
            testIdPrefix='subtitle-selector'
        />
    );
}
