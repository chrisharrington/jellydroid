import { useCallback } from 'react';
import { ControlBarProps } from '.';

export function useControlBar({ pause, resume, status }: ControlBarProps) {
    /**
     * Toggles playback between playing and paused states.
     * If currently playing, pauses playback.
     * If currently paused, resumes playback.
     */
    const handlePlayPause = useCallback(() => {
        if (status.isPlaying) pause();
        else resume();
    }, [pause, resume, status.isPlaying]);

    return {
        handlePlayPause,
    };
}
