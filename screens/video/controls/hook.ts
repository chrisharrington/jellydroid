import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { VideoControlsProps } from '.';

export function useVideoControls({ player }: VideoControlsProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isBusy, setBusy] = useState<boolean>(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isSliding, setIsSliding] = useState(false);
    const [wasPlaying, setWasPlaying] = useState<boolean>(false);
    const [sliderValue, setSliderValue] = useState(0);
    const [thumbPosition, setThumbPosition] = useState(0);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isAnimatingRef = useRef(false);

    // Show controls initially when component mounts.
    useEffect(() => {
        // Show controls on initial load only once.
        setIsVisible(true);

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        // Set initial auto-hide timer
        hideTimeoutRef.current = setTimeout(() => {
            if (!isAnimatingRef.current && !isBusy) {
                isAnimatingRef.current = true;

                if (hideTimeoutRef.current) {
                    clearTimeout(hideTimeoutRef.current);
                    hideTimeoutRef.current = null;
                }

                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => {
                    setIsVisible(false);
                    isAnimatingRef.current = false;
                });
            }
        }, 2000);
    }, []); // Empty dependency array - run only once on mount

    // Initialize player values when player is available
    useEffect(() => {
        if (player) {
            if (player.duration) setDuration(player.duration);
            if (player.currentTime) setCurrentTime(player.currentTime);

            // Initialize playing state.
            setIsPlaying(player.playing || false);
        }
    }, [player]);

    // Listen to player status changes to update play/pause state.
    useEffect(() => {
        if (!player) return;

        const subscription = player.addListener('statusChange', status => {
            // Update duration when available
            if (player.duration) {
                setDuration(player.duration);
            }

            if (status.status === 'readyToPlay') {
                setBusy(false);
                setIsPlaying(true);
            }
        });

        return () => {
            subscription?.remove();
        };
    }, [player]);

    // Periodically check playing state and update time
    useEffect(() => {
        if (!player) return;

        const interval = setInterval(() => {
            // Update playing state from player
            setIsPlaying(player.playing || false);

            // Update current time if not sliding
            if (!isSliding) {
                setCurrentTime(player.currentTime || 0);
            }
        }, 500); // Check every 500ms for more responsive updates

        return () => {
            clearInterval(interval);
        };
    }, [player, isSliding]);

    // Clear hide timer when video becomes busy
    useEffect(() => {
        if (isBusy && hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
    }, [isBusy]);

    // Clear timeout on cleanup.
    useEffect(() => {
        return () => {
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, []);

    const showControls = useCallback(() => {
        // Prevent multiple rapid calls
        if (isAnimatingRef.current || isVisible) {
            // Clear existing timeout if controls are already visible
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }

            // Reset auto-hide timer
            hideTimeoutRef.current = setTimeout(() => {
                if (!isAnimatingRef.current && !isBusy) {
                    hideControls();
                }
            }, 2000);
            return;
        }

        isAnimatingRef.current = true;
        setIsVisible(true);

        // Clear existing timeout.
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }

        // Animate controls to visible.
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            isAnimatingRef.current = false;
        });

        // Set timeout to hide controls after two seconds.
        hideTimeoutRef.current = setTimeout(() => {
            if (!isAnimatingRef.current && !isBusy) {
                // Call hideControls directly to avoid dependency issues
                isAnimatingRef.current = true;

                // Clear timeout
                if (hideTimeoutRef.current) {
                    clearTimeout(hideTimeoutRef.current);
                    hideTimeoutRef.current = null;
                }

                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => {
                    setIsVisible(false);
                    isAnimatingRef.current = false;
                });
            }
        }, 2000);
    }, [fadeAnim, isVisible, isBusy]);

    const hideControls = useCallback(() => {
        // Don't hide controls if video is busy
        if (isBusy) {
            return;
        }

        // Prevent multiple rapid calls
        if (isAnimatingRef.current || !isVisible) {
            return;
        }

        isAnimatingRef.current = true;

        // Clear timeout
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }

        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setIsVisible(false);
            isAnimatingRef.current = false;
        });
    }, [fadeAnim, isVisible, isBusy]);

    const handleVideoPress = useCallback(() => {
        if (isVisible) {
            hideControls();
        } else {
            showControls();
        }
    }, [isVisible, showControls, hideControls]);

    const handlePlayPause = useCallback(() => {
        if (!player) return;

        if (isPlaying) {
            player.pause();
            setIsPlaying(false);
        } else {
            player.play();
            setIsPlaying(true);
        }

        // Reset timeout when interacting with controls.
        showControls();
    }, [player, isPlaying, showControls]);

    const handleSeekBackward = useCallback(() => {
        if (!player) return;

        const currentTime = player.currentTime || 0;
        const newTime = Math.max(0, currentTime - 10);
        player.currentTime = newTime;
        setCurrentTime(newTime);

        // Reset timeout when interacting with controls.
        showControls();
    }, [player, showControls]);

    const handleSeekForward = useCallback(() => {
        if (!player) return;

        const currentTime = player.currentTime || 0;
        const duration = player.duration || 0;
        const newTime = Math.min(duration, currentTime + 30);
        player.currentTime = newTime;
        setCurrentTime(newTime);

        // Reset timeout when interacting with controls.
        showControls();
    }, [player, showControls]);

    const handleSeekBarChange = useCallback(
        (value: number) => {
            if (!player) return;

            const newTime = (value / 100) * duration;
            player.currentTime = newTime;
            setCurrentTime(newTime);

            // Reset timeout when interacting with controls.
            showControls();
        },
        [player, duration, showControls]
    );

    const handleSliderStart = useCallback(() => {
        setIsSliding(true);
        // Initialize thumb position to current progress when starting to drag.
        const currentProgress = duration > 0 ? (currentTime / duration) * 100 : 0;
        setThumbPosition(currentProgress);

        // Clear auto-hide timer while sliding.
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }

        // Pause playback while sliding.
        player.pause();
    }, [currentTime, duration]);

    const handleSliderChange = useCallback(
        (value: number) => {
            if (!player || !isSliding) return;

            const newTime = (value / 100) * duration;
            setCurrentTime(newTime);
            setSliderValue(value);
            setThumbPosition(value);
        },
        [player, duration, isSliding]
    );

    const handleSliderComplete = useCallback(
        (value: number) => {
            if (!player) return;

            const newTime = (value / 100) * duration;
            player.currentTime = newTime;
            setCurrentTime(newTime);
            setIsSliding(false);
            setSliderValue(value);
            setThumbPosition(0);

            // Reset auto-hide timer.
            showControls();

            // Unpause playback after sliding has finished.
            player.play();
        },
        [player, duration, showControls]
    );

    const getSeekBarProgress = useCallback((): number => {
        if (duration === 0) return 0;
        return (currentTime / duration) * 100;
    }, [currentTime, duration]);

    // Auto-hide controls when video finishes loading and starts playing
    useEffect(() => {
        if (!isBusy && isPlaying && isVisible && !isSliding) {
            // Clear any existing timeout
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = null;
            }

            // Set new auto-hide timer
            hideTimeoutRef.current = setTimeout(() => {
                if (!isAnimatingRef.current && !isBusy) {
                    hideControls();
                }
            }, 2000);
        }
    }, [isBusy, isPlaying, isVisible, isSliding, hideControls]);

    return {
        isVisible,
        isPlaying,
        isBusy,
        currentTime,
        duration,
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
