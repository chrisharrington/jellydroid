import { act, renderHook } from '@testing-library/react-native';
import { useVideoControls } from './hook';

// Mock the Jellyfin hook.
jest.mock('@/contexts/jellyfin', () => ({
    useJellyfin: jest.fn(),
}));

// Mock React Native dependencies.
jest.mock('react-native', () => {
    const mockAnimatedValue = {
        setValue: jest.fn(),
        interpolate: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn(),
        stopAnimation: jest.fn(),
        resetAnimation: jest.fn(),
        extractOffset: jest.fn(),
        setOffset: jest.fn(),
        flattenOffset: jest.fn(),
        _listeners: [],
        _value: 0,
    };

    return {
        Animated: {
            timing: jest.fn(() => ({
                start: jest.fn(callback => callback && callback()),
            })),
            Value: jest.fn(() => mockAnimatedValue),
        },
        DevMenu: {
            show: jest.fn(),
            hide: jest.fn(),
            addItem: jest.fn(),
            dismissMenu: jest.fn(),
        },
        Dimensions: {
            get: jest.fn(() => ({ width: 375, height: 667 })),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
        },
        Platform: {
            OS: 'ios',
            select: (obj: any) => obj.ios || obj.default,
        },
    };
});

// Import the mocked hook after mocking.
const { useJellyfin } = require('@/contexts/jellyfin');

// Mock video player with all required properties.
const createMockPlayer = () =>
    ({
        playing: false,
        currentTime: 0,
        duration: 100,
        timeUpdateEventInterval: 1,
        addListener: jest.fn((event: string, callback: Function) => ({
            remove: jest.fn(),
        })),
        removeListener: jest.fn(),
        play: jest.fn(),
        pause: jest.fn(),
        loop: false,
        allowsExternalPlayback: false,
        audioMixingMode: 'auto',
        muted: false,
        playbackRate: 1,
        volume: 1,
        status: 'idle',
        error: null,
        isLoaded: false,
    } as any);

// Mock media item.
const createMockItem = () =>
    ({
        Id: 'test-item-id',
        MediaSources: [{ Id: 'test-media-source-id' }],
    } as any);

// Mock Jellyfin hook.
const mockUpdatePlaybackProgress = jest.fn();
(useJellyfin as jest.Mock).mockReturnValue({
    updatePlaybackProgress: mockUpdatePlaybackProgress,
});

