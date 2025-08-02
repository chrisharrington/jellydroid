import { useEffect, useState } from 'react';

/**
 * Custom hook to provide smooth time interpolation.
 */
export function useInterpolatedTime(localTime: number, isEnabled: boolean, lastUpdateTime: number) {
    const [interpolatedTime, setInterpolatedTime] = useState(localTime);

    useEffect(() => {
        // Always update to the new localTime immediately when it changes
        setInterpolatedTime(localTime);
    }, [localTime]);

    useEffect(() => {
        if (!isEnabled) {
            setInterpolatedTime(localTime);
            return;
        }

        const timer = setInterval(() => {
            const elapsed = (Date.now() - lastUpdateTime) / 1000;
            setInterpolatedTime(localTime + elapsed);
        }, 100);

        return () => clearInterval(timer);
    }, [isEnabled, localTime, lastUpdateTime]);

    return interpolatedTime;
}
