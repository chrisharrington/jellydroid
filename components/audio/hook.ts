import { useCallback, useState } from 'react';

export function useAudioSelector() {
    const [showModal, setShowModal] = useState(false);

    const getSelectedLabel = useCallback(
        (options: Array<{ label: string; value: string }>, selectedValue: string, defaultLabel: string) => {
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
