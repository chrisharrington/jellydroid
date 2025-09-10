import { useJellyfin } from '@/contexts/jellyfin';
import { SubtitleMetadata } from '@/contexts/jellyfin/models';
import { SubtitleTrack } from 'expo-video';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { VideoControlsProps } from '.';

/**
 * Custom hook for managing video player controls state and interactions.
 * Handles control visibility, playback state, seek operations, and auto-hide functionality.
 *
 * @param {VideoPlayer} props.player - Video player instance for controlling playback
 *
 * @returns {Object} Object containing:
 * - isVisible: Whether controls are currently visible
 * - isPlaying: Current playback state (computed from player.playing)
 * - isBusy: Whether video is loading/buffering
 * - currentTime: Current playback position in seconds
 * - isSliding: Whether user is actively dragging seek bar
 * - sliderValue: Current slider position value
 * - thumbPosition: Position of trickplay thumbnail
 * - fadeAnim: Animated value for control fade in/out
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
export function useVideoControls({ item, player, playbackSessionId }: VideoControlsProps) {
    const [isVisible, setIsVisible] = useState<boolean>(false),
        [isSliding, setSliding] = useState<boolean>(false),
        [isBusy, setBusy] = useState<boolean>(false),
        [isPlaying, setPlaying] = useState<boolean>(false),
        [sliderValue, setSliderValue] = useState(0),
        [thumbPosition, setThumbPosition] = useState(0),
        playbackProgressCounter = useRef<number>(0),
        { updatePlaybackProgress, getSubtitleTrackMetadata } = useJellyfin(),
        [availableSubtitleTracks, setAvailableSubtitleTracks] = useState<(SubtitleTrack & SubtitleMetadata)[]>([]),
        [isForcedSubtitlesEnabled, setForcedSubtitlesEnabled] = useState<boolean>(false),
        [isSubtitlesEnabled, setSubtitlesEnabled] = useState<boolean>(false),
        currentTime = useMemo(() => player?.currentTime || 0, [player?.currentTime]),
        fadeAnim = useRef(new Animated.Value(0)).current,
        hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null),
        isAnimatingRef = useRef(false);

    // Add a listener to the video player to track available subtitle tracks.
    useEffect(() => {
        if (!player) return;

        const listener = player.addListener('availableSubtitleTracksChange', event => {
            const subtitleMetadata = getSubtitleTrackMetadata(item);

            setAvailableSubtitleTracks(
                event.availableSubtitleTracks
                    .map(track => {
                        const metadata = subtitleMetadata?.find(
                            meta => meta.displayTitle === track.id.replace('subs:', '')
                        );
                        if (!metadata) throw new Error('Unable to find matching subtitle metadata.');
                        return {
                            ...metadata,
                            ...track,
                        };
                    })
                    .filter(track => track.language === 'en') || []
            );
        });

        return () => listener?.remove();
    }, [player]);

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

        // On initial load, ensure that the user is aware video is loading.
        setBusy(true);

        // Set the time update interval to four times a second.
        player.timeUpdateEventInterval = 0.25;

        // Listen for time updates.
        const timeUpdateListener = player.addListener('timeUpdate', payload => {
            // Time is now computed from player.currentTime, no need to set state

            // Update playback progress counter.
            playbackProgressCounter.current++;

            // If playback progress counter is four (equating to once every second), update
            // playback progress with Jellyfin.
            if (playbackProgressCounter.current >= 4) {
                if (!item.Id || !item.MediaSources?.[0].Id) return;

                updatePlaybackProgress(item.Id, item.MediaSources?.[0].Id, playbackSessionId, payload.currentTime || 0);
                playbackProgressCounter.current = 0;
            }
        });

        // Listen for status updates so the user knows when the video is loading.
        const statusChangeListener = player.addListener('statusChange', payload => {
            setBusy(payload.status !== 'readyToPlay');
        });

        // Listen for playback state changes to update play/pause button.
        const playingChangeListener = player.addListener('playingChange', payload => {
            setPlaying(payload.isPlaying);
        });

        // Initialize playing state from player.
        setPlaying(player.playing || false);

        // Clean up listeners when unmounting.
        return () => {
            timeUpdateListener.remove();
            statusChangeListener.remove();
            playingChangeListener.remove();
        };
    }, [player, isSliding]);

    // Listen to player status changes and periodically update playback state.
    useEffect(() => {
        if (!player) return;

        // Subscribe to player status events.
        const subscription = player.addListener('statusChange', status => {
            if (status.status !== 'readyToPlay') return;
            // Playing state is now computed from player.playing, no need to set it
        });

        return () => subscription?.remove();
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

    // Auto-hide controls when video finishes loading and starts playing.
    useEffect(() => {
        if (!isBusy && isPlaying && isVisible && !isSliding) setAutoHideTimer();
    }, [isBusy, isPlaying, isVisible, isSliding, setAutoHideTimer]);

    return {
        isVisible,
        isPlaying,
        isBusy,
        isForcedSubtitlesAvailable: useMemo(
            () => availableSubtitleTracks.filter(track => track.isForced).length > 0,
            [item, availableSubtitleTracks]
        ),
        isForcedSubtitlesEnabled,
        isSubtitlesAvailable: useMemo(() => availableSubtitleTracks.length > 0, [item, availableSubtitleTracks]),
        isSubtitlesEnabled,
        currentTime,
        isSliding,
        sliderValue,
        thumbPosition,
        fadeAnim,
        duration: useMemo(() => player?.duration || 0, [player]),
        handleVideoPress,
        handlePlayPause,
        handleSeekBackward,
        handleSeekForward,
        handleSliderStart,
        handleSliderChange,
        handleSliderComplete,
        handleForcedSubtitlesToggle,
        handleSubtitlesToggle,
        getSeekBarProgress,
    };

    /**
     * Sets auto-hide timer to hide controls after 2 seconds of inactivity.
     * Clears any existing timer before setting new one.
     */
    function setAutoHideTimer() {
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

        hideTimeoutRef.current = setTimeout(() => {
            if (!isAnimatingRef.current && !isBusy) hideControls();
        }, 2000);
    }

    /**
     * Shows video controls with fade-in animation.
     * Sets auto-hide timer and prevents multiple rapid calls.
     */
    function showControls() {
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
    }

    /**
     * Hides video controls with fade-out animation.
     * Respects busy state and prevents hiding during loading.
     */
    function hideControls() {
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
    }

    /**
     * Handles video area press to toggle control visibility.
     * Shows controls if hidden, hides if visible.
     */
    function handleVideoPress() {
        if (isVisible) hideControls();
        else showControls();
    }

    /**
     * Handles play/pause button press to toggle playback state.
     * Updates local state and resets auto-hide timer.
     */
    function handlePlayPause() {
        if (!player) return;

        if (isPlaying) player.pause();
        else player.play();

        showControls();
    }

    /**
     * Handles backward seek button to jump back 10 seconds.
     * Clamps to minimum of 0 seconds and resets auto-hide timer.
     */
    function handleSeekBackward() {
        if (!player) return;

        // Seek to the current time minus 10 seconds.
        player.currentTime = Math.max(0, (player.currentTime || 0) - 10);

        // Show controls after seeking.
        showControls();
    }

    /**
     * Handles forward seek button to jump ahead 10 seconds.
     * Clamps to maximum of video duration and resets auto-hide timer.
     */
    function handleSeekForward() {
        if (!player || !player.duration) return;

        // Seek to the current time plus 30 seconds.
        player.currentTime = Math.max(0, (player.currentTime || 0) + 30);

        // Show controls after seeking.
        showControls();
    }

    /**
     * Handles seek bar drag start to begin interactive seeking.
     * Pauses playback, calculates initial thumb position, and clears auto-hide timer.
     */
    function handleSliderStart() {
        setSliding(true);

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
    }

    /**
     * Handles seek bar drag updates during interactive seeking.
     * Updates time preview without committing to player until drag completes.
     */
    function handleSliderChange(value: number) {
        if (!player || !isSliding) return;

        // Update slider state values.
        setSliderValue(value);
        setThumbPosition(value);
    }

    /**
     * Handles seek bar drag completion to finalize seeking.
     * Commits time to player, resumes playback, and resets auto-hide timer.
     */
    function handleSliderComplete(value: number) {
        if (!player) return;

        // Reset seeking state.
        setSliding(false);
        setSliderValue(value);
        setThumbPosition(0);

        // Seek to the new time based on the slider value.
        player.currentTime = (value / 100) * (player.duration || 0);

        // Resume playback and reset auto-hide timer.
        showControls();
        player.play();
    }

    /**
     * Calculates current playback progress as percentage.
     * Returns 0 if no duration available to prevent division by zero.
     */
    function getSeekBarProgress(): number {
        const playerDuration = player?.duration || 0;
        if (playerDuration === 0) return 0;
        return (currentTime / playerDuration) * 100;
    }

    /**
     * Toggles forced subtitles on/off and updates the player's subtitle track accordingly.
     * When forced subtitles are enabled, regular subtitles are disabled and the first forced subtitle track is selected.
     * When forced subtitles are disabled, the subtitle track is cleared.
     * Controls are shown after the toggle.
     *
     * @param isEnabled - Boolean indicating whether forced subtitles should be enabled
     */
    function handleForcedSubtitlesToggle(isEnabled: boolean) {
        // Update forced subtitles enabled state.
        setForcedSubtitlesEnabled(isEnabled);

        if (isEnabled) {
            // Disable regular subtitles and find the first forced subtitle track.
            setSubtitlesEnabled(false);
            player.subtitleTrack = availableSubtitleTracks.find(track => track.isForced) || null;
        } else {
            // Clear the subtitle track when forced subtitles are disabled.
            player.subtitleTrack = null;
        }

        // Show controls after toggle.
        showControls();
    }

    /**
     * Handles the toggling of subtitles in the video player.
     * When enabled, it sets the subtitle track to the default track if available.
     * When disabled, it removes the subtitle track.
     * Also disables forced subtitles when regular subtitles are enabled.
     *
     * @param isEnabled - Boolean indicating whether subtitles should be enabled
     * @returns void
     */
    function handleSubtitlesToggle(isEnabled: boolean) {
        // Update regular subtitles enabled state.
        setSubtitlesEnabled(isEnabled);

        if (isEnabled) {
            // Disable forced subtitles and set the default subtitle track.
            setForcedSubtitlesEnabled(false);
            player.subtitleTrack = availableSubtitleTracks.filter(track => !track.isForced)[0] || null;
        } else {
            // Clear the subtitle track when subtitles are disabled.
            player.subtitleTrack = null;
        }

        // Show controls after toggle.
        showControls();
    }
}
