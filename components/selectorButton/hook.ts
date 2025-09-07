import { LabelValue } from '@/models';
import { useCallback, useState } from 'react';

export function useSelectorButton() {
    const [showModal, setShowModal] = useState(false);

    const getSelectedLabel = useCallback(
        (options: Array<LabelValue>, selectedValue: string | number | null, defaultLabel: string) => {
            return options.find(option => option.value === selectedValue)?.label || defaultLabel;
        },
        []
    );

    return {
        getSelectedLabel,
        showModal,
        setShowModal,
    };
}
