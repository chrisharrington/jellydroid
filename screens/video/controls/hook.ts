import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { VideoControlsProps } from '.';

/**
 * Custom hook for managing video player controls state and interactions.
 * Handles control visibility, playback state, seeking, and auto-hide functionality.
 *
 * @param {VideoControlsProps} props - Hook configuration containing video player instance
 * @param {VideoPlayer} props.player - Video player instance for controlling playback
 *
 * @returns {Object} Object containing:
 * - isVisible: Whether controls are currently visible
 * - isPlaying: Current playback state
 * - isBusy: Whether video is loading/buffering
 * - currentTime: Current playback position in seconds
 * - isSliding: Whether user is actively dragging seek bar
 * - sliderValue: Current slider position value
 * - thumbPosition: Position of trickplay thumbnail
 * - fadeAnim: Animated value for control fade in/out
 * - handleVideoPress: Handler for video area tap/press
 * - handlePlayPause: Handler for play/pause button
 * - handleSeekBackward: Handler for 10-second backward seek
 * - handleSeekForward: Handler for 30-second forward seek
 * - handleSeekBarChange: Handler for seek bar value changes
 * - handleSliderStart: Handler for seek bar drag start
 * - handleSliderChange: Handler for seek bar drag updates
 * - handleSliderComplete: Handler for seek bar drag completion
 * - getSeekBarProgress: Function to calculate current progress percentage
 */
