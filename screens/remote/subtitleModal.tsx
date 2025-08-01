import { Selector, SelectorOption } from '@/components/selector';

type SubtitleModalProps = {
    visible: boolean;
    onClose: () => void;
    subtitleOptions: SelectorOption[];
    selectedSubtitle: string;
    onSelectSubtitle: (value: string) => void;
};

export function SubtitleModal({
    visible,
    onClose,
    subtitleOptions,
    selectedSubtitle,
    onSelectSubtitle,
}: SubtitleModalProps) {
    return (
        <Selector
            visible={visible}
            onClose={onClose}
            title='Subtitles'
            icon='subtitles'
            options={subtitleOptions}
            selectedValue={selectedSubtitle}
            onSelectValue={onSelectSubtitle}
        />
    );
}
