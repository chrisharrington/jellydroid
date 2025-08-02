interface UseControlBarProps {
    pause: () => void;
    resume: () => void;
    status: {
        isLoading: boolean;
        isPlaying: boolean;
    };
}

export function useControlBar({ pause, resume, status }: UseControlBarProps) {
    const handlePlayPause = () => {
        if (status.isPlaying) {
            pause();
        } else {
            resume();
        }
    };

    return {
        handlePlayPause,
    };
}
