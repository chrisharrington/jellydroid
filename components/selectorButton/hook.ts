import { useCallback, useState } from 'react';

export function useSelectorButton() {
    const [showModal, setShowModal] = useState(false);

    const getSelectedLabel = useCallback(
        (
            options: Array<{ label: string; value: string | null }>,
            selectedValue: string | null,
            defaultLabel: string
        ) => {
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