export function useVideoControls({ player }: VideoControlsProps) {
    const [isVisible, setIsVisible] = useState(false),
        [isBusy, setBusy] = useState<boolean>(true),
        [isPlaying, setIsPlaying] = useState(false),
        [currentTime, setCurrentTime] = useState(0),
        [isSliding, setIsSliding] = useState(false),
        [sliderValue, setSliderValue] = useState(0),
        [thumbPosition, setThumbPosition] = useState(0);

    const fadeAnim = useRef(new Animated.Value(0)).current,
        hideTimeoutRef = useRef<NodeJS.Timeout | null>(null),
        isAnimatingRef = useRef(false);

    // Show controls initially when component mounts.
    useEffect(() => {
        setIsVisible(true);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, []);

    // Initialize player state values when player becomes available.
    useEffect(() => {
        if (!player) return;

        setCurrentTime(player.currentTime || 0);
        setIsPlaying(player.playing || false);
    }, [player]);

    // Listen to player status changes and periodically update playback state.
    useEffect(() => {
        if (!player) return;

        // Subscribe to player status events.
        const subscription = player.addListener('statusChange', status => {
            if (status.status !== 'readyToPlay') return;

            setBusy(false);
            setIsPlaying(true);
        });

        // Poll for playback state changes every 500ms.
        const interval = setInterval(() => {
            setIsPlaying(player.playing || false);

            // Update current time only when not actively seeking.
            if (!isSliding) setCurrentTime(player.currentTime || 0);
        }, 500);

        return () => {
            subscription?.remove();
            clearInterval(interval);
        };
    }, [player, isSliding]);

    // Clear hide timer when video becomes busy and cleanup on unmount.
    useEffect(() => {
        // Prevent auto-hide when video is loading or buffering.
        if (isBusy && hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }

        return () => {
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        };
    }, [isBusy]);

    /**
     * Sets auto-hide timer to hide controls after 2 seconds of inactivity.
     * Clears any existing timer before setting new one.
     */
    const setAutoHideTimer = useCallback(() => {
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

        hideTimeoutRef.current = setTimeout(() => {
            if (!isAnimatingRef.current && !isBusy) hideControls();
        }, 2000);
    }, [isBusy]);

    /**
     * Shows video controls with fade-in animation.
     * Sets auto-hide timer and prevents multiple rapid calls.
     */
    const showControls = useCallback(() => {
        // Prevent multiple rapid calls.
        if (isAnimatingRef.current || isVisible) {
            setAutoHideTimer();
            return;
        }

        isAnimatingRef.current = true;
        setIsVisible(true);

        // Animate controls to visible with fade-in.
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            isAnimatingRef.current = false;
        });

        setAutoHideTimer();
    }, [fadeAnim, isVisible, setAutoHideTimer]);

    /**
     * Hides video controls with fade-out animation.
     * Respects busy state and prevents hiding during loading.
     */
    const hideControls = useCallback(() => {
        // Don't hide controls if video is busy or already animating/hidden.
        if (isBusy || isAnimatingRef.current || !isVisible) return;

        isAnimatingRef.current = true;

        // Clear any pending auto-hide timer.
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }

        // Animate controls to hidden with fade-out.
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setIsVisible(false);
            isAnimatingRef.current = false;
        });
    }, [fadeAnim, isVisible, isBusy]);

    /**
     * Handles video area press to toggle control visibility.
     * Shows controls if hidden, hides if visible.
     */
    const handleVideoPress = useCallback(() => {
        if (isVisible) hideControls();
        else showControls();
    }, [isVisible, showControls, hideControls]);

    /**
     * Handles play/pause button press to toggle playback state.
     * Updates local state and resets auto-hide timer.
     */
    const handlePlayPause = useCallback(() => {
        if (!player) return;

        if (isPlaying) {
            player.pause();
            setIsPlaying(false);
        } else {
            player.play();
            setIsPlaying(true);
        }

        showControls();
    }, [player, isPlaying, showControls]);

    /**
     * Handles backward seek button to jump back 10 seconds.
     * Clamps to minimum of 0 seconds and resets auto-hide timer.
     */
    const handleSeekBackward = useCallback(() => {
        if (!player) return;

        const newTime = Math.max(0, (player.currentTime || 0) - 10);
        player.currentTime = newTime;
        setCurrentTime(newTime);
        showControls();
    }, [player, showControls]);

    /**
     * Handles forward seek button to jump ahead 30 seconds.
     * Clamps to maximum of video duration and resets auto-hide timer.
     */
    const handleSeekForward = useCallback(() => {
        if (!player) return;

        const newTime = Math.min(player.duration || 0, (player.currentTime || 0) + 30);
        player.currentTime = newTime;
        setCurrentTime(newTime);
        showControls();
    }, [player, showControls]);

    /**
     * Handles seek bar value changes for direct time seeking.
     * Calculates new time based on percentage and resets auto-hide timer.
     */
    const handleSeekBarChange = useCallback(
        (value: number) => {
            if (!player) return;

            const newTime = (value / 100) * (player.duration || 0);
            player.currentTime = newTime;
            setCurrentTime(newTime);
            showControls();
        },
        [player, showControls]
    );

    /**
     * Handles seek bar drag start to begin interactive seeking.
     * Pauses playback, calculates initial thumb position, and clears auto-hide timer.
     */
    const handleSliderStart = useCallback(() => {
        setIsSliding(true);

        // Calculate current progress percentage for thumb positioning.
        const playerDuration = player?.duration || 0;
        const currentProgress = playerDuration > 0 ? (currentTime / playerDuration) * 100 : 0;
        setThumbPosition(currentProgress);

        // Clear auto-hide timer during seeking.
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }

        // Pause playback while seeking.
        player?.pause();
    }, [currentTime, player]);

    /**
     * Handles seek bar drag updates during interactive seeking.
     * Updates time preview without committing to player until drag completes.
     */
    const handleSliderChange = useCallback(
        (value: number) => {
            if (!player || !isSliding) return;

            // Calculate new time for preview but don't commit to player yet.
            const newTime = (value / 100) * (player.duration || 0);
            setCurrentTime(newTime);
            setSliderValue(value);
            setThumbPosition(value);
        },
        [player, isSliding]
    );

    /**
     * Handles seek bar drag completion to finalize seeking.
     * Commits time to player, resumes playback, and resets auto-hide timer.
     */
    const handleSliderComplete = useCallback(
        (value: number) => {
            if (!player) return;

            // Calculate and commit final seek time to player.
            const newTime = (value / 100) * (player.duration || 0);
            player.currentTime = newTime;
            setCurrentTime(newTime);

            // Reset seeking state.
            setIsSliding(false);
            setSliderValue(value);
            setThumbPosition(0);

            // Resume playback and reset auto-hide timer.
            showControls();
            player.play();
        },
        [player, showControls]
    );

    /**
     * Calculates current playback progress as percentage.
     * Returns 0 if no duration available to prevent division by zero.
     */
    const getSeekBarProgress = useCallback((): number => {
        const playerDuration = player?.duration || 0;
        if (playerDuration === 0) return 0;
        return (currentTime / playerDuration) * 100;
    }, [currentTime, player]);

    // Auto-hide controls when video finishes loading and starts playing.
    useEffect(() => {
        if (!isBusy && isPlaying && isVisible && !isSliding) setAutoHideTimer();
    }, [isBusy, isPlaying, isVisible, isSliding, setAutoHideTimer]);

    return {
        isVisible,
        isPlaying,
        isBusy,
        currentTime,
        isSliding,
        sliderValue,
        thumbPosition,
        fadeAnim,
        handleVideoPress,
        handlePlayPause,
        handleSeekBackward,
        handleSeekForward,
        handleSeekBarChange,
        handleSliderStart,
        handleSliderChange,
        handleSliderComplete,
        getSeekBarProgress,
    };
}
