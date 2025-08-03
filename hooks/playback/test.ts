import { act, renderHook } from '@testing-library/react-native';

// Mock expo-router
const mockGoBack = jest.fn();
jest.mock('expo-router', () => ({
    useNavigation: jest.fn(() => ({
        goBack: mockGoBack,
    })),
}));

// Mock react-native-google-cast
const mockPause = jest.fn();
const mockPlay = jest.fn();
const mockStop = jest.fn();
const mockSeek = jest.fn();
const mockGetMediaStatus = jest.fn();

jest.mock('react-native-google-cast', () => ({
    useRemoteMediaClient: jest.fn(),
}));

import { useRemoteMediaClient } from 'react-native-google-cast';
import { usePlayback } from './index';

// Get the mocked function
const mockUseRemoteMediaClient = useRemoteMediaClient as jest.MockedFunction<typeof useRemoteMediaClient>;

describe('usePlayback', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseRemoteMediaClient.mockReturnValue({
            pause: mockPause,
            play: mockPlay,
            stop: mockStop,
            seek: mockSeek,
            getMediaStatus: mockGetMediaStatus,
        } as any);

        // Suppress console.error for tests
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('initialization', () => {
        it('should initialize with default status', () => {
            const { result } = renderHook(() => usePlayback());

            expect(result.current.status).toEqual({
                isPlaying: false,
                isLoading: false,
                streamPosition: 0,
                maxPosition: 0,
                currentTime: '00:00',
                maxTime: '00:00',
            });
        });

        it('should return all expected methods', () => {
            const { result } = renderHook(() => usePlayback());

            expect(result.current).toHaveProperty('pause');
            expect(result.current).toHaveProperty('resume');
            expect(result.current).toHaveProperty('stop');
            expect(result.current).toHaveProperty('seekBackward');
            expect(result.current).toHaveProperty('seekForward');
            expect(result.current).toHaveProperty('seekToPosition');
            expect(result.current).toHaveProperty('status');
        });
    });

    describe('pause', () => {
        it('should pause successfully and update status', async () => {
            mockPause.mockResolvedValue(undefined);
            const { result } = renderHook(() => usePlayback());

            await act(async () => {
                await result.current.pause();
            });

            expect(mockPause).toHaveBeenCalledTimes(1);
            expect(result.current.status.isPlaying).toBe(false);
            expect(result.current.status.isLoading).toBe(false);
        });

        it('should handle pause error and revert status', async () => {
            const error = new Error('Pause failed');
            mockPause.mockRejectedValue(error);
            const { result } = renderHook(() => usePlayback());

            await act(async () => {
                await result.current.pause();
            });

            expect(mockPause).toHaveBeenCalledTimes(1);
            expect(console.error).toHaveBeenCalledWith('Failed to pause:', error);
            expect(result.current.status.isPlaying).toBe(true);
            expect(result.current.status.isLoading).toBe(false);
        });

        it('should not call pause if client is not available', async () => {
            mockUseRemoteMediaClient.mockReturnValue(null);
            const { result } = renderHook(() => usePlayback());

            await act(async () => {
                await result.current.pause();
            });

            expect(mockPause).not.toHaveBeenCalled();
        });
    });

    describe('resume', () => {
        it('should resume successfully and update status', async () => {
            mockPlay.mockResolvedValue(undefined);
            const { result } = renderHook(() => usePlayback());

            await act(async () => {
                await result.current.resume();
            });

            expect(mockPlay).toHaveBeenCalledTimes(1);
            expect(result.current.status.isPlaying).toBe(true);
            expect(result.current.status.isLoading).toBe(false);
        });

        it('should handle resume error and revert status', async () => {
            const error = new Error('Resume failed');
            mockPlay.mockRejectedValue(error);
            const { result } = renderHook(() => usePlayback());

            await act(async () => {
                await result.current.resume();
            });

            expect(mockPlay).toHaveBeenCalledTimes(1);
            expect(console.error).toHaveBeenCalledWith('Failed to resume:', error);
            expect(result.current.status.isPlaying).toBe(false);
            expect(result.current.status.isLoading).toBe(false);
        });

        it('should not call play if client is not available', async () => {
            mockUseRemoteMediaClient.mockReturnValue(null);
            const { result } = renderHook(() => usePlayback());

            await act(async () => {
                await result.current.resume();
            });

            expect(mockPlay).not.toHaveBeenCalled();
        });
    });

    describe('seekForward', () => {
        beforeEach(() => {
            mockGetMediaStatus.mockResolvedValue({
                streamPosition: 50,
            });
            mockSeek.mockResolvedValue(undefined);
        });

        it('should seek forward with default 30 seconds', async () => {
            const { result } = renderHook(() => usePlayback());

            await act(async () => {
                await result.current.seekForward();
            });

            expect(mockGetMediaStatus).toHaveBeenCalledTimes(1);
            expect(mockSeek).toHaveBeenCalledWith({ position: 80 }); // 50 + 30
            expect(result.current.status.isLoading).toBe(false);
        });

        it('should seek forward with custom seconds', async () => {
            const { result } = renderHook(() => usePlayback());

            await act(async () => {
                await result.current.seekForward(15);
            });

            expect(mockGetMediaStatus).toHaveBeenCalledTimes(1);
            expect(mockSeek).toHaveBeenCalledWith({ position: 65 }); // 50 + 15
            expect(result.current.status.isLoading).toBe(false);
        });

        it('should handle error during seek forward', async () => {
            const error = new Error('Seek failed');
            mockSeek.mockRejectedValue(error);
            const { result } = renderHook(() => usePlayback());

            await act(async () => {
                await result.current.seekForward();
            });

            expect(console.error).toHaveBeenCalledWith('Failed to seek forward:', error);
            expect(result.current.status.isLoading).toBe(false);
        });

        it('should exit early if no media status is available', async () => {
            mockGetMediaStatus.mockResolvedValue(null);
            const { result } = renderHook(() => usePlayback());

            await act(async () => {
                await result.current.seekForward();
            });

            expect(mockSeek).not.toHaveBeenCalled();
            expect(result.current.status.isLoading).toBe(false);
        });

        it('should not seek if client is not available', async () => {
            mockUseRemoteMediaClient.mockReturnValue(null);
            const { result } = renderHook(() => usePlayback());

            await act(async () => {
                await result.current.seekForward();
            });

            expect(mockGetMediaStatus).not.toHaveBeenCalled();
            expect(mockSeek).not.toHaveBeenCalled();
        });
    });

    describe('seekBackward', () => {
        beforeEach(() => {
            mockGetMediaStatus.mockResolvedValue({
                streamPosition: 50,
            });
            mockSeek.mockResolvedValue(undefined);
        });

        it('should seek backward with default 10 seconds', async () => {
            const { result } = renderHook(() => usePlayback());

            await act(async () => {
                await result.current.seekBackward();
            });

            expect(mockGetMediaStatus).toHaveBeenCalledTimes(1);
            expect(mockSeek).toHaveBeenCalledWith({ position: 40 }); // 50 - 10
            expect(result.current.status.isLoading).toBe(false);
        });

        it('should seek backward with custom seconds', async () => {
            const { result } = renderHook(() => usePlayback());

            await act(async () => {
                await result.current.seekBackward(20);
            });

            expect(mockGetMediaStatus).toHaveBeenCalledTimes(1);
            expect(mockSeek).toHaveBeenCalledWith({ position: 30 }); // 50 - 20
            expect(result.current.status.isLoading).toBe(false);
        });

        it('should not seek below 0 position', async () => {
            mockGetMediaStatus.mockResolvedValue({
                streamPosition: 5,
            });
            const { result } = renderHook(() => usePlayback());

            await act(async () => {
                await result.current.seekBackward(10);
            });

            expect(mockSeek).toHaveBeenCalledWith({ position: 0 }); // Math.max(0, 5 - 10)
        });

        it('should handle error during seek backward', async () => {
            const error = new Error('Seek backward failed');
            mockSeek.mockRejectedValue(error);
            const { result } = renderHook(() => usePlayback());

            await act(async () => {
                await result.current.seekBackward();
            });

            expect(console.error).toHaveBeenCalledWith('Failed to seek backward:', error);
            expect(result.current.status.isLoading).toBe(false);
        });

        it('should exit early if no media status is available', async () => {
            mockGetMediaStatus.mockResolvedValue(null);
            const { result } = renderHook(() => usePlayback());

            await act(async () => {
                await result.current.seekBackward();
            });

            expect(mockSeek).not.toHaveBeenCalled();
            expect(result.current.status.isLoading).toBe(false);
        });

        it('should not seek if client is not available', async () => {
            mockUseRemoteMediaClient.mockReturnValue(null);
            const { result } = renderHook(() => usePlayback());

            await act(async () => {
                await result.current.seekBackward();
            });

            expect(mockGetMediaStatus).not.toHaveBeenCalled();
            expect(mockSeek).not.toHaveBeenCalled();
        });
    });

    describe('stop', () => {
        it('should stop successfully and navigate back', async () => {
            mockStop.mockResolvedValue(undefined);
            const { result } = renderHook(() => usePlayback());

            await act(async () => {
                await result.current.stop();
            });

            expect(mockStop).toHaveBeenCalledTimes(1);
            expect(mockGoBack).toHaveBeenCalledTimes(1);
        });

        it('should handle stop error', async () => {
            const error = new Error('Stop failed');
            mockStop.mockRejectedValue(error);
            const { result } = renderHook(() => usePlayback());

            await act(async () => {
                await result.current.stop();
            });

            expect(mockStop).toHaveBeenCalledTimes(1);
            expect(console.error).toHaveBeenCalledWith('Failed to stop:', error);
        });

        it('should not call stop if client is not available', async () => {
            mockUseRemoteMediaClient.mockReturnValue(null);
            const { result } = renderHook(() => usePlayback());

            await act(async () => {
                await result.current.stop();
            });

            expect(mockStop).not.toHaveBeenCalled();
            expect(mockGoBack).not.toHaveBeenCalled();
        });
    });

    describe('seekToPosition', () => {
        beforeEach(() => {
            mockSeek.mockResolvedValue(undefined);
        });

        it('should seek to specific position and update status', async () => {
            const { result } = renderHook(() => usePlayback());
            const targetPosition = 120;

            await act(async () => {
                await result.current.seekToPosition(targetPosition);
            });

            expect(mockSeek).toHaveBeenCalledWith({ position: targetPosition });
            expect(result.current.status.isLoading).toBe(false);
            expect(result.current.status.streamPosition).toBe(targetPosition);
            expect(result.current.status.currentTime).toBe('02:00');
        });

        it('should handle seek to position error', async () => {
            const error = new Error('Seek to position failed');
            mockSeek.mockRejectedValue(error);
            const { result } = renderHook(() => usePlayback());

            await act(async () => {
                await result.current.seekToPosition(60);
            });

            expect(console.error).toHaveBeenCalledWith('Failed to seek to position:', error);
            expect(result.current.status.isLoading).toBe(false);
        });

        it('should not seek if client is not available', async () => {
            mockUseRemoteMediaClient.mockReturnValue(null);
            const { result } = renderHook(() => usePlayback());

            await act(async () => {
                await result.current.seekToPosition(60);
            });

            expect(mockSeek).not.toHaveBeenCalled();
        });
    });

    describe('formatTimeFromSeconds utility', () => {
        it('should format time correctly for various durations', () => {
            const { result } = renderHook(() => usePlayback());

            // Test with seekToPosition to access the formatTimeFromSeconds function indirectly
            act(() => {
                result.current.seekToPosition(0);
            });
            expect(result.current.status.currentTime).toBe('00:00');

            act(() => {
                result.current.seekToPosition(30);
            });
            expect(result.current.status.currentTime).toBe('00:30');

            act(() => {
                result.current.seekToPosition(60);
            });
            expect(result.current.status.currentTime).toBe('01:00');

            act(() => {
                result.current.seekToPosition(90);
            });
            expect(result.current.status.currentTime).toBe('01:30');

            act(() => {
                result.current.seekToPosition(3600);
            });
            expect(result.current.status.currentTime).toBe('01:00:00');

            act(() => {
                result.current.seekToPosition(3661);
            });
            expect(result.current.status.currentTime).toBe('01:01:01');

            act(() => {
                result.current.seekToPosition(7322);
            });
            expect(result.current.status.currentTime).toBe('02:02:02');
        });
    });

    describe('status state management', () => {
        it('should show loading state during operations', async () => {
            let resolvePromise: () => void;
            const promise = new Promise<void>(resolve => {
                resolvePromise = resolve;
            });
            mockPause.mockReturnValue(promise);

            const { result } = renderHook(() => usePlayback());

            // Start pause operation
            act(() => {
                result.current.pause();
            });

            // Check loading state is true during operation
            expect(result.current.status.isLoading).toBe(true);
            expect(result.current.status.isPlaying).toBe(false);

            // Resolve the operation
            act(() => {
                resolvePromise!();
            });

            // Wait for the promise to resolve
            await act(async () => {
                await promise;
            });

            // Check loading state is cleared
            expect(result.current.status.isLoading).toBe(false);
        });

        it('should maintain consistent state across multiple operations', async () => {
            mockPause.mockResolvedValue(undefined);
            mockPlay.mockResolvedValue(undefined);

            const { result } = renderHook(() => usePlayback());

            // Initial state
            expect(result.current.status.isPlaying).toBe(false);

            // Pause operation
            await act(async () => {
                await result.current.pause();
            });
            expect(result.current.status.isPlaying).toBe(false);

            // Resume operation
            await act(async () => {
                await result.current.resume();
            });
            expect(result.current.status.isPlaying).toBe(true);

            // Another pause
            await act(async () => {
                await result.current.pause();
            });
            expect(result.current.status.isPlaying).toBe(false);
        });
    });
});