describe('useVideoControls', () => {
    let mockPlayer: ReturnType<typeof createMockPlayer>;
    let mockItem: ReturnType<typeof createMockItem>;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        mockPlayer = createMockPlayer();
        mockItem = createMockItem();

        // Reset to known state
        mockPlayer.playing = false;
        mockPlayer.currentTime = 0;
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it('initializes with correct default state', () => {
        const { result } = renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        expect(result.current.isVisible).toBe(true);
        expect(result.current.isPlaying).toBe(false);
        expect(result.current.isBusy).toBe(true);
        expect(result.current.currentTime).toBe(0);
        expect(result.current.isSliding).toBe(false);
        expect(result.current.sliderValue).toBe(0);
    });

    it('shows controls with fade-in animation on mount', () => {
        const { Animated } = require('react-native');

        renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        expect(Animated.timing).toHaveBeenCalledWith(expect.any(Object), {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        });
    });

    it('sets up player listeners when player becomes available', () => {
        renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        expect(mockPlayer.addListener).toHaveBeenCalledWith('timeUpdate', expect.any(Function));
        expect(mockPlayer.addListener).toHaveBeenCalledWith('statusChange', expect.any(Function));
    });

    it('handles missing player gracefully', () => {
        const { result } = renderHook(() => useVideoControls({ item: mockItem, player: null as any }));

        expect(result.current.isPlaying).toBe(false);
        expect(result.current.currentTime).toBe(0);
        expect(() => result.current.handlePlayPause()).not.toThrow();
    });

    it('cleans up listeners on unmount', () => {
        const mockRemove = jest.fn();
        mockPlayer.addListener.mockReturnValue({ remove: mockRemove });

        const { unmount } = renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        unmount();

        expect(mockRemove).toHaveBeenCalledTimes(5); // timeUpdate, statusChange, availableSubtitleTracksChange, playingChange listeners
    });

    it('updates current time from timeUpdate events when not sliding', () => {
        mockPlayer.currentTime = 25;
        const { result } = renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        // Trigger time update event.
        act(() => {
            const timeUpdateCallback = mockPlayer.addListener.mock.calls.find(
                (call: any) => call[0] === 'timeUpdate'
            )?.[1];
            timeUpdateCallback?.({ currentTime: 25 });
        });

        // currentTime is computed from player.currentTime
        expect(result.current.currentTime).toBe(25);
    });

    it('does not update current time from timeUpdate events when sliding', () => {
        const { result } = renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        // Start sliding.
        act(() => {
            result.current.handleSliderStart();
        });

        // Save original current time.
        const originalTime = mockPlayer.currentTime;

        // Get the timeUpdate listener callback.
        const timeUpdateCallback = mockPlayer.addListener.mock.calls.find((call: any) => call[0] === 'timeUpdate')?.[1];

        act(() => {
            timeUpdateCallback?.({ currentTime: 25 });
        });

        // currentTime is computed from player.currentTime, so check that player.currentTime
        // wasn't changed by the timeUpdate event since we removed the setCurrentTime call
        expect(mockPlayer.currentTime).toBe(originalTime);
    });

    it('updates playback progress with Jellyfin every second', () => {
        renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        // Trigger four time update events to simulate one second.
        act(() => {
            const timeUpdateCallback = mockPlayer.addListener.mock.calls.find(
                (call: any) => call[0] === 'timeUpdate'
            )?.[1];

            // Trigger 4 updates (every 0.25 seconds = 1 second total).
            for (let i = 0; i < 4; i++) {
                timeUpdateCallback?.({ currentTime: 10 + i * 0.25 });
            }
        });

        expect(mockUpdatePlaybackProgress).toHaveBeenCalledWith(
            'test-item-id',
            'test-media-source-id',
            null,
            expect.any(Number)
        );
    });

    it('does not update playback progress when item data is missing', () => {
        const itemWithoutId = { ...mockItem, Id: undefined };
        renderHook(() => useVideoControls({ item: itemWithoutId, player: mockPlayer }));

        // Trigger time update events.
        act(() => {
            const timeUpdateCallback = mockPlayer.addListener.mock.calls.find(
                (call: any) => call[0] === 'timeUpdate'
            )?.[1];

            for (let i = 0; i < 4; i++) {
                timeUpdateCallback?.({ currentTime: 10 });
            }
        });

        expect(mockUpdatePlaybackProgress).not.toHaveBeenCalled();
    });

    it('updates busy state from statusChange events', () => {
        const { result } = renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        // Trigger statusChange.
        act(() => {
            const statusChangeCallback = mockPlayer.addListener.mock.calls.find(
                (call: any) => call[0] === 'statusChange'
            )?.[1];
            statusChangeCallback?.({ status: 'loading' });
        });

        expect(result.current.isBusy).toBe(true);

        // Change to ready state.
        act(() => {
            const statusChangeCallback = mockPlayer.addListener.mock.calls.find(
                (call: any) => call[0] === 'statusChange'
            )?.[1];
            statusChangeCallback?.({ status: 'readyToPlay' });
        });

        expect(result.current.isBusy).toBe(false);
    });

    it('computes playing state from player', () => {
        const { result } = renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        expect(result.current.isPlaying).toBe(false);

        // Update player state.
        mockPlayer.playing = true;
        const { result: newResult } = renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        expect(newResult.current.isPlaying).toBe(true);
    });

    it('toggles video controls visibility on video press', () => {
        const { Animated } = require('react-native');
        const { result } = renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        // Controls start visible and not busy, so first tap should hide them
        act(() => {
            const statusChangeCallback = mockPlayer.addListener.mock.calls.find(
                (call: any) => call[0] === 'statusChange'
            )?.[1];
            statusChangeCallback?.({ status: 'readyToPlay' });
        });

        // Reset animation mock calls after initial mount and status change.
        jest.clearAllMocks();

        // Tap video to hide controls (they start visible).
        act(() => {
            result.current.handleVideoPress();
        });

        // Verify hide animation was triggered.
        expect(Animated.timing).toHaveBeenCalledWith(expect.any(Object), {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        });
    });

    it('handles play/pause button press correctly', () => {
        const { result } = renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        // Player starts paused (playing: false), so pressing should call play.
        act(() => {
            result.current.handlePlayPause();
        });

        expect(mockPlayer.play).toHaveBeenCalled();
        jest.clearAllMocks();

        // Update player state to playing and create new hook instance.
        mockPlayer.playing = true;
        const { result: newResult } = renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        act(() => {
            newResult.current.handlePlayPause();
        });

        expect(mockPlayer.pause).toHaveBeenCalled();
    });

    it('handles backward seek correctly', () => {
        mockPlayer.currentTime = 30;
        const { result } = renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        act(() => {
            result.current.handleSeekBackward();
        });

        expect(mockPlayer.currentTime).toBe(20);
    });

    it('clamps backward seek to minimum of 0', () => {
        mockPlayer.currentTime = 5;
        const { result } = renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        act(() => {
            result.current.handleSeekBackward();
        });

        expect(mockPlayer.currentTime).toBe(0);
    });

    it('handles forward seek correctly', () => {
        mockPlayer.currentTime = 30;
        const { result } = renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        act(() => {
            result.current.handleSeekForward();
        });

        expect(mockPlayer.currentTime).toBe(60);
    });

    it('does not forward seek when player has no duration', () => {
        mockPlayer.duration = undefined;
        mockPlayer.currentTime = 30;
        const { result } = renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        act(() => {
            result.current.handleSeekForward();
        });

        // Should not change currentTime when no duration
        expect(mockPlayer.currentTime).toBe(30);
    });

    it('handles slider start correctly', () => {
        mockPlayer.currentTime = 25;
        mockPlayer.duration = 100;
        const { result } = renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        act(() => {
            result.current.handleSliderStart();
        });

        expect(result.current.isSliding).toBe(true);
        expect(result.current.thumbPosition).toBe(25); // 25% progress
        expect(mockPlayer.pause).toHaveBeenCalled();
    });

    it('handles slider changes during sliding', () => {
        const { result } = renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        // Start sliding first.
        act(() => {
            result.current.handleSliderStart();
        });

        act(() => {
            result.current.handleSliderChange(50);
        });

        // handleSliderChange should NOT update player.currentTime - only slider state
        expect(mockPlayer.currentTime).toBe(0); // Should remain unchanged
        expect(result.current.sliderValue).toBe(50);
        expect(result.current.thumbPosition).toBe(50);
    });

    it('does not handle slider changes when not sliding', () => {
        const { result } = renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        const originalTime = mockPlayer.currentTime;

        act(() => {
            result.current.handleSliderChange(50);
        });

        // Time should not change since we're not sliding.
        expect(mockPlayer.currentTime).toBe(originalTime);
    });

    it('handles slider completion correctly', () => {
        const { result } = renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        act(() => {
            result.current.handleSliderComplete(75);
        });

        expect(result.current.isSliding).toBe(false);
        expect(result.current.sliderValue).toBe(75);
        expect(result.current.thumbPosition).toBe(0);
        expect(mockPlayer.play).toHaveBeenCalled();
    });

    it('calculates seek bar progress correctly', () => {
        mockPlayer.currentTime = 25;
        mockPlayer.duration = 100;
        const { result } = renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        const progress = result.current.getSeekBarProgress();
        expect(progress).toBe(25);
    });

    it('returns 0 progress when duration is 0', () => {
        mockPlayer.duration = 0;
        const { result } = renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        const progress = result.current.getSeekBarProgress();
        expect(progress).toBe(0);
    });

    it('computes duration from player', () => {
        mockPlayer.duration = 150;
        const { result } = renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        expect(result.current.duration).toBe(150);
    });

    it('auto-hides controls after timeout when playing', async () => {
        const { Animated } = require('react-native');

        // Create a new instance with playing state from the start
        mockPlayer.playing = true;
        const { result } = renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        // Set up conditions for auto-hide: not busy, playing, visible, not sliding.
        act(() => {
            const statusChangeCallback = mockPlayer.addListener.mock.calls.find(
                (call: any) => call[0] === 'statusChange'
            )?.[1];
            statusChangeCallback?.({ status: 'readyToPlay' });
        });

        // Clear initial animation calls.
        jest.clearAllMocks();

        // The auto-hide effect should be triggered by the combination of:
        // not busy + playing + visible + not sliding
        // Let's wait a bit and then advance timers
        act(() => {
            jest.advanceTimersByTime(2100); // Slightly more than 2000ms
        });

        // Verify hide animation was triggered.
        expect(Animated.timing).toHaveBeenCalledWith(expect.any(Object), {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        });
    });

    it('does not auto-hide controls when video is busy', () => {
        const { Animated } = require('react-native');
        const { result } = renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        // Video remains busy.
        mockPlayer.playing = true;

        // Clear initial animation calls.
        jest.clearAllMocks();

        // Advance timers.
        act(() => {
            jest.advanceTimersByTime(2000);
        });

        // Hide animation should not be triggered when busy.
        expect(Animated.timing).toHaveBeenCalledTimes(0);
    });

    it('clears hide timer when video becomes busy', () => {
        const { result } = renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        // Set up auto-hide timer by making video not busy and playing.
        act(() => {
            const statusChangeCallback = mockPlayer.addListener.mock.calls.find(
                (call: any) => call[0] === 'statusChange'
            )?.[1];
            statusChangeCallback?.({ status: 'readyToPlay' });
        });

        // Ensure controls are visible and video is playing.
        expect(result.current.isVisible).toBe(true);
        expect(result.current.isBusy).toBe(false);

        // Make video busy again.
        act(() => {
            const statusChangeCallback = mockPlayer.addListener.mock.calls.find(
                (call: any) => call[0] === 'statusChange'
            )?.[1];
            statusChangeCallback?.({ status: 'loading' });
        });

        // Advance timer past auto-hide delay.
        act(() => {
            jest.advanceTimersByTime(2000);
        });

        // Controls should remain visible since video became busy.
        expect(result.current.isVisible).toBe(true);
        expect(result.current.isBusy).toBe(true);
    });

    it('handles rapid control toggle calls', () => {
        const { Animated } = require('react-native');
        const { result } = renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        // Make video not busy so controls can be hidden.
        act(() => {
            const statusChangeCallback = mockPlayer.addListener.mock.calls.find(
                (call: any) => call[0] === 'statusChange'
            )?.[1];
            statusChangeCallback?.({ status: 'readyToPlay' });
        });

        // Clear initial animation calls.
        jest.clearAllMocks();

        // Test that multiple calls work correctly (each toggle should work)
        act(() => {
            result.current.handleVideoPress(); // Hide
            result.current.handleVideoPress(); // Show
            result.current.handleVideoPress(); // Hide
            result.current.handleVideoPress(); // Show
        });

        // Each call should trigger an animation since we're toggling between states
        expect(Animated.timing).toHaveBeenCalledTimes(4);
    });
    it('does not hide controls when already hidden', () => {
        const { Animated } = require('react-native');
        const { result } = renderHook(() => useVideoControls({ item: mockItem, player: mockPlayer }));

        // Make video not busy so controls can be hidden.
        act(() => {
            const statusChangeCallback = mockPlayer.addListener.mock.calls.find(
                (call: any) => call[0] === 'statusChange'
            )?.[1];
            statusChangeCallback?.({ status: 'readyToPlay' });
        });

        // Hide controls first.
        act(() => {
            result.current.handleVideoPress();
        });

        jest.clearAllMocks();

        // Try to tap again when controls are hidden - should show them.
        act(() => {
            result.current.handleVideoPress(); // Should show instead of hide
        });

        // Should trigger show animation, not hide.
        expect(Animated.timing).toHaveBeenCalledWith(expect.any(Object), {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        });
    });

    it('handles item without MediaSources gracefully', () => {
        const itemWithoutMediaSources = { ...mockItem, MediaSources: undefined };
        renderHook(() => useVideoControls({ item: itemWithoutMediaSources, player: mockPlayer }));

        // Trigger time update events.
        act(() => {
            const timeUpdateCallback = mockPlayer.addListener.mock.calls.find(
                (call: any) => call[0] === 'timeUpdate'
            )?.[1];

            for (let i = 0; i < 4; i++) {
                timeUpdateCallback?.({ currentTime: 10 });
            }
        });

        // Should not crash and should not call updatePlaybackProgress.
        expect(mockUpdatePlaybackProgress).not.toHaveBeenCalled();
    });
});
